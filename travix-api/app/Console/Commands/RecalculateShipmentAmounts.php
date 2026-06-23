<?php

namespace App\Console\Commands;

use App\Models\Shipment;
use App\Models\Transaction;
use Illuminate\Console\Command;

class RecalculateShipmentAmounts extends Command
{
    protected $signature = 'shipments:recalculate {--dry-run : Show what would change without saving}';
    protected $description = 'Recalculate total_amount on every shipment from scratch using the current Calculator formula (weight fee + tiered value fee, $5 minimum base, 30% platform fee). Fixes shipments created with old/incorrect pricing logic, then updates their Transaction to match.';

    // Same rates as send-item.js / calculator.js — keep these two in sync if rates ever change.
    private array $countryRates = [
        'Saudi Arabia' => 8, 'UAE' => 9, 'Egypt' => 7, 'Kuwait' => 9, 'Qatar' => 10,
        'Bahrain' => 9, 'Oman' => 9, 'Lebanon' => 8, 'Iraq' => 10, 'Syria' => 11,
        'Tunisia' => 12, 'Morocco' => 13, 'Algeria' => 13, 'Libya' => 14, 'Yemen' => 15, 'Sudan' => 14,
        'Turkey' => 11, 'Germany' => 18, 'France' => 18, 'United Kingdom' => 20, 'Italy' => 17,
        'Spain' => 17, 'Netherlands' => 19, 'Poland' => 16, 'Sweden' => 20, 'Norway' => 21,
        'Switzerland' => 22, 'Greece' => 15,
        'United States' => 25, 'Canada' => 24, 'Mexico' => 22, 'Brazil' => 26,
    ];

    private function valueFeeRate(float $itemValue): float
    {
        if ($itemValue <= 100)  return 0.030;
        if ($itemValue <= 500)  return 0.025;
        if ($itemValue <= 1000) return 0.020;
        return 0.015;
    }

    public function handle()
    {
        $dryRun = $this->option('dry-run');
        $shipments = Shipment::all();

        if ($shipments->isEmpty()) {
            $this->info('No shipments found.');
            return self::SUCCESS;
        }

        $changedCount = 0;
        $skippedCount = 0;

        foreach ($shipments as $shipment) {
            $rate = $this->countryRates[$shipment->destination] ?? null;

            if ($rate === null) {
                $this->warn("Skipping {$shipment->order_id} — unknown destination '{$shipment->destination}', cannot determine rate.");
                $skippedCount++;
                continue;
            }

            $weight       = (float) ($shipment->weight ?? 0);
            $itemValue    = (float) ($shipment->value ?? 0);
            $weightFee    = $weight * $rate;
            $valueFeeRate = $this->valueFeeRate($itemValue);
            $valueFee     = $itemValue * $valueFeeRate;
            $base         = max($weightFee + $valueFee, 5);
            $platformFee  = round($base * 0.30, 2);
            $correctTotal = round($base + $platformFee, 2);
            $correctBase  = round($base, 2);

            $needsFix = abs((float) $shipment->total_amount - $correctTotal) > 0.01;

            if ($needsFix) {
                $changedCount++;
                $this->line(sprintf(
                    "%s (%s, %.1fkg, value \$%.2f): total \$%.2f → \$%.2f (traveler gets \$%.2f)",
                    $shipment->order_id, $shipment->destination, $weight, $itemValue,
                    $shipment->total_amount, $correctTotal, $correctBase
                ));

                if (!$dryRun) {
                    $shipment->update(['total_amount' => $correctTotal]);

                    // Keep the linked transaction in sync too, if one exists
                    $txn = Transaction::where('shipment_id', $shipment->id)->first();
                    if ($txn) {
                        $txn->update([
                            'amount'          => $correctTotal,
                            'platform_fee'    => $platformFee,
                            'traveler_amount' => $correctBase,
                        ]);
                    }
                }
            }
        }

        if ($changedCount === 0) {
            $this->info('All shipments already have correct totals.');
        } elseif ($dryRun) {
            $this->warn("{$changedCount} shipment(s) would be updated. Remove --dry-run to apply.");
        } else {
            $this->info("Updated {$changedCount} shipment(s) and their transactions.");
        }

        if ($skippedCount > 0) {
            $this->warn("{$skippedCount} shipment(s) skipped — destination didn't match any known country rate.");
        }

        return self::SUCCESS;
    }
}
