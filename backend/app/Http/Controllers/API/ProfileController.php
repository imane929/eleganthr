<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class ProfileController extends Controller
{
    /**
     * Get current user profile.
     */
    public function show(Request $request)
    {
        $user = $request->user();
        $user->load(['employee', 'employee.department', 'roles']);

        // Get employee data if exists
        $employee = null;
        if ($user->employee) {
            $employee = $user->employee;
            $employee->load(['department', 'leaveRequests', 'absences', 'salaries']);
            
            // Calculate remaining vacation days
            $totalVacationDays = 25;
            $usedVacationDays = $employee->leaveRequests()
                ->where('leave_type', 'annual')
                ->where('status', 'approved')
                ->sum('total_days');
            $employee->remaining_vacation_days = $totalVacationDays - $usedVacationDays;
        }

        return response()->json([
            'success' => true,
            'data' => [
                'user' => $user,
                'employee' => $employee
            ],
            'message' => 'Profile retrieved successfully'
        ]);
    }

    /**
     * Update current user profile.
     */
    public function update(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $user->id,
            'phone' => 'nullable|string|max:20',
            'current_password' => 'nullable|required_with:password|current_password',
            'password' => ['nullable', 'confirmed', Password::defaults()]
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $data = $request->except(['password', 'password_confirmation', 'current_password']);

        if ($request->has('password') && $request->password) {
            $data['password'] = $request->password;
        }

        $user->update($data);

        return response()->json([
            'success' => true,
            'data' => $user,
            'message' => 'Profile updated successfully'
        ]);
    }

    /**
     * Update employee profile (for employee users).
     */
    public function updateEmployee(Request $request)
    {
        $user = $request->user();
        
        if (!$user->employee) {
            return response()->json([
                'success' => false,
                'message' => 'No employee profile found'
            ], 404);
        }

        $employee = $user->employee;

        $validator = Validator::make($request->all(), [
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:100',
            'postal_code' => 'nullable|string|max:20',
            'country' => 'nullable|string|max:100',
            'emergency_contact_name' => 'nullable|string|max:255',
            'emergency_contact_phone' => 'nullable|string|max:20'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $employee->update($request->all());

        return response()->json([
            'success' => true,
            'data' => $employee,
            'message' => 'Employee profile updated successfully'
        ]);
    }

    /**
     * Change password.
     */
    public function changePassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'current_password' => 'required|current_password',
            'password' => ['required', 'confirmed', Password::defaults()]
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $request->user()->update([
            'password' => $request->password
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Password changed successfully'
        ]);
    }
}

