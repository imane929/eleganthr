<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Illuminate\Support\Facades\Auth;
use Laravel\Sanctum\PersonalAccessToken;

class AuthController extends Controller
{
    /**
     * Register a new user.
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => ['required', 'confirmed', Password::defaults()],
            'employee_id' => 'nullable|exists:employees,id'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => $request->password,
            'employee_id' => $request->employee_id ?? null
        ]);

        // Assign default role
        $employeeRole = \App\Models\Role::where('name', 'employee')->first();
        if ($employeeRole) {
            $user->roles()->attach($employeeRole->id);
        }

        // Generate token
        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'data' => [
                'user' => $user->load(['roles', 'employee']),
                'token' => $token
            ],
            'message' => 'User registered successfully'
        ], 201);
    }

    /**
     * Login user and generate token.
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials'
            ], 401);
        }

        // Revoke existing tokens
        $user->tokens()->delete();

        // Generate new token
        $token = $user->createToken('auth-token')->plainTextToken;

        // Load relationships
        $user->load(['roles', 'employee', 'employee.department']);

        return response()->json([
            'success' => true,
            'data' => [
                'user' => $user,
                'token' => $token
            ],
            'message' => 'Login successful'
        ]);
    }

    /**
     * Logout user and revoke token.
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully'
        ]);
    }

    /**
     * Get current authenticated user.
     */
    public function me(Request $request)
    {
        $user = $request->user();
        $user->load(['roles', 'employee', 'employee.department']);

        // Get permissions
        $permissions = [];
        foreach ($user->roles as $role) {
            $rolePermissions = $role->permissions->pluck('name')->toArray();
            $permissions = array_merge($permissions, $rolePermissions);
        }
        $permissions = array_unique($permissions);

        return response()->json([
            'success' => true,
            'data' => [
                'user' => $user,
                'permissions' => $permissions
            ],
            'message' => 'Current user retrieved successfully'
        ]);
    }

    /**
     * Refresh token.
     */
    public function refresh(Request $request)
    {
        $user = $request->user();
        
        // Revoke current token
        $user->currentAccessToken()->delete();

        // Generate new token
        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'data' => [
                'token' => $token
            ],
            'message' => 'Token refreshed successfully'
        ]);
    }

    /**
     * Check if email exists.
     */
    public function checkEmail(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $exists = User::where('email', $request->email)->exists();

        return response()->json([
            'success' => true,
            'data' => [
                'exists' => $exists
            ],
            'message' => 'Email check completed'
        ]);
    }
}

