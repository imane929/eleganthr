import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import {
    FiUser, FiCalendar, FiClock, FiCheckCircle, FiAlertCircle,
    FiCheckSquare, FiX, FiDollarSign, FiBell, FiTrendingUp,
    FiFileText, FiAlertTriangle, FiChevronRight, FiPlus, FiRefreshCw
} from 'react-icons/fi';

const StatCard = ({ title, value, subtitle, icon: Icon, iconBg, iconColor, onClick, link }) => {
    const content = (
        <div 
            className={`bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50 transition-all duration-300 group cursor-pointer ${onClick ? 'hover:border-indigo-300 dark:hover:border-indigo-700' : ''}`}
            onClick={onClick}
        >
            <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 ${iconBg} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-6 h-6 ${iconColor}`} />
                </div>
                {(link || onClick) && (
                    <FiChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                )}
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">{title}</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{value}</p>
            {subtitle && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{subtitle}</p>}
        </div>
    );

    if (link) {
        return <Link to={link}>{content}</Link>;
    }
    return content;
};

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(amount || 0);
};

const EmployeeDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [leaveRequests, setLeaveRequests] = useState([]);
    const [salary, setSalary] = useState(null);
    const [recentAbsences, setRecentAbsences] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchDashboardData = useCallback(async () => {
        setLoading(true);
        try {
            const [dashRes, salaryRes, absencesRes] = await Promise.all([
                api.get('/dashboard/employee'),
                api.get('/my-salary').catch(() => ({ data: null })),
                api.get('/my-absences').catch(() => ({ data: null }))
            ]);

            if (dashRes.data.success) {
                const data = dashRes.data.data;
                setStats(data);
                setLeaveRequests(data.leave_requests || []);
            }

            if (salaryRes.data?.success) {
                setSalary(salaryRes.data.data);
            }

            if (absencesRes.data?.success) {
                setRecentAbsences(absencesRes.data.data?.slice(0, 5) || []);
            } else if (dashRes.data.success && dashRes.data.data.absences?.recent) {
                setRecentAbsences(dashRes.data.data.absences.recent || []);
            }
        } catch (err) {
            console.error('Error fetching dashboard:', err);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

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

    const getLeaveTypeLabel = (type) => {
        const types = {
            annual: 'Congé annuel',
            sick: 'Maladie',
            personal: 'Congé personnel',
            maternity: 'Maternité',
            paternity: 'Paternité',
            unpaid: 'Sans solde',
        };
        return types[type] || type;
    };

    const pendingRequests = leaveRequests.filter(r => r.status === 'pending').length;
    const approvedRequests = leaveRequests.filter(r => r.status === 'approved').length;

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
                        Bonjour, {user?.name || 'Employé'}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Voici votre tableau de bord personnel
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={fetchDashboardData}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                        <FiRefreshCw size={18} />
                        Actualiser
                    </button>
                    <button
                        onClick={() => navigate('/leave-requests/new')}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all"
                    >
                        <FiPlus size={18} />
                        <span>Nouvelle demande</span>
                    </button>
                </div>
            </div>

            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center text-white font-bold text-2xl">
                        {user?.name?.[0] || 'U'}
                    </div>
                    <div className="flex-1">
                        <h2 className="text-xl font-bold">{stats?.employee?.name || user?.name}</h2>
                        <p className="text-white/80">
                            {stats?.employee?.position || 'Employé'} - {stats?.employee?.department || 'N/A'}
                        </p>
                        <span className="inline-block mt-1 px-2 py-0.5 bg-white/20 rounded text-xs font-medium">
                            {stats?.employee?.status === 'active' ? 'Actif' : 'Inactif'}
                        </span>
                    </div>
                    <div className="text-right">
                        <p className="text-white/60 text-sm">Solde de congés</p>
                        <p className="text-3xl font-bold">{stats?.leave_balance?.remaining || 0}</p>
                        <p className="text-white/60 text-sm">sur {stats?.leave_balance?.total || 0} jours</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Congés Restants"
                    value={stats?.leave_balance?.remaining || 0}
                    subtitle={`sur ${stats?.leave_balance?.total || 0} jours`}
                    icon={FiCheckSquare}
                    iconBg="bg-indigo-100 dark:bg-indigo-900/30"
                    iconColor="text-indigo-600 dark:text-indigo-400"
                    link="/leave-requests"
                />
                <StatCard
                    title="Congés Utilisés"
                    value={stats?.leave_balance?.used || 0}
                    subtitle="cette année"
                    icon={FiX}
                    iconBg="bg-purple-100 dark:bg-purple-900/30"
                    iconColor="text-purple-600 dark:text-purple-400"
                    link="/leave-requests?status=approved"
                />
                <StatCard
                    title="Absences ce mois"
                    value={stats?.absences?.this_month || 0}
                    icon={FiAlertCircle}
                    iconBg="bg-rose-100 dark:bg-rose-900/30"
                    iconColor="text-rose-600 dark:text-rose-400"
                />
                <StatCard
                    title="En attente"
                    value={pendingRequests}
                    subtitle="demandes en attente"
                    icon={FiClock}
                    iconBg="bg-amber-100 dark:bg-amber-900/30"
                    iconColor="text-amber-600 dark:text-amber-400"
                    link="/leave-requests?status=pending"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Mes demandes de congés</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Historique de vos demandes</p>
                        </div>
                        <div className="flex gap-2">
                            <span className="px-2 py-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs rounded-full font-medium">
                                {pendingRequests} en attente
                            </span>
                            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs rounded-full font-medium">
                                {approvedRequests} approuvées
                            </span>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 dark:bg-slate-900/50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Dates</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Durée</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Statut</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {leaveRequests.length > 0 ? leaveRequests.slice(0, 5).map((request) => (
                                    <tr key={request.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                                            {getLeaveTypeLabel(request.leave_type)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                                            {request.start_date ? request.start_date.split('T')[0] : '-'} - {request.end_date ? request.end_date.split('T')[0] : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{request.total_days || 1} jour(s)</td>
                                        <td className="px-6 py-4">{getStatusBadge(request.status)}</td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-8 text-center text-slate-500">
                                            Aucune demande de congés
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="p-4 border-t border-slate-100 dark:border-slate-700">
                        <button 
                            onClick={() => navigate('/leave-requests')}
                            className="flex items-center justify-center gap-1 w-full text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                        >
                            Voir toutes mes demandes <FiChevronRight />
                        </button>
                    </div>
                </div>

                <div className="space-y-6">
                    {salary ? (
                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                                    <FiDollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Mon Salaire</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        {salary.month || new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                                    <span className="text-sm text-slate-500 dark:text-slate-400">Salaire Brut</span>
                                    <span className="font-bold text-slate-800 dark:text-white">{formatCurrency(salary.gross_amount)}</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                                    <span className="text-sm text-slate-500 dark:text-slate-400">Salaire Net</span>
                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(salary.net_amount)}</span>
                                </div>
                                <button 
                                    onClick={() => navigate('/my-payslip')}
                                    className="flex items-center justify-center gap-2 w-full py-2.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl text-sm font-medium hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors"
                                >
                                    <FiFileText size={16} />
                                    Voir le bulletin de paie
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                                    <FiDollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Mon Salaire</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Bulletin de paie</p>
                                </div>
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                                Aucun bulletin de paie disponible
                            </p>
                        </div>
                    )}

                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                                    <FiAlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Absences</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Ce mois</p>
                                </div>
                            </div>
                            <span className="text-2xl font-bold text-slate-800 dark:text-white">
                                {stats?.absences?.this_month || 0}
                            </span>
                        </div>
                        {recentAbsences.length > 0 ? (
                            <div className="space-y-2">
                                {recentAbsences.slice(0, 3).map((absence, index) => (
                                    <div key={index} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                                        <span className="text-sm text-slate-600 dark:text-slate-400">
                                            {absence.date.split('T')[0]}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                            absence.type === 'justified' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                            absence.type === 'unjustified' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' :
                                            'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                                        }`}>
                                            {absence.type === 'justified' ? 'Justifiée' : absence.type === 'unjustified' ? 'Non justifiée' : 'Absence'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-2">
                                Aucune absence récente
                            </p>
                        )}
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                                <FiBell className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Actions rapides</h3>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <button 
                                onClick={() => navigate('/leave-requests/new')}
                                className="flex items-center gap-3 w-full p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                            >
                                <FiCalendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Nouvelle demande de congés</span>
                            </button>
                            <button 
                                onClick={() => navigate('/notifications')}
                                className="flex items-center gap-3 w-full p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                            >
                                <FiBell className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Mes notifications</span>
                            </button>
                            <button 
                                onClick={() => navigate('/leave-requests')}
                                className="flex items-center gap-3 w-full p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                                <FiFileText className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Mes demandes de congés</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button 
                    onClick={() => navigate('/leave-requests?status=pending')}
                    className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700 flex items-center gap-4 hover:shadow-md hover:border-amber-200 transition-all"
                >
                    <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                        <FiClock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="text-left">
                        <p className="text-2xl font-bold text-slate-800 dark:text-white">{pendingRequests}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Demandes en attente</p>
                    </div>
                </button>
                <button 
                    onClick={() => navigate('/leave-requests?status=approved')}
                    className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700 flex items-center gap-4 hover:shadow-md hover:border-emerald-200 transition-all"
                >
                    <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                        <FiCheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="text-left">
                        <p className="text-2xl font-bold text-slate-800 dark:text-white">{approvedRequests}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Congés approuvés</p>
                    </div>
                </button>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700 flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
                        <FiTrendingUp className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats?.leave_balance?.remaining || 0}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Jours de congés restants</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmployeeDashboard;
