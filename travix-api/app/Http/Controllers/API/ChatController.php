<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Message;
use App\Models\Shipment;
use Illuminate\Http\Request;

class ChatController extends Controller
{
    // GET /api/chat/{shipmentId} — load messages for a shipment
    public function index(Request $request, $shipmentId)
    {
        $user     = $request->user();
        $shipment = Shipment::findOrFail($shipmentId);

        // Only sender or traveler of this shipment can read
        if ($shipment->sender_id !== $user->id && $shipment->traveler_id !== $user->id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        // Mark messages sent to me as read
        Message::where('shipment_id', $shipmentId)
               ->where('receiver_id', $user->id)
               ->where('read', false)
               ->update(['read' => true]);

        $messages = Message::where('shipment_id', $shipmentId)
            ->with('sender:id,name,avatar,role')
            ->orderBy('created_at')
            ->get()
            ->map(fn($m) => [
                'id'         => $m->id,
                'body'       => $m->body,
                'sender_id'  => $m->sender_id,
                'sender_name'=> $m->sender->name,
                'sender_role'=> $m->sender->role,
                'is_mine'    => $m->sender_id === $user->id,
                'time'       => $m->created_at->format('H:i'),
                'date'       => $m->created_at->diffForHumans(),
            ]);

        return response()->json(['success' => true, 'messages' => $messages]);
    }

    // POST /api/chat/{shipmentId} — send a message
    public function store(Request $request, $shipmentId)
    {
        $user     = $request->user();
        $shipment = Shipment::findOrFail($shipmentId);

        if ($shipment->sender_id !== $user->id && $shipment->traveler_id !== $user->id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $request->validate(['body' => 'required|string|max:1000']);

        // Receiver is the other party
        $receiverId = $shipment->sender_id === $user->id
            ? $shipment->traveler_id
            : $shipment->sender_id;

        if (!$receiverId) {
            return response()->json(['success' => false, 'message' => 'No traveler assigned yet'], 422);
        }

        $msg = Message::create([
            'shipment_id' => $shipment->id,
            'sender_id'   => $user->id,
            'receiver_id' => $receiverId,
            'body'        => $request->body,
        ]);

        return response()->json([
            'success' => true,
            'message' => [
                'id'         => $msg->id,
                'body'       => $msg->body,
                'sender_id'  => $msg->sender_id,
                'sender_name'=> $user->name,
                'sender_role'=> $user->role,
                'is_mine'    => true,
                'time'       => $msg->created_at->format('H:i'),
                'date'       => $msg->created_at->diffForHumans(),
            ],
        ], 201);
    }

    // GET /api/chat/unread — unread count per shipment
    public function unread(Request $request)
    {
        $user = $request->user();
        $counts = Message::where('receiver_id', $user->id)
            ->where('read', false)
            ->groupBy('shipment_id')
            ->selectRaw('shipment_id, count(*) as count')
            ->get()
            ->keyBy('shipment_id')
            ->map(fn($r) => $r->count);

        return response()->json(['success' => true, 'unread' => $counts]);
    }
}
