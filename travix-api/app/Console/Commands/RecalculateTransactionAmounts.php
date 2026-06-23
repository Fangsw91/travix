<?php

namespace App\Console\Commands;

use App\Models\Shipment;
use App\Models\Transaction;
use Illuminate\Console\Command;

class RecalculateTransactionAmounts extends Command
{
    protected $signature = 'transactions:recalculate {--dry-run : Show what would change without saving}';
    protected $description = 'Recalculate platform_fee and traveler_amount on every transaction using the current 15% fee formula, fixing any stale/incorrect values from earlier in development';

    public function handle()
    {
        $dryRun = $this->option('dry-run');
        $transactions = Transaction::with('shipment')->get();

        if ($transactions->isEmpty()) {
            $this->info('No transactions found.');
            return self::SUCCESS;
        }

        $changedCount = 0;

        foreach ($transactions as $txn) {
            $shipment = $txn->shipment;
            if (!$shipment) {
                $this->warn("Transaction #{$txn->id} has no linked shipment — skipping.");
                continue;
            }

            // total_amount = base + platform_fee (base × 0.30), so base = total / 1.30
            $correctBase           = round($shipment->total_amount / 1.30, 2);
            $correctPlatformFee    = round($shipment->total_amount - $correctBase, 2);
            $correctTravelerAmount = $correctBase;

            $needsFix = abs($txn->platform_fee - $correctPlatformFee) > 0.01
                     || abs($txn->traveler_amount - $correctTravelerAmount) > 0.01
                     || abs($txn->amount - $shipment->total_amount) > 0.01;

            if ($needsFix) {
                $changedCount++;
                $this->line(sprintf(
                    "Txn #%d (Shipment %s): amount $%s→$%s, fee $%s→$%s, traveler $%s→$%s",
                    $txn->id, $shipment->order_id,
                    $txn->amount, $shipment->total_amount,
                    $txn->platform_fee, $correctPlatformFee,
                    $txn->traveler_amount, $correctTravelerAmount
                ));

                if (!$dryRun) {
                    $txn->update([
                        'amount'          => $shipment->total_amount,
                        'platform_fee'    => $correctPlatformFee,
                        'traveler_amount' => $correctTravelerAmount,
                    ]);
                }
            }
        }

        if ($changedCount === 0) {
            $this->info('All transactions already have correct amounts.');
            return self::SUCCESS;
        }

        if ($dryRun) {
            $this->warn("{$changedCount} transaction(s) would be updated. Remove --dry-run to apply.");
        } else {
            $this->info("Updated {$changedCount} transaction(s).");
        }

        return self::SUCCESS;
    }
}
