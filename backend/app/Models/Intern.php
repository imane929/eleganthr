<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Intern extends Model
{
    protected $fillable = [
        'employee_id',
        'first_name',
        'last_name',
        'email',
        'phone',
        'school_university',
        'study_level',
        'study_field',
        'internship_start_date',
        'internship_end_date',
        'academic_supervisor_name',
        'academic_supervisor_email',
        'academic_supervisor_phone',
        'monthly_stipend',
        'agreement_document',
        'status',
        'termination_reason',
        'termination_date',
        'department_id',
        'position',
        'supervisor_id',
        'notes',
    ];

    protected $casts = [
        'internship_start_date' => 'date',
        'internship_end_date' => 'date',
        'termination_date' => 'date',
        'monthly_stipend' => 'decimal:2',
    ];

    protected $appends = ['full_name', 'days_remaining', 'is_expiring_soon'];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function supervisor(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'supervisor_id');
    }

    public function evaluations(): HasMany
    {
        return $this->hasMany(InternEvaluation::class, 'intern_id');
    }

    public function getFullNameAttribute(): string
    {
        return $this->first_name . ' ' . $this->last_name;
    }

    public function getDaysRemainingAttribute(): int
    {
        if (!$this->internship_end_date) return 0;
        return now()->diffInDays($this->internship_end_date, false);
    }

    public function getIsExpiringSoonAttribute(): bool
    {
        return $this->days_remaining <= 30 && $this->days_remaining > 0;
    }

    public function getDurationMonthsAttribute(): int
    {
        if (!$this->internship_start_date || !$this->internship_end_date) return 0;
        return $this->internship_start_date->diffInMonths($this->internship_end_date);
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function isExpiringSoon(): bool
    {
        return $this->is_expiring_soon;
    }

    public function convertToEmployee(array $employeeData): Employee
    {
        $this->update(['status' => 'converted']);

        return Employee::create([
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'email' => $this->email,
            'phone' => $this->phone,
            'department_id' => $this->department_id,
            'position' => $this->position,
            'hire_date' => now(),
            'contract_type' => 'CDI',
            'status' => 'active',
            'base_salary' => $employeeData['base_salary'] ?? 0,
            'currency' => 'MAD',
        ]);
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeExpiringSoon($query)
    {
        return $query->where('status', 'active')
            ->where('internship_end_date', '<=', now()->addDays(30));
    }
}
