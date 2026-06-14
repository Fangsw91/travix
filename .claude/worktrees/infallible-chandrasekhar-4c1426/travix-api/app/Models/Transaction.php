<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'shipment_id',
        'sender_id',
        'traveler_id',
        'amount',
        'platform_fee',
        'traveler_amount',
        'currency',
        'payment_method',
        'payment_gateway_id',
        'payment_intent_id',
        'status',
        'paid_at',
        'released_at',
        'refunded_at',
        'notes',
        'failure_reason',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'platform_fee' => 'decimal:2',
            'traveler_amount' => 'decimal:2',
            'paid_at' => 'datetime',
            'released_at' => 'datetime',
            'refunded_at' => 'datetime',
        ];
    }

    /**
     * Shipment relationship
     */
    public function shipment()
    {
        return $this->belongsTo(Shipment::class);
    }

    /**
     * Sender relationship
     */
    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    /**
     * Traveler relationship
     */
    public function traveler()
    {
        return $this->belongsTo(User::class, 'traveler_id');
    }

    /**
     * Scope for completed transactions
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    /**
     * Scope for pending transactions
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }
}