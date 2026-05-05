<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Warning extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'issued_by',
        'manager_id',
        'warning_type',
        'severity',
        'incident_date',
        'warning_date',
        'description',
        'consequence',
        'attachment_path',
        'employee_acknowledged',
        'acknowledgment_date',
        'employee_signature',
        'expiry_date',
        'status',
        'resolution_notes',
        'resolved_date',
        'resolved_by'
    ];

    protected $casts = [
        'incident_date' => 'date',
        'warning_date' => 'date',
        'acknowledgment_date' => 'date',
        'expiry_date' => 'date',
        'resolved_date' => 'date',
        'employee_acknowledged' => 'boolean',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function issuer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'issued_by');
    }

    public function manager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'manager_id');
    }

    public function resolver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'resolved_by');
    }

    public static function getWarningTypeLabel($type): string
    {
        return match($type) {
            'verbal' => 'Avertissement verbal',
            'written' => 'Avertissement écrit',
            'final_written' => 'Avertissement écrit final',
            'suspension' => 'Avis de suspension',
            default => $type
        };
    }

    public static function getSeverityLabel($severity): string
    {
        return match($severity) {
            'low' => 'Faible',
            'medium' => 'Moyen',
            'high' => 'Élevé',
            'critical' => 'Critique',
            default => $severity
        };
    }

    public static function getStatusLabel($status): string
    {
        return match($status) {
            'active' => 'Actif',
            'expired' => 'Expiré',
            'cleared' => 'Effacé',
            default => $status
        };
    }

    public static function getProgressionLevel($warningType): int
    {
        return match($warningType) {
            'verbal' => 1,
            'written' => 2,
            'final_written' => 3,
            'suspension' => 4,
            default => 0
        };
    }
}
