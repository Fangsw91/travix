<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Trip;
use Illuminate\Http\Request;

class TripController extends Controller
{
    // GET /api/trips — traveler's own trips
    public function index(Request $request)
    {
        $trips = Trip::where('traveler_id', $request->user()->id)->latest()->get();
        return response()->json(['success' => true, 'trips' => $trips]);
    }

    // GET /api/trips/available?from=Jordan&to=Saudi+Arabia
    // Senders browse travelers going to their destination
    public function available(Request $request)
    {
        $to   = strtolower($request->query('to', ''));
        $from = strtolower($request->query('from', ''));

        $trips = Trip::where('status', 'active')
            ->where('departure_date', '>=', now()->toDateString())
            ->with('traveler:id,name,avatar,phone')
            ->latest('departure_date')
            ->get()
            ->filter(function ($trip) use ($to, $from) {
                $tripTo   = strtolower($trip->to_country ?? $trip->to_location ?? '');
                $tripFrom = strtolower($trip->from_country ?? $trip->from_location ?? '');

                $toMatch   = !$to   || str_contains($tripTo, $to)   || str_contains($to, $tripTo);
                $fromMatch = !$from || str_contains($tripFrom, $from) || str_contains($from, $tripFrom);

                return $toMatch && $fromMatch;
            })
            ->values()
            ->take(20);

        return response()->json([
            'success' => true,
            'trips'   => $trips->map(fn($t) => [
                'id'              => $t->id,
                'from'            => $t->from_location,
                'to'              => $t->to_location,
                'from_country'    => $t->from_country,
                'to_country'      => $t->to_country,
                'departure_date'  => $t->departure_date,
                'available_space' => $t->available_space,
                'price_per_kg'    => $t->price_per_kg,
                'notes'           => $t->notes,
                'traveler'        => [
                    'id'     => $t->traveler->id,
                    'name'   => $t->traveler->name,
                    'avatar' => $t->traveler->avatar,
                ],
            ]),
        ]);
    }

    // GET /api/trips/{id}
    public function show(Request $request, $id)
    {
        $trip = Trip::with('traveler:id,name,avatar')->findOrFail($id);
        return response()->json(['success' => true, 'trip' => $trip]);
    }

    // POST /api/trips
    public function store(Request $request)
    {
        $validated = $request->validate([
            'from_location'      => 'required|string',
            'from_country'       => 'nullable|string',
            'to_location'        => 'required|string',
            'to_country'         => 'nullable|string',
            'departure_date'     => 'required|date|after:today',
            'arrival_date'       => 'nullable|date',
            'available_space'    => 'required|numeric|min:0.1',
            'price_per_kg'       => 'required|numeric|min:0',
            'accepted_categories'=> 'nullable|array',
            'notes'              => 'nullable|string',
        ]);

        $trip = Trip::create(array_merge($validated, [
            'traveler_id' => $request->user()->id,
            'status'      => 'active',
        ]));

        return response()->json(['success' => true, 'trip' => $trip], 201);
    }

    // PUT /api/trips/{id}
    public function update(Request $request, $id)
    {
        $trip = Trip::where('id', $id)
            ->where('traveler_id', $request->user()->id)
            ->firstOrFail();

        $trip->update($request->only([
            'from_location','from_country','to_location','to_country',
            'departure_date','arrival_date','available_space','price_per_kg','notes'
        ]));

        return response()->json(['success' => true, 'trip' => $trip]);
    }

    // POST /api/trips/{id}/cancel
    public function cancel(Request $request, $id)
    {
        $trip = Trip::where('id', $id)
            ->where('traveler_id', $request->user()->id)
            ->firstOrFail();

        $trip->update(['status' => 'cancelled']);
        return response()->json(['success' => true]);
    }
}
