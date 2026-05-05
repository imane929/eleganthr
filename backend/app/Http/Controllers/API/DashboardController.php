<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\LeaveRequest;
use App\Models\Absence;
use App\Models\Salary;
use App\Models\Department;
use App\Models\Intern;
use App\Models\LeavePolicy;
use Illuminate\Http\Request;
use Carbon\Carbon;

class DashboardController extends Controller
{
    /**
     * Get main dashboard statistics.
     */
    public function index(Request $request)
    {
        // Total employees
        $totalEmployees = Employee::count();
        $activeEmployees = Employee::where('status', 'active')->count();
        $inactiveEmployees = Employee::where('status', 'inactive')->count();

        // Pending leave requests
        $pendingLeaveRequests = LeaveRequest::where('status', 'pending')->count();

        // Monthly salary total (sum of net amounts for paid salaries)
        $currentMonth = Carbon::now()->format('Y-m');
        $monthlySalary = Salary::where('month', $currentMonth)
            ->where('status', 'paid')
            ->get()
            ->sum(function($s) {
                return ($s->gross_amount ?? 0) + ($s->bonus ?? 0) - ($s->tax_amount ?? 0) - ($s->deductions ?? 0);
            });

        // Recent leave requests
        $recentLeaveRequests = LeaveRequest::with(['employee'])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        // Absences this month
        $absencesThisMonth = Absence::whereMonth('date', Carbon::now()->month)
            ->whereYear('date', Carbon::now()->year)
            ->count();

        // Department distribution
        $departmentDistribution = Department::withCount('employees')
            ->get()
            ->map(function ($dept) {
                return [
                    'id' => $dept->id,
                    'name' => $dept->name,
                    'count' => $dept->employees_count
                ];
            });

        return response()->json([
            'success' => true,
            'data' => [
                'employees' => [
                    'total' => $totalEmployees,
                    'active' => $activeEmployees,
                    'inactive' => $inactiveEmployees
                ],
                'leave_requests' => [
                    'pending' => $pendingLeaveRequests
                ],
                'salary' => [
                    'monthly_total' => $monthlySalary
                ],
                'absences' => [
                    'this_month' => $absencesThisMonth
                ],
                'recent_leave_requests' => $recentLeaveRequests,
                'department_distribution' => $departmentDistribution
            ],
            'message' => 'Dashboard statistics retrieved successfully'
        ]);
    }

    /**
     * Get department distribution for charts.
     */
    public function departmentDistribution()
    {
        $departments = Department::withCount(['employees' => function ($query) {
            $query->where('status', 'active');
        }])->get();

        $labels = $departments->pluck('name');
        $data = $departments->pluck('employees_count');

        // Colors for chart
        $colors = [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
            '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'labels' => $labels,
                'datasets' => [
                    [
                        'label' => 'Employees by Department',
                        'data' => $data,
                        'backgroundColor' => $colors,
                        'borderWidth' => 1
                    ]
                ]
            ],
            'message' => 'Department distribution retrieved successfully'
        ]);
    }

    /**
     * Get absence trends for charts.
     */
    public function absenceTrends(Request $request)
    {
        $months = $request->months ?? 6;
        $startDate = Carbon::now()->subMonths($months - 1)->startOfMonth();
        $endDate = Carbon::now()->endOfMonth();

        $absences = Absence::selectRaw('MONTH(date) as month, YEAR(date) as year, COUNT(*) as count')
            ->whereBetween('date', [$startDate, $endDate])
            ->groupBy('month', 'year')
            ->orderBy('year')
            ->orderBy('month')
            ->get();

        $labels = [];
        $data = [];

        foreach ($absences as $absence) {
            $monthName = Carbon::createFromDate($absence->year, $absence->month)->format('M Y');
            $labels[] = $monthName;
            $data[] = $absence->count;
        }

        return response()->json([
            'success' => true,
            'data' => [
                'labels' => $labels,
                'datasets' => [
                    [
                        'label' => 'Absences',
                        'data' => $data,
                        'borderColor' => '#FF6384',
                        'backgroundColor' => 'rgba(255, 99, 132, 0.2)',
                        'fill' => true,
                        'tension' => 0.4
                    ]
                ]
            ],
            'message' => 'Absence trends retrieved successfully'
        ]);
    }

    /**
     * Get latest leave requests for dashboard.
     */
    public function latestLeaveRequests()
    {
        $leaveRequests = LeaveRequest::with(['employee', 'employee.department'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($request) {
                return [
                    'id' => $request->id,
                    'employee_name' => $request->employee ? $request->employee->full_name : 'N/A',
                    'department' => $request->employee && $request->employee->department 
                        ? $request->employee->department->name : 'N/A',
                    'leave_type' => $request->leave_type,
                    'start_date' => $request->start_date,
                    'end_date' => $request->end_date,
                    'total_days' => $request->total_days,
                    'status' => $request->status,
                    'created_at' => $request->created_at,
                    'reason' => $request->reason,
                    'employee' => $request->employee ? [
                        'id' => $request->employee->id,
                        'first_name' => $request->employee->first_name,
                        'last_name' => $request->employee->last_name,
                        'position' => $request->employee->position,
                        'full_name' => $request->employee->full_name,
                    ] : null
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $leaveRequests,
            'message' => 'Latest leave requests retrieved successfully'
        ]);
    }

    /**
     * Get salary trends.
     */
    public function salaryTrends(Request $request)
    {
        $months = $request->months ?? 6;
        
        $salaries = Salary::selectRaw('month, SUM(net_amount) as total')
            ->where('month', '>=', Carbon::now()->subMonths($months - 1)->format('Y-m'))
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        $labels = [];
        $data = [];

        foreach ($salaries as $salary) {
            $monthName = Carbon::createFromFormat('Y-m', $salary->month)->format('M Y');
            $labels[] = $monthName;
            $data[] = $salary->total;
        }

        return response()->json([
            'success' => true,
            'data' => [
                'labels' => $labels,
                'datasets' => [
                    [
                        'label' => 'Total Salaries',
                        'data' => $data,
                        'borderColor' => '#4BC0C0',
                        'backgroundColor' => 'rgba(75, 192, 192, 0.2)',
                        'fill' => true,
                        'tension' => 0.4
                    ]
                ]
            ],
            'message' => 'Salary trends retrieved successfully'
        ]);
    }

    /**
     * Get quick stats summary.
     */
    public function quickStats()
    {
        $today = Carbon::today();
        
        // Today's absences
        $todayAbsences = Absence::where('date', $today)->count();

        // Pending approvals
        $pendingLeaves = LeaveRequest::where('status', 'pending')->count();

        // New employees this month
        $newEmployees = Employee::whereMonth('hire_date', Carbon::now()->month)
            ->whereYear('hire_date', Carbon::now()->year)
            ->count();

        // Active departments
        $activeDepartments = Department::where('status', 'active')->count();

        return response()->json([
            'success' => true,
            'data' => [
                'today_absences' => $todayAbsences,
                'pending_leaves' => $pendingLeaves,
                'new_employees_this_month' => $newEmployees,
                'active_departments' => $activeDepartments
            ],
            'message' => 'Quick stats retrieved successfully'
        ]);
    }

    /**
     * Get Responsable Dashboard - department specific data.
     */
    public function responsableDashboard(Request $request)
    {
        $user = $request->user();
        $employee = $user->employee;
        
        if (!$employee || !$employee->department_id) {
            return response()->json([
                'success' => false,
                'message' => 'Vous n\'êtes assigné à aucun département'
            ], 403);
        }

        $departmentId = $employee->department_id;
        $department = Department::find($departmentId);

        // Employees in department
        $totalEmployees = Employee::where('department_id', $departmentId)->count();
        $activeEmployees = Employee::where('department_id', $departmentId)->where('status', 'active')->count();

        // Leave requests from department
        $pendingLeaves = LeaveRequest::whereHas('employee', function ($q) use ($departmentId) {
            $q->where('department_id', $departmentId);
        })->where('status', 'pending')->count();

        // Absences in department
        $absencesThisMonth = Absence::whereHas('employee', function ($q) use ($departmentId) {
            $q->where('department_id', $departmentId);
        })->whereMonth('date', Carbon::now()->month)
          ->whereYear('date', Carbon::now()->year)
          ->count();

        // Recent leave requests
        $recentLeaveRequests = LeaveRequest::with(['employee'])
            ->whereHas('employee', function ($q) use ($departmentId) {
                $q->where('department_id', $departmentId);
            })
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'department' => [
                    'id' => $department->id,
                    'name' => $department->name
                ],
                'employees' => [
                    'total' => $totalEmployees,
                    'active' => $activeEmployees
                ],
                'leave_requests' => [
                    'pending' => $pendingLeaves
                ],
                'absences' => [
                    'this_month' => $absencesThisMonth
                ],
                'recent_leave_requests' => $recentLeaveRequests
            ],
            'message' => 'Responsable dashboard data retrieved successfully'
        ]);
    }

    /**
     * Get General Dashboard - all user types combined.
     */
    public function generalDashboard()
    {
        $totalEmployees = Employee::count();
        $totalInterns = \App\Models\Intern::count();
        $totalUsers = \App\Models\User::count();

        $activeEmployees = Employee::where('status', 'active')->count();
        $activeInterns = \App\Models\Intern::where('status', 'active')->count();

        // Monthly new hires
        $newEmployees = Employee::whereMonth('hire_date', Carbon::now()->month)
            ->whereYear('hire_date', Carbon::now()->year)
            ->count();
        $newInterns = \App\Models\Intern::whereMonth('start_date', Carbon::now()->month)
            ->whereYear('start_date', Carbon::now()->year)
            ->count();

        // Distribution by type
        $userDistribution = [
            ['type' => 'Employees', 'count' => $totalEmployees, 'active' => $activeEmployees],
            ['type' => 'Interns', 'count' => $totalInterns, 'active' => $activeInterns]
        ];

        // By department
        $departmentDistribution = Department::withCount('employees')
            ->withCount('interns')
            ->get()
            ->map(function ($dept) {
                return [
                    'id' => $dept->id,
                    'name' => $dept->name,
                    'employees_count' => $dept->employees_count,
                    'interns_count' => $dept->interns_count
                ];
            });

        return response()->json([
            'success' => true,
            'data' => [
                'totals' => [
                    'employees' => $totalEmployees,
                    'interns' => $totalInterns,
                    'users' => $totalUsers,
                    'new_employees_this_month' => $newEmployees,
                    'new_interns_this_month' => $newInterns
                ],
                'active' => [
                    'employees' => $activeEmployees,
                    'interns' => $activeInterns
                ],
                'user_distribution' => $userDistribution,
                'department_distribution' => $departmentDistribution
            ],
            'message' => 'General dashboard data retrieved successfully'
        ]);
    }

    /**
     * Get Employee Dashboard - personal view.
     */
    public function employeeDashboard(Request $request)
    {
        $user = $request->user();
        $employee = $user->employee;
        
        if (!$employee) {
            return response()->json([
                'success' => false,
                'message' => 'Profil employé non trouvé'
            ], 403);
        }

        // My leave requests
        $myLeaveRequests = LeaveRequest::where('employee_id', $employee->id)
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        // My absences
        $myAbsences = Absence::where('employee_id', $employee->id)
            ->whereMonth('date', Carbon::now()->month)
            ->whereYear('date', Carbon::now()->year)
            ->count();

        // Get recent absences
        $recentAbsences = Absence::where('employee_id', $employee->id)
            ->orderBy('date', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($a) {
                return [
                    'id' => $a->id,
                    'date' => $a->date,
                    'type' => $a->type,
                    'status' => $a->status,
                    'reason' => $a->reason
                ];
            });

        // Calculate real leave balance
        $annualPolicy = LeavePolicy::where('leave_type', 'annual')->first();
        $totalAnnualLeave = $annualPolicy ? $annualPolicy->max_days : 20;

        $usedLeave = LeaveRequest::where('employee_id', $employee->id)
            ->where('leave_type', 'annual')
            ->where('status', 'approved')
            ->whereYear('start_date', Carbon::now()->year)
            ->sum('total_days');

        $pendingLeave = LeaveRequest::where('employee_id', $employee->id)
            ->where('leave_type', 'annual')
            ->where('status', 'pending')
            ->whereYear('start_date', Carbon::now()->year)
            ->sum('total_days');

        $remainingLeave = max(0, $totalAnnualLeave - $usedLeave);

        $leaveBalance = [
            'total' => $totalAnnualLeave,
            'used' => $usedLeave,
            'pending' => $pendingLeave,
            'remaining' => $remainingLeave
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'employee' => [
                    'id' => $employee->id,
                    'name' => $employee->full_name,
                    'department' => $employee->department?->name,
                    'position' => $employee->position,
                    'status' => $employee->status
                ],
                'leave_requests' => $myLeaveRequests,
                'absences' => [
                    'this_month' => $myAbsences,
                    'recent' => $recentAbsences
                ],
                'leave_balance' => $leaveBalance
            ],
            'message' => 'Employee dashboard data retrieved successfully'
        ]);
    }

    /**
     * Get RH Dashboard - HR focused metrics.
     */
    public function rhDashboard()
    {
        // Total employees
        $totalEmployees = Employee::count();
        $activeEmployees = Employee::where('status', 'active')->count();

        // Contract types distribution
        $contractTypes = Employee::select('contract_type')
            ->selectRaw('COUNT(*) as count')
            ->groupBy('contract_type')
            ->get()
            ->map(function ($emp) {
                return [
                    'type' => $emp->contract_type ?? 'Non défini',
                    'count' => $emp->count
                ];
            });

        // Turnover - employees who left this year
        $leftThisYear = Employee::whereYear('end_date', Carbon::now()->year)->count();
        $hiredThisYear = Employee::whereYear('hire_date', Carbon::now()->year)->count();

        // By department
        $byDepartment = Department::withCount('employees')
            ->get()
            ->map(function ($dept) {
                return [
                    'name' => $dept->name,
                    'count' => $dept->employees_count
                ];
            });

        // Pending requests
        $pendingLeaves = LeaveRequest::where('status', 'pending')->count();
        $pendingWarnings = \App\Models\Warning::where('status', 'pending')->count();

        // Absences this month
        $absencesThisMonth = Absence::whereMonth('date', Carbon::now()->month)
            ->whereYear('date', Carbon::now()->year)
            ->count();

        // Salary stats
        $currentMonth = Carbon::now()->format('Y-m');
        $totalSalary = Salary::where('month', $currentMonth)->sum('gross_amount');
        $avgSalary = Salary::where('month', $currentMonth)->avg('gross_amount');

        // Recent leave requests (pending first)
        $recentLeaveRequests = LeaveRequest::with(['employee'])
            ->orderBy('status', 'asc')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        // Bonuses/Primes stats
        $pendingBonuses = \App\Models\EmployeeBonus::where('status', 'pending')->count();
        $approvedBonuses = \App\Models\EmployeeBonus::where('status', 'approved')->count();

        return response()->json([
            'success' => true,
            'data' => [
                'employees' => [
                    'total' => $totalEmployees,
                    'active' => $activeEmployees
                ],
                'contracts' => $contractTypes,
                'turnover' => [
                    'hired_this_year' => $hiredThisYear,
                    'left_this_year' => $leftThisYear
                ],
                'by_department' => $byDepartment,
                'pending' => [
                    'leaves' => $pendingLeaves,
                    'warnings' => $pendingWarnings,
                    'bonuses' => $pendingBonuses
                ],
                'absences' => [
                    'this_month' => $absencesThisMonth
                ],
                'salary' => [
                    'monthly_total' => $totalSalary,
                    'average' => $avgSalary
                ],
                'bonuses' => [
                    'pending' => $pendingBonuses,
                    'approved_this_month' => $approvedBonuses
                ],
                'recent_leave_requests' => $recentLeaveRequests
            ],
            'message' => 'RH dashboard data retrieved successfully'
        ]);
    }

    /**
     * Get Department Analytics - cross-department comparison.
     */
    public function departmentAnalytics()
    {
        $departments = Department::withCount('employees')
            ->withCount('interns')
            ->get();

        $analytics = $departments->map(function ($dept) {
            // Absence rate
            $totalEmployees = $dept->employees_count;
            $absences = Absence::whereHas('employee', function ($q) use ($dept) {
                $q->where('department_id', $dept->id);
            })->whereMonth('date', Carbon::now()->month)
              ->whereYear('date', Carbon::now()->year)
              ->count();
            
            $absenceRate = $totalEmployees > 0 ? round(($absences / $totalEmployees) * 100, 1) : 0;

            // Pending leaves
            $pendingLeaves = LeaveRequest::whereHas('employee', function ($q) use ($dept) {
                $q->where('department_id', $dept->id);
            })->where('status', 'pending')->count();

            // Salary total
            $salaryTotal = Salary::whereHas('employee', function ($q) use ($dept) {
                $q->where('department_id', $dept->id);
            })->where('month', Carbon::now()->format('Y-m'))
              ->sum('gross_amount');

            return [
                'id' => $dept->id,
                'name' => $dept->name,
                'employees_count' => $dept->employees_count,
                'interns_count' => $dept->interns_count,
                'absences_this_month' => $absences,
                'absence_rate' => $absenceRate,
                'pending_leaves' => $pendingLeaves,
                'monthly_salary' => $salaryTotal
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $analytics,
            'message' => 'Department analytics retrieved successfully'
        ]);
    }
}

