<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class RoleController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Role::query();

        // Search
        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        // Sort
        $sortBy = $request->sort_by ?? 'created_at';
        $sortOrder = $request->sort_order ?? 'desc';
        $query->orderBy($sortBy, $sortOrder);

        $roles = $query->get();

        return response()->json([
            'success' => true,
            'data' => $roles,
            'message' => 'Roles retrieved successfully'
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:roles',
            'guard_name' => 'nullable|string|max:255'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $role = Role::create([
            'name' => $request->name,
            'guard_name' => $request->guard_name ?? 'web'
        ]);

        return response()->json([
            'success' => true,
            'data' => $role,
            'message' => 'Role created successfully'
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Role $role)
    {
        return response()->json([
            'success' => true,
            'data' => $role,
            'message' => 'Role retrieved successfully'
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Role $role)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255|unique:roles,name,' . $role->id,
            'guard_name' => 'nullable|string|max:255'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $role->update($request->all());

        return response()->json([
            'success' => true,
            'data' => $role,
            'message' => 'Role updated successfully'
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Role $role)
    {
        // Check if role has users
        try {
            $userCount = $role->users()->count();
        } catch (\Exception $e) {
            $userCount = 0;
        }
        
        if ($userCount > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete role with associated users'
            ], 422);
        }

        $role->delete();

        return response()->json([
            'success' => true,
            'message' => 'Role deleted successfully'
        ]);
    }

    /**
     * Assign permissions to role.
     */
    public function assignPermissions(Request $request, Role $role)
    {
        $validator = Validator::make($request->all(), [
            'permissions' => 'required|array',
            'permissions.*' => 'exists:permissions,id'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $role->permissions()->sync($request->permissions);

        return response()->json([
            'success' => true,
            'data' => $role->load('permissions'),
            'message' => 'Permissions assigned successfully'
        ]);
    }

    /**
     * Get all permissions for a role.
     */
    public function permissions(Role $role)
    {
        $permissions = $role->permissions;

        return response()->json([
            'success' => true,
            'data' => $permissions,
            'message' => 'Role permissions retrieved successfully'
        ]);
    }
}

