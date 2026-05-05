import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { 
    FiUsers, FiCalendar, FiDollarSign,
    FiTrendingUp, FiTrendingDown,
    FiClock, FiCheckCircle, FiXCircle, FiMoreHorizontal, FiDownload,
    FiPlus, FiArrowRight, FiEye, FiEdit2, FiTrash2, FiX
} from 'react-icons/fi';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';

const POLLING_INTERVAL = 5000;

const StatCard = ({ title, value, change, changeType, icon: Icon, iconBg, iconColor }) => (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50 transition-all duration-300 group">
        <div className="flex items-start justify-between mb-4">
            <div className={`w-12 h-12 ${iconBg} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <Icon className={`w-6 h-6 ${iconColor}`} />
            </div>
            {change !== undefined && change !== null && change !== 0 && (
                <div className={`flex items-center gap-1 text-sm font-semibold ${changeType === 'up' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {changeType === 'up' ? <FiTrendingUp /> : <FiTrendingDown />}
                    <span>{change > 0 ? '+' : ''}{change}%</span>
                </div>
            )}
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">{title}</p>
        <p className="text-2xl font-bold text-slate-800 dark:text-white">{value}</p>
    </div>
);

const Dashboard = () => {
    const { user, hasPermission, isAdmin, isRH, isResponsable } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({ 
        total_employees: 0, employee_change: 0,
        pending_leaves: 0, leaves_change: 0,
        monthly_absences: 0, absence_change: 0,
        total_salary: 0, salary_change: 0
    });
    const [departmentData, setDepartmentData] = useState([]);
    const [absenceTrend, setAbsenceTrend] = useState([]);
    const [leaveRequests, setLeaveRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [absenceFilter, setAbsenceFilter] = useState(6);
    const [openMenuId, setOpenMenuId] = useState(null);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [importing, setImporting] = useState(false);
    const fileInputRef = useRef(null);

    const fetchStats = useCallback(async () => {
        try {
            const statsRes = await api.get('/dashboard/stats');
            const statsData = statsRes.data.data || statsRes.data;
            setStats(prev => ({
                total_employees: statsData.employees?.total ?? prev.total_employees,
                employee_change: statsData.employees?.change ?? 0,
                pending_leaves: statsData.leave_requests?.pending ?? prev.pending_leaves,
                leaves_change: statsData.leave_requests?.change ?? 0,
                monthly_absences: statsData.absences?.this_month ?? prev.monthly_absences,
                absence_change: statsData.absences?.change ?? 0,
                total_salary: statsData.salary?.monthly_total ?? prev.total_salary,
                salary_change: statsData.salary?.change ?? 0
            }));
        } catch (err) {
            console.error('Error fetching stats:', err);
        }
    }, []);

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImporting(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await api.post('/employees/import/csv', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (response.data.success) {
                alert(`Import successful: ${response.data.imported_count} employees imported`);
                fetchStats();
            }
        } catch (err) {
            console.error('Import error:', err);
            alert('Failed to import employees');
        } finally {
            setImporting(false);
            e.target.value = '';
        }
    };

    const fetchDepartmentData = useCallback(async () => {
        try {
            const deptRes = await api.get('/dashboard/department-distribution');
            const deptData = deptRes.data.data;
            
            let formattedData = [];
            if (deptData && deptData.labels && Array.isArray(deptData.labels)) {
                formattedData = deptData.labels.map((name, index) => ({
                    id: index,
                    name: name,
                    employees_count: deptData.datasets?.[0]?.data?.[index] || 0,
                    color: ['#6366f1', '#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#ec4899'][index % 8]
                }));
            } else if (Array.isArray(deptData)) {
                formattedData = deptData.map((dept, index) => ({
                    id: dept.id || index,
                    name: dept.name,
                    employees_count: dept.employees_count || dept.count || 0,
                    color: ['#6366f1', '#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#ec4899'][index % 8]
                }));
            }
            setDepartmentData(formattedData);
        } catch (err) {
            console.error('Error fetching department data:', err);
        }
    }, []);

    const fetchAbsenceTrend = useCallback(async (months = 6) => {
        try {
            const absenceRes = await api.get(`/dashboard/absence-trends?months=${months}`);
            const absenceData = absenceRes.data.data;
            if (absenceData && Array.isArray(absenceData.labels)) {
                setAbsenceTrend(absenceData.labels.map((month, index) => ({
                    month: month,
                    absences: absenceData.datasets?.[0]?.data?.[index] || 0
                })));
            } else if (Array.isArray(absenceData)) {
                setAbsenceTrend(absenceData);
            }
        } catch (err) {
            console.error('Error fetching absence trends:', err);
        }
    }, []);

    const fetchLeaveRequests = useCallback(async () => {
        try {
            const leaveRes = await api.get('/dashboard/latest-leave-requests');
            const data = leaveRes.data.data;
            if (Array.isArray(data)) {
                setLeaveRequests(data);
            } else if (data?.data && Array.isArray(data.data)) {
                setLeaveRequests(data.data);
            }
        } catch (err) {
            console.error('Error fetching leave requests:', err);
        }
    }, []);

    const fetchDashboardData = useCallback(async () => {
        setLoading(true);
        await Promise.all([
            fetchStats(),
            fetchDepartmentData(),
            fetchAbsenceTrend(absenceFilter),
            fetchLeaveRequests()
        ]);
        setLoading(false);
    }, [fetchStats, fetchDepartmentData, fetchAbsenceTrend, fetchLeaveRequests, absenceFilter]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    useEffect(() => {
        const interval = setInterval(() => {
            fetchStats();
            fetchLeaveRequests();
            fetchDepartmentData();
        }, POLLING_INTERVAL);
        return () => clearInterval(interval);
    }, [fetchStats, fetchLeaveRequests, fetchDepartmentData]);

    useEffect(() => {
        fetchAbsenceTrend(absenceFilter);
    }, [absenceFilter, fetchAbsenceTrend]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.menu-dropdown')) {
                setOpenMenuId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleViewDetails = (request) => {
        setSelectedRequest(request);
        setShowModal(true);
        setOpenMenuId(null);
    };

    const handleEdit = (id) => {
        setOpenMenuId(null);
        navigate(`/leave-requests/${id}/edit`);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cette demande de congés?')) {
            try {
                await api.delete(`/leave-requests/${id}`);
                await Promise.all([fetchStats(), fetchLeaveRequests()]);
            } catch (err) {
                alert(err.response?.data?.message || 'Erreur lors de la suppression');
            }
        }
        setOpenMenuId(null);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(amount || 0);
    };

    const getStatusBadge = (status) => {
        const styles = {
            pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
            approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
            rejected: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
        };
        const labels = { pending: 'En attente', approved: 'Approuvé', rejected: 'Refusé' };
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${styles[status] || styles.pending}`}>
                {labels[status] || status}
            </span>
        );
    };

    const handleApprove = async (id) => {
        try {
            await api.post(`/leave-requests/${id}/approve`);
            await Promise.all([fetchStats(), fetchLeaveRequests()]);
        } catch (err) {
            alert(err.response?.data?.message || 'Erreur lors de l\'approbation de la demande');
        }
    };

    const handleReject = async (id) => {
        try {
            await api.post(`/leave-requests/${id}/reject`);
            await Promise.all([fetchStats(), fetchLeaveRequests()]);
        } catch (err) {
            alert(err.response?.data?.message || 'Erreur lors du rejet de la demande');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white">
                        Bienvenue, {user?.name || 'Utilisateur'}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Voici ce qui se passe dans votre entreprise aujourd'hui
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".csv"
                        className="hidden"
                    />
                    <button 
                        onClick={handleImportClick}
                        disabled={importing}
                        className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                    >
                        <FiDownload size={20} />
                    </button>
                    <Link to="/employees/new" className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/25">
                        <FiPlus size={20} />
                        <span>Nouvel employé</span>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link to="/employees">
                    <StatCard 
                        title="Total Employés" 
                        value={stats?.total_employees || 0} 
                        change={stats?.employee_change}
                        changeType={stats?.employee_change >= 0 ? 'up' : 'down'}
                        icon={FiUsers}
                        iconBg="bg-indigo-100 dark:bg-indigo-900/30"
                        iconColor="text-indigo-600 dark:text-indigo-400"
                    />
                </Link>
                <Link to="/leave-requests?status=pending">
                    <StatCard 
                        title="Congés en attente" 
                        value={stats?.pending_leaves ?? 0} 
                        change={stats?.leaves_change}
                        changeType={stats?.leaves_change >= 0 ? 'up' : 'down'}
                        icon={FiClock}
                        iconBg="bg-amber-100 dark:bg-amber-900/30"
                        iconColor="text-amber-600 dark:text-amber-400"
                    />
                </Link>
                <Link to="/absences">
                    <StatCard 
                        title="Absences ce mois" 
                        value={stats?.monthly_absences ?? 0} 
                        change={stats?.monthly_absences > 0 ? stats?.absence_change : undefined}
                        changeType={stats?.absence_change >= 0 ? 'up' : 'down'}
                        icon={FiCalendar}
                        iconBg="bg-rose-100 dark:bg-rose-900/30"
                        iconColor="text-rose-600 dark:text-rose-400"
                    />
                </Link>
                <Link to="/salaries">
                    <StatCard 
                        title="Masse salariale" 
                        value={formatCurrency(stats?.total_salary)} 
                        change={stats?.salary_change}
                        changeType={stats?.salary_change >= 0 ? 'up' : 'down'}
                        icon={FiDollarSign}
                        iconBg="bg-emerald-100 dark:bg-emerald-900/30"
                        iconColor="text-emerald-600 dark:text-emerald-400"
                    />
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Tendances d'absences</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Taux d'absence moyen par mois</p>
                        </div>
                        <select 
                            className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400"
                            value={absenceFilter}
                            onChange={(e) => setAbsenceFilter(Number(e.target.value))}
                        >
                            <option value={3}>3 derniers mois</option>
                            <option value={6}>6 derniers mois</option>
                            <option value={12}>12 derniers mois</option>
                        </select>
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={absenceTrend}>
                                <defs>
                                    <linearGradient id="colorAbsences" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                                <Tooltip 
                                    contentStyle={{ 
                                        backgroundColor: '#1e293b', 
                                        border: 'none', 
                                        borderRadius: '12px',
                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                                    }}
                                    labelStyle={{ color: '#94a3b8' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Area type="monotone" dataKey="absences" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorAbsences)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700">
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Répartition par département</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Nombre d'employés par service</p>
                    </div>
                    <div className="h-48 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={departmentData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={70}
                                    paddingAngle={5}
                                    dataKey="employees_count"
                                    nameKey="name"
                                >
                                    {departmentData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color || ['#6366f1', '#8b5cf6', '#06b6d4', '#f59e0b', '#10b981'][index % 5]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="space-y-2 mt-4 max-h-48 overflow-y-auto">
                        {departmentData.map((dept, index) => (
                            <div key={dept.id || index} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: dept.color || ['#6366f1', '#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#ec4899'][index % 8] }}></div>
                                    <span className="text-sm text-slate-600 dark:text-slate-400">{dept.name}</span>
                                </div>
                                <span className="text-sm font-bold text-slate-800 dark:text-white">{dept.employees_count || 0}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Demandes de congés récentes</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Gérez les demandes en attente</p>
                    </div>
                    <Link to="/leave-requests" className="flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                        Voir tout <FiArrowRight />
                    </Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-900/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Employé</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Dates</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Durée</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Statut</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {leaveRequests.length > 0 ? leaveRequests.slice(0, 5).map((request) => (
                                <tr key={request.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                                                {request.employee?.first_name?.[0]}{request.employee?.last_name?.[0]}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-800 dark:text-white">
                                                    {request.employee?.first_name} {request.employee?.last_name}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{request.leave_type}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                                        {request.start_date ? request.start_date.split('T')[0] : '-'} - {request.end_date ? request.end_date.split('T')[0] : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{request.total_days || 1} jour{(request.total_days || 1) > 1 ? 's' : ''}</td>
                                    <td className="px-6 py-4">{getStatusBadge(request.status)}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {request.status === 'pending' && (isAdmin() || isRH() || isResponsable()) && (
                                                <>
                                                    <button 
                                                        onClick={() => handleApprove(request.id)}
                                                        className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors" 
                                                        title="Approuver"
                                                    >
                                                        <FiCheckCircle size={18} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleReject(request.id)}
                                                        className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors" 
                                                        title="Refuser"
                                                    >
                                                        <FiXCircle size={18} />
                                                    </button>
                                                </>
                                            )}
                                            <div className="relative menu-dropdown">
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setOpenMenuId(openMenuId === request.id ? null : request.id);
                                                    }}
                                                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                                >
                                                    {openMenuId === request.id ? <FiX size={18} /> : <FiMoreHorizontal size={18} />}
                                                </button>
                                                {openMenuId === request.id && (
                                                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-50 overflow-hidden">
                                                        <button
                                                            onClick={() => handleViewDetails(request)}
                                                            className="w-full px-4 py-2.5 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                                                        >
                                                            <FiEye size={16} />
                                                            Voir les détails
                                                        </button>
                                                        <button
                                                            onClick={() => handleEdit(request.id)}
                                                            className="w-full px-4 py-2.5 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                                                        >
                                                            <FiEdit2 size={16} />
                                                            Modifier
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(request.id)}
                                                            className="w-full px-4 py-2.5 text-left text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 flex items-center gap-2"
                                                        >
                                                            <FiTrash2 size={16} />
                                                            Supprimer
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                                        Aucune demande de congés récente
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && selectedRequest && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg overflow-hidden">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Détails de la demande</h3>
                            <button 
                                onClick={() => setShowModal(false)}
                                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                <FiX size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                                    {selectedRequest.employee?.first_name?.[0]}{selectedRequest.employee?.last_name?.[0]}
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-800 dark:text-white text-lg">
                                        {selectedRequest.employee?.first_name} {selectedRequest.employee?.last_name}
                                    </p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        {selectedRequest.employee?.position || 'N/A'}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 pt-4">
                                <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Type de congés</p>
                                    <p className="font-medium text-slate-800 dark:text-white">{selectedRequest.leave_type}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Statut</p>
                                    {getStatusBadge(selectedRequest.status)}
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Date de début</p>
                                    <p className="font-medium text-slate-800 dark:text-white">{selectedRequest.start_date.split('T')[0]}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Date de fin</p>
                                    <p className="font-medium text-slate-800 dark:text-white">{selectedRequest.end_date.split('T')[0]}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Durée</p>
                                    <p className="font-medium text-slate-800 dark:text-white">{selectedRequest.total_days || selectedRequest.days || 1} jour(s)</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Date de création</p>
                                    <p className="font-medium text-slate-800 dark:text-white">{selectedRequest.created_at.split('T')[0]}</p>
                                </div>
                            </div>

                            {selectedRequest.reason && (
                                <div className="pt-4">
                                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Raison</p>
                                    <p className="text-slate-700 dark:text-slate-300">{selectedRequest.reason}</p>
                                </div>
                            )}
                        </div>
                        <div className="p-6 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
                            <button 
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                Fermer
                            </button>
                            <Link 
                                to={`/leave-requests/${selectedRequest.id}/edit`}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                            >
                                Modifier
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
