<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Trip extends Model
{
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
        'available_space',
        'price_per_kg',
        'accepted_categories',
        'notes',
        'status',
    ];

    protected $casts = [
        'departure_date'      => 'date',
        'arrival_date'        => 'date',
        'available_space'     => 'float',
        'price_per_kg'        => 'float',
        'accepted_categories' => 'array',
    ];

    public function traveler(): BelongsTo
    {
        return $this->belongsTo(User::class, 'traveler_id');
    }
}
