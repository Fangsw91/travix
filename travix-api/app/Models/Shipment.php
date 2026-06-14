<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Shipment extends Model
{
    protected $fillable = [
        'order_id', 'sender_id', 'traveler_id',
        'item_name', 'category', 'weight', 'value', 'description',
        'pickup_location', 'destination', 'pickup_date', 'delivery_date',
        'receiver_name', 'receiver_phone', 'delivery_address',
        'total_amount', 'payment_method_id', 'payment_status',
        'status', 'status_updated_at', 'status_note', 'pickup_photo',
    ];

    protected $casts = [
        'pickup_date'       => 'date',
        'delivery_date'     => 'date',
        'status_updated_at' => 'datetime',
        'weight'            => 'float',
        'total_amount'      => 'float',
    ];

    // Status display labels
    public static array $statusLabels = [
        'requested'        => 'Requested',
        'accepted'         => 'Accepted',
        'picked_up'        => 'Picked Up',
        'in_transit'       => 'In Transit',
        'out_for_delivery' => 'Out for Delivery',
        'delivered'        => 'Delivered',
        'cancelled'        => 'Cancelled',
    ];

    // Status descriptions
    public static array $statusDescriptions = [
        'requested'        => 'Request submitted',
        'accepted'         => 'Traveler confirmed',
        'picked_up'        => 'Item collected',
        'in_transit'       => 'On the way',
        'out_for_delivery' => 'Almost there!',
        'delivered'        => 'Successfully delivered',
        'cancelled'        => 'Order cancelled',
    ];

    // All statuses in order
    public static array $statusFlow = [
        'requested',
        'accepted',
        'picked_up',
        'in_transit',
        'out_for_delivery',
        'delivered',
    ];

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function traveler(): BelongsTo
    {
        return $this->belongsTo(User::class, 'traveler_id');
    }

    public function events(): HasMany
    {
        return $this->hasMany(ShipmentEvent::class)->orderBy('occurred_at', 'asc');
    }

    // Build the full timeline array for the frontend
    public function buildTimeline(): array
    {
        $completedStatuses = array_slice(
            self::$statusFlow,
            0,
            array_search($this->status, self::$statusFlow) + 1
        );

        $events = $this->events->keyBy('status');

        return collect(self::$statusFlow)->map(function ($status) use ($completedStatuses, $events) {
            $isDone    = in_array($status, $completedStatuses);
            $isCurrent = $status === $this->status;
            $event     = $events->get($status);

            return [
                'status'      => $status,
                'label'       => self::$statusLabels[$status],
                'description' => $event?->description ?? self::$statusDescriptions[$status],
                'location'    => $event?->location,
                'time'        => $event ? $event->occurred_at->format('M d, Y H:i') : null,
                'done'        => $isDone,
                'current'     => $isCurrent,
            ];
        })->values()->toArray();
    }

    // Generate unique order ID
    public static function generateOrderId(): string
    {
        do {
            $id = 'TRX-' . date('Y') . '-' . strtoupper(substr(uniqid(), -6));
        } while (self::where('order_id', $id)->exists());

        return $id;
    }
}
