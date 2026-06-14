<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Shipment;
use App\Models\Trip;
use App\Jobs\MatchTravelersJob;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ShipmentController extends Controller
{
    /**
     * Get all shipments for authenticated user
     */
    public function index(Request $request)
    {
        $user = $request->user();
        
        if ($user->isSender()) {
            $shipments = $user->sentShipments()
                ->with(['traveler', 'transaction'])
                ->latest()
                ->paginate(15);
        } else {
            $shipments = $user->deliveredShipments()
                ->with(['sender', 'transaction'])
                ->latest()
                ->paginate(15);
        }

        return response()->json([
            'success' => true,
            'shipments' => $shipments
        ]);
    }

    /**
     * Get single shipment
     */
    public function show($id)
    {
        $shipment = Shipment::with(['sender', 'traveler', 'transaction', 'reviews'])
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'shipment' => $shipment
        ]);
    }

    /**
     * Create new shipment request
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'item_name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category' => 'required|in:electronics,documents,clothing,gifts,food,medicines,other',
            'weight' => 'required|numeric|min:0.1',
            'value' => 'nullable|numeric|min:0',
            'pickup_location' => 'required|string',
            'pickup_country' => 'required|string',
            'pickup_city' => 'required|string',
            'destination' => 'required|string',
            'destination_country' => 'required|string',
            'destination_city' => 'required|string',
            'receiver_name' => 'required|string',
            'receiver_phone' => 'required|string',
            'receiver_email' => 'nullable|email',
            'pickup_date' => 'required|date|after_or_equal:today',
            'price' => 'required|numeric|min:1',
            'special_instructions' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $shipment = Shipment::create([
            'sender_id' => $request->user()->id,
            ...$request->only([
                'item_name', 'description', 'category', 'weight', 'value',
                'pickup_location', 'pickup_country', 'pickup_city',
                'destination', 'destination_country', 'destination_city',
                'receiver_name', 'receiver_phone', 'receiver_email',
                'pickup_date', 'price', 'special_instructions'
            ])
        ]);

        // Calculate fees
        $shipment->calculateFees();

        // Dispatch job to find matching travelers
        MatchTravelersJob::dispatch($shipment);

        return response()->json([
            'success' => true,
            'message' => 'Shipment request created successfully',
            'shipment' => $shipment
        ], 201);
    }

    /**
     * Update shipment
     */
    public function update(Request $request, $id)
    {
        $shipment = Shipment::findOrFail($id);

        // Only sender can update
        if ($shipment->sender_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        // Can only update pending shipments
        if ($shipment->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Cannot update shipment in current status'
            ], 400);
        }

        $validator = Validator::make($request->all(), [
            'special_instructions' => 'nullable|string',
            'receiver_name' => 'sometimes|string',
            'receiver_phone' => 'sometimes|string',
            'receiver_email' => 'nullable|email',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $shipment->update($request->only([
            'special_instructions', 'receiver_name', 'receiver_phone', 'receiver_email'
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Shipment updated successfully',
            'shipment' => $shipment
        ]);
    }

    /**
     * Cancel shipment
     */
    public function cancel(Request $request, $id)
    {
        $shipment = Shipment::findOrFail($id);

        if ($shipment->sender_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        if (!$shipment->canBeCancelled()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot cancel shipment in current status'
            ], 400);
        }

        $shipment->update([
            'status' => 'cancelled',
            'cancellation_reason' => $request->reason
        ]);

        // TODO: Process refund if payment was made

        return response()->json([
            'success' => true,
            'message' => 'Shipment cancelled successfully'
        ]);
    }

    /**
     * Get available shipments for travelers
     */
    public function available(Request $request)
    {
        $query = Shipment::pending()
            ->with('sender')
            ->latest();

        // Filter by route if provided
        if ($request->has('from')) {
            $query->where('pickup_location', 'LIKE', "%{$request->from}%");
        }

        if ($request->has('to')) {
            $query->where('destination', 'LIKE', "%{$request->to}%");
        }

        // Filter by date
        if ($request->has('pickup_date')) {
            $query->whereDate('pickup_date', '>=', $request->pickup_date);
        }

        // Filter by category
        if ($request->has('category')) {
            $query->where('category', $request->category);
        }

        $shipments = $query->paginate(20);

        return response()->json([
            'success' => true,
            'shipments' => $shipments
        ]);
    }

    /**
     * Accept shipment (traveler accepts delivery request)
     */
    public function accept(Request $request, $id)
    {
        $shipment = Shipment::findOrFail($id);
        $user = $request->user();

        if (!$user->isTraveler()) {
            return response()->json([
                'success' => false,
                'message' => 'Only travelers can accept shipments'
            ], 403);
        }

        if ($shipment->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Shipment is no longer available'
            ], 400);
        }

        // Check if traveler has a matching trip
        $trip = Trip::where('traveler_id', $user->id)
            ->available()
            ->matchingRoute($shipment->pickup_location, $shipment->destination)
            ->matchingDates($shipment->pickup_date)
            ->first();

        if (!$trip) {
            return response()->json([
                'success' => false,
                'message' => 'No matching trip found'
            ], 400);
        }

        if (!$trip->hasSpaceFor($shipment->weight)) {
            return response()->json([
                'success' => false,
                'message' => 'Insufficient space in your trip'
            ], 400);
        }

        // Update shipment
        $shipment->update([
            'traveler_id' => $user->id,
            'status' => 'accepted',
            'accepted_at' => now()
        ]);

        // Reserve space in trip
        $trip->reserveSpace($shipment->weight);

        // TODO: Send notification to sender

        return response()->json([
            'success' => true,
            'message' => 'Shipment accepted successfully',
            'shipment' => $shipment
        ]);
    }

    /**
     * Mark shipment as delivered
     */
    public function markDelivered(Request $request, $id)
    {
        $shipment = Shipment::findOrFail($id);

        if ($shipment->traveler_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        $shipment->markAsDelivered();

        // TODO: Release payment to traveler

        return response()->json([
            'success' => true,
            'message' => 'Shipment marked as delivered'
        ]);
    }
}
