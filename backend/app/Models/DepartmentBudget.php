<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DepartmentBudget extends Model
{
    protected $fillable = [
        'department_id',
        'year',
        'annual_budget',
        'allocated_q1',
        'allocated_q2',
        'allocated_q3',
        'allocated_q4',
        'notes',
    ];

    protected $casts = [
        'annual_budget' => 'decimal:2',
        'allocated_q1' => 'decimal:2',
        'allocated_q2' => 'decimal:2',
        'allocated_q3' => 'decimal:2',
        'allocated_q4' => 'decimal:2',
        'year' => 'integer',
    ];

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public static function getBudgetForDepartment(int $departmentId, int $year): ?DepartmentBudget
    {
        return self::where('department_id', $departmentId)
            ->where('year', $year)
            ->first();
    }

    public function getAllocatedTotal(): float
    {
        return $this->allocated_q1 + $this->allocated_q2 + $this->allocated_q3 + $this->allocated_q4;
    }

    public function getRemainingBudget(): float
    {
        return $this->annual_budget - $this->getAllocatedTotal();
    }
}
