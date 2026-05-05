<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class EmployeeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Employee::with(['department', 'user']);

        // Filter by status
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Filter by department
        if ($request->has('department_id')) {
            $query->where('department_id', $request->department_id);
        }

        // Search
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', '%' . $search . '%')
                    ->orWhere('last_name', 'like', '%' . $search . '%')
                    ->orWhere('email', 'like', '%' . $search . '%')
                    ->orWhere('employee_id', 'like', '%' . $search . '%')
                    ->orWhere('position', 'like', '%' . $search . '%');
            });
        }

        // Sort
        $sortBy = $request->sort_by ?? 'created_at';
        $sortOrder = $request->sort_order ?? 'desc';
        $allowedSorts = ['first_name', 'last_name', 'email', 'hire_date', 'salary', 'created_at'];
        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortOrder);
        }

        // Pagination
        $perPage = $request->per_page ?? 10;
        $employees = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $employees,
            'message' => 'Employees retrieved successfully'
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|unique:employees,email',
            'phone' => 'nullable|string|max:20',
            'position' => 'required|string|max:255',
            'department_id' => 'nullable|exists:departments,id',
            'hire_date' => 'required|date',
            'salary' => 'required|numeric|min:0',
            'status' => 'nullable|in:active,inactive',
            'contract_type' => 'nullable|in:CDI,CDD,Stage,Freelance',
            'nationality' => 'nullable|string|max:100',
            'birth_date' => 'nullable|date',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:100',
            'postal_code' => 'nullable|string|max:20',
            'country' => 'nullable|string|max:100',
            'emergency_contact_name' => 'nullable|string|max:255',
            'emergency_contact_phone' => 'nullable|string|max:20',
            'user_id' => 'nullable|exists:users,id'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        // Generate unique employee ID
        $employeeId = 'EMP-' . strtoupper(Str::random(6));

        $employee = Employee::create(array_merge(
            $request->all(),
            ['employee_id' => $employeeId]
        ));

        return response()->json([
            'success' => true,
            'data' => $employee->load(['department', 'user']),
            'message' => 'Employee created successfully'
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Employee $employee)
    {
        $employee->load(['department', 'user', 'leaveRequests', 'absences', 'salaries']);

        return response()->json([
            'success' => true,
            'data' => $employee,
            'message' => 'Employee retrieved successfully'
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Employee $employee)
    {
        $validator = Validator::make($request->all(), [
            'first_name' => 'sometimes|string|max:255',
            'last_name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:employees,email,' . $employee->id,
            'phone' => 'nullable|string|max:20',
            'position' => 'sometimes|string|max:255',
            'department_id' => 'nullable|exists:departments,id',
            'hire_date' => 'sometimes|date',
            'salary' => 'sometimes|numeric|min:0',
            'status' => 'nullable|in:active,inactive',
            'contract_type' => 'nullable|in:CDI,CDD,Stage,Freelance',
            'nationality' => 'nullable|string|max:100',
            'birth_date' => 'nullable|date',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:100',
            'postal_code' => 'nullable|string|max:20',
            'country' => 'nullable|string|max:100',
            'emergency_contact_name' => 'nullable|string|max:255',
            'emergency_contact_phone' => 'nullable|string|max:20',
            'user_id' => 'nullable|exists:users,id'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $employee->update($request->all());

        // Handle user link - update or remove
        if ($request->has('user_id')) {
            if (is_null($request->user_id) || $request->user_id === '') {
                // Removing user link - set employee.user_id to null
                // Optionally: also set user.employee_id to null
                if ($employee->user) {
                    $employee->user->update(['employee_id' => null]);
                }
                $employee->update(['user_id' => null]);
            } else {
                // Adding/linking user
                $employee->update(['user_id' => $request->user_id]);
                // Also update the user's employee_id
                \App\Models\User::where('id', $request->user_id)->update(['employee_id' => $employee->id]);
            }
        }

        // Sync user name/email if employee has a linked user
        if ($employee->user && ($request->has('first_name') || $request->has('last_name') || $request->has('email'))) {
            $name = trim(($request->first_name ?? $employee->first_name) . ' ' . ($request->last_name ?? $employee->last_name));
            $userData = ['name' => $name];
            if ($request->has('email')) {
                $userData['email'] = $request->email;
            }
            $employee->user->update($userData);
        }

        return response()->json([
            'success' => true,
            'data' => $employee->load(['department', 'user']),
            'message' => 'Employee updated successfully'
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Employee $employee)
    {
        $employee->delete();

        return response()->json([
            'success' => true,
            'message' => 'Employee deleted successfully'
        ]);
    }

    /**
     * Restore a soft-deleted employee.
     */
    public function restore($id)
    {
        $employee = Employee::withTrashed()->findOrFail($id);
        $employee->restore();

        return response()->json([
            'success' => true,
            'data' => $employee->load(['department', 'user']),
            'message' => 'Employee restored successfully'
        ]);
    }

    /**
     * Export employees to CSV.
     */
    public function exportCsv(Request $request)
    {
        $query = Employee::with(['department']);

        // Apply same filters as index
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->has('department_id')) {
            $query->where('department_id', $request->department_id);
        }

        $employees = $query->get();

        $csvData = [];
        $csvData[] = ['Employee ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Position', 'Department', 'Hire Date', 'Salary', 'Status'];

        foreach ($employees as $employee) {
            $csvData[] = [
                $employee->employee_id,
                $employee->first_name,
                $employee->last_name,
                $employee->email,
                $employee->phone,
                $employee->position,
                $employee->department->name ?? 'N/A',
                $employee->hire_date,
                $employee->salary,
                $employee->status
            ];
        }

        $filename = 'employees_export_' . date('Y-m-d_His') . '.csv';
        
        return response()->streamDownload(function () use ($csvData) {
            $handle = fopen('php://output', 'w');
            foreach ($csvData as $row) {
                fputcsv($handle, $row);
            }
            fclose($handle);
        }, $filename, ['Content-Type' => 'text/csv']);
    }

    /**
     * Get active employees (for dropdowns)
     */
    public function active()
    {
        $employees = Employee::where('status', 'active')
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $employees,
            'message' => 'Active employees retrieved successfully'
        ]);
    }

    /**
     * Get employee profile with all related data
     */
    public function profile(Employee $employee)
    {
        $employee->load([
            'department',
            'user',
            'leaveRequests' => function ($query) {
                $query->orderBy('created_at', 'desc')->limit(10);
            },
            'absences' => function ($query) {
                $query->orderBy('date', 'desc')->limit(10);
            },
            'salaries' => function ($query) {
                $query->orderBy('month', 'desc')->limit(12);
            }
        ]);

        // Calculate vacation days
        $totalVacationDays = 25;
        $usedVacationDays = $employee->leaveRequests()
            ->where('leave_type', 'annual')
            ->where('status', 'approved')
            ->get()
            ->sum('total_days');

        $employee->remaining_vacation_days = $totalVacationDays - $usedVacationDays;

        return response()->json([
            'success' => true,
            'data' => $employee,
            'message' => 'Employee profile retrieved successfully'
        ]);
    }
}

