<?php

namespace App\Console\Commands;

use App\Models\Trip;
use Illuminate\Console\Command;

class CleanupDuplicateTrips extends Command
{
    protected $signature = 'trips:cleanup-duplicates {--dry-run : Show what would be deleted without deleting}';
    protected $description = 'Remove duplicate active trips (same traveler, route, and departure date), keeping only the oldest one of each group';

    public function handle()
    {
        $dryRun = $this->option('dry-run');

        $trips = Trip::where('status', 'active')->orderBy('created_at')->get();

        $seen = [];
        $toDelete = [];

        foreach ($trips as $trip) {
            $key = $trip->traveler_id . '|' . $trip->from_location . '|' . $trip->to_location . '|' . $trip->departure_date;

            if (isset($seen[$key])) {
                $toDelete[] = $trip;
            } else {
                $seen[$key] = $trip->id;
            }
        }

        if (empty($toDelete)) {
            $this->info('No duplicate trips found.');
            return self::SUCCESS;
        }

        $this->info(count($toDelete) . ' duplicate trip(s) found:');
        foreach ($toDelete as $trip) {
            $this->line("  - Trip #{$trip->id}: {$trip->from_location} → {$trip->to_location} on {$trip->departure_date} (created {$trip->created_at})");
        }

        if ($dryRun) {
            $this->warn('Dry run — nothing was deleted. Remove --dry-run to actually delete these.');
            return self::SUCCESS;
        }

        foreach ($toDelete as $trip) {
            $trip->delete();
        }

        $this->info('Deleted ' . count($toDelete) . ' duplicate trip(s).');
        return self::SUCCESS;
    }
}
