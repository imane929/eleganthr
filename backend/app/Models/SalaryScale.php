<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SalaryScale extends Model
{
    protected $fillable = [
        'position',
        'contract_type',
        'seniority_level',
        'min_salary',
        'max_salary',
        'mid_salary',
        'allowance_transport',
        'allowance_housing',
        'allowance_food',
        'is_active',
    ];

    protected $casts = [
        'min_salary' => 'decimal:2',
        'max_salary' => 'decimal:2',
        'mid_salary' => 'decimal:2',
        'allowance_transport' => 'decimal:2',
        'allowance_housing' => 'decimal:2',
        'allowance_food' => 'decimal:2',
        'seniority_level' => 'integer',
        'is_active' => 'boolean',
    ];

    public static function getScaleForPosition(string $position, string $contractType, int $seniorityYears): ?SalaryScale
    {
        return self::where('position', $position)
            ->where('contract_type', $contractType)
            ->where('seniority_level', '<=', $seniorityYears)
            ->orderBy('seniority_level', 'desc')
            ->first();
    }

    public static function getActiveScales()
    {
        return self::where('is_active', true)->get();
    }
}
