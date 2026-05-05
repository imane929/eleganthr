<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class PermissionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Permission::with(['roles']);

        // Filter by module
        if ($request->has('module') && $request->module !== 'all') {
            $query->where('module', $request->module);
        }

        // Search
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%' . $search . '%')
                    ->orWhere('description', 'like', '%' . $search . '%');
            });
        }

        // Sort
        $sortBy = $request->sort_by ?? 'module';
        $sortOrder = $request->sort_order ?? 'asc';
        $query->orderBy($sortBy, $sortOrder);

        $permissions = $query->get();

        // Group by module
        $grouped = $permissions->groupBy('module');

        return response()->json([
            'success' => true,
            'data' => [
                'permissions' => $permissions,
                'grouped' => $grouped
            ],
            'message' => 'Permissions retrieved successfully'
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:permissions',
            'guard_name' => 'nullable|string|max:255',
            'module' => 'required|string|max:255',
            'description' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $permission = Permission::create([
            'name' => $request->name,
            'guard_name' => $request->guard_name ?? 'web',
            'module' => $request->module,
            'description' => $request->description
        ]);

        return response()->json([
            'success' => true,
            'data' => $permission->load(['roles']),
            'message' => 'Permission created successfully'
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Permission $permission)
    {
        $permission->load(['roles']);

        return response()->json([
            'success' => true,
            'data' => $permission,
            'message' => 'Permission retrieved successfully'
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Permission $permission)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255|unique:permissions,name,' . $permission->id,
            'guard_name' => 'nullable|string|max:255',
            'module' => 'sometimes|string|max:255',
            'description' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $permission->update($request->all());

        return response()->json([
            'success' => true,
            'data' => $permission->load(['roles']),
            'message' => 'Permission updated successfully'
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Permission $permission)
    {
        // Check if permission is assigned to any roles
        if ($permission->roles()->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete permission assigned to roles'
            ], 422);
        }

        $permission->delete();

        return response()->json([
            'success' => true,
            'message' => 'Permission deleted successfully'
        ]);
    }

    /**
     * Get permissions by module.
     */
    public function byModule()
    {
        $modules = Permission::select('module')
            ->distinct()
            ->pluck('module');

        $permissionsByModule = [];
        
        foreach ($modules as $module) {
            $permissionsByModule[$module] = Permission::where('module', $module)->get();
        }

        return response()->json([
            'success' => true,
            'data' => $permissionsByModule,
            'message' => 'Permissions grouped by module retrieved successfully'
        ]);
    }

    /**
     * Get all available modules.
     */
    public function modules()
    {
        $modules = Permission::select('module')
            ->distinct()
            ->orderBy('module')
            ->pluck('module');

        return response()->json([
            'success' => true,
            'data' => $modules,
            'message' => 'Modules retrieved successfully'
        ]);
    }
}

