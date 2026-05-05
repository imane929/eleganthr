<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Salary extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'month',
        'gross_amount',
        'net_amount',
        'tax_amount',
        'bonus',
        'deductions',
        'status',
        'payment_date',
        'payment_method',
        'notes',
        'payslip_path',
        'processed_by'
    ];

    protected $casts = [
        'gross_amount' => 'decimal:2',
        'net_amount' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'bonus' => 'decimal:2',
        'deductions' => 'decimal:2',
        'payment_date' => 'date'
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function processor()
    {
        return $this->belongsTo(User::class, 'processed_by');
    }
}