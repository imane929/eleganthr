<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Controllers\API\NotificationController;
use App\Models\Absence;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class AbsenceController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Absence::with(['employee', 'recorder']);

        // Filter by status
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Filter by type
        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        // Filter by employee
        if ($request->has('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }

        // Filter by date range
        if ($request->has('start_date')) {
            $query->where('date', '>=', $request->start_date);
        }
        if ($request->has('end_date')) {
            $query->where('date', '<=', $request->end_date);
        }

        // Sort
        $sortBy = $request->sort_by ?? 'date';
        $sortOrder = $request->sort_order ?? 'desc';
        $allowedSorts = ['date', 'type', 'status', 'created_at'];
        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortOrder);
        }

        // Pagination
        $perPage = $request->per_page ?? 10;
        $absences = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $absences,
            'message' => 'Absences retrieved successfully'
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'employee_id' => 'required|exists:employees,id',
            'date' => 'required|date',
            'type' => 'required|in:justified,unjustified,sick,personal,other',
            'reason' => 'nullable|string',
            'status' => 'nullable|in:recorded,justified,unjustified'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        // Check for existing absence on same date
        $existingAbsence = Absence::where('employee_id', $request->employee_id)
            ->where('date', $request->date)
            ->first();

        if ($existingAbsence) {
            return response()->json([
                'success' => false,
                'message' => 'An absence record already exists for this employee on this date'
            ], 422);
        }

        $absence = Absence::create([
            'employee_id' => $request->employee_id,
            'date' => $request->date,
            'type' => $request->type,
            'reason' => $request->reason,
            'status' => $request->status ?? 'recorded',
            'recorded_by' => auth()->id()
        ]);

        $absence->load(['employee']);
        $hrUsers = User::role(['Admin', 'HR Manager'])->get();
        $typeLabel = [
            'justified' => 'justifiée',
            'unjustified' => 'non justifiée',
            'sick' => 'maladie',
            'personal' => 'personnel',
            'other' => 'autre'
        ];
        foreach ($hrUsers as $hrUser) {
            NotificationController::createNotification(
                $hrUser->id,
                'absence',
                'Nouvelle absence enregistrée',
                $absence->employee->first_name . ' ' . $absence->employee->last_name . ' est absent(e) le ' . Carbon::parse($absence->date)->format('d/m/Y') . ' (' . ($typeLabel[$absence->type] ?? $absence->type) . ')',
                '/absences',
                $absence->id,
                Absence::class
            );
        }

        return response()->json([
            'success' => true,
            'data' => $absence->load(['employee', 'recorder']),
            'message' => 'Absence recorded successfully'
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Absence $absence)
    {
        $absence->load(['employee', 'recorder']);

        return response()->json([
            'success' => true,
            'data' => $absence,
            'message' => 'Absence retrieved successfully'
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Absence $absence)
    {
        $validator = Validator::make($request->all(), [
            'date' => 'sometimes|date',
            'type' => 'sometimes|in:justified,unjustified,sick,personal,other',
            'reason' => 'nullable|string',
            'status' => 'sometimes|in:recorded,justified,unjustified'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $absence->update($request->all());

        return response()->json([
            'success' => true,
            'data' => $absence->load(['employee', 'recorder']),
            'message' => 'Absence updated successfully'
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Absence $absence)
    {
        $absence->delete();

        return response()->json([
            'success' => true,
            'message' => 'Absence deleted successfully'
        ]);
    }

    /**
     * Justify an absence.
     */
    public function justify(Request $request, Absence $absence)
    {
        $validator = Validator::make($request->all(), [
            'justification' => 'required|string',
            'attachment' => 'nullable|file|mimes:pdf,doc,docx,jpg,jpeg,png|max:2048'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $data = [
            'status' => 'justified',
            'reason' => $request->justification
        ];

        // Handle file attachment
        if ($request->hasFile('attachment')) {
            $data['attachment'] = $request->file('attachment')->store('absence_attachments', 'public');
        }

        $absence->update($data);

        return response()->json([
            'success' => true,
            'data' => $absence->load(['employee', 'recorder']),
            'message' => 'Absence justified successfully'
        ]);
    }

    /**
     * Get monthly absence report.
     */
    public function monthlyReport(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'month' => 'nullable|integer|min:1|max:12',
            'year' => 'nullable|integer|min:2020|max:2030'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $month = $request->month ?? Carbon::now()->month;
        $year = $request->year ?? Carbon::now()->year;

        $absences = Absence::with(['employee'])
            ->whereMonth('date', $month)
            ->whereYear('date', $year)
            ->orderBy('date')
            ->get();

        // Group by type
        $byType = $absences->groupBy('type')->map(function ($items) {
            return $items->count();
        });

        // Group by employee
        $byEmployee = $absences->groupBy('employee_id')->map(function ($items) {
            return [
                'count' => $items->count(),
                'employee' => $items->first()->employee
            ];
        });

        return response()->json([
            'success' => true,
            'data' => [
                'absences' => $absences,
                'by_type' => $byType,
                'by_employee' => $byEmployee,
                'total' => $absences->count(),
                'justified' => $absences->where('status', 'justified')->count(),
                'unjustified' => $absences->where('status', 'unjustified')->count()
            ],
            'message' => 'Monthly absence report generated successfully'
        ]);
    }

    /**
     * Get absence trends.
     */
    public function trends(Request $request)
    {
        $months = $request->months ?? 6;
        $startDate = Carbon::now()->subMonths($months - 1)->startOfMonth();
        $endDate = Carbon::now()->endOfMonth();

        $absences = Absence::whereBetween('date', [$startDate, $endDate])
            ->selectRaw('MONTH(date) as month, YEAR(date) as year, COUNT(*) as count')
            ->groupBy('month', 'year')
            ->orderBy('year')
            ->orderBy('month')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $absences,
            'message' => 'Absence trends retrieved successfully'
        ]);
    }

    /**
     * Get absence statistics.
     */
    public function statistics()
    {
        $totalAbsences = Absence::count();
        $justifiedAbsences = Absence::where('status', 'justified')->count();
        $unjustifiedAbsences = Absence::where('status', 'unjustified')->count();

        // Current month
        $currentMonth = Carbon::now()->month;
        $currentYear = Carbon::now()->year;
        
        $monthlyAbsences = Absence::whereMonth('date', $currentMonth)
            ->whereYear('date', $currentYear)
            ->count();

        // Most absent employees
        $mostAbsent = Absence::select('employee_id')
            ->groupBy('employee_id')
            ->orderByRaw('COUNT(*) DESC')
            ->limit(5)
            ->get()
            ->map(function ($item) {
                $employee = Employee::find($item->employee_id);
                return [
                    'employee_id' => $item->employee_id,
                    'employee_name' => $employee ? $employee->full_name : 'Unknown',
                    'count' => Absence::where('employee_id', $item->employee_id)->count()
                ];
            });

        return response()->json([
            'success' => true,
            'data' => [
                'total' => $totalAbsences,
                'justified' => $justifiedAbsences,
                'unjustified' => $unjustifiedAbsences,
                'monthly' => $monthlyAbsences,
                'most_absent' => $mostAbsent
            ],
            'message' => 'Absence statistics retrieved successfully'
        ]);
    }

    /**
     * Get my absences (current user's absences).
     */
    public function myAbsences()
    {
        $user = auth()->user();
        $employee = $user->employee;
        
        if (!$employee) {
            return response()->json([
                'success' => false,
                'message' => 'Profil employé non trouvé'
            ], 403);
        }

        $absences = Absence::where('employee_id', $employee->id)
            ->orderBy('date', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $absences,
            'message' => 'Absences récupérées avec succès'
        ]);
    }
}

