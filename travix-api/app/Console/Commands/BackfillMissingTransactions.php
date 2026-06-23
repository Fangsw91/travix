<?php

namespace App\Console\Commands;

use App\Models\Shipment;
use App\Models\Transaction;
use Illuminate\Console\Command;

class BackfillMissingTransactions extends Command
{
    protected $signature = 'transactions:backfill {--dry-run : Show what would be created without saving}';
    protected $description = 'Create missing Transaction records for shipments that have a traveler assigned but no transaction (e.g. accepted via the old accept() flow before it created one) — fixes empty "Your Earnings" cards';

    public function handle()
    {
        $dryRun = $this->option('dry-run');

        $shipments = Shipment::whereNotNull('traveler_id')->get()->filter(function ($s) {
            return !Transaction::where('shipment_id', $s->id)->exists();
        });

        if ($shipments->isEmpty()) {
            $this->info('No shipments are missing a transaction.');
            return self::SUCCESS;
        }

        $this->info($shipments->count() . ' shipment(s) missing a transaction:');

        foreach ($shipments as $shipment) {
            // total_amount = base + platform_fee (base × 0.30), so base = total / 1.30
            $base           = round($shipment->total_amount / 1.30, 2);
            $platformFee    = round($shipment->total_amount - $base, 2);
            $travelerAmount = $base;

            $this->line(sprintf(
                "  - %s: total $%s → traveler gets $%s (fee $%s)",
                $shipment->order_id, $shipment->total_amount, $travelerAmount, $platformFee
            ));

            if (!$dryRun) {
                Transaction::create([
                    'shipment_id'     => $shipment->id,
                    'sender_id'       => $shipment->sender_id,
                    'traveler_id'     => $shipment->traveler_id,
                    'amount'          => $shipment->total_amount,
                    'platform_fee'    => $platformFee,
                    'traveler_amount' => $travelerAmount,
                    'status'          => in_array($shipment->status, ['delivered']) ? 'released' : 'escrow',
                    'paid_at'         => $shipment->created_at,
                ]);
            }
        }

        if ($dryRun) {
            $this->warn('Dry run — nothing was created. Remove --dry-run to apply.');
        } else {
            $this->info('Created ' . $shipments->count() . ' missing transaction(s).');
        }

        return self::SUCCESS;
    }
}
