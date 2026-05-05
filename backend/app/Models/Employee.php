<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Employee extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'employees';

    protected $fillable = [
        'employee_id',
        'user_id',
        'first_name',
        'last_name',
        'email',
        'phone',
        'position',
        'department_id',
        'hire_date',
        'salary',
        'status',
        'contract_type',
        'nationality',
        'birth_date',
        'address',
        'city',
        'postal_code',
        'country',
        'emergency_contact_name',
        'emergency_contact_phone',
        // Compensation fields
        'base_salary',
        'currency',
        'transport_allowance',
        'housing_allowance',
        'food_allowance',
        'other_allowances',
        'seniority_bonus',
        'seniority_years',
        'salary_start_date'
    ];

    protected $casts = [
        'hire_date' => 'date',
        'birth_date' => 'date',
        'salary' => 'decimal:2',
        'base_salary' => 'decimal:2',
        'transport_allowance' => 'decimal:2',
        'housing_allowance' => 'decimal:2',
        'food_allowance' => 'decimal:2',
        'other_allowances' => 'decimal:2',
        'seniority_bonus' => 'decimal:2',
        'seniority_years' => 'integer',
        'salary_start_date' => 'date',
    ];

    protected $appends = ['full_name', 'remaining_vacation_days', 'total_salary', 'cost_to_company'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function leaveRequests()
    {
        return $this->hasMany(LeaveRequest::class);
    }

    public function absences()
    {
        return $this->hasMany(Absence::class);
    }

    public function salaries()
    {
        return $this->hasMany(Salary::class);
    }

    public function salaryHistories()
    {
        return $this->hasMany(SalaryHistory::class);
    }

    public function meritIncreases()
    {
        return $this->hasMany(MeritIncrease::class);
    }

    public function bonuses()
    {
        return $this->hasMany(EmployeeBonus::class);
    }

    public function getFullNameAttribute()
    {
        return $this->first_name . ' ' . $this->last_name;
    }

    public function getTotalSalaryAttribute(): float
    {
        return ($this->base_salary ?? 0)
            + ($this->transport_allowance ?? 0)
            + ($this->housing_allowance ?? 0)
            + ($this->food_allowance ?? 0)
            + ($this->other_allowances ?? 0)
            + ($this->seniority_bonus ?? 0);
    }

    public function getCostToCompanyAttribute(): float
    {
        $monthlySalary = $this->total_salary;
        
        // CNSS (employer contribution) - approximately 6.67%
        $cnss = $monthlySalary * 0.0667;
        
        // CIMR (retirement) - approximately 3%
        $cimr = $monthlySalary * 0.03;
        
        // Mutuelle (insurance) - approximately 2%
        $mutuelle = $monthlySalary * 0.02;
        
        // Annual bonus (one month salary)
        $annualBonus = $monthlySalary;
        
        // Annual cost
        $annualCost = ($monthlySalary + $cnss + $cimr + $mutuelle) * 12 + $annualBonus;
        
        return round($annualCost, 2);
    }

    public function getRemainingVacationDaysAttribute()
    {
        $totalVacationDays = 25; // Par défaut
        $usedVacationDays = $this->leaveRequests()
            ->where('leave_type', 'annual')
            ->where('status', 'approved')
            ->sum('total_days');
        
        return max(0, $totalVacationDays - $usedVacationDays);
    }

    // Scope pour les employés actifs
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    // Scope pour un département spécifique
    public function scopeInDepartment($query, $departmentId)
    {
        return $query->where('department_id', $departmentId);
    }
}