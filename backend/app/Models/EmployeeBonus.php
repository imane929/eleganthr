<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EmployeeBonus extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'bonus_type_id',
        'amount',
        'calculated_amount',
        'effective_date',
        'end_date',
        'status',
        'payment_status',
        'payment_date',
        'event_type',
        'justification',
        'attachment',
        'notes',
        'requested_by',
        'approved_by',
        'approved_at',
        'rejection_reason',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'calculated_amount' => 'decimal:2',
        'effective_date' => 'date',
        'end_date' => 'date',
        'payment_date' => 'date',
        'approved_at' => 'datetime',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function bonusType()
    {
        return $this->belongsTo(BonusType::class, 'bonus_type_id');
    }

    public function requestedBy()
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'approved')
            ->where('payment_status', 'unpaid');
    }

    public function scopePaid($query)
    {
        return $query->where('payment_status', 'paid');
    }
}
