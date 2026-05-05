<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Department extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'manager_id',
        'status'
    ];

    public function employees()
    {
        return $this->hasMany(Employee::class);
    }

    public function interns()
    {
        return $this->hasMany(Intern::class);
    }

    public function manager()
    {
        return $this->belongsTo(Employee::class, 'manager_id');
    }

    public function getEmployeeCountAttribute()
    {
        return $this->employees()->count();
    }
}