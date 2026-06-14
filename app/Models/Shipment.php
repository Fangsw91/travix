<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Shipment extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'sender_id',
        'traveler_id',
        'item_name',
        'description',
        'category',
        'weight',
        'value',
        'pickup_location',
        'pickup_country',
        'pickup_city',
        'pickup_address',
        'destination',
        'destination_country',
        'destination_city',
        'destination_address',
        'receiver_name',
        'receiver_phone',
        'receiver_email',
        'pickup_date',
        'delivery_date',
        'accepted_at',
        'delivered_at',
        'price',
        'platform_fee',
        'traveler_earnings',
        'status',
        'item_images',
        'documents',
        'special_instructions',
        'cancellation_reason',
    ];

    protected function casts(): array
    {
        return [
            'weight' => 'decimal:2',
            'value' => 'decimal:2',
            'price' => 'decimal:2',
            'platform_fee' => 'decimal:2',
            'traveler_earnings' => 'decimal:2',
            'pickup_date' => 'date',
            'delivery_date' => 'date',
            'accepted_at' => 'datetime',
            'delivered_at' => 'datetime',
            'item_images' => 'array',
            'documents' => 'array',
        ];
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
     * Transaction relationship
     */
    public function transaction()
    {
        return $this->hasOne(Transaction::class);
    }

    /**
     * Reviews relationship
     */
    public function reviews()
    {
        return $this->hasMany(Review::class);
    }

    /**
     * Scope for pending shipments
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope for active shipments
     */
    public function scopeActive($query)
    {
        return $query->whereIn('status', ['matched', 'accepted', 'in_transit']);
    }

    /**
     * Scope for completed shipments
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', 'delivered');
    }

    /**
     * Calculate platform fee (10% of price)
     */
    public function calculateFees()
    {
        $this->platform_fee = $this->price * 0.10; // 10% platform fee
        $this->traveler_earnings = $this->price - $this->platform_fee;
        $this->save();
    }

    /**
     * Check if shipment can be cancelled
     */
    public function canBeCancelled(): bool
    {
        return in_array($this->status, ['pending', 'matched', 'accepted']);
    }

    /**
     * Mark as delivered
     */
    public function markAsDelivered()
    {
        $this->update([
            'status' => 'delivered',
            'delivered_at' => now(),
        ]);
    }
}
