<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Shipment;
use App\Models\ShipmentEvent;
use App\Models\Trip;
use App\Models\Transaction;
use App\Models\User;
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
            'traveler_id'      => 'nullable|integer|exists:users,id',
        ]);

        $hasTraveler = !empty($validated['traveler_id']);

        $shipment = Shipment::create(array_merge($validated, [
            'sender_id'         => $request->user()->id,
            'order_id'          => 'TRX-' . date('Y') . '-' . strtoupper(Str::random(6)),
            'status'            => $hasTraveler ? 'accepted' : 'requested',
            'status_updated_at' => $hasTraveler ? now() : null,
        ]));

        ShipmentEvent::create([
            'shipment_id' => $shipment->id,
            'status'      => 'requested',
            'title'       => 'Shipment Requested',
            'description' => 'Your shipment request has been created',
            'occurred_at' => $hasTraveler ? now()->subSeconds(5) : now(),
        ]);

        if ($hasTraveler) {
            ShipmentEvent::create([
                'shipment_id' => $shipment->id,
                'status'      => 'accepted',
                'title'       => 'Traveler Accepted',
                'description' => $shipment->traveler->name . ' will carry your item',
                'occurred_at' => now(),
            ]);

            // Create the matching transaction immediately so earnings show
            // correctly everywhere as soon as the shipment exists.
            $platformFee    = round($shipment->total_amount * 0.15, 2);
            $travelerAmount = round($shipment->total_amount - $platformFee, 2);

            Transaction::create([
                'shipment_id'     => $shipment->id,
                'sender_id'       => $shipment->sender_id,
                'traveler_id'     => $shipment->traveler_id,
                'amount'          => $shipment->total_amount,
                'platform_fee'    => $platformFee,
                'traveler_amount' => $travelerAmount,
                'status'          => 'escrow',
                'paid_at'         => now(),
            ]);
        }

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

        // Real traveler earnings come from the transaction created at payment time —
        // never recompute this from total_amount on the frontend, the platform fee
        // percentage can change over time and would make old shipments show wrong numbers.
        $transaction = Transaction::where('shipment_id', $shipment->id)->first();

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
            'traveler_amount' => $transaction?->traveler_amount,
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

    // ── POST /api/shipments/accept-demo — promote a demo request into a real,
    // persisted shipment so it shows up everywhere (admin dashboard, DB, etc.)
    // instead of only existing in the traveler's browser localStorage.
    public function acceptDemo(Request $request)
    {
        $validated = $request->validate([
            'order_id'     => 'required|string',
            'item_name'    => 'required|string',
            'category'     => 'nullable|string',
            'weight'       => 'required|numeric',
            'total_amount' => 'required|numeric',
            'pickup_location' => 'required|string',
            'destination'      => 'required|string',
            'pickup_date'      => 'nullable|date',
            'sender_name'      => 'nullable|string',
        ]);

        // Reuse a single system "Demo Sender" account for all demo shipments,
        // creating it once if it doesn't exist yet.
        $demoSender = User::firstOrCreate(
            ['email' => 'demo-sender@travix.internal'],
            [
                'name'     => $validated['sender_name'] ?? 'Omar Al-Rashid',
                'password' => bin2hex(random_bytes(16)), // unusable random password
                'role'     => 'sender',
                'phone'    => '+962700000000',
                'verification_status' => 'approved',
            ]
        );

        // If this demo order was already promoted before, just return it
        $existing = Shipment::where('order_id', $validated['order_id'])->first();
        if ($existing) {
            if ($existing->status === 'requested') {
                $existing->update([
                    'traveler_id'       => $request->user()->id,
                    'status'            => 'accepted',
                    'status_updated_at' => now(),
                ]);
            }
            return response()->json(['success' => true, 'shipment' => $existing]);
        }

        $shipment = Shipment::create([
            'order_id'         => $validated['order_id'],
            'sender_id'        => $demoSender->id,
            'traveler_id'      => $request->user()->id,
            'item_name'        => $validated['item_name'],
            'category'         => $validated['category'] ?? 'General',
            'weight'           => $validated['weight'],
            'total_amount'     => $validated['total_amount'],
            'pickup_location'  => $validated['pickup_location'],
            'destination'      => $validated['destination'],
            'pickup_date'      => $validated['pickup_date'] ?? now()->addDay(),
            'status'           => 'accepted',
            'status_updated_at'=> now(),
        ]);

        ShipmentEvent::create([
            'shipment_id' => $shipment->id,
            'status'      => 'requested',
            'title'       => 'Shipment Requested',
            'description' => 'Shipment request created',
            'occurred_at' => now()->subMinutes(5),
        ]);

        ShipmentEvent::create([
            'shipment_id' => $shipment->id,
            'status'      => 'accepted',
            'title'       => 'Traveler Accepted',
            'description' => $request->user()->name . ' will carry this item',
            'occurred_at' => now(),
        ]);

        // Also create the matching transaction so earnings show correctly everywhere
        $platformFee    = round($shipment->total_amount * 0.15, 2);
        $travelerAmount = round($shipment->total_amount - $platformFee, 2);

        \App\Models\Transaction::create([
            'shipment_id'     => $shipment->id,
            'sender_id'       => $demoSender->id,
            'traveler_id'     => $request->user()->id,
            'amount'          => $shipment->total_amount,
            'platform_fee'    => $platformFee,
            'traveler_amount' => $travelerAmount,
            'status'          => 'escrow',
            'paid_at'         => now(),
        ]);

        return response()->json(['success' => true, 'shipment' => $shipment], 201);
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

        if ($shipment->traveler_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Only the assigned traveler can share location for this shipment.',
            ], 403);
        }

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

        // Estimate the traveler's cut using the same fixed 15% platform fee used
        // everywhere else (PaymentController, dashboard stats). This is shown to
        // the traveler BEFORE they accept, since no Transaction exists yet at
        // the 'requested' stage — the real traveler_amount is locked in at payment time.
        $estimatedTravelerAmount = round($s->total_amount * 0.85, 2);

        return [
            'id'              => $s->id,
            'order_id'        => $s->order_id,
            'item_name'       => $s->item_name,
            'category'        => $s->category,
            'weight'          => $s->weight,
            'value'           => $s->value,
            'description'     => $s->description,
            'route'           => "{$s->pickup_location} → {$s->destination}",
            'from'            => $s->pickup_location,
            'to'              => $s->destination,
            'pickup_date'     => $s->pickup_date,
            'total_amount'    => '$' . number_format($s->total_amount, 2),
            'traveler_amount' => '$' . number_format($estimatedTravelerAmount, 2),
            'status'          => $s->status,
            'status_label'    => Shipment::$statusLabels[$s->status] ?? $s->status,
            'status_color'    => $statusColors[$s->status] ?? '#6B7280',
            'sender'          => $s->sender ? ['id' => $s->sender->id, 'name' => $s->sender->name] : null,
            'created_at'      => $s->created_at->diffForHumans(),
        ];
    }
}
