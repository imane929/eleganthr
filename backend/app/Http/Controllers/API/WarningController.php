<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Controllers\API\NotificationController;
use App\Models\Warning;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class WarningController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Warning::with(['employee', 'issuer', 'manager']);

        // Filter by employee
        if ($request->has('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }

        // Filter by status
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Filter by warning type
        if ($request->has('warning_type')) {
            $query->where('warning_type', $request->warning_type);
        }

        // Filter by severity
        if ($request->has('severity')) {
            $query->where('severity', $request->severity);
        }

        // Filter by department
        if ($request->has('department_id')) {
            $query->whereHas('employee', function ($q) use ($request) {
                $q->where('department_id', $request->department_id);
            });
        }

        // Sort
        $sortBy = $request->sort_by ?? 'warning_date';
        $sortOrder = $request->sort_order ?? 'desc';
        $query->orderBy($sortBy, $sortOrder);

        // Pagination
        $perPage = $request->per_page ?? 15;
        $warnings = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $warnings,
            'message' => 'Warnings retrieved successfully'
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'employee_id' => 'required|exists:employees,id',
            'warning_type' => 'required|in:verbal,written,final_written,suspension',
            'severity' => 'required|in:low,medium,high,critical',
            'incident_date' => 'required|date',
            'warning_date' => 'required|date',
            'description' => 'required|string',
            'consequence' => 'nullable|string',
            'attachment' => 'nullable|file|mimes:pdf,doc,docx,jpg,jpeg,png|max:5120',
            'manager_id' => 'nullable|exists:users,id',
            'expiry_months' => 'nullable|integer|min:1|max:24'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        // Handle file attachment
        $attachmentPath = null;
        if ($request->hasFile('attachment')) {
            $attachmentPath = $request->file('attachment')->store('warning_attachments', 'public');
        }

        // Calculate expiry date
        $expiryDate = null;
        if ($request->expiry_months) {
            $expiryDate = Carbon::parse($request->warning_date)->addMonths((int) $request->expiry_months);
        }

        $warning = Warning::create([
            'employee_id' => $request->employee_id,
            'issued_by' => auth()->id(),
            'manager_id' => $request->manager_id,
            'warning_type' => $request->warning_type,
            'severity' => $request->severity,
            'incident_date' => $request->incident_date,
            'warning_date' => $request->warning_date,
            'description' => $request->description,
            'consequence' => $request->consequence,
            'attachment_path' => $attachmentPath,
            'expiry_date' => $expiryDate,
            'status' => 'active'
        ]);

        $warning->load(['employee', 'issuer']);

        // Notify employee
        $employeeUser = User::where('employee_id', $request->employee_id)->first();
        if ($employeeUser) {
            NotificationController::createNotification(
                $employeeUser->id,
                'warning',
                'Nouvel avertissement',
                'Vous avez reçu un ' . Warning::getWarningTypeLabel($request->warning_type) . '. Veuillez consulter vos avertissements.',
                '/my-warnings',
                $warning->id,
                Warning::class
            );
        }

        return response()->json([
            'success' => true,
            'data' => $warning,
            'message' => 'Warning created successfully'
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Warning $warning)
    {
        $warning->load(['employee', 'issuer', 'manager', 'resolver']);

        return response()->json([
            'success' => true,
            'data' => $warning,
            'message' => 'Warning retrieved successfully'
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Warning $warning)
    {
        $validator = Validator::make($request->all(), [
            'warning_type' => 'sometimes|in:verbal,written,final_written,suspension',
            'severity' => 'sometimes|in:low,medium,high,critical',
            'incident_date' => 'sometimes|date',
            'warning_date' => 'sometimes|date',
            'description' => 'sometimes|string',
            'consequence' => 'nullable|string',
            'attachment' => 'nullable|file|mimes:pdf,doc,docx,jpg,jpeg,png|max:5120',
            'manager_id' => 'nullable|exists:users,id',
            'expiry_date' => 'nullable|date',
            'status' => 'sometimes|in:active,expired,cleared',
            'resolution_notes' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        // Handle file attachment
        if ($request->hasFile('attachment')) {
            $attachmentPath = $request->file('attachment')->store('warning_attachments', 'public');
            $warning->attachment_path = $attachmentPath;
        }

        // If clearing/expiring, add resolution info
        if ($request->status === 'cleared' || $request->status === 'expired') {
            $warning->resolved_by = auth()->id();
            $warning->resolved_date = now();
            $warning->resolution_notes = $request->resolution_notes;
        }

        $warning->update($request->except(['attachment', 'expiry_months']));

        return response()->json([
            'success' => true,
            'data' => $warning->fresh(['employee', 'issuer', 'manager']),
            'message' => 'Warning updated successfully'
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Warning $warning)
    {
        $warning->delete();

        return response()->json([
            'success' => true,
            'message' => 'Warning deleted successfully'
        ]);
    }

    /**
     * Get employee's warning history.
     */
    public function employeeWarnings(Request $request)
    {
        $employeeId = $request->employee_id;

        // If no employee_id, try to get from authenticated user
        if (!$employeeId && auth()->check()) {
            $user = auth()->user();
            if ($user->employee_id) {
                $employeeId = $user->employee_id;
            } else {
                $employee = Employee::where('email', $user->email)->first();
                if ($employee) {
                    $employeeId = $employee->id;
                }
            }
        }

        if (!$employeeId) {
            return response()->json([
                'success' => false,
                'message' => 'Employee not found'
            ], 404);
        }

        $warnings = Warning::with(['issuer'])
            ->where('employee_id', $employeeId)
            ->orderBy('warning_date', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $warnings,
            'message' => 'Employee warnings retrieved successfully'
        ]);
    }

    /**
     * Acknowledge warning by employee.
     */
    public function acknowledge(Request $request, Warning $warning)
    {
        $validator = Validator::make($request->all(), [
            'signature' => 'required|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $warning->update([
            'employee_acknowledged' => true,
            'acknowledgment_date' => now(),
            'employee_signature' => $request->signature
        ]);

        return response()->json([
            'success' => true,
            'data' => $warning,
            'message' => 'Warning acknowledged successfully'
        ]);
    }

    /**
     * Clear/resolve a warning.
     */
    public function resolve(Request $request, Warning $warning)
    {
        $validator = Validator::make($request->all(), [
            'resolution_notes' => 'required|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $warning->update([
            'status' => 'cleared',
            'resolved_by' => auth()->id(),
            'resolved_date' => now(),
            'resolution_notes' => $request->resolution_notes
        ]);

        return response()->json([
            'success' => true,
            'data' => $warning,
            'message' => 'Warning resolved successfully'
        ]);
    }

    /**
     * Get warnings statistics.
     */
    public function statistics(Request $request)
    {
        $query = Warning::query();

        // Filter by department
        if ($request->has('department_id')) {
            $query->whereHas('employee', function ($q) use ($request) {
                $q->where('department_id', $request->department_id);
            });
        }

        // Filter by year
        if ($request->has('year')) {
            $query->whereYear('warning_date', $request->year);
        }

        $totalWarnings = $query->count();
        $activeWarnings = (clone $query)->where('status', 'active')->count();
        $expiredWarnings = (clone $query)->where('status', 'expired')->count();
        $clearedWarnings = (clone $query)->where('status', 'cleared')->count();

        // By type
        $byType = (clone $query)->selectRaw('warning_type, count(*) as count')
            ->groupBy('warning_type')
            ->pluck('count', 'warning_type')
            ->toArray();

        // By severity
        $bySeverity = (clone $query)->selectRaw('severity, count(*) as count')
            ->groupBy('severity')
            ->pluck('count', 'severity')
            ->toArray();

        // By department
        $byDepartment = Warning::selectRaw('departments.name as department, count(warnings.id) as count')
            ->join('employees', 'warnings.employee_id', '=', 'employees.id')
            ->join('departments', 'employees.department_id', '=', 'departments.id')
            ->when($request->has('year'), fn($q) => $q->whereYear('warnings.warning_date', $request->year))
            ->groupBy('departments.name')
            ->pluck('count', 'department')
            ->toArray();

        // Employees with multiple warnings
        $employeesWithWarnings = Warning::selectRaw('employee_id, count(*) as warning_count')
            ->where('status', 'active')
            ->groupBy('employee_id')
            ->having('warning_count', '>', 1)
            ->with(['employee:id,first_name,last_name'])
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'total' => $totalWarnings,
                'active' => $activeWarnings,
                'expired' => $expiredWarnings,
                'cleared' => $clearedWarnings,
                'by_type' => $byType,
                'by_severity' => $bySeverity,
                'by_department' => $byDepartment,
                'employees_with_multiple_warnings' => $employeesWithWarnings
            ],
            'message' => 'Statistics retrieved successfully'
        ]);
    }

    /**
     * Check if employee has active warnings.
     */
    public function checkEmployeeWarnings($employeeId)
    {
        $activeWarnings = Warning::where('employee_id', $employeeId)
            ->where('status', 'active')
            ->count();

        $latestWarning = Warning::where('employee_id', $employeeId)
            ->where('status', 'active')
            ->latest()
            ->first();

        // Get progression level
        $progressionLevel = 0;
        if ($latestWarning) {
            $progressionLevel = Warning::getProgressionLevel($latestWarning->warning_type);
        }

        // Check previous warnings for progressive discipline
        $previousWarnings = Warning::where('employee_id', $employeeId)
            ->whereIn('status', ['active', 'expired'])
            ->orderBy('warning_date', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'has_active_warnings' => $activeWarnings > 0,
                'active_count' => $activeWarnings,
                'latest_warning' => $latestWarning,
                'progression_level' => $progressionLevel,
                'previous_warnings' => $previousWarnings
            ],
            'message' => 'Employee warnings checked successfully'
        ]);
    }

    /**
     * Generate warning letter (returns data for print).
     */
    public function generateLetter(Warning $warning)
    {
        $warning->load(['employee', 'issuer']);

        return response()->json([
            'success' => true,
            'data' => [
                'employee_name' => $warning->employee->first_name . ' ' . $warning->employee->last_name,
                'employee_position' => $warning->employee->position,
                'warning_type' => Warning::getWarningTypeLabel($warning->warning_type),
                'severity' => Warning::getSeverityLabel($warning->severity),
                'incident_date' => Carbon::parse($warning->incident_date)->format('d/m/Y'),
                'warning_date' => Carbon::parse($warning->warning_date)->format('d/m/Y'),
                'description' => $warning->description,
                'consequence' => $warning->consequence,
                'issuer_name' => $warning->issuer->name,
                'issuer_date' => now()->format('d/m/Y')
            ],
            'message' => 'Warning letter data retrieved successfully'
        ]);
    }
}
