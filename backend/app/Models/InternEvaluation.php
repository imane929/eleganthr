<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InternEvaluation extends Model
{
    protected $fillable = [
        'intern_id',
        'evaluated_by',
        'month_number',
        'technical_skills',
        'communication',
        'teamwork',
        'initiative',
        'professionalism',
        'overall_score',
        'strengths',
        'areas_for_improvement',
        'comments',
        'status',
        'evaluation_date',
    ];

    protected $casts = [
        'technical_skills' => 'integer',
        'communication' => 'integer',
        'teamwork' => 'integer',
        'initiative' => 'integer',
        'professionalism' => 'integer',
        'overall_score' => 'decimal:1',
        'evaluation_date' => 'date',
    ];

    public function intern(): BelongsTo
    {
        return $this->belongsTo(Intern::class);
    }

    public function evaluatedBy(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'evaluated_by');
    }

    public function calculateOverallScore(): float
    {
        return round((
            $this->technical_skills +
            $this->communication +
            $this->teamwork +
            $this->initiative +
            $this->professionalism
        ) / 5, 1);
    }

    public function getGradeAttribute(): string
    {
        $score = $this->overall_score;
        if ($score >= 9) return 'Excellent';
        if ($score >= 7.5) return 'Très Bien';
        if ($score >= 6) return 'Bien';
        if ($score >= 5) return 'Passable';
        return 'Insuffisant';
    }

    public function scopeSubmitted($query)
    {
        return $query->where('status', 'submitted');
    }

    public function scopeDraft($query)
    {
        return $query->where('status', 'draft');
    }
}
