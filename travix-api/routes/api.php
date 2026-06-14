<?php

use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\PaymentController;
use App\Http\Controllers\API\ShipmentController;
use App\Http\Controllers\API\TripController;
use App\Http\Controllers\API\ChatController;
use App\Http\Controllers\API\VerificationController;
use Illuminate\Support\Facades\Route;

// Public config
Route::get('/config', function () {
    return response()->json([
        'stripe_key' => config('services.stripe.key'),
    ]);
});

// ─── Public Auth ──────────────────────────────────────────────────────────────
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login',    [AuthController::class, 'login']);
});

// ─── Protected ───────────────────────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::prefix('auth')->group(function () {
        Route::post('/logout',          [AuthController::class, 'logout']);
        Route::get('/user',             [AuthController::class, 'user']);
        Route::put('/profile',          [AuthController::class, 'updateProfile']);
        Route::post('/change-password', [AuthController::class, 'changePassword']);
    });

    // Shipments
    Route::prefix('shipments')->group(function () {
        Route::get('/available',                [ShipmentController::class, 'available']);     // ← Travelers browse open requests
        Route::get('/',                         [ShipmentController::class, 'index']);
        Route::post('/',                        [ShipmentController::class, 'store']);
        Route::get('/{orderId}/status',         [ShipmentController::class, 'status']);        // ← Live tracker polls this
        Route::post('/{orderId}/update-status', [ShipmentController::class, 'updateStatus']);  // ← Traveler updates this
        Route::post('/{orderId}/accept',        [ShipmentController::class, 'accept']);        // ← Traveler accepts request
        Route::post('/{orderId}/pickup',        [ShipmentController::class, 'pickup']);        // ← Traveler picks up + uploads photo
        Route::post('/{orderId}/location',      [ShipmentController::class, 'updateLocation']); // ← Traveler pushes GPS
        Route::get('/{orderId}/location',       [ShipmentController::class, 'getLocation']);    // ← Sender polls GPS
    });

    // Trip routes
    Route::prefix('trips')->group(function () {
        Route::get('/available',  [TripController::class, 'available']);  // ← public within auth (senders browse)
        Route::get('/',           [TripController::class, 'index']);
        Route::post('/',          [TripController::class, 'store']);
        Route::get('/{id}',       [TripController::class, 'show']);
        Route::put('/{id}',       [TripController::class, 'update']);
        Route::post('/{id}/cancel', [TripController::class, 'cancel']);
    });

    // Verification
    Route::prefix('verification')->group(function () {
        Route::get('/status',       [VerificationController::class, 'status']);
        Route::post('/upload',      [VerificationController::class, 'upload']);
        Route::post('/submit',      [VerificationController::class, 'submit']);
    });

    // Chat
    Route::prefix('chat')->group(function () {
        Route::get('/unread',       [ChatController::class, 'unread']);
        Route::get('/{shipmentId}', [ChatController::class, 'index']);
        Route::post('/{shipmentId}',[ChatController::class, 'store']);
    });


    // Payment routes
    Route::prefix('payments')->group(function () {
        Route::post('/create-intent', [PaymentController::class, 'createPaymentIntent']);
        Route::post('/confirm', [PaymentController::class, 'confirmPayment']);
    });

    // Dashboard stats — real counts from DB
    Route::get('/dashboard/stats', function (\Illuminate\Http\Request $request) {
        $user = $request->user();
        $uid  = $user->id;

        $activeStatuses    = ['requested','accepted','picked_up','in_transit','out_for_delivery'];
        $completedStatuses = ['delivered'];

        // Sender stats
        $senderShipments = \App\Models\Shipment::where('sender_id', $uid);
        $active_requests  = (clone $senderShipments)->whereIn('status', $activeStatuses)->count();
        $pending          = (clone $senderShipments)->where('status', 'requested')->count();
        $completed        = (clone $senderShipments)->whereIn('status', $completedStatuses)->count();
        $total_spent      = (clone $senderShipments)->whereIn('status', $completedStatuses)->sum('total_amount');

        // Traveler stats
        $travelerShipments = \App\Models\Shipment::where('traveler_id', $uid);
        $accepted_trips    = (clone $travelerShipments)->whereIn('status', $activeStatuses)->count();
        $pending_requests  = \App\Models\Shipment::where('status', 'requested')->whereNull('traveler_id')->count();
        $active_deliveries = (clone $travelerShipments)->whereIn('status', ['picked_up','in_transit','out_for_delivery'])->count();
        $total_earnings    = (clone $travelerShipments)->whereIn('status', $completedStatuses)->sum('total_amount');
        $this_month        = (clone $travelerShipments)->whereIn('status', $completedStatuses)
                                ->whereMonth('updated_at', now()->month)->sum('total_amount');

        return response()->json([
            'success' => true,
            'stats'   => compact(
                'active_requests','pending','completed','total_spent',
                'accepted_trips','pending_requests','active_deliveries','total_earnings','this_month'
            ),
        ]);
    });

    // Profile — fresh user data from DB
    Route::get('/dashboard/profile', function (\Illuminate\Http\Request $request) {
        $user = $request->user();
        $uid  = $user->id;

        $completed  = \App\Models\Shipment::where('sender_id', $uid)->where('status','delivered')->count();
        $sent       = \App\Models\Shipment::where('sender_id', $uid)->count();
        $earned     = \App\Models\Shipment::where('traveler_id', $uid)->where('status','delivered')->sum('total_amount');

        return response()->json([
            'success' => true,
            'user' => [
                'id'      => $user->id,
                'name'    => $user->name,
                'email'   => $user->email,
                'role'    => $user->role ?? 'sender',
                'phone'   => $user->phone ?? null,
                'avatar'  => $user->avatar ?? null,
            ],
            'stats' => [
                'total_deliveries' => $completed,
                'items_sent'       => $sent,
                'earned'           => '$' . number_format($earned, 2),
            ],
        ]);
    });

    // Dashboard shipments list
    Route::get('/dashboard/shipments', function (\Illuminate\Http\Request $request) {
        $user = $request->user();
        $role = $request->query('role', 'sender'); // ?role=sender or ?role=traveler

        $query = $role === 'traveler'
            ? \App\Models\Shipment::where('traveler_id', $user->id)
            : \App\Models\Shipment::where('sender_id',   $user->id);

        $shipments = $query->latest()->take(10)->get();

        $statusColors = [
            'requested'        => '#6B7280',
            'accepted'         => '#3B82F6',
            'picked_up'        => '#8B5CF6',
            'in_transit'       => '#F59E0B',
            'out_for_delivery' => '#F97316',
            'delivered'        => '#10B981',
            'cancelled'        => '#EF4444',
        ];

        return response()->json([
            'success'   => true,
            'shipments' => $shipments->map(fn($s) => [
                'order_id'     => $s->order_id,
                'item_name'    => $s->item_name,
                'route'        => "{$s->pickup_location} → {$s->destination}",
                'status'       => $s->status,
                'status_label' => \App\Models\Shipment::$statusLabels[$s->status] ?? $s->status,
                'status_color' => $statusColors[$s->status] ?? '#6B7280',
                'total_amount' => '$' . number_format($s->total_amount, 2),
                'created_at'   => $s->created_at->diffForHumans(),
            ]),
        ]);
    });
});
