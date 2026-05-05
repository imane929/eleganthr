<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\SalaryScale;
use App\Models\SalaryHistory;
use App\Models\MeritIncrease;
use App\Models\DepartmentBudget;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class CompensationController extends Controller
{
    // Salary Scales
    public function getSalaryScales()
    {
        $scales = SalaryScale::all();
        return response()->json([
            'success' => true,
            'data' => $scales
        ]);
    }

    public function getSalaryScale(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'position' => 'required|string',
            'contract_type' => 'required|string',
            'seniority_years' => 'required|integer|min:0'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $scale = SalaryScale::getScaleForPosition(
            $request->position,
            $request->contract_type,
            $request->seniority_years
        );

        return response()->json([
            'success' => true,
            'data' => $scale
        ]);
    }

    public function updateSalaryScale(Request $request, $id)
    {
        $scale = SalaryScale::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'min_salary' => 'nullable|numeric|min:0',
            'max_salary' => 'nullable|numeric|min:0',
            'mid_salary' => 'nullable|numeric|min:0',
            'allowance_transport' => 'nullable|numeric|min:0',
            'allowance_housing' => 'nullable|numeric|min:0',
            'allowance_food' => 'nullable|numeric|min:0',
            'is_active' => 'boolean'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $scale->update($request->all());

        return response()->json([
            'success' => true,
            'data' => $scale,
            'message' => 'Salary scale updated successfully'
        ]);
    }

    // Employee Compensation
    public function getEmployeeCompensation($employeeId)
    {
        $employee = Employee::with('department')->findOrFail($employeeId);

        return response()->json([
            'success' => true,
            'data' => [
                'employee' => $employee,
                'base_salary' => $employee->base_salary,
                'currency' => $employee->currency,
                'allowances' => [
                    'transport' => $employee->transport_allowance,
                    'housing' => $employee->housing_allowance,
                    'food' => $employee->food_allowance,
                    'other' => $employee->other_allowances,
                    'seniority' => $employee->seniority_bonus
                ],
                'total_salary' => $employee->total_salary,
                'cost_to_company' => $employee->cost_to_company,
                'seniority_years' => $employee->seniority_years,
                'contract_type' => $employee->contract_type,
                'salary_start_date' => $employee->salary_start_date
            ]
        ]);
    }

    public function updateEmployeeCompensation(Request $request, $employeeId)
    {
        $employee = Employee::findOrFail($employeeId);

        $validator = Validator::make($request->all(), [
            'base_salary' => 'required|numeric|min:0',
            'currency' => 'required|string|in:MAD',
            'contract_type' => 'required|string|in:CDI,CDD,Intern,Stagiaire',
            'transport_allowance' => 'nullable|numeric|min:0',
            'housing_allowance' => 'nullable|numeric|min:0',
            'food_allowance' => 'nullable|numeric|min:0',
            'other_allowances' => 'nullable|numeric|min:0',
            'seniority_years' => 'nullable|integer|min:0',
            'salary_start_date' => 'nullable|date',
            'reason' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $oldSalary = $employee->base_salary;
        $employee->update($request->only([
            'base_salary', 'currency', 'contract_type',
            'transport_allowance', 'housing_allowance', 'food_allowance',
            'other_allowances', 'seniority_years', 'salary_start_date'
        ]));

        // Calculate seniority bonus based on years
        $seniorityBonus = $employee->seniority_years * 100;
        $employee->update(['seniority_bonus' => $seniorityBonus]);

        // Create salary history record
        $changeType = $oldSalary ? 'adjustment' : 'initial';
        SalaryHistory::create([
            'employee_id' => $employee->id,
            'base_salary' => $employee->base_salary,
            'transport_allowance' => $employee->transport_allowance ?? 0,
            'housing_allowance' => $employee->housing_allowance ?? 0,
            'food_allowance' => $employee->food_allowance ?? 0,
            'other_allowances' => $employee->other_allowances ?? 0,
            'total_salary' => $employee->total_salary,
            'change_type' => $changeType,
            'reason' => $request->reason,
            'changed_by' => auth()->id(),
            'effective_date' => now()
        ]);

        return response()->json([
            'success' => true,
            'data' => $employee,
            'message' => 'Compensation updated successfully'
        ]);
    }

    // Salary History
    public function getSalaryHistory($employeeId)
    {
        $history = SalaryHistory::where('employee_id', $employeeId)
            ->orderBy('effective_date', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $history
        ]);
    }

    // Merit Increases
    public function requestMeritIncrease(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'employee_id' => 'required|exists:employees,id',
            'proposed_increase_percent' => 'required|numeric|min:0|max:50',
            'reason' => 'nullable|string',
            'effective_date' => 'nullable|date'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $employee = Employee::findOrFail($request->employee_id);
        $currentSalary = $employee->base_salary;
        $increaseAmount = $currentSalary * ($request->proposed_increase_percent / 100);

        $meritIncrease = MeritIncrease::create([
            'employee_id' => $request->employee_id,
            'current_salary' => $currentSalary,
            'proposed_increase_percent' => $request->proposed_increase_percent,
            'proposed_increase_amount' => $increaseAmount,
            'new_salary' => $currentSalary + $increaseAmount,
            'status' => 'pending',
            'reason' => $request->reason,
            'requested_by' => auth()->id(),
            'effective_date' => $request->effective_date
        ]);

        return response()->json([
            'success' => true,
            'data' => $meritIncrease,
            'message' => 'Merit increase request submitted'
        ]);
    }

    public function getMeritIncreases(Request $request)
    {
        $query = MeritIncrease::with(['employee', 'requestedBy', 'approvedBy']);

        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        $increases = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $increases
        ]);
    }

    public function approveMeritIncrease(Request $request, $id)
    {
        $meritIncrease = MeritIncrease::findOrFail($id);

        if ($meritIncrease->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Merit increase has already been processed'
            ], 422);
        }

        $meritIncrease->update([
            'status' => 'approved',
            'approved_by' => auth()->id()
        ]);

        // Update employee salary
        $employee = $meritIncrease->employee;
        $employee->update(['base_salary' => $meritIncrease->new_salary]);

        // Create salary history
        SalaryHistory::create([
            'employee_id' => $employee->id,
            'base_salary' => $meritIncrease->new_salary,
            'transport_allowance' => $employee->transport_allowance ?? 0,
            'housing_allowance' => $employee->housing_allowance ?? 0,
            'food_allowance' => $employee->food_allowance ?? 0,
            'other_allowances' => $employee->other_allowances ?? 0,
            'total_salary' => $employee->total_salary,
            'change_type' => 'increase',
            'reason' => 'Merit increase approved: ' . $meritIncrease->proposed_increase_percent . '%',
            'changed_by' => auth()->id(),
            'effective_date' => $meritIncrease->effective_date
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Merit increase approved'
        ]);
    }

    public function rejectMeritIncrease(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'rejection_reason' => 'required|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $meritIncrease = MeritIncrease::findOrFail($id);
        $meritIncrease->update([
            'status' => 'rejected',
            'approved_by' => auth()->id(),
            'rejection_reason' => $request->rejection_reason
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Merit increase rejected'
        ]);
    }

    // Budget vs Actual
    public function getBudgetVsActual(Request $request)
    {
        $year = $request->year ?? Carbon::now()->year;
        $departments = \App\Models\Department::with('employees')->get();

        $data = $departments->map(function ($dept) use ($year) {
            $employees = $dept->employees;
            $actualSalary = $employees->sum('base_salary') * 12;
            $actualCTC = $employees->sum('cost_to_company');
            
            $budget = DepartmentBudget::where('department_id', $dept->id)
                ->where('year', $year)
                ->first();

            return [
                'department' => $dept->name,
                'employee_count' => $employees->count(),
                'budget' => $budget ? $budget->annual_budget : 0,
                'actual_salary' => $actualSalary,
                'actual_ctc' => $actualCTC,
                'variance' => $budget ? ($budget->annual_budget - $actualCTC) : -$actualCTC,
                'variance_percent' => $budget && $budget->annual_budget > 0 
                    ? (($budget->annual_budget - $actualCTC) / $budget->annual_budget) * 100 
                    : -100
            ];
        });

        $totals = [
            'total_budget' => $data->sum('budget'),
            'total_actual_ctc' => $data->sum('actual_ctc'),
            'total_variance' => $data->sum('variance'),
            'total_employees' => $data->sum('employee_count')
        ];

        return response()->json([
            'success' => true,
            'data' => $data,
            'totals' => $totals,
            'year' => $year
        ]);
    }

    // Department Budget
    public function setDepartmentBudget(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'department_id' => 'required|exists:departments,id',
            'year' => 'required|integer|min:2020',
            'annual_budget' => 'required|numeric|min:0'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $budget = DepartmentBudget::updateOrCreate(
            ['department_id' => $request->department_id, 'year' => $request->year],
            ['annual_budget' => $request->annual_budget]
        );

        return response()->json([
            'success' => true,
            'data' => $budget,
            'message' => 'Budget set successfully'
        ]);
    }

    public function getDepartmentBudgets(Request $request)
    {
        $year = $request->year ?? Carbon::now()->year;
        $budgets = DepartmentBudget::where('year', $year)->with('department')->get();

        return response()->json([
            'success' => true,
            'data' => $budgets
        ]);
    }

    // Cost to Company Calculator
    public function calculateCostToCompany(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'base_salary' => 'required|numeric|min:0',
            'transport_allowance' => 'nullable|numeric|min:0',
            'housing_allowance' => 'nullable|numeric|min:0',
            'food_allowance' => 'nullable|numeric|min:0',
            'other_allowances' => 'nullable|numeric|min:0',
            'seniority_bonus' => 'nullable|numeric|min:0'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $monthlySalary = $request->base_salary 
            + ($request->transport_allowance ?? 0)
            + ($request->housing_allowance ?? 0)
            + ($request->food_allowance ?? 0)
            + ($request->other_allowances ?? 0)
            + ($request->seniority_bonus ?? 0);

        $cnss = $monthlySalary * 0.0667;
        $cimr = $monthlySalary * 0.03;
        $mutuelle = $monthlySalary * 0.02;
        $annualBonus = $monthlySalary;
        
        $monthlyCost = $monthlySalary + $cnss + $cimr + $mutuelle;
        $annualCost = $monthlyCost * 12 + $annualBonus;

        return response()->json([
            'success' => true,
            'data' => [
                'monthly_salary' => $monthlySalary,
                'monthly_cost' => $monthlyCost,
                'annual_cost' => $annualCost,
                'breakdown' => [
                    'base_salary_annual' => $monthlySalary * 12,
                    'cnss_annual' => $cnss * 12,
                    'cimr_annual' => $cimr * 12,
                    'mutuelle_annual' => $mutuelle * 12,
                    'annual_bonus' => $annualBonus
                ]
            ]
        ]);
    }
}
