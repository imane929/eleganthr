<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BonusType extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'description',
        'calculation_type',
        'default_value',
        'percentage_value',
        'formula',
        'is_taxable',
        'payment_frequency',
        'is_active',
    ];

    protected $casts = [
        'default_value' => 'decimal:2',
        'percentage_value' => 'decimal:2',
        'is_taxable' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function employeeBonuses()
    {
        return $this->hasMany(EmployeeBonus::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function calculateAmount($baseSalary = 0, $daysWorked = 0, $seniorityYears = 0)
    {
        switch ($this->calculation_type) {
            case 'fixed':
                return $this->default_value;
            case 'percentage':
                return ($baseSalary * ($this->percentage_value ?? 0)) / 100;
            case 'formula':
                if ($this->formula && $baseSalary > 0) {
                    $formula = str_replace(['{base_salary}', '{days_worked}', '{seniority_years}'], [$baseSalary, $daysWorked, $seniorityYears], $this->formula);
                    return eval('return ' . $formula . ';');
                }
                return 0;
            case 'tiered':
                return $this->getTieredAmount($seniorityYears);
            default:
                return $this->default_value;
        }
    }

    protected function getTieredAmount($seniorityYears)
    {
        $tiers = [
            ['min' => 0, 'max' => 2, 'value' => 100],
            ['min' => 2, 'max' => 5, 'value' => 200],
            ['min' => 5, 'max' => 10, 'value' => 350],
            ['min' => 10, 'max' => PHP_INT_MAX, 'value' => 500],
        ];

        foreach ($tiers as $tier) {
            if ($seniorityYears >= $tier['min'] && $seniorityYears < $tier['max']) {
                return $tier['value'];
            }
        }

        return $this->default_value;
    }
}
