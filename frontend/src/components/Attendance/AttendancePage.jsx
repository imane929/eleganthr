import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { FiClock, FiLogOut, FiSearch, FiBarChart2 } from 'react-icons/fi';
import toast from 'react-hot-toast';

const AttendancePage = () => {
    const { isAdmin, isRH } = useAuth();
    const [attendances, setAttendances] = useState([]);
    const [stats, setStats] = useState(null);
    const [todayStatus, setTodayStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [clocking, setClocking] = useState(false);

    const isViewer = isAdmin() || isRH();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const endpoint = isViewer ? '/attendances' : '/my-attendances';
            const statsEndpoint = isViewer ? '/attendances/statistics' : '/my-attendances/statistics';

            const [attRes, statsRes, todayRes] = await Promise.all([
                api.get(endpoint, { params: { per_page: 50 } }).catch(err => {
                    toast.error('Échec du chargement des enregistrements');
                    return { data: { data: [] } };
                }),
                api.get(statsEndpoint).catch(err => {
                    return { data: { data: null } };
                }),
                api.get('/attendances/today').catch(() => ({ data: { data: null } }))
            ]);

            const attData = attRes.data.data;
            setAttendances(attData.data || attData || []);
            setStats(statsRes.data.data);
            setTodayStatus(todayRes.data.data);
        } catch (error) {
            toast.error('Échec du chargement des données de présence');
        } finally {
            setLoading(false);
        }
    };

    const handleClockIn = async () => {
        setClocking(true);
        try {
            await api.post('/attendances/clock-in');
            toast.success('Pointage effectué');
            loadData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Échec du pointage');
        } finally {
            setClocking(false);
        }
    };

    const handleClockOut = async () => {
        setClocking(true);
        try {
            await api.post('/attendances/clock-out');
            toast.success('Dépointage effectué');
            loadData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Échec du dépointage');
        } finally {
            setClocking(false);
        }
    };

    const statusColors = {
        present: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        absent: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
        late: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
        half_day: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
        excused: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    };

    const statusLabels = {
        present: 'Présent',
        absent: 'Absent',
        late: 'En retard',
        half_day: 'Demi-journée',
        excused: 'Excusé',
    };

    if (loading) return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

    return (
        <div className="p-4 sm:p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Présence</h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Suivez votre présence quotidienne</p>
            </div>

            {/* Clock In/Out */}
            <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500">Arrivée</p>
                            <p className="text-2xl font-bold text-slate-800 dark:text-white">{todayStatus?.check_in?.substring(0, 5) || '--:--'}</p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                            <FiClock className="text-green-600" />
                        </div>
                    </div>
                    {!todayStatus?.check_in && (
                        <button onClick={handleClockIn} disabled={clocking} className="mt-3 w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium disabled:opacity-50">
                            {clocking ? 'Traitement...' : 'Pointer'}
                        </button>
                    )}
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500">Départ</p>
                            <p className="text-2xl font-bold text-slate-800 dark:text-white">{todayStatus?.check_out?.substring(0, 5) || '--:--'}</p>
                        </div>
                        <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                            <FiLogOut className="text-red-600" />
                        </div>
                    </div>
                    {todayStatus?.check_in && !todayStatus?.check_out && (
                        <button onClick={handleClockOut} disabled={clocking} className="mt-3 w-full py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium disabled:opacity-50">
                            {clocking ? 'Traitement...' : 'Dépointer'}
                        </button>
                    )}
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500">Statut</p>
                            <p className="text-2xl font-bold text-slate-800 dark:text-white capitalize">{statusLabels[todayStatus?.status] || todayStatus?.status || 'N/D'}</p>
                        </div>
                        <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                            <FiBarChart2 className="text-indigo-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats */}
            {stats && (
                <div className="mb-6 grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {[
                        { label: 'Présent', value: stats.present, color: 'text-green-600' },
                        { label: 'Absent', value: stats.absent, color: 'text-red-600' },
                        { label: 'En retard', value: stats.late, color: 'text-yellow-600' },
                        { label: isViewer ? 'Demi-journée' : 'Heures', value: isViewer ? stats.half_day : (stats.total_work_hours ?? 0) + 'h', color: 'text-blue-600' },
                        { label: 'Taux', value: stats.attendance_rate + '%', color: 'text-indigo-600' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700 text-center">
                            <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                            <p className="text-xs text-slate-500">{stat.label}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Table */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="p-4">
                    <div className="relative">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="text" placeholder="Rechercher par date..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-slate-700 dark:text-white dark:border-slate-600" />
                    </div>
                </div>
                <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-slate-900/50">
                        <tr>
                            <th className="text-left p-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Date</th>
                            {isViewer && <th className="text-left p-3 text-sm font-semibold text-slate-600 dark:text-slate-300 hidden md:table-cell">Employé</th>}
                            <th className="text-left p-3 text-sm font-semibold text-slate-600 dark:text-slate-300 hidden sm:table-cell">Arrivée</th>
                            <th className="text-left p-3 text-sm font-semibold text-slate-600 dark:text-slate-300 hidden sm:table-cell">Départ</th>
                            <th className="text-left p-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Statut</th>
                        </tr>
                    </thead>
                    <tbody>
                        {attendances.filter(a => {
                            if (!search) return true;
                            const dateMatch = a.date?.includes(search);
                            const nameMatch = a.employee?.full_name?.toLowerCase().includes(search.toLowerCase());
                            return dateMatch || nameMatch;
                        }).map(att => (
                            <tr key={att.id} className="border-t border-slate-100 dark:border-slate-700">
                                <td className="p-3 text-sm text-slate-800 dark:text-white">{new Date(att.date).toLocaleDateString()}</td>
                                {isViewer && <td className="p-3 text-sm text-slate-600 dark:text-slate-300 hidden md:table-cell">{att.employee?.full_name || '-'}</td>}
                                <td className="p-3 text-sm text-slate-600 dark:text-slate-300 hidden sm:table-cell">{att.check_in?.substring(0, 5) || '-'}</td>
                                <td className="p-3 text-sm text-slate-600 dark:text-slate-300 hidden sm:table-cell">{att.check_out?.substring(0, 5) || '-'}</td>
                                <td className="p-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[att.status] || 'bg-gray-100 text-gray-800'}`}>{statusLabels[att.status] || att.status || '-'}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {attendances.length === 0 && <div className="p-8 text-center text-slate-500">Aucun enregistrement de présence</div>}
            </div>
        </div>
    );
};

export default AttendancePage;
