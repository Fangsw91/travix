<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Transaction extends Model
{
    protected $fillable = [
        'shipment_id', 'sender_id', 'traveler_id',
        'amount', 'platform_fee', 'traveler_amount',
        'currency', 'payment_method', 'payment_gateway_id', 'payment_intent_id',
        'status', 'paid_at', 'released_at',
    ];

    protected $casts = [
        'amount'          => 'float',
        'platform_fee'    => 'float',
        'traveler_amount' => 'float',
        'paid_at'         => 'datetime',
        'released_at'     => 'datetime',
    ];

    public function shipment(): BelongsTo { return $this->belongsTo(Shipment::class); }
    public function sender(): BelongsTo   { return $this->belongsTo(User::class, 'sender_id'); }
    public function traveler(): BelongsTo { return $this->belongsTo(User::class, 'traveler_id'); }
}
