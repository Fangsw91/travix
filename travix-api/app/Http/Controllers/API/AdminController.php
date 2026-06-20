<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Shipment;
use App\Models\Transaction;
use App\Models\Trip;
use App\Models\User;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    // ── GET /api/admin/stats — live dashboard stat cards ──────────────────────
    public function stats(Request $request)
    {
        $totalUsers      = User::count();
        $usersLastMonth  = User::where('created_at', '<', now()->subDays(30))->count();
        $userGrowthPct   = $usersLastMonth > 0
            ? round((($totalUsers - $usersLastMonth) / $usersLastMonth) * 100, 1)
            : ($totalUsers > 0 ? 100 : 0);

        $activeShipments = Shipment::whereIn('status', ['accepted', 'picked_up', 'in_transit', 'out_for_delivery'])->count();
        $activeLastMonth  = Shipment::whereIn('status', ['accepted', 'picked_up', 'in_transit', 'out_for_delivery'])
            ->where('created_at', '<', now()->subDays(30))->count();
        $shipmentGrowthPct = $activeLastMonth > 0
            ? round((($activeShipments - $activeLastMonth) / $activeLastMonth) * 100, 1)
            : ($activeShipments > 0 ? 100 : 0);

        $revenueThisMonth = Transaction::where('status', '!=', 'failed')
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->sum('platform_fee');

        $revenueLastMonth = Transaction::where('status', '!=', 'failed')
            ->whereMonth('created_at', now()->subMonth()->month)
            ->whereYear('created_at', now()->subMonth()->year)
            ->sum('platform_fee');

        $revenueGrowthPct = $revenueLastMonth > 0
            ? round((($revenueThisMonth - $revenueLastMonth) / $revenueLastMonth) * 100, 1)
            : ($revenueThisMonth > 0 ? 100 : 0);

        $totalShipments     = Shipment::count();
        $deliveredShipments = Shipment::where('status', 'delivered')->count();
        $completionRate     = $totalShipments > 0
            ? round(($deliveredShipments / $totalShipments) * 100, 1)
            : 0;

        return response()->json([
            'success' => true,
            'stats' => [
                'total_users'        => $totalUsers,
                'user_growth_pct'    => $userGrowthPct,
                'active_shipments'   => $activeShipments,
                'shipment_growth_pct'=> $shipmentGrowthPct,
                'revenue_month'      => round($revenueThisMonth, 2),
                'revenue_growth_pct' => $revenueGrowthPct,
                'completion_rate'    => $completionRate,
            ],
        ]);
    }

    // ── GET /api/admin/users ───────────────────────────────────────────────────
    public function users(Request $request)
    {
        $search = $request->query('search', '');

        $users = User::query()
            ->when($search, fn($q) => $q->where(function ($qq) use ($search) {
                $qq->where('name', 'like', "%{$search}%")
                   ->orWhere('email', 'like', "%{$search}%");
            }))
            ->latest()
            ->paginate(20);

        return response()->json([
            'success' => true,
            'users' => $users->through(fn($u) => [
                'id'                   => $u->id,
                'name'                 => $u->name,
                'email'                => $u->email,
                'role'                 => $u->role,
                'verification_status'  => $u->verification_status ?? 'unverified',
                'joined'               => $u->created_at->format('M Y'),
                'created_at'           => $u->created_at->toIso8601String(),
            ]),
        ]);
    }

    // ── POST /api/admin/users/{id}/suspend ─────────────────────────────────────
    public function suspendUser(Request $request, $id)
    {
        $user = User::findOrFail($id);
        $user->update(['verification_status' => 'rejected']);
        return response()->json(['success' => true, 'message' => 'User suspended']);
    }

    // ── DELETE /api/admin/users/{id} ────────────────────────────────────────────
    public function deleteUser(Request $request, $id)
    {
        $user = User::findOrFail($id);
        if ($user->id === $request->user()->id) {
            return response()->json(['success' => false, 'message' => 'Cannot delete your own account'], 422);
        }
        $user->delete();
        return response()->json(['success' => true, 'message' => 'User deleted']);
    }

    // ── GET /api/admin/shipments ────────────────────────────────────────────────
    public function shipments(Request $request)
    {
        $search = $request->query('search', '');

        $shipments = Shipment::query()
            ->with(['sender:id,name', 'traveler:id,name'])
            ->when($search, fn($q) => $q->where(function ($qq) use ($search) {
                $qq->where('order_id', 'like', "%{$search}%")
                   ->orWhere('item_name', 'like', "%{$search}%");
            }))
            ->latest()
            ->paginate(20);

        return response()->json([
            'success' => true,
            'shipments' => $shipments->through(fn($s) => [
                'id'            => $s->id,
                'order_id'      => $s->order_id,
                'sender'        => $s->sender->name ?? '—',
                'traveler'      => $s->traveler->name ?? '—',
                'route'         => "{$s->pickup_location} → {$s->destination}",
                'status'        => $s->status,
                'status_label'  => Shipment::$statusLabels[$s->status] ?? $s->status,
                'amount'        => '$' . number_format($s->total_amount ?? 0, 2),
                'created_at'    => $s->created_at->toIso8601String(),
            ]),
        ]);
    }

    // ── GET /api/admin/verification-requests — pending ID verifications ───────
    public function verificationRequests(Request $request)
    {
        $users = User::where('verification_status', 'pending')
            ->latest('verification_submitted_at')
            ->get();

        return response()->json([
            'success' => true,
            'requests' => $users->map(fn($u) => [
                'id'             => $u->id,
                'name'           => $u->name,
                'email'          => $u->email,
                'role'           => $u->role,
                'submitted_at'   => $u->verification_submitted_at?->diffForHumans(),
                'has_id_front'   => (bool) $u->id_front_photo,
                'has_id_back'    => (bool) $u->id_back_photo,
                'has_selfie'     => (bool) $u->id_selfie_photo,
                'has_passport'   => (bool) $u->passport_photo,
                'id_front_url'   => $u->id_front_photo ? asset('storage/' . $u->id_front_photo) : null,
                'id_back_url'    => $u->id_back_photo ? asset('storage/' . $u->id_back_photo) : null,
                'selfie_url'     => $u->id_selfie_photo ? asset('storage/' . $u->id_selfie_photo) : null,
                'passport_url'   => $u->passport_photo ? asset('storage/' . $u->passport_photo) : null,
            ]),
        ]);
    }

    // ── POST /api/admin/verification-requests/{id}/approve ─────────────────────
    public function approveVerification(Request $request, $id)
    {
        $user = User::findOrFail($id);
        $user->update(['verification_status' => 'approved']);
        return response()->json(['success' => true, 'message' => 'User verified']);
    }

    // ── POST /api/admin/verification-requests/{id}/reject ───────────────────────
    public function rejectVerification(Request $request, $id)
    {
        $user = User::findOrFail($id);
        $user->update(['verification_status' => 'rejected']);
        return response()->json(['success' => true, 'message' => 'Verification rejected']);
    }

    // ── GET /api/admin/payments ─────────────────────────────────────────────────
    public function payments(Request $request)
    {
        $transactions = Transaction::with(['shipment:id,order_id', 'sender:id,name', 'traveler:id,name'])
            ->latest()
            ->paginate(20);

        return response()->json([
            'success' => true,
            'payments' => $transactions->through(fn($t) => [
                'id'              => $t->id,
                'order_id'        => $t->shipment->order_id ?? '—',
                'sender'          => $t->sender->name ?? '—',
                'traveler'        => $t->traveler->name ?? '—',
                'amount'          => '$' . number_format($t->amount, 2),
                'platform_fee'    => '$' . number_format($t->platform_fee, 2),
                'traveler_amount' => '$' . number_format($t->traveler_amount, 2),
                'status'          => $t->status,
                'paid_at'         => $t->paid_at?->diffForHumans() ?? '—',
            ]),
        ]);
    }
}
