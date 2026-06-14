<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Review extends Model
{
    use HasFactory;

    protected $fillable = [
        'shipment_id',
        'reviewer_id',
        'reviewed_id',
        'rating',
        'comment',
        'type',
    ];

    protected function casts(): array
    {
        return [
            'rating' => 'integer',
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
     * Reviewer relationship
     */
    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }

    /**
     * Reviewed user relationship
     */
    public function reviewedUser()
    {
        return $this->belongsTo(User::class, 'reviewed_id');
    }
}