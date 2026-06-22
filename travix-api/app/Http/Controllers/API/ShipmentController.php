<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Shipment;
use App\Models\ShipmentEvent;
use App\Models\Trip;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ShipmentController extends Controller
{
    // ── GET /api/shipments — sender's own shipments ──────────────────────────
    public function index(Request $request)
    {
        $shipments = Shipment::where('sender_id', $request->user()->id)
            ->latest()->get();

        return response()->json(['success' => true, 'shipments' => $shipments]);
    }

    // ── POST /api/shipments — create new shipment ────────────────────────────
    public function store(Request $request)
    {
        $validated = $request->validate([
            'item_name'        => 'required|string|max:255',
            'category'         => 'nullable|string',
            'weight'           => 'required|numeric|min:0.1',
            'value'            => 'nullable|numeric|min:0',
            'description'      => 'nullable|string',
            'pickup_location'  => 'required|string',
            'destination'      => 'required|string',
            'pickup_date'      => 'nullable|date',
            'receiver_name'    => 'nullable|string',
            'receiver_phone'   => 'nullable|string',
            'delivery_address' => 'nullable|string',
            'total_amount'     => 'nullable|numeric|min:0',
        ]);

        $shipment = Shipment::create(array_merge($validated, [
            'sender_id' => $request->user()->id,
            'order_id'  => 'TRX-' . date('Y') . '-' . strtoupper(Str::random(6)),
            'status'    => 'requested',
        ]));

        ShipmentEvent::create([
            'shipment_id' => $shipment->id,
            'status'      => 'requested',
            'title'       => 'Shipment Requested',
            'description' => 'Your shipment request has been created',
            'occurred_at' => now(),
        ]);

        return response()->json(['success' => true, 'shipment' => $shipment], 201);
    }

    // ── GET /api/shipments/available — traveler sees matched requests ─────────
    // Matches traveler's active trips to open shipments on same route
    public function available(Request $request)
    {
        $traveler = $request->user();

        // Get traveler's active trips
        $trips = Trip::where('traveler_id', $traveler->id)
            ->where('status', 'active')
            ->get();

        if ($trips->isEmpty()) {
            // No trips — return all open requests
            $shipments = Shipment::where('status', 'requested')
                ->whereNull('traveler_id')
                ->with('sender:id,name,avatar')
                ->latest()->take(20)->get();
        } else {
            // Match by destination country
            $destinations = $trips->pluck('to_country')->filter()->map(fn($c) => strtolower($c));
            $origins      = $trips->pluck('from_country')->filter()->map(fn($c) => strtolower($c));

            $shipments = Shipment::where('status', 'requested')
                ->whereNull('traveler_id')
                ->with('sender:id,name,avatar')
                ->get()
                ->filter(function ($s) use ($destinations, $origins) {
                    $dest   = strtolower($s->destination ?? '');
                    $origin = strtolower($s->pickup_location ?? '');
                    $destMatch   = $destinations->contains(fn($d) => str_contains($dest, $d));
                    $originMatch = $origins->isEmpty() || $origins->contains(fn($o) => str_contains($origin, $o));
                    return $destMatch || $originMatch;
                })
                ->values()
                ->take(20);
        }

        return response()->json([
            'success'   => true,
            'shipments' => $shipments->map(fn($s) => $this->formatShipment($s)),
        ]);
    }

    // ── GET /api/shipments/{orderId}/status ──────────────────────────────────
    public function status(Request $request, $orderId)
    {
        $shipment = Shipment::where('order_id', $orderId)
            ->with(['events' => fn($q) => $q->orderBy('occurred_at'), 'traveler', 'sender'])
            ->firstOrFail();

        $user       = $request->user();
        $isTraveler = $user && $shipment->traveler_id === $user->id;

        return response()->json([
            'success'       => true,
            'order_id'      => $shipment->order_id,
            'shipment_id'   => $shipment->id,
            'status'        => $shipment->status,
            'status_label'  => self::$statusLabels[$shipment->status] ?? $shipment->status,
            'status_note'   => $shipment->status_note,
            'item_name'     => $shipment->item_name,
            'weight'        => $shipment->weight,
            'total_amount'  => $shipment->total_amount,
            'is_traveler'   => $isTraveler,
            'pickup_photo_url' => $shipment->pickup_photo
                ? asset('storage/' . $shipment->pickup_photo)
                : null,
            'traveler'     => $shipment->traveler ? [
                'id'     => $shipment->traveler->id,
                'name'   => $shipment->traveler->name,
                'rating' => $shipment->traveler->rating ?? 4.8,
                'trips'  => $shipment->traveler->trips_completed ?? 0,
            ] : null,
            'sender'       => $shipment->sender ? [
                'id'   => $shipment->sender->id,
                'name' => $shipment->sender->name,
            ] : null,
            'timeline'     => $shipment->events->map(fn($e) => [
                'status'      => $e->status,
                'title'       => $e->title,
                'description' => $e->description,
                'location'    => $e->location,
                'time'        => $e->occurred_at,
            ]),
        ]);
    }

    // ── POST /api/shipments/{orderId}/accept — traveler accepts ──────────────
    public function accept(Request $request, $orderId)
    {
        $shipment = Shipment::where('order_id', $orderId)->firstOrFail();

        if ($shipment->status !== 'requested' || $shipment->traveler_id) {
            return response()->json(['success' => false, 'message' => 'Already accepted'], 422);
        }

        $shipment->update([
            'traveler_id'       => $request->user()->id,
            'status'            => 'accepted',
            'status_updated_at' => now(),
        ]);

        ShipmentEvent::create([
            'shipment_id' => $shipment->id,
            'status'      => 'accepted',
            'title'       => 'Traveler Accepted',
            'description' => $request->user()->name . ' will carry your item',
            'occurred_at' => now(),
        ]);

        return response()->json(['success' => true, 'message' => 'Shipment accepted']);
    }

    // ── POST /api/shipments/{orderId}/pickup — photo upload ──────────────────
    public function pickup(Request $request, $orderId)
    {
        $request->validate(['photo' => 'required|image|max:5120']); // 5MB max

        $shipment = Shipment::where('order_id', $orderId)->firstOrFail();

        if ($shipment->traveler_id !== $request->user()->id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $path = $request->file('photo')->store('pickup-photos', 'public');

        $shipment->update([
            'pickup_photo'      => $path,
            'status'            => 'picked_up',
            'status_updated_at' => now(),
        ]);

        ShipmentEvent::create([
            'shipment_id' => $shipment->id,
            'status'      => 'picked_up',
            'title'       => 'Item Picked Up',
            'description' => 'Traveler has picked up the item and uploaded proof photo',
            'occurred_at' => now(),
        ]);

        return response()->json([
            'success'      => true,
            'pickup_photo' => asset('storage/' . $path),
        ]);
    }

    // ── POST /api/shipments/{orderId}/update-status ───────────────────────────
    public function updateStatus(Request $request, $orderId)
    {
        $request->validate([
            'status'      => 'required|in:accepted,picked_up,in_transit,out_for_delivery,delivered,cancelled',
            'status_note' => 'nullable|string',
            'location'    => 'nullable|string',
        ]);

        $shipment = Shipment::where('order_id', $orderId)->firstOrFail();

        $shipment->update([
            'status'            => $request->status,
            'status_note'       => $request->status_note,
            'status_updated_at' => now(),
        ]);

        ShipmentEvent::create([
            'shipment_id' => $shipment->id,
            'status'      => $request->status,
            'title'       => Shipment::$statusLabels[$request->status] ?? $request->status,
            'description' => $request->status_note,
            'location'    => $request->location,
            'occurred_at' => now(),
        ]);

        return response()->json(['success' => true]);
    }

    // ── POST /api/shipments/{orderId}/location ────────────────────────────────
    public function updateLocation(Request $request, $orderId)
    {
        $request->validate(['lat' => 'required|numeric', 'lng' => 'required|numeric']);
        $shipment = Shipment::where('order_id', $orderId)->firstOrFail();

        \App\Models\ShipmentLocation::updateOrCreate(
            ['shipment_id' => $shipment->id],
            ['lat' => $request->lat, 'lng' => $request->lng, 'updated_at' => now()]
        );

        return response()->json(['success' => true]);
    }

    // ── GET /api/shipments/{orderId}/location ─────────────────────────────────
    public function getLocation(Request $request, $orderId)
    {
        $shipment = Shipment::where('order_id', $orderId)->firstOrFail();
        $loc = \App\Models\ShipmentLocation::where('shipment_id', $shipment->id)->first();

        return response()->json([
            'success'  => true,
            'location' => $loc ? ['lat' => $loc->lat, 'lng' => $loc->lng] : null,
        ]);
    }

    // ── Format helper ─────────────────────────────────────────────────────────
    private function formatShipment(Shipment $s): array
    {
        $statusColors = [
            'requested'        => '#6B7280',
            'accepted'         => '#3B82F6',
            'picked_up'        => '#8B5CF6',
            'in_transit'       => '#F59E0B',
            'out_for_delivery' => '#F97316',
            'delivered'        => '#10B981',
            'cancelled'        => '#EF4444',
        ];

        return [
            'id'           => $s->id,
            'order_id'     => $s->order_id,
            'item_name'    => $s->item_name,
            'category'     => $s->category,
            'weight'       => $s->weight,
            'value'        => $s->value,
            'description'  => $s->description,
            'route'        => "{$s->pickup_location} → {$s->destination}",
            'from'         => $s->pickup_location,
            'to'           => $s->destination,
            'pickup_date'  => $s->pickup_date,
            'total_amount' => '$' . number_format($s->total_amount, 2),
            'status'       => $s->status,
            'status_label' => Shipment::$statusLabels[$s->status] ?? $s->status,
            'status_color' => $statusColors[$s->status] ?? '#6B7280',
            'sender'       => $s->sender ? ['id' => $s->sender->id, 'name' => $s->sender->name] : null,
            'created_at'   => $s->created_at->diffForHumans(),
        ];
    }
}
