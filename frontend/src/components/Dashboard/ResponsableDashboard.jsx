import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { 
    FiUsers, FiCalendar, FiClock, FiCheckCircle, FiXCircle,
    FiMoreHorizontal, FiArrowRight, FiEye, FiEdit2, FiTrash2, FiX,
    FiHome
} from 'react-icons/fi';

const StatCard = ({ title, value, change, changeType, icon: Icon, iconBg, iconColor }) => (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50 transition-all duration-300 group">
        <div className="flex items-start justify-between mb-4">
            <div className={`w-12 h-12 ${iconBg} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <Icon className={`w-6 h-6 ${iconColor}`} />
            </div>
            {change && (
                <div className={`flex items-center gap-1 text-sm font-semibold ${changeType === 'up' ? 'text-emerald-600' : changeType === 'down' ? 'text-rose-600' : 'text-amber-600'}`}>
                    <span>{change}</span>
                </div>
            )}
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">{title}</p>
        <p className="text-2xl font-bold text-slate-800 dark:text-white">{value}</p>
    </div>
);

const ResponsableDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [leaveRequests, setLeaveRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openMenuId, setOpenMenuId] = useState(null);

    const fetchDashboardData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/dashboard/responsable');
            if (res.data.success) {
                const data = res.data.data;
                setStats({
                    department: data.department,
                    totalEmployees: data.employees?.total || 0,
                    activeEmployees: data.employees?.active || 0,
                    pendingLeaves: data.leave_requests?.pending || 0,
                    absencesThisMonth: data.absences?.this_month || 0
                });
                setLeaveRequests(data.recent_leave_requests || []);
            }
        } catch (err) {
            console.error('Error fetching dashboard:', err);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.menu-dropdown')) {
                setOpenMenuId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleApprove = async (id) => {
        try {
            await api.post(`/leave-requests/${id}/approve`);
            fetchDashboardData();
        } catch (err) {
            alert('Erreur lors de l\'approbation');
        }
    };

    const handleReject = async (id) => {
        try {
            await api.post(`/leave-requests/${id}/reject`);
            fetchDashboardData();
        } catch (err) {
            alert('Erreur lors du rejet');
        }
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
                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-1">
                        <FiHome size={16} />
                        <span>Mon Département</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white">
                        {stats?.department?.name || 'Département'}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Vue d'ensemble de votre équipe
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link to="/employees">
                    <StatCard 
                        title="Total Employés" 
                        value={stats?.totalEmployees || 0} 
                        icon={FiUsers}
                        iconBg="bg-indigo-100 dark:bg-indigo-900/30"
                        iconColor="text-indigo-600 dark:text-indigo-400"
                    />
                </Link>
                <Link to="/employees?status=active">
                    <StatCard 
                        title="Employés Actifs" 
                        value={stats?.activeEmployees || 0} 
                        icon={FiCheckCircle}
                        iconBg="bg-emerald-100 dark:bg-emerald-900/30"
                        iconColor="text-emerald-600 dark:text-emerald-400"
                    />
                </Link>
                <Link to="/leave-requests?status=pending">
                    <StatCard 
                        title="Congés en attente" 
                        value={stats?.pendingLeaves || 0} 
                        icon={FiClock}
                        iconBg="bg-amber-100 dark:bg-amber-900/30"
                        iconColor="text-amber-600 dark:text-amber-400"
                    />
                </Link>
                <Link to="/absences">
                    <StatCard 
                        title="Absences ce mois" 
                        value={stats?.absencesThisMonth || 0} 
                        icon={FiCalendar}
                        iconBg="bg-rose-100 dark:bg-rose-900/30"
                        iconColor="text-rose-600 dark:text-rose-400"
                    />
                </Link>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Demandes de congés</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Gérez les demandes de votre équipe</p>
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
                                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{request.total_days || 1} jour(s)</td>
                                    <td className="px-6 py-4">{getStatusBadge(request.status)}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {request.status === 'pending' && (
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
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                                        Aucune demande de congés
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ResponsableDashboard;
