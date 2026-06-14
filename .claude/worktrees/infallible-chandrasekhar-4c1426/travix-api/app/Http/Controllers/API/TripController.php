<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Trip;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class TripController extends Controller
{
    /**
     * Get all trips for authenticated traveler
     */
    public function index(Request $request)
    {
        $trips = Trip::where('traveler_id', $request->user()->id)
            ->with('traveler')
            ->latest()
            ->paginate(15);

        return response()->json([
            'success' => true,
            'trips' => $trips
        ]);
    }

    /**
     * Get single trip
     */
    public function show($id)
    {
        $trip = Trip::with('traveler')->findOrFail($id);

        return response()->json([
            'success' => true,
            'trip' => $trip
        ]);
    }

    /**
     * Create new trip
     */
    public function store(Request $request)
    {
        if (!$request->user()->isTraveler()) {
            return response()->json([
                'success' => false,
                'message' => 'Only travelers can create trips'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'from_location' => 'required|string',
            'from_country' => 'required|string',
            'from_city' => 'required|string',
            'to_location' => 'required|string',
            'to_country' => 'required|string',
            'to_city' => 'required|string',
            'departure_date' => 'required|date|after_or_equal:today',
            'arrival_date' => 'nullable|date|after_or_equal:departure_date',
            'flight_number' => 'nullable|string',
            'available_space' => 'required|numeric|min:1',
            'price_per_kg' => 'required|numeric|min:1',
            'accepted_categories' => 'nullable|array',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $trip = Trip::create([
            'traveler_id' => $request->user()->id,
            ...$request->only([
                'from_location', 'from_country', 'from_city',
                'to_location', 'to_country', 'to_city',
                'departure_date', 'arrival_date', 'flight_number',
                'available_space', 'price_per_kg', 'accepted_categories', 'notes'
            ])
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Trip created successfully',
            'trip' => $trip
        ], 201);
    }

    /**
     * Update trip
     */
    public function update(Request $request, $id)
    {
        $trip = Trip::findOrFail($id);

        if ($trip->traveler_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'departure_date' => 'sometimes|date|after_or_equal:today',
            'arrival_date' => 'nullable|date|after_or_equal:departure_date',
            'available_space' => 'sometimes|numeric|min:' . $trip->used_space,
            'price_per_kg' => 'sometimes|numeric|min:1',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $trip->update($request->only([
            'departure_date', 'arrival_date', 'available_space', 'price_per_kg', 'notes'
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Trip updated successfully',
            'trip' => $trip
        ]);
    }

    /**
     * Cancel trip
     */
    public function cancel($id)
    {
        $trip = Trip::findOrFail($id);

        if ($trip->traveler_id !== auth()->id()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        if ($trip->used_space > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot cancel trip with accepted shipments'
            ], 400);
        }

        $trip->update(['status' => 'cancelled']);

        return response()->json([
            'success' => true,
            'message' => 'Trip cancelled successfully'
        ]);
    }

    /**
     * Get available trips (for senders to browse)
     */
    public function available(Request $request)
    {
        $query = Trip::available()
            ->with('traveler')
            ->latest();

        // Filter by route
        if ($request->has('from')) {
            $query->where('from_location', 'LIKE', "%{$request->from}%");
        }

        if ($request->has('to')) {
            $query->where('to_location', 'LIKE', "%{$request->to}%");
        }

        // Filter by date
        if ($request->has('departure_date')) {
            $query->whereDate('departure_date', '>=', $request->departure_date);
        }

        $trips = $query->paginate(20);

        return response()->json([
            'success' => true,
            'trips' => $trips
        ]);
    }
}
