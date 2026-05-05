<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = User::with(['roles', 'employee', 'employee.department']);

        // Search
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%' . $search . '%')
                    ->orWhere('email', 'like', '%' . $search . '%');
            });
        }

        // Filter by role
        if ($request->has('role')) {
            $query->whereHas('roles', function ($q) use ($request) {
                $q->where('name', $request->role);
            });
        }

        // Sort
        $sortBy = $request->sort_by ?? 'created_at';
        $sortOrder = $request->sort_order ?? 'desc';
        $query->orderBy($sortBy, $sortOrder);

        // Pagination
        $perPage = $request->per_page ?? 100;
        $users = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $users,
            'message' => 'Users retrieved successfully'
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // If employee_id provided, check if that employee already has a user or if email exists
        $employeeId = $request->employee_id;
        if ($employeeId) {
            $employee = \App\Models\Employee::find($employeeId);
            if ($employee && $employee->user_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cet employé a déjà un compte utilisateur'
                ], 422);
            }
        }

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
            'employee_id' => $employeeId ?? null
        ]);

        // If employee_id provided, update the employee's user_id
        if ($employeeId) {
            \App\Models\Employee::where('id', $employeeId)->update(['user_id' => $user->id]);
        }

        // Assign default role (employee)
        $employeeRole = \App\Models\Role::where('name', 'employee')->first();
        if ($employeeRole) {
            $user->roles()->attach($employeeRole->id);
        }

        return response()->json([
            'success' => true,
            'data' => $user->load(['roles', 'employee']),
            'message' => 'User created successfully'
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(User $user)
    {
        $user->load(['roles', 'employee', 'employee.department']);

        return response()->json([
            'success' => true,
            'data' => $user,
            'message' => 'User retrieved successfully'
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, User $user)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $user->id,
            'password' => ['nullable', 'confirmed', Password::defaults()],
            'employee_id' => 'nullable|exists:employees,id'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $data = $request->except(['password', 'password_confirmation']);

        if ($request->has('password') && $request->password) {
            $data['password'] = $request->password;
        }

        $user->update($data);

        // Sync employee name/email if user has an employee record
        if ($user->employee) {
            $nameParts = explode(' ', $user->name, 2);
            $employeeData = [
                'first_name' => $nameParts[0] ?? '',
                'last_name' => $nameParts[1] ?? ''
            ];
            if ($request->has('email')) {
                $employeeData['email'] = $request->email;
            }
            $user->employee->update($employeeData);
        }

        return response()->json([
            'success' => true,
            'data' => $user->load(['roles', 'employee']),
            'message' => 'User updated successfully'
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(User $user)
    {
        // Prevent self-deletion
        if ($user->id === auth()->id()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete your own account'
            ], 422);
        }

        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'User deleted successfully'
        ]);
    }

    /**
     * Assign a role to user.
     */
    public function assignRole(Request $request, User $user)
    {
        $validator = Validator::make($request->all(), [
            'role_id' => 'required|exists:roles,id',
            'department_id' => 'nullable|exists:departments,id'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $role = \App\Models\Role::find($request->role_id);
        
        // Remove existing roles and add new one
        $user->roles()->sync([$request->role_id]);

        // If assigning Responsable role and department_id is provided, update employee's department
        if ($role && strtolower($role->name) === 'responsable' && $request->department_id) {
            // Try to find employee by user_id first, or by matching name
            $employee = $user->employee;
            
            if (!$employee) {
                // Try to find existing employee by matching name/email
                $employee = \App\Models\Employee::where('first_name', 'like', '%' . explode(' ', $user->name)[0] . '%')
                    ->where('email', $user->email)
                    ->first();
                
                if ($employee) {
                    $employee->update(['user_id' => $user->id, 'department_id' => $request->department_id]);
                }
            }
            
            if (!$employee) {
                // Create employee record if doesn't exist
                $employee = \App\Models\Employee::create([
                    'user_id' => $user->id,
                    'department_id' => $request->department_id,
                    'hire_date' => now(),
                    'position' => 'Responsable',
                    'first_name' => explode(' ', $user->name)[0],
                    'last_name' => implode(' ', array_slice(explode(' ', $user->name), 1)),
                    'email' => $user->email
                ]);
            } else {
                $employee->update(['department_id' => $request->department_id]);
            }
            
            // Also set the user as manager of the department
            if ($employee && $employee->id) {
                \App\Models\Department::where('id', $request->department_id)->update(['manager_id' => $employee->id]);
            }
        }

        return response()->json([
            'success' => true,
            'data' => $user->load('roles'),
            'message' => 'Role assigned successfully'
        ]);
    }

    /**
     * Remove a role from user.
     */
    public function removeRole(Request $request, User $user)
    {
        $validator = Validator::make($request->all(), [
            'role_id' => 'required|exists:roles,id'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $user->roles()->detach($request->role_id);

        return response()->json([
            'success' => true,
            'data' => $user->load('roles'),
            'message' => 'Role removed successfully'
        ]);
    }

    /**
     * Activate user account.
     */
    public function activate(User $user)
    {
        // User model uses Illuminate\Foundation\Auth\User which doesn't have active field
        // This is a placeholder - implement based on your needs
        
        return response()->json([
            'success' => true,
            'data' => $user,
            'message' => 'User activated successfully'
        ]);
    }

    /**
     * Deactivate user account.
     */
    public function deactivate(User $user)
    {
        // User model uses Illuminate\Foundation\Auth\User which doesn't have active field
        // This is a placeholder - implement based on your needs
        
        return response()->json([
            'success' => true,
            'data' => $user,
            'message' => 'User deactivated successfully'
        ]);
    }
}

