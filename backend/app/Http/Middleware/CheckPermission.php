<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckPermission
{
    public function handle(Request $request, Closure $next, $permission)
    {
        if (!$request->user()) {
            return response()->json([
                'success' => false,
                'message' => 'Non authentifié'
            ], 401);
        }

        if (!$request->user()->hasPermission($permission)) {
            return response()->json([
                'success' => false,
                'message' => 'Accès non autorisé - Permission manquante'
            ], 403);
        }

        return $next($request);
    }
}