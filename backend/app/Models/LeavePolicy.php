<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LeavePolicy extends Model
{
    protected $fillable = [
        'leave_type',
        'notice_period_days',
        'handover_threshold_days',
        'max_days',
        'requires_approval',
        'description',
    ];

    protected $casts = [
        'notice_period_days' => 'integer',
        'handover_threshold_days' => 'integer',
        'max_days' => 'integer',
        'requires_approval' => 'boolean',
    ];

    public static function getNoticePeriod(string $leaveType): int
    {
        $policy = self::where('leave_type', $leaveType)->first();
        return $policy ? $policy->notice_period_days : 0;
    }

    public static function getHandoverThreshold(string $leaveType): int
    {
        $policy = self::where('leave_type', $leaveType)->first();
        return $policy ? $policy->handover_threshold_days : 5;
    }

    public static function getAllPolicies()
    {
        return self::all();
    }

    public static function getPolicyOptions(): array
    {
        return [
            ['value' => 0, 'label' => 'Aucun'],
            ['value' => 1, 'label' => '1 jour'],
            ['value' => 3, 'label' => '3 jours'],
            ['value' => 5, 'label' => '5 jours'],
            ['value' => 7, 'label' => '7 jours'],
            ['value' => 14, 'label' => '14 jours'],
            ['value' => 30, 'label' => '30 jours'],
        ];
    }
}
