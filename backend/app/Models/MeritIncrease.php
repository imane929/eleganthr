<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MeritIncrease extends Model
{
    protected $fillable = [
        'employee_id',
        'current_salary',
        'proposed_increase_percent',
        'proposed_increase_amount',
        'new_salary',
        'status',
        'reason',
        'rejection_reason',
        'requested_by',
        'approved_by',
        'effective_date',
    ];

    protected $casts = [
        'current_salary' => 'decimal:2',
        'proposed_increase_percent' => 'decimal:2',
        'proposed_increase_amount' => 'decimal:2',
        'new_salary' => 'decimal:2',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function requestedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
