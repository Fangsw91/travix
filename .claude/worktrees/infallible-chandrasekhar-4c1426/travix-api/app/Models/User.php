<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'phone',
        'address',
        'country',
        'city',
        'profile_image',
        'rating',
        'total_ratings',
        'is_verified',
        'is_active',
        'last_login_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'last_login_at' => 'datetime',
            'is_verified' => 'boolean',
            'is_active' => 'boolean',
            'rating' => 'decimal:2',
        ];
    }

    /**
     * Shipments sent by this user
     */
    public function sentShipments()
    {
        return $this->hasMany(Shipment::class, 'sender_id');
    }

    /**
     * Shipments delivered by this user (as traveler)
     */
    public function deliveredShipments()
    {
        return $this->hasMany(Shipment::class, 'traveler_id');
    }

    /**
     * Trips posted by this user
     */
    public function trips()
    {
        return $this->hasMany(Trip::class, 'traveler_id');
    }

    /**
     * Reviews written by this user
     */
    public function reviewsGiven()
    {
        return $this->hasMany(Review::class, 'reviewer_id');
    }

    /**
     * Reviews received by this user
     */
    public function reviewsReceived()
    {
        return $this->hasMany(Review::class, 'reviewed_id');
    }

    /**
     * Transactions as sender
     */
    public function senderTransactions()
    {
        return $this->hasMany(Transaction::class, 'sender_id');
    }

    /**
     * Transactions as traveler
     */
    public function travelerTransactions()
    {
        return $this->hasMany(Transaction::class, 'traveler_id');
    }

    /**
     * Check if user is sender
     */
    public function isSender(): bool
    {
        return $this->role === 'sender';
    }

    /**
     * Check if user is traveler
     */
    public function isTraveler(): bool
    {
        return $this->role === 'traveler';
    }

    /**
     * Check if user is admin
     */
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    /**
     * Update user rating
     */
    public function updateRating()
    {
        $reviews = $this->reviewsReceived()->get();
        
        if ($reviews->count() > 0) {
            $this->update([
                'rating' => $reviews->avg('rating'),
                'total_ratings' => $reviews->count(),
            ]);
        }
    }
}
