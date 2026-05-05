import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { 
    FiUsers, FiFileText, FiDollarSign, FiUserPlus, FiUserMinus,
    FiAlertCircle, FiCheckCircle, FiClock, FiCalendar, FiAward
} from 'react-icons/fi';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';

const StatCard = ({ title, value, subtitle, icon: Icon, iconBg, iconColor, link }) => {
    const content = (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50 transition-all duration-300 group">
            <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 ${iconBg} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-6 h-6 ${iconColor}`} />
                </div>
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

const RHDashboard = () => {
    const { user, isAdmin } = useAuth();
    const [rhStats, setRhStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchRHData = useCallback(async () => {
        try {
            const res = await api.get('/dashboard/rh');
            if (res.data.success) {
                setRhStats(res.data.data);
            }
        } catch (err) {
            console.error('Error fetching RH dashboard:', err);
        }
    }, []);

    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true);
            await fetchRHData();
            setLoading(false);
        };
        fetchAll();
    }, [fetchRHData]);

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
            fetchRHData();
        } catch (err) {
            alert('Erreur lors de l\'approbation');
        }
    };

    const handleReject = async (id) => {
        try {
            await api.post(`/leave-requests/${id}/reject`);
            fetchRHData();
        } catch (err) {
            alert('Erreur lors du rejet');
        }
    };

    const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#ef4444'];

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
                        Dashboard RH
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Gestion des ressources humaines
                    </p>
                </div>
            </div>

            {/* Stats Cards - Employee Management & Leave Requests */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard 
                    title="Total Employés" 
                    value={rhStats?.employees?.total || 0}
                    subtitle={`${rhStats?.employees?.active || 0} actifs`}
                    icon={FiUsers}
                    iconBg="bg-indigo-100 dark:bg-indigo-900/30"
                    iconColor="text-indigo-600 dark:text-indigo-400"
                    link="/employees"
                />
                <StatCard 
                    title="Congés en attente" 
                    value={rhStats?.pending?.leaves || 0}
                    subtitle="À traiter"
                    icon={FiCalendar}
                    iconBg="bg-amber-100 dark:bg-amber-900/30"
                    iconColor="text-amber-600 dark:text-amber-400"
                    link="/leave-requests?status=pending"
                />
                <StatCard 
                    title="Absences ce mois" 
                    value={rhStats?.absences?.this_month || 0}
                    icon={FiAlertCircle}
                    iconBg="bg-rose-100 dark:bg-rose-900/30"
                    iconColor="text-rose-600 dark:text-rose-400"
                    link="/absences"
                />
                <StatCard 
                    title="Primes en attente" 
                    value={rhStats?.pending?.bonuses || 0}
                    subtitle={`${rhStats?.bonuses?.approved_this_month || 0} approuvées`}
                    icon={FiAward}
                    iconBg="bg-purple-100 dark:bg-purple-900/30"
                    iconColor="text-purple-600 dark:text-purple-400"
                    link="/primes"
                />
            </div>

            {/* Salary & Compensation Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard 
                    title="Masse salariale" 
                    value={formatCurrency(rhStats?.salary?.monthly_total || 0)}
                    subtitle="Ce mois"
                    icon={FiDollarSign}
                    iconBg="bg-emerald-100 dark:bg-emerald-900/30"
                    iconColor="text-emerald-600 dark:text-emerald-400"
                    link="/salaries"
                />
                <StatCard 
                    title="Salaire Moyen" 
                    value={formatCurrency(rhStats?.salary?.average || 0)}
                    subtitle="Par employé"
                    icon={FiFileText}
                    iconBg="bg-blue-100 dark:bg-blue-900/30"
                    iconColor="text-blue-600 dark:text-blue-400"
                />
                <StatCard 
                    title="Avertissements" 
                    value={rhStats?.pending?.warnings || 0}
                    subtitle="En attente"
                    icon={FiAlertCircle}
                    iconBg="bg-red-100 dark:bg-red-900/30"
                    iconColor="text-red-600 dark:text-red-400"
                    link="/warnings"
                />
                <StatCard 
                    title="Rémunération" 
                    value="Gestion"
                    subtitle="Compensation"
                    icon={FiFileText}
                    iconBg="bg-cyan-100 dark:bg-cyan-900/30"
                    iconColor="text-cyan-600 dark:text-cyan-400"
                    link="/compensation"
                />
            </div>

            {/* Turnover and Contracts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                            <FiUserPlus className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800 dark:text-white">{rhStats?.turnover?.hired_this_year || 0}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Embauches cette année</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-rose-100 dark:bg-rose-900/30 rounded-xl flex items-center justify-center">
                            <FiUserMinus className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800 dark:text-white">{rhStats?.turnover?.left_this_year || 0}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Départs cette année</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Types de contrats</h3>
                    <div className="flex items-center gap-4">
                        <div className="h-32 w-32">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={rhStats?.contracts || []}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={35}
                                        outerRadius={55}
                                        paddingAngle={3}
                                        dataKey="count"
                                        nameKey="type"
                                    >
                                        {(rhStats?.contracts || []).map((entry, index) => (
                                            <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex-1 space-y-2">
                            {(rhStats?.contracts || []).map((contract, index) => (
                                <div key={index} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                        <span className="text-sm text-slate-600 dark:text-slate-400">{contract.type}</span>
                                    </div>
                                    <span className="font-bold text-slate-800 dark:text-white">{contract.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Department Chart - Department Overview */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700">
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Effectif par département</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Répartition des employés</p>
                </div>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={rhStats?.by_department || []} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                            <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} width={100} />
                            <Tooltip 
                                contentStyle={{ 
                                    backgroundColor: '#1e293b', 
                                    border: 'none', 
                                    borderRadius: '12px'
                                }}
                                labelStyle={{ color: '#fff' }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <Bar dataKey="count" name="Employés" fill="#6366f1" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Leave Requests Table */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Demandes de congés récentes</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Gérez les demandes en attente</p>
                    </div>
                    <Link to="/leave-requests" className="flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                        Voir tout →
                    </Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-900/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Employé</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Type</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Dates</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Statut</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {rhStats?.recent_leave_requests?.length > 0 ? rhStats.recent_leave_requests.slice(0, 5).map((request) => (
                                <tr key={request.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                                                {request.employee?.first_name?.[0]}{request.employee?.last_name?.[0]}
                                            </div>
                                            <p className="font-semibold text-slate-800 dark:text-white">
                                                {request.employee?.first_name} {request.employee?.last_name}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{request.leave_type}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                                        {request.start_date ? request.start_date.split('T')[0] : '-'} - {request.end_date ? request.end_date.split('T')[0] : '-'}
                                    </td>
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
                                                        <FiClock size={18} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
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

export default RHDashboard;