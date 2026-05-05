<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Controllers\API\NotificationController;
use App\Models\Intern;
use App\Models\InternEvaluation;
use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class InternController extends Controller
{
    // List all interns
    public function index(Request $request)
    {
        $query = Intern::with(['department', 'supervisor']);

        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->has('department_id')) {
            $query->where('department_id', $request->department_id);
        }

        if ($request->has('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('first_name', 'like', '%' . $request->search . '%')
                    ->orWhere('last_name', 'like', '%' . $request->search . '%')
                    ->orWhere('email', 'like', '%' . $request->search . '%')
                    ->orWhere('school_university', 'like', '%' . $request->search . '%');
            });
        }

        $interns = $query->orderBy('internship_end_date', 'asc')->paginate(10);

        return response()->json([
            'success' => true,
            'data' => $interns,
            'message' => 'Interns retrieved successfully'
        ]);
    }

    // Get active interns for dashboard
    public function getActiveInterns()
    {
        $interns = Intern::with(['department', 'supervisor'])
            ->where('status', 'active')
            ->orderBy('internship_end_date', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $interns
        ]);
    }

    // Get expiring soon interns
    public function getExpiringSoon()
    {
        $interns = Intern::with(['department'])
            ->where('status', 'active')
            ->where('internship_end_date', '<=', now()->addDays(30))
            ->orderBy('internship_end_date', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $interns,
            'count' => $interns->count()
        ]);
    }

    // Get intern statistics
    public function getStatistics()
    {
        $totalActive = Intern::where('status', 'active')->count();
        $expiringSoon = Intern::where('status', 'active')
            ->where('internship_end_date', '<=', now()->addDays(30))
            ->count();
        $completed = Intern::where('status', 'completed')->count();
        $converted = Intern::where('status', 'converted')->count();

        return response()->json([
            'success' => true,
            'data' => [
                'total_active' => $totalActive,
                'expiring_soon' => $expiringSoon,
                'completed' => $completed,
                'converted' => $converted
            ]
        ]);
    }

    // Create new intern
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|unique:interns,email',
            'phone' => 'nullable|string|max:20',
            'school_university' => 'nullable|string|max:255',
            'study_level' => 'nullable|string|max:50',
            'study_field' => 'nullable|string|max:255',
            'internship_start_date' => 'required|date',
            'internship_end_date' => 'required|date|after:internship_start_date',
            'academic_supervisor_name' => 'nullable|string|max:255',
            'academic_supervisor_email' => 'nullable|email',
            'academic_supervisor_phone' => 'nullable|string|max:20',
            'monthly_stipend' => 'nullable|numeric|min:0',
            'department_id' => 'nullable|exists:departments,id',
            'position' => 'nullable|string|max:255',
            'supervisor_id' => 'nullable|exists:employees,id',
            'notes' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $intern = Intern::create($request->all());

        return response()->json([
            'success' => true,
            'data' => $intern->load(['department', 'supervisor']),
            'message' => 'Intern created successfully'
        ], 201);
    }

    // Get single intern
    public function show(Intern $intern)
    {
        $intern->load(['department', 'supervisor', 'evaluations.evaluatedBy']);

        return response()->json([
            'success' => true,
            'data' => $intern
        ]);
    }

    // Update intern
    public function update(Request $request, Intern $intern)
    {
        $validator = Validator::make($request->all(), [
            'first_name' => 'sometimes|string|max:255',
            'last_name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:interns,email,' . $intern->id,
            'phone' => 'nullable|string|max:20',
            'school_university' => 'nullable|string|max:255',
            'study_level' => 'nullable|string|max:50',
            'study_field' => 'nullable|string|max:255',
            'internship_start_date' => 'sometimes|date',
            'internship_end_date' => 'sometimes|date',
            'academic_supervisor_name' => 'nullable|string|max:255',
            'academic_supervisor_email' => 'nullable|email',
            'academic_supervisor_phone' => 'nullable|string|max:20',
            'monthly_stipend' => 'nullable|numeric|min:0',
            'department_id' => 'nullable|exists:departments,id',
            'position' => 'nullable|string|max:255',
            'supervisor_id' => 'nullable|exists:employees,id',
            'status' => 'nullable|string|in:active,completed,converted',
            'notes' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $intern->update($request->all());

        return response()->json([
            'success' => true,
            'data' => $intern->load(['department', 'supervisor']),
            'message' => 'Intern updated successfully'
        ]);
    }

    // Terminate intern
    public function terminate(Request $request, Intern $intern)
    {
        $validator = Validator::make($request->all(), [
            'termination_reason' => 'required|string',
            'termination_date' => 'required|date'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $intern->update([
            'status' => 'terminated',
            'termination_reason' => $request->termination_reason,
            'termination_date' => $request->termination_date
        ]);

        return response()->json([
            'success' => true,
            'data' => $intern,
            'message' => 'Intern terminated successfully'
        ]);
    }

    // Complete intern
    public function complete(Intern $intern)
    {
        $intern->update(['status' => 'completed']);

        return response()->json([
            'success' => true,
            'data' => $intern,
            'message' => 'Internship marked as completed'
        ]);
    }

    // Convert intern to employee
    public function convertToEmployee(Request $request, Intern $intern)
    {
        $validator = Validator::make($request->all(), [
            'base_salary' => 'required|numeric|min:0',
            'position' => 'required|string|max:255',
            'department_id' => 'required|exists:departments,id',
            'hire_date' => 'required|date'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $employee = $intern->convertToEmployee([
            'base_salary' => $request->base_salary,
            'position' => $request->position,
            'department_id' => $request->department_id,
            'hire_date' => $request->hire_date
        ]);

        return response()->json([
            'success' => true,
            'data' => $employee,
            'message' => 'Intern converted to employee successfully'
        ]);
    }

    // Get evaluations for intern
    public function getEvaluations(Intern $intern)
    {
        $evaluations = $intern->evaluations()
            ->with('evaluatedBy')
            ->orderBy('evaluation_date', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $evaluations
        ]);
    }

    // Create evaluation
    public function storeEvaluation(Request $request, Intern $intern)
    {
        $validator = Validator::make($request->all(), [
            'month_number' => 'required|integer|min:1',
            'technical_skills' => 'required|integer|min:1|max:10',
            'communication' => 'required|integer|min:1|max:10',
            'teamwork' => 'required|integer|min:1|max:10',
            'initiative' => 'required|integer|min:1|max:10',
            'professionalism' => 'required|integer|min:1|max:10',
            'strengths' => 'nullable|string',
            'areas_for_improvement' => 'nullable|string',
            'comments' => 'nullable|string',
            'evaluation_date' => 'required|date'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        // Calculate overall score
        $overallScore = (
            $request->technical_skills +
            $request->communication +
            $request->teamwork +
            $request->initiative +
            $request->professionalism
        ) / 5;

        $evaluation = InternEvaluation::create([
            'intern_id' => $intern->id,
            'evaluated_by' => auth()->id(),
            'month_number' => $request->month_number,
            'technical_skills' => $request->technical_skills,
            'communication' => $request->communication,
            'teamwork' => $request->teamwork,
            'initiative' => $request->initiative,
            'professionalism' => $request->professionalism,
            'overall_score' => $overallScore,
            'strengths' => $request->strengths,
            'areas_for_improvement' => $request->areas_for_improvement,
            'comments' => $request->comments,
            'status' => 'submitted',
            'evaluation_date' => $request->evaluation_date
        ]);

        return response()->json([
            'success' => true,
            'data' => $evaluation,
            'message' => 'Evaluation submitted successfully'
        ]);
    }

    // Get all pending evaluations
    public function getPendingEvaluations()
    {
        $interns = Intern::where('status', 'active')
            ->with('department')
            ->get()
            ->map(function ($intern) {
                $currentMonth = Carbon::parse($intern->internship_start_date)->diffInMonths(now()) + 1;
                $hasEvaluation = $intern->evaluations()
                    ->where('month_number', $currentMonth)
                    ->exists();

                return [
                    'intern' => $intern,
                    'current_month' => $currentMonth,
                    'needs_evaluation' => !$hasEvaluation
                ];
            })
            ->filter(function ($item) {
                return $item['needs_evaluation'];
            });

        return response()->json([
            'success' => true,
            'data' => $interns->values()
        ]);
    }

    // Check and send expiration notifications
    public function checkExpiringInterns()
    {
        $expiringInterns = Intern::where('status', 'active')
            ->where('internship_end_date', '<=', now()->addDays(7))
            ->get();

        $notified = 0;
        foreach ($expiringInterns as $intern) {
            // Create notification for HR
            $hrUsers = \App\Models\User::role(['admin', 'rh'])->get();
            foreach ($hrUsers as $hrUser) {
                NotificationController::createNotification(
                    $hrUser->id,
                    'intern_expiring',
                    'Stage arrivant à échéance',
                    'Le stage de ' . $intern->full_name . ' prend fin le ' . Carbon::parse($intern->internship_end_date)->format('d/m/Y'),
                    '/interns',
                    $intern->id,
                    Intern::class
                );
            }
            $notified++;
        }

        return response()->json([
            'success' => true,
            'message' => "Notifications sent for {$notified} expiring interns"
        ]);
    }
}
