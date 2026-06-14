<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class VerificationController extends Controller
{
    // GET /api/verification/status
    public function status(Request $request)
    {
        $user = $request->user();
        return response()->json([
            'success' => true,
            'verification_status'       => $user->verification_status ?? 'unverified',
            'verification_submitted_at' => $user->verification_submitted_at,
            'has_id_front'   => (bool) $user->id_front_photo,
            'has_id_back'    => (bool) $user->id_back_photo,
            'has_selfie'     => (bool) $user->id_selfie_photo,
            'has_passport'   => (bool) $user->passport_photo,
        ]);
    }

    // POST /api/verification/upload
    // fields: type = id_front | id_back | selfie | passport
    public function upload(Request $request)
    {
        $request->validate([
            'type'  => 'required|in:id_front,id_back,selfie,passport',
            'photo' => 'required|image|max:8192', // 8MB
        ]);

        $user   = $request->user();
        $type   = $request->input('type');
        $column = match($type) {
            'id_front' => 'id_front_photo',
            'id_back'  => 'id_back_photo',
            'selfie'   => 'id_selfie_photo',
            'passport' => 'passport_photo',
        };

        $path = $request->file('photo')->store("verification/{$user->id}", 'public');
        $user->update([$column => $path]);

        return response()->json([
            'success' => true,
            'type'    => $type,
            'path'    => $path,
        ]);
    }

    // POST /api/verification/submit — mark as pending after all uploads
    public function submit(Request $request)
    {
        $user = $request->user();

        if (!$user->id_front_photo || !$user->id_back_photo) {
            return response()->json([
                'success' => false,
                'message' => 'Please upload both front and back of your ID.',
            ], 422);
        }

        if ($user->verification_status === 'approved') {
            return response()->json(['success' => true, 'message' => 'Already verified.']);
        }

        $user->update([
            'verification_status'       => 'pending',
            'verification_submitted_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Verification submitted. We\'ll review within 24 hours.',
        ]);
    }
}
