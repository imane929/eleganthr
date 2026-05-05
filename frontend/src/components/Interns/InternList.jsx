import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { FiPlus, FiSearch, FiCalendar, FiBook, FiUser, FiCheck, FiX, FiClock, FiTrendingUp, FiEdit, FiTrash2 } from 'react-icons/fi';

const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return dateStr.split('T')[0];
};

const InternList = () => {
    const { hasPermission, isAdmin } = useAuth();
    const [interns, setInterns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [stats, setStats] = useState({ total_active: 0, expiring_soon: 0, completed: 0, converted: 0 });
    const [showModal, setShowModal] = useState(false);
    const [editIntern, setEditIntern] = useState(null);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        school_university: '',
        study_level: '',
        internship_start_date: '',
        internship_end_date: '',
        department_id: '',
        position: '',
        monthly_stipend: 0,
        status: 'active'
    });
    const [departments, setDepartments] = useState([]);

    useEffect(() => {
        fetchInterns();
        fetchStats();
        fetchDepartments();
    }, [search]);

    const fetchInterns = async () => {
        try {
            setLoading(true);
            const params = search ? `?search=${search}` : '';
            const response = await api.get(`/interns${params}`);
            const data = response.data.data?.data || response.data.data || [];
            setInterns(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error fetching interns:', err);
            setInterns([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await api.get('/interns/statistics');
            setStats(response.data.data);
        } catch (err) {
            console.error('Error fetching stats:', err);
        }
    };

    const fetchDepartments = async () => {
        try {
            const response = await api.get('/departments?status=active&per_page=100');
            let deptData = response.data?.data?.data || response.data?.data || [];
            
            if (!Array.isArray(deptData)) {
                deptData = [];
            }
            
            setDepartments(deptData);
        } catch (err) {
            console.error('Error fetching departments:', err);
            setDepartments([]);
        }
    };

    const handleComplete = async (id) => {
        if (!window.confirm('Marquer ce stage comme terminé?')) return;
        try {
            await api.post(`/interns/${id}/complete`);
            fetchInterns();
            fetchStats();
        } catch (err) {
            alert('Erreur');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce stagiaire?')) return;
        try {
            await api.delete(`/interns/${id}`);
            fetchInterns();
            fetchStats();
        } catch (err) {
            alert('Erreur lors de la suppression');
        }
    };

    const handleEdit = (intern) => {
        setEditIntern(intern);
        setFormData({
            first_name: intern.first_name || '',
            last_name: intern.last_name || '',
            email: intern.email || '',
            phone: intern.phone || '',
            school_university: intern.school_university || '',
            study_level: intern.study_level || '',
            internship_start_date: intern.internship_start_date || '',
            internship_end_date: intern.internship_end_date || '',
            department_id: intern.department_id || '',
            position: intern.position || '',
            monthly_stipend: intern.monthly_stipend || 0,
            status: intern.status || 'active'
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            let response;
            if (editIntern) {
                response = await api.put(`/interns/${editIntern.id}`, formData);
                setInterns(prev => prev.map(i => i.id === editIntern.id ? response.data.data : i));
            } else {
                response = await api.post('/interns', formData);
                setInterns(prev => [...prev, response.data.data]);
            }
            setShowModal(false);
            setEditIntern(null);
            setFormData({
                first_name: '',
                last_name: '',
                email: '',
                phone: '',
                school_university: '',
                study_level: '',
                internship_start_date: '',
                internship_end_date: '',
                department_id: '',
                position: '',
                monthly_stipend: 0,
                status: 'active'
            });
            fetchInterns();
            fetchStats();
            alert(editIntern ? 'Stagiaire mis à jour!' : 'Stagiaire ajouté avec succès!');
        } catch (err) {
            alert(err.response?.data?.message || 'Erreur lors de la création');
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setEditIntern(null);
        setFormData({
            first_name: '',
            last_name: '',
            email: '',
            phone: '',
            school_university: '',
            study_level: '',
            internship_start_date: '',
            internship_end_date: '',
            department_id: '',
            position: '',
            monthly_stipend: 0,
            status: 'active'
        });
    };

    const getStatusBadge = (status, daysRemaining) => {
        if (status === 'active') {
            if (daysRemaining <= 30 && daysRemaining > 0) {
                return <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full">Expire bientôt</span>;
            }
            return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full">Actif</span>;
        }
        if (status === 'completed') return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">Terminé</span>;
        if (status === 'converted') return <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">Embauché</span>;
        return <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-full">{status}</span>;
    };

    const getDaysRemaining = (endDate) => {
        if (!endDate) return 0;
        const end = new Date(endDate);
        const now = new Date();
        return Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    };

    return (
        <div className="p-4 sm:p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Stagiaires</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Gestion des stages</p>
                </div>
                {isAdmin() && (
                    <button 
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                        <FiPlus size={18} />
                        <span>Nouveau Stagiaire</span>
                    </button>
                )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                            <FiUser className="text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.total_active}</p>
                            <p className="text-sm text-slate-500">Actifs</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                            <FiClock className="text-amber-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.expiring_soon}</p>
                            <p className="text-sm text-slate-500">Expirent bientôt</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                            <FiCheck className="text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.completed}</p>
                            <p className="text-sm text-slate-500">Terminés</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                            <FiTrendingUp className="text-purple-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.converted}</p>
                            <p className="text-sm text-slate-500">Embauché</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700 mb-6">
                <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Rechercher un stagaire..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 rounded-lg"
                    />
                </div>
            </div>

            {/* Interns List */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                ) : interns.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                        Aucun stagaire trouvé
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 dark:bg-slate-900/50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Stagiaire</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase hidden md:table-cell">École/Université</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase hidden lg:table-cell">Dates</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Statut</th>
                                    <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {interns.map((intern) => {
                                    const daysRemaining = getDaysRemaining(intern.internship_end_date);
                                    return (
                                        <tr key={intern.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                                        {intern.first_name?.[0]}{intern.last_name?.[0]}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-800 dark:text-white">
                                                            {intern.first_name} {intern.last_name}
                                                        </p>
                                                        <p className="text-sm text-slate-500">{intern.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400 hidden md:table-cell">
                                                {intern.school_university || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400 hidden lg:table-cell">
                                                {formatDate(intern.internship_start_date)} - {formatDate(intern.internship_end_date)}
                                                <p className="text-xs text-slate-400">{daysRemaining} jours restants</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                {getStatusBadge(intern.status, daysRemaining)}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button 
                                                    onClick={() => handleEdit(intern)}
                                                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg mr-1"
                                                    title="Modifier"
                                                >
                                                    <FiEdit size={16} />
                                                </button>
                                                {intern.status === 'active' && (
                                                    <button 
                                                        onClick={() => handleComplete(intern.id)}
                                                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg mr-1"
                                                        title="Marquer terminé"
                                                    >
                                                        <FiCheck size={16} />
                                                    </button>
                                                )}
                                                <button 
                                                    onClick={() => handleDelete(intern.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                                    title="Supprimer"
                                                >
                                                    <FiTrash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">
                            {editIntern ? 'Modifier le Stagiaire' : 'Nouveau Stagiaire'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Prénom</label>
                                    <input
                                        type="text"
                                        value={formData.first_name}
                                        onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 rounded-lg"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nom</label>
                                    <input
                                        type="text"
                                        value={formData.last_name}
                                        onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 rounded-lg"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 rounded-lg"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Téléphone</label>
                                <input
                                    type="text"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Université/École</label>
                                <input
                                    type="text"
                                    value={formData.school_university}
                                    onChange={(e) => setFormData({...formData, school_university: e.target.value})}
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 rounded-lg"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Niveau d'études</label>
                                    <select
                                        value={formData.study_level}
                                        onChange={(e) => setFormData({...formData, study_level: e.target.value})}
                                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 rounded-lg"
                                    >
                                        <option value="">Sélectionner</option>
                                        <option value="BAC+2">BAC+2</option>
                                        <option value="BAC+3">BAC+3</option>
                                        <option value="BAC+4">BAC+4</option>
                                        <option value="BAC+5">BAC+5</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Indemnité (MAD)</label>
                                    <input
                                        type="number"
                                        value={formData.monthly_stipend}
                                        onChange={(e) => setFormData({...formData, monthly_stipend: e.target.value})}
                                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 rounded-lg"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date début</label>
                                    <input
                                        type="date"
                                        value={formData.internship_start_date}
                                        onChange={(e) => setFormData({...formData, internship_start_date: e.target.value})}
                                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 rounded-lg"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date fin</label>
                                    <input
                                        type="date"
                                        value={formData.internship_end_date}
                                        onChange={(e) => setFormData({...formData, internship_end_date: e.target.value})}
                                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 rounded-lg"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Département</label>
                                <select
                                    value={formData.department_id}
                                    onChange={(e) => setFormData({...formData, department_id: e.target.value})}
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 rounded-lg"
                                >
                                    <option value="">Sélectionner</option>
                                    {departments.map(dept => (
                                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Poste</label>
                                <input
                                    type="text"
                                    value={formData.position}
                                    onChange={(e) => setFormData({...formData, position: e.target.value})}
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Statut</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 rounded-lg"
                                >
                                    <option value="active">Actif</option>
                                    <option value="completed">Terminé</option>
                                    <option value="converted">Embauché</option>
                                </select>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="submit" className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                                    {editIntern ? 'Mettre à jour' : 'Ajouter'}
                                </button>
                                <button type="button" onClick={closeModal} className="flex-1 py-2.5 border border-slate-300 rounded-lg hover:bg-slate-50">
                                    Annuler
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InternList;
