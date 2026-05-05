<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\BonusType;
use App\Models\EmployeeBonus;
use App\Models\Employee;
use App\Models\Department;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class BonusController extends Controller
{
    // Bonus Types
    public function getBonusTypes(Request $request)
    {
        $query = BonusType::query();
        
        if ($request->has('active') && $request->active) {
            $query->where('is_active', true);
        }

        $types = $query->orderBy('name')->get();

        return response()->json([
            'success' => true,
            'data' => $types
        ]);
    }

    public function createBonusType(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:bonus_types,code',
            'description' => 'nullable|string',
            'calculation_type' => 'required|in:fixed,percentage,formula,tiered',
            'default_value' => 'nullable|numeric|min:0',
            'percentage_value' => 'nullable|numeric|min:0|max:100',
            'formula' => 'nullable|string',
            'is_taxable' => 'boolean',
            'payment_frequency' => 'required|in:one_time,monthly,quarterly,annual,event_based',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $bonusType = BonusType::create($request->all());

        return response()->json([
            'success' => true,
            'data' => $bonusType,
            'message' => 'Type de prime créé avec succès'
        ]);
    }

    public function updateBonusType(Request $request, $id)
    {
        $bonusType = BonusType::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:bonus_types,code,' . $id,
            'description' => 'nullable|string',
            'calculation_type' => 'required|in:fixed,percentage,formula,tiered',
            'default_value' => 'nullable|numeric|min:0',
            'percentage_value' => 'nullable|numeric|min:0|max:100',
            'formula' => 'nullable|string',
            'is_taxable' => 'boolean',
            'payment_frequency' => 'required|in:one_time,monthly,quarterly,annual,event_based',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $bonusType->update($request->all());

        return response()->json([
            'success' => true,
            'data' => $bonusType,
            'message' => 'Type de prime mis à jour'
        ]);
    }

    public function deleteBonusType($id)
    {
        $bonusType = BonusType::findOrFail($id);
        
        if ($bonusType->employeeBonuses()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Impossible de supprimer ce type de prime car il est utilisé'
            ], 422);
        }

        $bonusType->delete();

        return response()->json([
            'success' => true,
            'message' => 'Type de prime supprimé'
        ]);
    }

    // Employee Bonuses
    public function getEmployeeBonuses(Request $request)
    {
        $query = EmployeeBonus::with(['employee', 'bonusType', 'requestedBy', 'approvedBy']);

        if ($request->has('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }

        if ($request->has('bonus_type_id')) {
            $query->where('bonus_type_id', $request->bonus_type_id);
        }

        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->has('payment_status')) {
            $query->where('payment_status', $request->payment_status);
        }

        if ($request->has('department_id')) {
            $query->whereHas('employee', function ($q) use ($request) {
                $q->where('department_id', $request->department_id);
            });
        }

        $bonuses = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $bonuses
        ]);
    }

    public function assignBonus(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'employee_id' => 'required|exists:employees,id',
            'bonus_type_id' => 'required|exists:bonus_types,id',
            'amount' => 'required|numeric|min:0',
            'effective_date' => 'required|date',
            'end_date' => 'nullable|date|after:effective_date',
            'event_type' => 'nullable|string',
            'justification' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $bonusType = BonusType::findOrFail($request->bonus_type_id);
        $employee = Employee::findOrFail($request->employee_id);

        $calculatedAmount = $bonusType->calculateAmount(
            $employee->base_salary ?? 0,
            0,
            $employee->seniority_years ?? 0
        );

        $bonus = EmployeeBonus::create([
            'employee_id' => $request->employee_id,
            'bonus_type_id' => $request->bonus_type_id,
            'amount' => $request->amount,
            'calculated_amount' => $calculatedAmount,
            'effective_date' => $request->effective_date,
            'end_date' => $request->end_date,
            'status' => 'pending',
            'payment_status' => 'unpaid',
            'event_type' => $request->event_type,
            'justification' => $request->justification,
            'notes' => $request->notes,
            'requested_by' => auth()->id(),
        ]);

        return response()->json([
            'success' => true,
            'data' => $bonus->load(['employee', 'bonusType']),
            'message' => 'Prime attribuée avec succès'
        ]);
    }

    public function bulkAssignBonus(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'employee_ids' => 'required|array|min:1',
            'employee_ids.*' => 'exists:employees,id',
            'bonus_type_id' => 'required|exists:bonus_types,id',
            'amount' => 'required|numeric|min:0',
            'effective_date' => 'required|date',
            'end_date' => 'nullable|date|after:effective_date',
            'justification' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $bonusType = BonusType::findOrFail($request->bonus_type_id);
        $bonuses = [];

        foreach ($request->employee_ids as $employeeId) {
            $employee = Employee::findOrFail($employeeId);
            
            $calculatedAmount = $bonusType->calculateAmount(
                $employee->base_salary ?? 0,
                0,
                $employee->seniority_years ?? 0
            );

            $bonuses[] = EmployeeBonus::create([
                'employee_id' => $employeeId,
                'bonus_type_id' => $request->bonus_type_id,
                'amount' => $request->amount,
                'calculated_amount' => $calculatedAmount,
                'effective_date' => $request->effective_date,
                'end_date' => $request->end_date,
                'status' => 'pending',
                'payment_status' => 'unpaid',
                'justification' => $request->justification,
                'requested_by' => auth()->id(),
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => $bonuses,
            'message' => count($bonuses) . ' prime(s) attribuée(s) avec succès'
        ]);
    }

    public function bulkAssignByDepartment(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'department_id' => 'required|exists:departments,id',
            'bonus_type_id' => 'required|exists:bonus_types,id',
            'amount' => 'required|numeric|min:0',
            'effective_date' => 'required|date',
            'end_date' => 'nullable|date|after:effective_date',
            'justification' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $department = Department::findOrFail($request->department_id);
        $bonusType = BonusType::findOrFail($request->bonus_type_id);
        $employees = $department->employees()->where('status', 'active')->get();

        $bonuses = [];

        foreach ($employees as $employee) {
            $calculatedAmount = $bonusType->calculateAmount(
                $employee->base_salary ?? 0,
                0,
                $employee->seniority_years ?? 0
            );

            $bonuses[] = EmployeeBonus::create([
                'employee_id' => $employee->id,
                'bonus_type_id' => $request->bonus_type_id,
                'amount' => $request->amount,
                'calculated_amount' => $calculatedAmount,
                'effective_date' => $request->effective_date,
                'end_date' => $request->end_date,
                'status' => 'pending',
                'payment_status' => 'unpaid',
                'justification' => $request->justification,
                'requested_by' => auth()->id(),
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => $bonuses,
            'message' => count($bonuses) . ' prime(s) attribuée(s) au département ' . $department->name
        ]);
    }

    public function approveBonus($id)
    {
        $bonus = EmployeeBonus::findOrFail($id);

        if ($bonus->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Cette prime a déjà été traitée'
            ], 422);
        }

        $bonus->update([
            'status' => 'approved',
            'payment_status' => 'unpaid',
            'approved_by' => auth()->id(),
            'approved_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'data' => $bonus->load(['employee', 'bonusType', 'approvedBy']),
            'message' => 'Prime approuvée avec succès'
        ]);
    }

    public function rejectBonus(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'rejection_reason' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $bonus = EmployeeBonus::findOrFail($id);

        if ($bonus->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Cette prime a déjà été traitée'
            ], 422);
        }

        $bonus->update([
            'status' => 'rejected',
            'rejection_reason' => $request->rejection_reason,
            'approved_by' => auth()->id(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Prime rejetée'
        ]);
    }

    public function cancelBonus($id)
    {
        $bonus = EmployeeBonus::findOrFail($id);

        $bonus->update(['status' => 'cancelled']);

        return response()->json([
            'success' => true,
            'message' => 'Prime annulée'
        ]);
    }

    public function markAsPaid(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'payment_date' => 'required|date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $bonus = EmployeeBonus::findOrFail($id);

        if ($bonus->status !== 'approved') {
            return response()->json([
                'success' => false,
                'message' => 'Seules les primes approuvées peuvent être marquées comme payées'
            ], 422);
        }

        $bonus->update([
            'payment_status' => 'paid',
            'payment_date' => $request->payment_date,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Prime marquée comme payée'
        ]);
    }

    public function getEmployeeBonusHistory($employeeId)
    {
        $bonuses = EmployeeBonus::with(['bonusType'])
            ->where('employee_id', $employeeId)
            ->orderBy('effective_date', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $bonuses
        ]);
    }

    // Reports
    public function getBonusReport(Request $request)
    {
        $year = $request->year ?? Carbon::now()->year;
        $month = $request->month;

        $query = EmployeeBonus::with(['employee.department', 'bonusType']);

        if ($month) {
            $query->whereMonth('effective_date', $month)
                  ->whereYear('effective_date', $year);
        } else {
            $query->whereYear('effective_date', $year);
        }

        if ($request->has('department_id')) {
            $query->whereHas('employee', function ($q) use ($request) {
                $q->where('department_id', $request->department_id);
            });
        }

        if ($request->has('bonus_type_id')) {
            $query->where('bonus_type_id', $request->bonus_type_id);
        }

        $bonuses = $query->get();

        $byEmployee = $bonuses->groupBy('employee_id')->map(function ($items) {
            return [
                'employee' => $items->first()->employee,
                'total' => $items->sum('amount'),
                'count' => $items->count(),
                'bonuses' => $items
            ];
        });

        $byType = $bonuses->groupBy('bonus_type_id')->map(function ($items) {
            return [
                'bonus_type' => $items->first()->bonusType,
                'total' => $items->sum('amount'),
                'count' => $items->count(),
            ];
        });

        $byDepartment = $bonuses->groupBy('employee.department_id')->map(function ($items) {
            return [
                'department' => $items->first()->employee->department,
                'total' => $items->sum('amount'),
                'count' => $items->count(),
            ];
        });

        $total = $bonuses->sum('amount');

        return response()->json([
            'success' => true,
            'data' => [
                'total' => $total,
                'count' => $bonuses->count(),
                'by_employee' => $byEmployee->values(),
                'by_type' => $byType->values(),
                'by_department' => $byDepartment->values(),
            ],
            'year' => $year,
            'month' => $month
        ]);
    }

    public function getPendingApprovals()
    {
        $pending = EmployeeBonus::with(['employee.department', 'bonusType', 'requestedBy'])
            ->where('status', 'pending')
            ->orderBy('effective_date', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $pending,
            'count' => $pending->count()
        ]);
    }

    public function getStats()
    {
        $currentMonth = Carbon::now()->month;
        $currentYear = Carbon::now()->year;

        $pendingCount = EmployeeBonus::where('status', 'pending')->count();
        $approvedThisMonth = EmployeeBonus::where('status', 'approved')
            ->whereMonth('approved_at', $currentMonth)
            ->whereYear('approved_at', $currentYear)
            ->count();
        $paidThisMonth = EmployeeBonus::where('payment_status', 'paid')
            ->whereMonth('payment_date', $currentMonth)
            ->whereYear('payment_date', $currentYear)
            ->count();
        $totalPaidThisMonth = EmployeeBonus::where('payment_status', 'paid')
            ->whereMonth('payment_date', $currentMonth)
            ->whereYear('payment_date', $currentYear)
            ->sum('amount');

        return response()->json([
            'success' => true,
            'data' => [
                'pending_count' => $pendingCount,
                'approved_this_month' => $approvedThisMonth,
                'paid_this_month' => $paidThisMonth,
                'total_paid_this_month' => $totalPaidThisMonth,
            ]
        ]);
    }

    public function calculateProratedBonus(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'bonus_type_id' => 'required|exists:bonus_types,id',
            'base_salary' => 'required|numeric|min:0',
            'working_days' => 'required|integer|min:1',
            'days_worked' => 'required|integer|min:0',
            'seniority_years' => 'nullable|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $bonusType = BonusType::findOrFail($request->bonus_type_id);
        $baseAmount = $bonusType->calculateAmount(
            $request->base_salary,
            $request->days_worked,
            $request->seniority_years ?? 0
        );

        $proratedAmount = ($baseAmount / $request->working_days) * $request->days_worked;

        return response()->json([
            'success' => true,
            'data' => [
                'base_amount' => $baseAmount,
                'working_days' => $request->working_days,
                'days_worked' => $request->days_worked,
                'prorated_amount' => round($proratedAmount, 2),
                'percentage' => round(($request->days_worked / $request->working_days) * 100, 2),
            ]
        ]);
    }
}
