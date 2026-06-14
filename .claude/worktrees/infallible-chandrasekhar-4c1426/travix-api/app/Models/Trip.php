<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Trip extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'traveler_id',
        'from_location',
        'from_country',
        'from_city',
        'to_location',
        'to_country',
        'to_city',
        'departure_date',
        'arrival_date',
        'flight_number',
        'available_space',
        'used_space',
        'price_per_kg',
        'accepted_categories',
        'status',
        'verification_documents',
        'is_verified',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'departure_date' => 'date',
            'arrival_date' => 'date',
            'available_space' => 'decimal:2',
            'used_space' => 'decimal:2',
            'price_per_kg' => 'decimal:2',
            'accepted_categories' => 'array',
            'verification_documents' => 'array',
            'is_verified' => 'boolean',
        ];
    }

    /**
     * Traveler relationship
     */
    public function traveler()
    {
        return $this->belongsTo(User::class, 'traveler_id');
    }

    /**
     * Get remaining space
     */
    public function getRemainingSpaceAttribute()
    {
        return $this->available_space - $this->used_space;
    }

    /**
     * Check if trip has space for weight
     */
    public function hasSpaceFor(float $weight): bool
    {
        return $this->remaining_space >= $weight;
    }

    /**
     * Scope for active trips
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active')
                    ->where('departure_date', '>=', now());
    }

    /**
     * Scope for available trips (active with space)
     */
    public function scopeAvailable($query)
    {
        return $query->active()
                    ->whereRaw('(available_space - used_space) > 0');
    }

    /**
     * Scope to match route
     */
    public function scopeMatchingRoute($query, $from, $to)
    {
        return $query->where('from_location', 'LIKE', "%{$from}%")
                    ->where('to_location', 'LIKE', "%{$to}%");
    }

    /**
     * Scope to match date range
     */
    public function scopeMatchingDates($query, $pickupDate)
    {
        return $query->where('departure_date', '>=', $pickupDate);
    }

    /**
     * Reserve space
     */
    public function reserveSpace(float $weight)
    {
        if (!$this->hasSpaceFor($weight)) {
            throw new \Exception('Insufficient space available');
        }

        $this->used_space += $weight;
        
        // Update status if full
        if ($this->remaining_space <= 0) {
            $this->status = 'full';
        }
        
        $this->save();
    }

    /**
     * Release space (when shipment is cancelled)
     */
    public function releaseSpace(float $weight)
    {
        $this->used_space -= $weight;
        
        // Reactivate if there's space now
        if ($this->remaining_space > 0 && $this->status === 'full') {
            $this->status = 'active';
        }
        
        $this->save();
    }
}
