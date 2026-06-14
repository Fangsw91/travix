<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\ShipmentController;
use App\Http\Controllers\API\TripController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public routes
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
});

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    
    // Auth routes
    Route::prefix('auth')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/user', [AuthController::class, 'user']);
        Route::put('/profile', [AuthController::class, 'updateProfile']);
        Route::post('/change-password', [AuthController::class, 'changePassword']);
    });

    // Shipment routes
    Route::prefix('shipments')->group(function () {
        Route::get('/', [ShipmentController::class, 'index']);
        Route::get('/available', [ShipmentController::class, 'available']);
        Route::post('/', [ShipmentController::class, 'store']);
        Route::get('/{id}', [ShipmentController::class, 'show']);
        Route::put('/{id}', [ShipmentController::class, 'update']);
        Route::post('/{id}/cancel', [ShipmentController::class, 'cancel']);
        Route::post('/{id}/accept', [ShipmentController::class, 'accept']);
        Route::post('/{id}/delivered', [ShipmentController::class, 'markDelivered']);
    });

    // Trip routes
    Route::prefix('trips')->group(function () {
        Route::get('/', [TripController::class, 'index']);
        Route::get('/available', [TripController::class, 'available']);
        Route::post('/', [TripController::class, 'store']);
        Route::get('/{id}', [TripController::class, 'show']);
        Route::put('/{id}', [TripController::class, 'update']);
        Route::post('/{id}/cancel', [TripController::class, 'cancel']);
    });

    // Dashboard stats
    Route::get('/dashboard/stats', function (Request $request) {
        $user = $request->user();
        
        if ($user->isSender()) {
            return response()->json([
                'success' => true,
                'stats' => [
                    'active_requests' => $user->sentShipments()->active()->count(),
                    'pending' => $user->sentShipments()->pending()->count(),
                    'completed' => $user->sentShipments()->completed()->count(),
                    'total_spent' => $user->senderTransactions()->where('status', 'completed')->sum('amount'),
                ]
            ]);
        } else {
            return response()->json([
                'success' => true,
                'stats' => [
                    'accepted_trips' => $user->deliveredShipments()->where('status', 'accepted')->count(),
                    'pending_requests' => $user->deliveredShipments()->pending()->count(),
                    'active_deliveries' => $user->deliveredShipments()->active()->count(),
                    'total_earnings' => $user->travelerTransactions()->where('status', 'completed')->sum('traveler_amount'),
                    'this_month' => $user->travelerTransactions()
                        ->where('status', 'completed')
                        ->whereMonth('created_at', now()->month)
                        ->sum('traveler_amount'),
                ]
            ]);
        }
    });
});

// Health check
Route::get('/health', function () {
    return response()->json([
        'success' => true,
        'message' => 'API is running',
        'timestamp' => now()
    ]);
});
