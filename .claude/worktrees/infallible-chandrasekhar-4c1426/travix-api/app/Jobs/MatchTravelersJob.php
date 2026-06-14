<?php

namespace App\Jobs;

use App\Models\Shipment;
use App\Models\Trip;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class MatchTravelersJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $shipment;

    /**
     * Create a new job instance.
     */
    public function __construct(Shipment $shipment)
    {
        $this->shipment = $shipment;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            // Find matching trips
            $matchingTrips = Trip::available()
                ->matchingRoute(
                    $this->shipment->pickup_location, 
                    $this->shipment->destination
                )
                ->matchingDates($this->shipment->pickup_date)
                ->with('traveler')
                ->get();

            Log::info("Found {$matchingTrips->count()} matching trips for shipment #{$this->shipment->id}");

            // Filter trips that have enough space
            $suitableTrips = $matchingTrips->filter(function ($trip) {
                return $trip->hasSpaceFor($this->shipment->weight);
            });

            Log::info("{$suitableTrips->count()} trips have sufficient space");

            // Update shipment status if matches found
            if ($suitableTrips->count() > 0) {
                $this->shipment->update(['status' => 'matched']);
                
                // Notify travelers about the new request
                foreach ($suitableTrips as $trip) {
                    $this->notifyTraveler($trip->traveler);
                }
            }

        } catch (\Exception $e) {
            Log::error("Error matching travelers for shipment #{$this->shipment->id}: " . $e->getMessage());
        }
    }

    /**
     * Notify traveler about matching shipment
     */
    protected function notifyTraveler(User $traveler)
    {
        // TODO: Implement notification
        // You can use Laravel Notifications or a third-party service
        
        Log::info("Notifying traveler #{$traveler->id} about shipment #{$this->shipment->id}");
        
        // Example:
        // $traveler->notify(new NewShipmentMatchNotification($this->shipment));
    }
}
