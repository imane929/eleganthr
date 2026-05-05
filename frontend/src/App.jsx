import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import NotificationContainer from './components/Notifications/NotificationContainer';
import Login from './components/Auth/Login';
import Dashboard from './components/Dashboard/Dashboard';
import EmployeeDashboard from './components/Dashboard/EmployeeDashboard';
import ResponsableDashboard from './components/Dashboard/ResponsableDashboard';
import RHDashboard from './components/Dashboard/RHDashboard';
import Layout from './components/Layout/Layout';
import EmployeeList from './components/Employees/EmployeeList';
import EmployeeForm from './components/Employees/EmployeeForm';
import EmployeeDetail from './components/Employees/EmployeeDetail';
import DepartmentList from './components/Departments/DepartmentList';
import DepartmentForm from './components/Departments/DepartmentForm';
import DepartmentDetail from './components/Departments/DepartmentDetail';
import LeaveRequestList from './components/LeaveRequests/LeaveRequestList';
import PrimesPage from './components/Primes/PrimesPage';
import AbsenceList from './components/Absences/AbsenceList';
import SalaryList from './components/Salaries/SalaryList';
import MyPayslipPage from './components/Salaries/MyPayslipPage';
import UserList from './components/Users/UserList';
import SettingsPage from './components/Settings/SettingsPage';
import NotificationsPage from './components/Notifications/NotificationsPage';
import InternList from './components/Interns/InternList';
import CompensationPage from './components/Compensation/CompensationPage';
import WarningList from './components/Warnings/WarningList';
import EmployeeDocuments from './components/Documents/EmployeeDocuments';
import DocumentsPage from './components/Documents/DocumentsPage';
import AttendancePage from './components/Attendance/AttendancePage';
import PerformancePage from './components/Performance/PerformancePage';
import RecruitmentPage from './components/Recruitment/RecruitmentPage';
import MyProfilePage from './components/Profile/MyProfilePage';

const ProtectedRoute = ({ children, requiredRole = null, requiredPermission = null }) => {
    const { isAuthenticated, loading, hasPermission: checkPermission, isAdmin, isRH, isEmployee, user } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-slate-600">Chargement...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    return children;
};

const DashboardRedirect = () => {
    const { isAdmin, isRH, isEmployee, isResponsable } = useAuth();
    
    if (isAdmin()) {
        return <Dashboard />;
    }
    if (isRH()) {
        return <RHDashboard />;
    }
    if (isResponsable()) {
        return <ResponsableDashboard />;
    }
    if (isEmployee()) {
        return <EmployeeDashboard />;
    }
    
    return <Dashboard />;
};

function AppRoutes() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/" element={
                <ProtectedRoute>
                    <Layout />
                </ProtectedRoute>
            }>
                <Route index element={<Navigate to="/dashboard" />} />
                
                <Route path="dashboard" element={<DashboardRedirect />} />
                
                <Route path="employees" element={
                    <ProtectedRoute requiredPermission="view_employees">
                        <EmployeeList />
                    </ProtectedRoute>
                } />
                <Route path="employees/new" element={
                    <ProtectedRoute requiredPermission="create_employees">
                        <EmployeeForm />
                    </ProtectedRoute>
                } />
                <Route path="employees/:id" element={
                    <ProtectedRoute requiredPermission="view_employees">
                        <EmployeeDetail />
                    </ProtectedRoute>
                } />
                <Route path="employees/:id/edit" element={
                    <ProtectedRoute requiredPermission="edit_employees">
                        <EmployeeForm />
                    </ProtectedRoute>
                } />
                
                <Route path="departments" element={
                    <ProtectedRoute requiredPermission="view_departments">
                        <DepartmentList />
                    </ProtectedRoute>
                } />
                <Route path="departments/new" element={
                    <ProtectedRoute requiredPermission="create_departments">
                        <DepartmentForm />
                    </ProtectedRoute>
                } />
                <Route path="departments/:id/edit" element={
                    <ProtectedRoute requiredPermission="edit_departments">
                        <DepartmentForm />
                    </ProtectedRoute>
                } />
                <Route path="departments/:id" element={
                    <ProtectedRoute requiredPermission="view_departments">
                        <DepartmentDetail />
                    </ProtectedRoute>
                } />
                
                <Route path="leave-requests" element={
                    <ProtectedRoute requiredPermission="view_leaves">
                        <LeaveRequestList />
                    </ProtectedRoute>
                } />
                
                <Route path="leave-requests/new" element={
                    <ProtectedRoute requiredPermission="view_leaves">
                        <LeaveRequestList isNew={true} />
                    </ProtectedRoute>
                } />
                
                <Route path="leave-requests/:id/edit" element={
                    <ProtectedRoute requiredPermission="view_leaves">
                        <LeaveRequestList isEdit={true} />
                    </ProtectedRoute>
                } />
                
                <Route path="absences" element={
                    <ProtectedRoute requiredPermission="view_absences">
                        <AbsenceList />
                    </ProtectedRoute>
                } />
                
                <Route path="salaries" element={
                    <ProtectedRoute requiredPermission="view_salaries">
                        <SalaryList />
                    </ProtectedRoute>
                } />
                
                <Route path="primes" element={
                    <ProtectedRoute requiredPermission="view_salaries">
                        <PrimesPage />
                    </ProtectedRoute>
                } />
                
                <Route path="users" element={
                    <ProtectedRoute requiredPermission="manage_users">
                        <UserList />
                    </ProtectedRoute>
                } />
                
                <Route path="settings" element={<SettingsPage />} />
                <Route path="profile" element={<MyProfilePage />} />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="interns" element={
                    <ProtectedRoute requiredRole={['Admin', 'HR Manager', 'Responsable']}>
                        <InternList />
                    </ProtectedRoute>
                } />
                
                <Route path="my-payslip" element={<MyPayslipPage />} />
                
                <Route path="compensation" element={
                    <ProtectedRoute requiredRole={['Admin', 'HR Manager']}>
                        <CompensationPage />
                    </ProtectedRoute>
                } />
                
                <Route path="warnings" element={
                    <ProtectedRoute requiredRole={['Admin', 'HR Manager']}>
                        <WarningList />
                    </ProtectedRoute>
                } />
                
                <Route path="employee-documents" element={
                    <ProtectedRoute requiredPermission="view_employees">
                        <EmployeeDocuments />
                    </ProtectedRoute>
                } />
                
                <Route path="documents" element={<DocumentsPage />} />
                
                <Route path="attendance" element={<AttendancePage />} />
                
                <Route path="performance" element={<PerformancePage />} />
                
                <Route path="recruitment" element={
                    <ProtectedRoute requiredRole={['Admin', 'HR Manager']}>
                        <RecruitmentPage />
                    </ProtectedRoute>
                } />
            </Route>
        </Routes>
    );
}

function App() {
    return (
        <Router>
            <AuthProvider>
                <NotificationProvider>
                    <NotificationContainer />
                    <AppRoutes />
                </NotificationProvider>
            </AuthProvider>
        </Router>
    );
}

export default App;
