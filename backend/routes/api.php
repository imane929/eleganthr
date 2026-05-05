<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\BonusController;
use App\Http\Controllers\API\DashboardController;
use App\Http\Controllers\API\DepartmentController;
use App\Http\Controllers\API\EmployeeController;
use App\Http\Controllers\API\LeaveRequestController;
use App\Http\Controllers\API\AbsenceController;
use App\Http\Controllers\API\SalaryController;
use App\Http\Controllers\API\UserController;
use App\Http\Controllers\API\RoleController;
use App\Http\Controllers\API\PermissionController;
use App\Http\Controllers\API\ProfileController;
use App\Http\Controllers\API\NotificationController;
use App\Http\Controllers\API\LeavePolicyController;
use App\Http\Controllers\API\CompensationController;
use App\Http\Controllers\API\WarningController;
use App\Http\Controllers\API\InternController;

// Routes publiques (sans middleware CSRF/session pour API)
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);
Route::post('/logout', [AuthController::class, 'logout']);

// Dashboard (public for testing)
Route::get('/dashboard/stats', [DashboardController::class, 'index']);
Route::get('/dashboard/department-distribution', [DashboardController::class, 'departmentDistribution']);
Route::get('/dashboard/absence-trends', [DashboardController::class, 'absenceTrends']);
Route::get('/dashboard/latest-leave-requests', [DashboardController::class, 'latestLeaveRequests']);
Route::get('/dashboard/responsable', [DashboardController::class, 'responsableDashboard']);
Route::get('/dashboard/general', [DashboardController::class, 'generalDashboard']);
Route::get('/dashboard/employee', [DashboardController::class, 'employeeDashboard']);
Route::get('/dashboard/rh', [DashboardController::class, 'rhDashboard']);
Route::get('/dashboard/department-analytics', [DashboardController::class, 'departmentAnalytics']);

// Routes protégées (nécessitent authentification)
Route::middleware('auth:sanctum')->group(function () {
    // Employees
    Route::apiResource('employees', EmployeeController::class);
    Route::post('/employees/{employee}/restore', [EmployeeController::class, 'restore']);
    Route::get('/employees/export/csv', [EmployeeController::class, 'exportCsv']);
    
    // Departments
    Route::apiResource('departments', DepartmentController::class);
    Route::get('/departments/active', [DepartmentController::class, 'active']);
    
    // Leave Requests
    Route::apiResource('leave-requests', LeaveRequestController::class);
    Route::post('/leave-requests/{leaveRequest}/approve', [LeaveRequestController::class, 'approve']);
    Route::post('/leave-requests/{leaveRequest}/reject', [LeaveRequestController::class, 'reject']);
    Route::post('/leave-requests/{leaveRequest}/complete-handover', [LeaveRequestController::class, 'completeHandover']);
    Route::get('/my-leave-requests', [LeaveRequestController::class, 'myRequests']);
    
    // Absences
    Route::apiResource('absences', AbsenceController::class);
    Route::post('/absences/{absence}/justify', [AbsenceController::class, 'justify']);
    Route::get('/my-absences', [AbsenceController::class, 'myAbsences']);
    
    // Salaries
    Route::apiResource('salaries', SalaryController::class);
    Route::get('/salaries/export/monthly/{month}', [SalaryController::class, 'exportMonthly']);
    Route::post('/salaries/generate-payslip/{salary}', [SalaryController::class, 'generatePayslip']);
    Route::get('/my-salaries', [SalaryController::class, 'mySalaries']);
    Route::get('/my-salary', [SalaryController::class, 'mySalary']);
    
    // Users & Roles
    Route::apiResource('users', UserController::class);
    Route::apiResource('roles', RoleController::class);
    Route::apiResource('permissions', PermissionController::class);
    
    // Roles assignment
    Route::post('/users/{user}/assign-role', [UserController::class, 'assignRole']);
    Route::post('/users/{user}/remove-role', [UserController::class, 'removeRole']);
    
    // Profile
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::put('/profile', [ProfileController::class, 'update']);
    Route::post('/profile/change-password', [ProfileController::class, 'changePassword']);
    
    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::post('/notifications/mark-all-as-read', [NotificationController::class, 'markAllAsRead']);
    Route::post('/notifications/delete-all', [NotificationController::class, 'deleteAll']);
    Route::post('/notifications/{id}/mark-as-read', [NotificationController::class, 'markAsRead']);
    Route::delete('/notifications/{id}', [NotificationController::class, 'destroy']);
    
    // Leave Policies
    Route::get('/leave-policies', [LeavePolicyController::class, 'index']);
    Route::get('/leave-policies/{leaveType}', [LeavePolicyController::class, 'show']);
    Route::put('/leave-policies/{leaveType}', [LeavePolicyController::class, 'update']);
    Route::get('/leave-policies/{leaveType}/notice-period', [LeavePolicyController::class, 'getNoticePeriod']);
    
    // Compensation Management
    Route::get('/salary-scales', [CompensationController::class, 'getSalaryScales']);
    Route::get('/salary-scales/recommend', [CompensationController::class, 'getSalaryScale']);
    Route::put('/salary-scales/{id}', [CompensationController::class, 'updateSalaryScale']);
    
    Route::get('/employees/{employeeId}/compensation', [CompensationController::class, 'getEmployeeCompensation']);
    Route::put('/employees/{employeeId}/compensation', [CompensationController::class, 'updateEmployeeCompensation']);
    Route::get('/employees/{employeeId}/salary-history', [CompensationController::class, 'getSalaryHistory']);
    
    Route::post('/merit-increases', [CompensationController::class, 'requestMeritIncrease']);
    Route::get('/merit-increases', [CompensationController::class, 'getMeritIncreases']);
    Route::post('/merit-increases/{id}/approve', [CompensationController::class, 'approveMeritIncrease']);
    Route::post('/merit-increases/{id}/reject', [CompensationController::class, 'rejectMeritIncrease']);
    
    Route::get('/budget-vs-actual', [CompensationController::class, 'getBudgetVsActual']);
    Route::post('/department-budgets', [CompensationController::class, 'setDepartmentBudget']);
    Route::get('/department-budgets', [CompensationController::class, 'getDepartmentBudgets']);
    
    // Bonus & Allowance Management (Primes)
    Route::get('/bonus-types', [BonusController::class, 'getBonusTypes']);
    Route::post('/bonus-types', [BonusController::class, 'createBonusType']);
    Route::put('/bonus-types/{id}', [BonusController::class, 'updateBonusType']);
    Route::delete('/bonus-types/{id}', [BonusController::class, 'deleteBonusType']);
    
    Route::get('/bonuses', [BonusController::class, 'getEmployeeBonuses']);
    Route::post('/bonuses', [BonusController::class, 'assignBonus']);
    Route::post('/bonuses/bulk', [BonusController::class, 'bulkAssignBonus']);
    Route::post('/bonuses/bulk-department', [BonusController::class, 'bulkAssignByDepartment']);
    Route::post('/bonuses/{id}/approve', [BonusController::class, 'approveBonus']);
    Route::post('/bonuses/{id}/reject', [BonusController::class, 'rejectBonus']);
    Route::post('/bonuses/{id}/cancel', [BonusController::class, 'cancelBonus']);
    Route::post('/bonuses/{id}/mark-paid', [BonusController::class, 'markAsPaid']);
    Route::get('/bonuses/pending', [BonusController::class, 'getPendingApprovals']);
    Route::get('/bonuses/stats', [BonusController::class, 'getStats']);
    Route::get('/bonuses/report', [BonusController::class, 'getBonusReport']);
    Route::get('/bonuses/calculate-prorated', [BonusController::class, 'calculateProratedBonus']);
    Route::get('/employees/{employeeId}/bonuses', [BonusController::class, 'getEmployeeBonusHistory']);
    
    
    Route::post('/calculate-cost-to-company', [CompensationController::class, 'calculateCostToCompany']);
    
    // Intern Management
    Route::get('/interns', [InternController::class, 'index']);
    Route::get('/interns/active', [InternController::class, 'getActiveInterns']);
    Route::get('/interns/expiring-soon', [InternController::class, 'getExpiringSoon']);
    Route::get('/interns/statistics', [InternController::class, 'getStatistics']);
    Route::get('/interns/pending-evaluations', [InternController::class, 'getPendingEvaluations']);
    Route::post('/interns/check-expiring', [InternController::class, 'checkExpiringInterns']);
    Route::get('/interns/{intern}', [InternController::class, 'show']);
    Route::post('/interns', [InternController::class, 'store']);
    Route::put('/interns/{intern}', [InternController::class, 'update']);
    Route::post('/interns/{intern}/terminate', [InternController::class, 'terminate']);
    Route::post('/interns/{intern}/complete', [InternController::class, 'complete']);
    Route::post('/interns/{intern}/convert', [InternController::class, 'convertToEmployee']);
    Route::get('/interns/{intern}/evaluations', [InternController::class, 'getEvaluations']);
    Route::post('/interns/{intern}/evaluations', [InternController::class, 'storeEvaluation']);
    
    // Warnings/Disciplinary
    Route::apiResource('warnings', WarningController::class);
    Route::get('/warnings/employee', [WarningController::class, 'employeeWarnings']);
    Route::get('/warnings/{warning}/employee-warnings', [WarningController::class, 'employeeWarnings']);
    Route::get('/warnings/statistics', [WarningController::class, 'statistics']);
    Route::get('/warnings/{warning}/check-employee', [WarningController::class, 'checkEmployeeWarnings']);
    Route::post('/warnings/{warning}/acknowledge', [WarningController::class, 'acknowledge']);
    Route::post('/warnings/{warning}/resolve', [WarningController::class, 'resolve']);
    Route::get('/warnings/{warning}/letter', [WarningController::class, 'generateLetter']);
});
