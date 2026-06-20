<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Shipment;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Stripe\Stripe;
use Stripe\PaymentIntent;

class PaymentController extends Controller
{
    public function createPaymentIntent(Request $request)
    {
        $request->validate([
            'shipment_id' => 'required|integer',
            'trip_id'     => 'nullable|integer',
        ]);

        $shipment = Shipment::findOrFail($request->shipment_id);

        if ($shipment->sender_id !== $request->user()->id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        // Pre-assign traveler if trip_id provided and shipment still pending
        if ($request->trip_id && $shipment->status === 'pending') {
            $trip = \App\Models\Trip::findOrFail($request->trip_id);
            if ($trip->hasSpaceFor($shipment->weight)) {
                $shipment->update([
                    'traveler_id' => $trip->traveler_id,
                    'status'      => 'accepted',
                    'accepted_at' => now(),
                ]);
                $trip->reserveSpace($shipment->weight);
            }
        }

        Stripe::setApiKey(config('services.stripe.secret'));

        $amountInCents = (int) round($shipment->total_amount * 100);

        $paymentIntent = PaymentIntent::create([
            'amount'   => $amountInCents,
            'currency' => 'usd',
            'metadata' => [
                'shipment_id' => $shipment->id,
                'sender_id'   => $request->user()->id,
            ],
        ]);

        return response()->json([
            'success'       => true,
            'client_secret' => $paymentIntent->client_secret,
            'amount'        => $shipment->total_amount,
            'shipment'      => $shipment->load('traveler'),
        ]);
    }

    public function confirmPayment(Request $request)
    {
        $request->validate([
            'payment_intent_id' => 'required|string',
            'shipment_id'       => 'required|integer',
        ]);

        $shipment = Shipment::findOrFail($request->shipment_id);

        Stripe::setApiKey(config('services.stripe.secret'));

        $paymentIntent = PaymentIntent::retrieve($request->payment_intent_id);

        if ($paymentIntent->status !== 'succeeded') {
            return response()->json(['success' => false, 'message' => 'Payment not completed'], 400);
        }

        $platformFee    = round($shipment->total_amount * 0.15, 2);
        $travelerAmount = round($shipment->total_amount * 0.85, 2);

        Transaction::create([
            'shipment_id'        => $shipment->id,
            'sender_id'          => $shipment->sender_id,
            'traveler_id'        => $shipment->traveler_id,
            'amount'             => $shipment->total_amount,
            'platform_fee'       => $platformFee,
            'traveler_amount'    => $travelerAmount,
            'currency'           => 'usd',
            'payment_method'     => 'stripe',
            'payment_gateway_id' => $paymentIntent->id,
            'payment_intent_id'  => $paymentIntent->id,
            'status'             => 'escrow',
            'paid_at'            => now(),
        ]);

        $shipment->update(['status' => 'in_transit']);

        return response()->json([
            'success' => true,
            'message' => 'Payment confirmed successfully',
        ]);
    }
}
