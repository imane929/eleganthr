<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SalaryHistory extends Model
{
    protected $fillable = [
        'employee_id',
        'base_salary',
        'transport_allowance',
        'housing_allowance',
        'food_allowance',
        'other_allowances',
        'total_salary',
        'change_type',
        'reason',
        'changed_by',
        'effective_date',
    ];

    protected $casts = [
        'base_salary' => 'decimal:2',
        'transport_allowance' => 'decimal:2',
        'housing_allowance' => 'decimal:2',
        'food_allowance' => 'decimal:2',
        'other_allowances' => 'decimal:2',
        'total_salary' => 'decimal:2',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function changedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changed_by');
    }
}
