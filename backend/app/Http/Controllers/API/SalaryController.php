<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Controllers\API\NotificationController;
use App\Models\Salary;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;
use PDF;

class SalaryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Salary::with(['employee', 'processor']);

        // Filter by employee
        if ($request->has('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }

        // Filter by month
        if ($request->has('month')) {
            $query->where('month', $request->month);
        }

        // Filter by status
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Filter by payment date range
        if ($request->has('start_date')) {
            $query->where('payment_date', '>=', $request->start_date);
        }
        if ($request->has('end_date')) {
            $query->where('payment_date', '<=', $request->end_date);
        }

        // Sort
        $sortBy = $request->sort_by ?? 'month';
        $sortOrder = $request->sort_order ?? 'desc';
        $allowedSorts = ['month', 'gross_amount', 'net_amount', 'payment_date', 'created_at'];
        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortOrder);
        }

        // Pagination
        $perPage = $request->per_page ?? 10;
        $salaries = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $salaries,
            'message' => 'Salaries retrieved successfully'
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'employee_id' => 'required|exists:employees,id',
            'month' => 'required|date_format:Y-m',
            'gross_amount' => 'required|numeric|min:0',
            'tax_amount' => 'nullable|numeric|min:0',
            'bonus' => 'nullable|numeric|min:0',
            'deductions' => 'nullable|numeric|min:0',
            'status' => 'nullable|in:pending,paid,cancelled',
            'payment_date' => 'nullable|date',
            'payment_method' => 'nullable|in:cash,check,transfer,other',
            'notes' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        // Check if salary already exists for this employee and month
        $existingSalary = Salary::where('employee_id', $request->employee_id)
            ->where('month', $request->month)
            ->first();

        if ($existingSalary) {
            return response()->json([
                'success' => false,
                'message' => 'Salary record already exists for this employee and month'
            ], 422);
        }

        // Calculate net amount
        $grossAmount = $request->gross_amount;
        $taxAmount = $request->tax_amount ?? 0;
        $bonus = $request->bonus ?? 0;
        $deductions = $request->deductions ?? 0;
        $netAmount = $grossAmount - $taxAmount + $bonus - $deductions;

        $salary = Salary::create([
            'employee_id' => $request->employee_id,
            'month' => $request->month,
            'gross_amount' => $grossAmount,
            'net_amount' => $netAmount,
            'tax_amount' => $taxAmount,
            'bonus' => $bonus,
            'deductions' => $deductions,
            'status' => $request->status ?? 'pending',
            'payment_date' => $request->payment_date,
            'payment_method' => $request->payment_method,
            'notes' => $request->notes,
            'processed_by' => auth()->id()
        ]);

        $salary->load(['employee']);
        $employeeUser = User::where('employee_id', $salary->employee_id)->first();
        if ($employeeUser && $salary->status === 'paid') {
            NotificationController::createNotification(
                $employeeUser->id,
                'salary',
                'Bulletin de paie disponible',
                'Le bulletin de paie de ' . Carbon::parse($salary->month . '-01')->format('F Y') . ' est maintenant disponible. Vous pouvez le consulter et le télécharger.',
                '/salaries',
                $salary->id,
                Salary::class
            );
        }

        return response()->json([
            'success' => true,
            'data' => $salary->load(['employee', 'processor']),
            'message' => 'Salary created successfully'
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Salary $salary)
    {
        $salary->load(['employee', 'processor']);

        return response()->json([
            'success' => true,
            'data' => $salary,
            'message' => 'Salary retrieved successfully'
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Salary $salary)
    {
        // Only allow updates for pending salaries
        if ($salary->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Cannot update a processed salary'
            ], 422);
        }

        $validator = Validator::make($request->all(), [
            'gross_amount' => 'sometimes|numeric|min:0',
            'tax_amount' => 'nullable|numeric|min:0',
            'bonus' => 'nullable|numeric|min:0',
            'deductions' => 'nullable|numeric|min:0',
            'status' => 'nullable|in:pending,paid,cancelled',
            'payment_date' => 'nullable|date',
            'payment_method' => 'nullable|in:cash,check,transfer,other',
            'notes' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        // Recalculate net amount if amounts changed
        $data = $request->all();
        if ($request->has('gross_amount')) {
            $grossAmount = $request->gross_amount;
            $taxAmount = $request->tax_amount ?? $salary->tax_amount;
            $bonus = $request->bonus ?? $salary->bonus;
            $deductions = $request->deductions ?? $salary->deductions;
            $data['net_amount'] = $grossAmount - $taxAmount + $bonus - $deductions;
        }

        $salary->update($data);

        return response()->json([
            'success' => true,
            'data' => $salary->load(['employee', 'processor']),
            'message' => 'Salary updated successfully'
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Salary $salary)
    {
        // Allow deletion of any salary
        $salary->delete();

        return response()->json([
            'success' => true,
            'message' => 'Salary deleted successfully'
        ]);
    }

    /**
     * Export monthly salaries to CSV.
     */
    public function exportMonthly(Request $request, $month)
    {
        $validator = Validator::make(['month' => $month], [
            'month' => 'required|date_format:Y-m'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $salaries = Salary::with(['employee'])
            ->where('month', $month)
            ->get();

        $csvData = [];
        $csvData[] = ['Employee ID', 'Employee Name', 'Gross Amount', 'Tax', 'Bonus', 'Deductions', 'Net Amount', 'Status', 'Payment Date'];

        foreach ($salaries as $salary) {
            $csvData[] = [
                $salary->employee->employee_id ?? 'N/A',
                $salary->employee->full_name ?? 'N/A',
                $salary->gross_amount,
                $salary->tax_amount,
                $salary->bonus,
                $salary->deductions,
                $salary->net_amount,
                $salary->status,
                $salary->payment_date
            ];
        }

        $filename = 'salaries_' . $month . '_export.csv';
        
        return response()->streamDownload(function () use ($csvData) {
            $handle = fopen('php://output', 'w');
            foreach ($csvData as $row) {
                fputcsv($handle, $row);
            }
            fclose($handle);
        }, $filename, ['Content-Type' => 'text/csv']);
    }

    /**
     * Generate payslip PDF for a salary.
     */
    public function generatePayslip(Request $request, Salary $salary)
    {
        $salary->load(['employee', 'employee.department', 'processor']);

        $payslipData = [
            'salary' => $salary,
            'employee' => $salary->employee,
            'department' => $salary->employee->department,
            'generated_date' => Carbon::now()->format('Y-m-d H:i:s'),
            'company_name' => 'ELEGANT ART STUDIO',
            'company_address' => '123 Rue Example, Casablanca, Maroc',
            'company_phone' => '+212 5XX-XXXXXX',
            'company_email' => 'contact@elegantartstudio.ma'
        ];

        if ($request->has('download') && $request->download === 'pdf') {
            $pdf = PDF::loadView('payslips.template', $payslipData);
            $monthName = Carbon::parse($salary->month . '-01')->format('F Y');
            return $pdf->download('bulletin_paie_' . $salary->employee->first_name . '_' . $salary->employee->last_name . '_' . $monthName . '.pdf');
        }

        return response()->json([
            'success' => true,
            'data' => $payslipData,
            'message' => 'Payslip generated successfully'
        ]);
    }

    /**
     * Get salary history for an employee.
     */
    public function history(Request $request, Employee $employee)
    {
        $salaries = Salary::where('employee_id', $employee->id)
            ->orderBy('month', 'desc')
            ->get();

        // Calculate totals
        $totalGross = $salaries->sum('gross_amount');
        $totalNet = $salaries->sum('net_amount');
        $totalTax = $salaries->sum('tax_amount');

        return response()->json([
            'success' => true,
            'data' => [
                'salaries' => $salaries,
                'totals' => [
                    'total_gross' => $totalGross,
                    'total_net' => $totalNet,
                    'total_tax' => $totalTax,
                    'count' => $salaries->count()
                ]
            ],
            'message' => 'Salary history retrieved successfully'
        ]);
    }

    /**
     * Get monthly payroll summary.
     */
    public function monthlyPayroll(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'month' => 'nullable|date_format:Y-m'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $month = $request->month ?? Carbon::now()->format('Y-m');

        $salaries = Salary::with(['employee'])
            ->where('month', $month)
            ->get();

        $totalGross = $salaries->sum('gross_amount');
        $totalNet = $salaries->sum('net_amount');
        $totalTax = $salaries->sum('tax_amount');
        $totalBonus = $salaries->sum('bonus');
        $totalDeductions = $salaries->sum('deductions');

        $paidCount = $salaries->where('status', 'paid')->count();
        $pendingCount = $salaries->where('status', 'pending')->count();

        return response()->json([
            'success' => true,
            'data' => [
                'month' => $month,
                'salaries' => $salaries,
                'summary' => [
                    'total_gross' => $totalGross,
                    'total_net' => $totalNet,
                    'total_tax' => $totalTax,
                    'total_bonus' => $totalBonus,
                    'total_deductions' => $totalDeductions,
                    'paid_count' => $paidCount,
                    'pending_count' => $pendingCount,
                    'total_employees' => $salaries->count()
                ]
            ],
            'message' => 'Monthly payroll retrieved successfully'
        ]);
    }

    /**
     * Get salary statistics.
     */
    public function statistics()
    {
        // Current month
        $currentMonth = Carbon::now()->format('Y-m');
        
        $currentSalaries = Salary::where('month', $currentMonth)->get();
        
        $currentMonthTotal = $currentSalaries->sum('net_amount');
        $currentMonthGross = $currentSalaries->sum('gross_amount');

        // Year to date
        $yearStart = Carbon::now()->startOfYear()->format('Y-m');
        
        $yearToDateSalaries = Salary::where('month', '>=', $yearStart)->get();
        
        $yearToDateTotal = $yearToDateSalaries->sum('net_amount');
        $yearToDateGross = $yearToDateSalaries->sum('gross_amount');

        // Average salary
        $averageSalary = Salary::avg('net_amount');

        // Highest and lowest
        $highestSalary = Salary::orderBy('net_amount', 'desc')->first();
        $lowestSalary = Salary::orderBy('net_amount', 'asc')->first();

        return response()->json([
            'success' => true,
            'data' => [
                'current_month' => [
                    'total_net' => $currentMonthTotal,
                    'total_gross' => $currentMonthGross,
                    'employee_count' => $currentSalaries->count()
                ],
                'year_to_date' => [
                    'total_net' => $yearToDateTotal,
                    'total_gross' => $yearToDateGross
                ],
                'averages' => [
                    'net_salary' => $averageSalary
                ],
                'highest' => $highestSalary ? [
                    'employee_id' => $highestSalary->employee_id,
                    'amount' => $highestSalary->net_amount
                ] : null,
                'lowest' => $lowestSalary ? [
                    'employee_id' => $lowestSalary->employee_id,
                    'amount' => $lowestSalary->net_amount
                ] : null
            ],
            'message' => 'Salary statistics retrieved successfully'
        ]);
    }

    /**
     * Get my salaries (current user's salaries).
     */
    public function mySalaries()
    {
        $user = auth()->user();
        $employee = $user->employee;
        
        if (!$employee) {
            return response()->json([
                'success' => false,
                'message' => 'Profil employé non trouvé'
            ], 403);
        }

        $salaries = Salary::where('employee_id', $employee->id)
            ->orderBy('month', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $salaries,
            'message' => 'Salaires récupérés avec succès'
        ]);
    }

    /**
     * Get my latest salary (current user's most recent salary).
     */
    public function mySalary()
    {
        $user = auth()->user();
        $employee = $user->employee;
        
        if (!$employee) {
            return response()->json([
                'success' => false,
                'message' => 'Profil employé non trouvé'
            ], 403);
        }

        $salary = Salary::where('employee_id', $employee->id)
            ->orderBy('month', 'desc')
            ->first();

        if (!$salary) {
            return response()->json([
                'success' => false,
                'message' => 'Aucun salaire trouvé'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $salary,
            'message' => 'Salaire récupéré avec succès'
        ]);
    }
}

