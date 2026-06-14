<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ShipmentLocation extends Model
{
    protected $fillable = ['shipment_id', 'lat', 'lng', 'address', 'recorded_at'];
    protected $casts    = ['recorded_at' => 'datetime', 'lat' => 'float', 'lng' => 'float'];

    public function shipment(): BelongsTo
    {
        return $this->belongsTo(Shipment::class);
    }
}
