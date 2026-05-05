<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\LeavePolicy;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class LeavePolicyController extends Controller
{
    public function index()
    {
        $policies = LeavePolicy::all();
        return response()->json([
            'success' => true,
            'data' => $policies,
            'message' => 'Leave policies retrieved successfully'
        ]);
    }

    public function show(string $leaveType)
    {
        $policy = LeavePolicy::where('leave_type', $leaveType)->first();
        
        if (!$policy) {
            return response()->json([
                'success' => false,
                'message' => 'Policy not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $policy,
            'message' => 'Policy retrieved successfully'
        ]);
    }

    public function update(Request $request, string $leaveType)
    {
        $policy = LeavePolicy::where('leave_type', $leaveType)->first();

        if (!$policy) {
            return response()->json([
                'success' => false,
                'message' => 'Policy not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'notice_period_days' => 'required|integer|min:0',
            'max_days' => 'nullable|integer|min:1',
            'requires_approval' => 'boolean',
            'description' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $policy->update($request->all());

        return response()->json([
            'success' => true,
            'data' => $policy,
            'message' => 'Policy updated successfully'
        ]);
    }

    public function getNoticePeriod(string $leaveType)
    {
        $noticeDays = LeavePolicy::getNoticePeriod($leaveType);
        return response()->json([
            'success' => true,
            'data' => [
                'leave_type' => $leaveType,
                'notice_period_days' => $noticeDays
            ]
        ]);
    }
}
