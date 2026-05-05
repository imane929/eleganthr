<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
$query = Notification::where('user_id', $request->user()->id)
            ->where('created_at', '>=', now()->subDays(30))
            ->orderBy('created_at', 'desc');

        if ($request->has('type') && $request->type !== 'all' && $request->type !== '') {
            $query->where('type', $request->type);
        }

        if ($request->has('read') && $request->read !== 'all') {
            $query->where('read', $request->read === 'unread' ? false : true);
        }

        $notifications = $query->paginate(100);

        return response()->json([
            'success' => true,
            'data' => $notifications->map(function ($notification) {
                return [
                    'id' => $notification->id,
                    'type' => $notification->type,
                    'title' => $notification->title,
                    'message' => $notification->message,
                    'link' => $notification->link,
                    'read' => $notification->read,
                    'date' => $notification->created_at->toISOString(),
                    'created_at' => $notification->created_at,
                ];
            }),
            'meta' => [
                'current_page' => $notifications->currentPage(),
                'last_page' => $notifications->lastPage(),
                'per_page' => $notifications->perPage(),
                'total' => $notifications->total(),
            ]
        ]);
    }

    public function unreadCount(Request $request)
    {
        $count = Notification::where('user_id', $request->user()->id)
            ->where('read', false)
            ->count();

        return response()->json([
            'success' => true,
            'data' => ['count' => $count]
        ]);
    }

    public function markAsRead(Request $request, string $id)
    {
        $notification = Notification::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->first();

        if (!$notification) {
            return response()->json([
                'success' => false,
                'message' => 'Notification not found'
            ], 404);
        }

        $notification->markAsRead();

        return response()->json([
            'success' => true,
            'message' => 'Notification marked as read'
        ]);
    }

    public function markAllAsRead(Request $request)
    {
        Notification::where('user_id', $request->user()->id)
            ->where('read', false)
            ->update(['read' => true]);

        return response()->json([
            'success' => true,
            'message' => 'All notifications marked as read'
        ]);
    }

    public function deleteAll(Request $request)
    {
        Notification::where('user_id', $request->user()->id)->delete();

        return response()->json([
            'success' => true,
            'message' => 'All notifications deleted'
        ]);
    }

    public function destroy(Request $request, string $id)
    {
        $notification = Notification::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->first();

        if (!$notification) {
            return response()->json([
                'success' => false,
                'message' => 'Notification not found'
            ], 404);
        }

        $notification->delete();

        return response()->json([
            'success' => true,
            'message' => 'Notification deleted'
        ]);
    }

    public static function createNotification(
        int $userId,
        string $type,
        string $title,
        string $message,
        ?string $link = null,
        ?int $notifiableId = null,
        ?string $notifiableType = null
    ): Notification {
        return Notification::create([
            'id' => (string) Str::uuid(),
            'user_id' => $userId,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'link' => $link,
            'notifiable_id' => $notifiableId,
            'notifiable_type' => $notifiableType,
            'read' => false,
        ]);
    }
}
