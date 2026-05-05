<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Department;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class DepartmentController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Department::with(['employees', 'manager'])->withCount('employees');

        // Filter by status
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Search by name
        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        // Sort
        $sortBy = $request->sort_by ?? 'created_at';
        $sortOrder = $request->sort_order ?? 'desc';
        $query->orderBy($sortBy, $sortOrder);

        // Pagination
        $perPage = $request->per_page ?? 10;
        $departments = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $departments,
            'message' => 'Departments retrieved successfully'
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:departments',
            'description' => 'nullable|string',
            'manager_id' => 'nullable|exists:employees,id',
            'status' => 'nullable|in:active,inactive'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $department = Department::create([
            'name' => $request->name,
            'description' => $request->description,
            'manager_id' => $request->manager_id,
            'status' => $request->status ?? 'active'
        ]);

        return response()->json([
            'success' => true,
            'data' => $department->load(['employees', 'manager']),
            'message' => 'Department created successfully'
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Department $department)
    {
        $department->load(['employees', 'manager']);

        return response()->json([
            'success' => true,
            'data' => $department,
            'message' => 'Department retrieved successfully'
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Department $department)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255|unique:departments,name,' . $department->id,
            'description' => 'nullable|string',
            'manager_id' => 'nullable|exists:employees,id',
            'status' => 'nullable|in:active,inactive'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $department->update($request->only(['name', 'description', 'manager_id', 'status']));

        return response()->json([
            'success' => true,
            'data' => $department->load(['employees', 'manager']),
            'message' => 'Department updated successfully'
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Department $department)
    {
        // Check if department has employees
        if ($department->employees()->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete department with associated employees'
            ], 422);
        }

        $department->delete();

        return response()->json([
            'success' => true,
            'message' => 'Department deleted successfully'
        ]);
    }

    /**
     * Get all active departments (for dropdowns)
     */
    public function active()
    {
        $departments = Department::where('status', 'active')
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $departments,
            'message' => 'Active departments retrieved successfully'
        ]);
    }

    /**
     * Get department statistics
     */
    public function statistics(Department $department)
    {
        $employeeCount = $department->employees()->count();
        $activeEmployeeCount = $department->employees()->where('status', 'active')->count();
        $totalSalaries = $department->employees()->sum('salary');

        return response()->json([
            'success' => true,
            'data' => [
                'total_employees' => $employeeCount,
                'active_employees' => $activeEmployeeCount,
                'total_monthly_salary' => $totalSalaries
            ],
            'message' => 'Department statistics retrieved successfully'
        ]);
    }
}

