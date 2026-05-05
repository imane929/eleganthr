<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Controllers\API\NotificationController;
use App\Models\LeaveRequest;
use App\Models\Employee;
use App\Models\User;
use App\Models\LeavePolicy;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class LeaveRequestController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = auth()->user();
        $query = LeaveRequest::with(['employee', 'approver']);

        // Filter by role - Responsibles can only see their department's requests
        if ($user->hasRole('Responsable')) {
            $employee = Employee::where('user_id', $user->id)->first();
            if ($employee && $employee->department_id) {
                $query->whereHas('employee', function ($q) use ($employee) {
                    $q->where('department_id', $employee->department_id);
                });
            }
        }

        // Filter by status
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Filter by leave type
        if ($request->has('leave_type')) {
            $query->where('leave_type', $request->leave_type);
        }

        // Filter by employee
        if ($request->has('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }

        // Filter by date range
        if ($request->has('start_date')) {
            $query->where('start_date', '>=', $request->start_date);
        }
        if ($request->has('end_date')) {
            $query->where('end_date', '<=', $request->end_date);
        }

        // Sort
        $sortBy = $request->sort_by ?? 'created_at';
        $sortOrder = $request->sort_order ?? 'desc';
        $allowedSorts = ['start_date', 'end_date', 'total_days', 'status', 'created_at'];
        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortOrder);
        }

        // Pagination
        $perPage = $request->per_page ?? 10;
        $leaveRequests = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $leaveRequests,
            'message' => 'Leave requests retrieved successfully'
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // Get employee_id from request or from authenticated user
        $employeeId = $request->employee_id;
        
        // If no employee_id provided, try to get from authenticated user
        if (!$employeeId && auth()->check()) {
            $user = auth()->user();
            
            // Try to get from user->employee relationship first
            if ($user->employee) {
                $employeeId = $user->employee->id;
            } else {
                // Try to find employee by matching email
                $employee = \App\Models\Employee::where('email', $user->email)->first();
                if ($employee) {
                    $employeeId = $employee->id;
                }
            }
        }
        
        $validator = Validator::make($request->all(), [
            'employee_id' => 'nullable|exists:employees,id',
            'leave_type' => 'required|in:annual,sick,unpaid,maternity,paternity,other,preavis',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'reason' => 'nullable|string',
            'attachment' => 'nullable|file|mimes:pdf,doc,docx,jpg,jpeg,png|max:2048',
            'handover_recipient' => 'nullable|string|max:255'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        // If still no employee_id, return error
        if (!$employeeId) {
            return response()->json([
                'success' => false,
                'message' => 'Employee ID is required. Please contact administrator.'
            ], 422);
        }

        // Calculate total days
        $startDate = Carbon::parse($request->start_date);
        $endDate = Carbon::parse($request->end_date);
        $totalDays = $startDate->diffInDays($endDate) + 1;

        // Check notice period
        $noticePeriodDays = LeavePolicy::getNoticePeriod($request->leave_type);
        $daysUntilStart = Carbon::now()->diffInDays($startDate, false);
        $noticePeriodMet = $daysUntilStart >= $noticePeriodDays;
        $noticeWarning = null;
        
        if ($noticePeriodDays > 0 && !$noticePeriodMet) {
            $noticeWarning = "Cette demande ne respecte pas le préavis de {$noticePeriodDays} jours. Approval du manager requise.";
        }

        // Check if employee has enough vacation days for annual leave
        if ($request->leave_type === 'annual') {
            $employee = Employee::findOrFail($request->employee_id);
            $remainingDays = $employee->remaining_vacation_days;
            
            if ($totalDays > $remainingDays) {
                return response()->json([
                    'success' => false,
                    'message' => 'Insufficient vacation days. You have ' . $remainingDays . ' days remaining.'
                ], 422);
            }
        }

        // Check if handover is required
        $handoverThreshold = LeavePolicy::getHandoverThreshold($request->leave_type);
        $handoverRequired = $totalDays >= $handoverThreshold && $handoverThreshold > 0;

        // Handle file attachment
        $attachmentPath = null;
        if ($request->hasFile('attachment')) {
            $attachmentPath = $request->file('attachment')->store('leave_attachments', 'public');
        }

        $leaveRequest = LeaveRequest::create([
            'employee_id' => $employeeId,
            'leave_type' => $request->leave_type,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'total_days' => $totalDays,
            'reason' => $request->reason,
            'status' => 'pending',
            'attachment' => $attachmentPath,
            'notice_period_days' => $noticePeriodDays,
            'notice_period_met' => $noticePeriodMet,
            'notice_warning' => $noticeWarning,
            'handover_required' => $handoverRequired,
            'handover_recipient' => $request->handover_recipient
        ]);

        $response = [
            'success' => true,
            'data' => $leaveRequest->load(['employee', 'approver']),
            'message' => 'Leave request submitted successfully'
        ];

        // Add warning to response if notice period not met
        if ($noticeWarning) {
            $response['warning'] = $noticeWarning;
            $response['notice_period_required'] = $noticePeriodDays;
            $response['days_until_start'] = $daysUntilStart;
        }

        // Add handover info to response
        if ($handoverRequired) {
            $response['handover_required'] = true;
            $response['handover_message'] = 'Une passation est requise pour ce congé. Veuillez compléter la passation avant l\'approbation.';
        }

        // Notify admins/RH about new leave request
        try {
            $admins = User::role(['Admin', 'HR Manager'])->get();
            $employee = Employee::find($employeeId);
            foreach ($admins as $admin) {
                NotificationController::createNotification(
                    $admin->id,
                    'leave',
                    'Nouvelle demande de congé',
                    $employee->first_name . ' ' . $employee->last_name . ' a soumis une demande de congé du ' . Carbon::parse($request->start_date)->format('d/m/Y') . ' au ' . Carbon::parse($request->end_date)->format('d/m/Y'),
                    '/leave-requests',
                    $leaveRequest->id,
                    LeaveRequest::class
                );
            }

            // Notify the responsible of the employee's department
            if ($employee && $employee->department_id) {
                $department = \App\Models\Department::find($employee->department_id);
                if ($department && $department->manager_id) {
                    $managerEmployee = Employee::find($department->manager_id);
                    if ($managerEmployee && $managerEmployee->user_id) {
                        NotificationController::createNotification(
                            $managerEmployee->user_id,
                            'leave',
                            'Nouvelle demande de congé',
                            $employee->first_name . ' ' . $employee->last_name . ' a soumis une demande de congé du ' . Carbon::parse($request->start_date)->format('d/m/Y') . ' au ' . Carbon::parse($request->end_date)->format('d/m/Y'),
                            '/leave-requests',
                            $leaveRequest->id,
                            LeaveRequest::class
                        );
                    }
                }
            }
        } catch (\Exception $e) {
            \Log::error('Notification error: ' . $e->getMessage());
        }

        return response()->json($response, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(LeaveRequest $leaveRequest)
    {
        $leaveRequest->load(['employee', 'approver']);

        return response()->json([
            'success' => true,
            'data' => $leaveRequest,
            'message' => 'Leave request retrieved successfully'
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, LeaveRequest $leaveRequest)
    {
        // Only allow updates for pending requests
        if ($leaveRequest->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Cannot update a processed leave request'
            ], 422);
        }

        $validator = Validator::make($request->all(), [
            'leave_type' => 'sometimes|in:annual,sick,unpaid,maternity,paternity,other,preavis',
            'start_date' => 'sometimes|date',
            'end_date' => 'sometimes|date|after_or_equal:start_date',
            'reason' => 'nullable|string',
            'attachment' => 'nullable|file|mimes:pdf,doc,docx,jpg,jpeg,png|max:2048'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        // Recalculate total days if dates changed
        $data = $request->all();
        if ($request->has('start_date') && $request->has('end_date')) {
            $startDate = Carbon::parse($request->start_date);
            $endDate = Carbon::parse($request->end_date);
            $data['total_days'] = $startDate->diffInDays($endDate) + 1;
        }

        // Handle file attachment
        if ($request->hasFile('attachment')) {
            $data['attachment'] = $request->file('attachment')->store('leave_attachments', 'public');
        }

        $leaveRequest->update($data);

        return response()->json([
            'success' => true,
            'data' => $leaveRequest->load(['employee', 'approver']),
            'message' => 'Leave request updated successfully'
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(LeaveRequest $leaveRequest)
    {
        // Only allow deletion of pending requests
        if ($leaveRequest->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete a processed leave request'
            ], 422);
        }

        $leaveRequest->delete();

        return response()->json([
            'success' => true,
            'message' => 'Leave request deleted successfully'
        ]);
    }

    /**
     * Approve a leave request.
     */
    public function approve(Request $request, LeaveRequest $leaveRequest)
    {
        $user = auth()->user();
        
        if (!$user->hasAnyRole(['Admin', 'HR Manager', 'Responsable'])) {
            return response()->json([
                'success' => false,
                'message' => 'Vous n\'avez pas l\'autorisation d\'approuver les demandes de congé.'
            ], 403);
        }

        if ($user->hasRole('Responsable')) {
            $employee = $leaveRequest->employee;
            if ($employee && $employee->department_id !== $user->employee->department_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Vous ne pouvez approuver que les demandes de votre département.'
                ], 403);
            }
        }

        if ($leaveRequest->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Leave request has already been processed'
            ], 422);
        }

        $validator = Validator::make($request->all(), [
            'comments' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        // Check if handover is required but not completed
        if ($leaveRequest->handover_required && !$leaveRequest->handover_completed) {
            return response()->json([
                'success' => false,
                'message' => 'La passation n\'a pas été complétée. La passation est requise avant l\'approbation du congé.',
                'handover_required' => true,
                'handover_recipient' => $leaveRequest->handover_recipient
            ], 422);
        }

        $leaveRequest->update([
            'status' => 'approved',
            'approved_by' => auth()->id(),
            'approved_at' => now(),
            'rejection_reason' => null
        ]);

        $leaveRequest->load(['employee']);
        $employeeUser = User::where('employee_id', $leaveRequest->employee_id)->first();
        if ($employeeUser) {
            NotificationController::createNotification(
                $employeeUser->id,
                'approved',
                'Demande de congé approuvée',
                'Votre demande de congé du ' . Carbon::parse($leaveRequest->start_date)->format('d/m/Y') . ' au ' . Carbon::parse($leaveRequest->end_date)->format('d/m/Y') . ' a été approuvée.',
                '/leave-requests',
                $leaveRequest->id,
                LeaveRequest::class
            );
        }

        // Notify the responsible of the employee's department
        $employee = $leaveRequest->employee;
        if ($employee && $employee->department_id) {
            $department = \App\Models\Department::find($employee->department_id);
            if ($department && $department->manager_id) {
                $managerEmployee = Employee::find($department->manager_id);
                if ($managerEmployee && $managerEmployee->user_id) {
                    $approver = auth()->user();
                    $isResponsableApproval = $approver->hasRole('Responsable');
                    
                    if (!$isResponsableApproval) {
                        NotificationController::createNotification(
                            $managerEmployee->user_id,
                            'approved',
                            'Demande de congé approuvée',
                            'La demande de congé de ' . $employee->first_name . ' ' . $employee->last_name . ' a été approuvée par l\'administration.',
                            '/leave-requests',
                            $leaveRequest->id,
                            LeaveRequest::class
                        );
                    }
                }
            }
        }

        return response()->json([
            'success' => true,
            'data' => $leaveRequest->load(['employee', 'approver']),
            'message' => 'Leave request approved successfully'
        ]);
    }

    /**
     * Reject a leave request.
     */
    public function reject(Request $request, LeaveRequest $leaveRequest)
    {
        $user = auth()->user();
        
        if (!$user->hasAnyRole(['Admin', 'HR Manager', 'Responsable'])) {
            return response()->json([
                'success' => false,
                'message' => 'Vous n\'avez pas l\'autorisation de rejeter les demandes de congé.'
            ], 403);
        }

        if ($user->hasRole('Responsable')) {
            $employee = $leaveRequest->employee;
            if ($employee && $employee->department_id !== $user->employee->department_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Vous ne pouvez rejeter que les demandes de votre département.'
                ], 403);
            }
        }

        if ($leaveRequest->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Leave request has already been processed'
            ], 422);
        }

        $validator = Validator::make($request->all(), [
            'rejection_reason' => 'required|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $leaveRequest->update([
            'status' => 'rejected',
            'approved_by' => auth()->id(),
            'approved_at' => now(),
            'rejection_reason' => $request->rejection_reason
        ]);

        $leaveRequest->load(['employee']);
        $employeeUser = User::where('employee_id', $leaveRequest->employee_id)->first();
        if ($employeeUser) {
            NotificationController::createNotification(
                $employeeUser->id,
                'rejected',
                'Demande de congé refusée',
                'Votre demande de congé du ' . Carbon::parse($leaveRequest->start_date)->format('d/m/Y') . ' au ' . Carbon::parse($leaveRequest->end_date)->format('d/m/Y') . ' a été refusée. Motif: ' . $request->rejection_reason,
                '/leave-requests',
                $leaveRequest->id,
                LeaveRequest::class
            );
        }

        // Notify the responsible of the employee's department
        $employee = $leaveRequest->employee;
        if ($employee && $employee->department_id) {
            $department = \App\Models\Department::find($employee->department_id);
            if ($department && $department->manager_id) {
                $managerEmployee = Employee::find($department->manager_id);
                if ($managerEmployee && $managerEmployee->user_id) {
                    $approver = auth()->user();
                    $isResponsableApproval = $approver->hasRole('Responsable');
                    
                    if (!$isResponsableApproval) {
                        NotificationController::createNotification(
                            $managerEmployee->user_id,
                            'rejected',
                            'Demande de congé refusée',
                            'La demande de congé de ' . $employee->first_name . ' ' . $employee->last_name . ' a été refusée par l\'administration. Motif: ' . $request->rejection_reason,
                            '/leave-requests',
                            $leaveRequest->id,
                            LeaveRequest::class
                        );
                    }
                }
            }
        }

        return response()->json([
            'success' => true,
            'data' => $leaveRequest->load(['employee', 'approver']),
            'message' => 'Leave request rejected successfully'
        ]);
    }

    /**
     * Get current user's leave requests.
     */
    public function myRequests(Request $request)
    {
        // Get employee associated with current user
        $employee = Employee::where('user_id', auth()->id())->first();

        if (!$employee) {
            return response()->json([
                'success' => false,
                'message' => 'No employee profile found for current user'
            ], 404);
        }

        $query = LeaveRequest::with(['employee'])
            ->where('employee_id', $employee->id);

        // Filter by status
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        $leaveRequests = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $leaveRequests,
            'message' => 'My leave requests retrieved successfully'
        ]);
    }

    /**
     * Get leave balance for an employee.
     */
    public function balance(Request $request)
    {
        $employeeId = $request->employee_id ?? auth()->user()->employee->id ?? null;
        
        if (!$employeeId) {
            return response()->json([
                'success' => false,
                'message' => 'Employee not found'
            ], 404);
        }

        $employee = Employee::findOrFail($employeeId);

        // Get used vacation days
        $usedDays = LeaveRequest::where('employee_id', $employeeId)
            ->where('leave_type', 'annual')
            ->where('status', 'approved')
            ->sum('total_days');

        $totalDays = 25; // Default annual leave days
        $remainingDays = $totalDays - $usedDays;

        return response()->json([
            'success' => true,
            'data' => [
                'total_annual_leave' => $totalDays,
                'used_days' => $usedDays,
                'remaining_days' => $remainingDays
            ],
            'message' => 'Leave balance retrieved successfully'
        ]);
    }

    /**
     * Get leave statistics.
     */
    public function statistics()
    {
        $user = auth()->user();
        $query = LeaveRequest::query();

        // Filter by role - Responsibles can only see their department's requests
        if ($user->hasRole('Responsable')) {
            $employee = Employee::where('user_id', $user->id)->first();
            if ($employee && $employee->department_id) {
                $query->whereHas('employee', function ($q) use ($employee) {
                    $q->where('department_id', $employee->department_id);
                });
            }
        }

        $pendingCount = $query->clone()->where('status', 'pending')->count();
        $approvedCount = $query->clone()->where('status', 'approved')->count();
        $rejectedCount = $query->clone()->where('status', 'rejected')->count();

        // Current month stats
        $currentMonth = Carbon::now()->month;
        $currentYear = Carbon::now()->year;
        
        $monthlyApproved = LeaveRequest::where('status', 'approved')
            ->whereMonth('start_date', $currentMonth)
            ->whereYear('start_date', $currentYear)
            ->count();

        return response()->json([
            'success' => true,
            'data' => [
                'pending' => $pendingCount,
                'approved' => $approvedCount,
                'rejected' => $rejectedCount,
                'monthly_approved' => $monthlyApproved
            ],
            'message' => 'Leave statistics retrieved successfully'
        ]);
    }

    /**
     * Complete handover for a leave request.
     */
    public function completeHandover(Request $request, LeaveRequest $leaveRequest)
    {
        $validator = Validator::make($request->all(), [
            'handover_notes' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        if (!$leaveRequest->handover_required) {
            return response()->json([
                'success' => false,
                'message' => 'Handover is not required for this leave request'
            ], 422);
        }

        if ($leaveRequest->handover_completed) {
            return response()->json([
                'success' => false,
                'message' => 'Handover has already been completed'
            ], 422);
        }

        $leaveRequest->update([
            'handover_completed' => true,
            'handover_completed_at' => now(),
            'handover_notes' => $request->handover_notes
        ]);

        return response()->json([
            'success' => true,
            'data' => $leaveRequest->load(['employee']),
            'message' => 'Handover completed successfully'
        ]);
    }
}

