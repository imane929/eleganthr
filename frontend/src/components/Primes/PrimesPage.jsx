import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { 
    FiPlus, FiCheck, FiX, FiDollarSign, FiTrendingUp, FiClock, 
    FiUsers, FiEdit2, FiTrash2, FiX as FiClose, FiFilter, FiDownload,
    FiAward, FiCheckCircle, FiXCircle
} from 'react-icons/fi';

const PrimesPage = () => {
    const { isAdmin, isRH } = useAuth();
    const [activeTab, setActiveTab] = useState('bonuses');
    const [bonuses, setBonuses] = useState([]);
    const [bonusTypes, setBonusTypes] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [showTypeModal, setShowTypeModal] = useState(false);
    const [editingBonus, setEditingBonus] = useState(null);
    const [editingType, setEditingType] = useState(null);
    const [stats, setStats] = useState(null);
    const [filters, setFilters] = useState({
        status: 'all',
        bonus_type_id: '',
        department_id: '',
        month: '',
        year: new Date().getFullYear()
    });

    const [formData, setFormData] = useState({
        employee_id: '',
        bonus_type_id: '',
        amount: '',
        effective_date: '',
        end_date: '',
        justification: '',
        notes: ''
    });

    const [bulkData, setBulkData] = useState({
        employee_ids: [],
        department_id: '',
        bonus_type_id: '',
        amount: '',
        effective_date: '',
        end_date: '',
        justification: ''
    });

    const [typeData, setTypeData] = useState({
        name: '',
        code: '',
        description: '',
        calculation_type: 'fixed',
        default_value: '',
        percentage_value: '',
        formula: '',
        is_taxable: true,
        payment_frequency: 'monthly'
    });

    useEffect(() => {
        fetchData();
        fetchStats();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [bonusesRes, typesRes, employeesRes, deptsRes] = await Promise.all([
                api.get('/bonuses'),
                api.get('/bonus-types'),
                api.get('/employees'),
                api.get('/departments?per_page=100')
            ]);
            
            let bonusesData = bonusesRes.data.data || [];
            if (!Array.isArray(bonusesData)) bonusesData = [];
            setBonuses(bonusesData);
            
            let typesData = typesRes.data.data || [];
            if (!Array.isArray(typesData)) typesData = [];
            setBonusTypes(typesData);
            
            let employeesData = employeesRes.data.data?.data || employeesRes.data.data || [];
            if (!Array.isArray(employeesData)) employeesData = [];
            setEmployees(employeesData);
            
            let deptsData = deptsRes.data.data?.data || deptsRes.data.data || [];
            if (!Array.isArray(deptsData)) deptsData = [];
            setDepartments(deptsData);
        } catch (err) {
            console.error('Error fetching data:', err);
        }
        setLoading(false);
    };

    const fetchStats = async () => {
        try {
            const res = await api.get('/bonuses/stats');
            setStats(res.data.data);
        } catch (err) {
            console.error('Error fetching stats:', err);
        }
    };

    const filteredBonuses = bonuses.filter(bonus => {
        if (filters.status !== 'all' && bonus.status !== filters.status) return false;
        if (filters.bonus_type_id && bonus.bonus_type_id !== parseInt(filters.bonus_type_id)) return false;
        if (filters.department_id && bonus.employee?.department_id !== parseInt(filters.department_id)) return false;
        return true;
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingBonus) {
                await api.put(`/bonuses/${editingBonus.id}`, formData);
            } else {
                await api.post('/bonuses', formData);
            }
            setShowModal(false);
            resetForm();
            fetchData();
            fetchStats();
        } catch (err) {
            alert(err.response?.data?.message || 'Erreur lors de la soumission');
        }
    };

    const handleBulkSubmit = async (e) => {
        e.preventDefault();
        try {
            if (bulkData.department_id) {
                await api.post('/bonuses/bulk-department', bulkData);
            } else {
                await api.post('/bonuses/bulk', bulkData);
            }
            setShowBulkModal(false);
            resetBulkForm();
            fetchData();
            fetchStats();
        } catch (err) {
            alert(err.response?.data?.message || 'Erreur lors de la soumission');
        }
    };

    const handleTypeSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingType) {
                await api.put(`/bonus-types/${editingType.id}`, typeData);
            } else {
                await api.post('/bonus-types', typeData);
            }
            setShowTypeModal(false);
            resetTypeForm();
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'Erreur lors de la soumission');
        }
    };

    const handleApprove = async (id) => {
        try {
            await api.post(`/bonuses/${id}/approve`);
            fetchData();
            fetchStats();
        } catch (err) {
            alert('Erreur lors de l\'approbation');
        }
    };

    const handleReject = async (id) => {
        const reason = prompt('Raison du rejet:');
        if (reason) {
            try {
                await api.post(`/bonuses/${id}/reject`, { rejection_reason: reason });
                fetchData();
                fetchStats();
            } catch (err) {
                alert('Erreur lors du rejet');
            }
        }
    };

    const handleMarkPaid = async (id) => {
        const paymentDate = prompt('Date du paiement (YYYY-MM-DD):', new Date().toISOString().split('T')[0]);
        if (paymentDate) {
            try {
                const response = await api.post(`/bonuses/${id}/mark-paid`, { payment_date: paymentDate });
                alert(response.data.message || 'Prime marquée comme payée!');
                fetchData();
                fetchStats();
            } catch (err) {
                alert(err.response?.data?.message || 'Erreur lors du marquage comme payé');
            }
        }
    };

    const handleDeleteType = async (id) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer ce type de prime?')) {
            try {
                await api.delete(`/bonus-types/${id}`);
                fetchData();
            } catch (err) {
                alert(err.response?.data?.message || 'Erreur lors de la suppression');
            }
        }
    };

    const resetForm = () => {
        setFormData({
            employee_id: '',
            bonus_type_id: '',
            amount: '',
            effective_date: '',
            end_date: '',
            justification: '',
            notes: ''
        });
        setEditingBonus(null);
    };

    const resetBulkForm = () => {
        setBulkData({
            employee_ids: [],
            department_id: '',
            bonus_type_id: '',
            amount: '',
            effective_date: '',
            end_date: '',
            justification: ''
        });
    };

    const resetTypeForm = () => {
        setTypeData({
            name: '',
            code: '',
            description: '',
            calculation_type: 'fixed',
            default_value: '',
            percentage_value: '',
            formula: '',
            is_taxable: true,
            payment_frequency: 'monthly'
        });
        setEditingType(null);
    };

    const openEditModal = (bonus) => {
        setFormData({
            employee_id: bonus.employee_id,
            bonus_type_id: bonus.bonus_type_id,
            amount: bonus.amount,
            effective_date: bonus.effective_date,
            end_date: bonus.end_date || '',
            justification: bonus.justification || '',
            notes: bonus.notes || ''
        });
        setEditingBonus(bonus);
        setShowModal(true);
    };

    const openEditTypeModal = (type) => {
        setTypeData({
            name: type.name,
            code: type.code,
            description: type.description || '',
            calculation_type: type.calculation_type,
            default_value: type.default_value,
            percentage_value: type.percentage_value || '',
            formula: type.formula || '',
            is_taxable: type.is_taxable,
            payment_frequency: type.payment_frequency
        });
        setEditingType(type);
        setShowTypeModal(true);
    };

    const getStatusBadge = (status) => {
        const styles = {
            pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
            approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
            rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
            active: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            expired: 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400',
            cancelled: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
        };
        const labels = {
            pending: 'En attente',
            approved: 'Approuvé',
            rejected: 'Refusé',
            active: 'Actif',
            expired: 'Expiré',
            cancelled: 'Annulé'
        };
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${styles[status] || ''}`}>
                {labels[status] || status}
            </span>
        );
    };

    const getPaymentBadge = (status) => {
        const styles = {
            unpaid: 'bg-slate-100 text-slate-600 dark:bg-slate-900/30 dark:text-slate-400',
            paid: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
        };
        return (
            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${styles[status] || ''}`}>
                {status === 'paid' ? 'Payé' : 'Non payé'}
            </span>
        );
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(amount || 0);
    };

    const formatDate = (date) => {
        if (!date) return '-';
        return date.split('T')[0];
    };

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Primes & Allocations</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Gestion des primes et allocations</p>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={() => { resetTypeForm(); setShowTypeModal(true); }}
                        className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                        <FiAward size={18} />
                        Types de primes
                    </button>
                    <button 
                        onClick={() => { resetBulkForm(); setShowBulkModal(true); }}
                        className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                        <FiUsers size={18} />
                        Attribution groupée
                    </button>
                    <button 
                        onClick={() => { resetForm(); setShowModal(true); }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all"
                    >
                        <FiPlus size={18} />
                        Nouvelle prime
                    </button>
                </div>
            </div>

            {stats && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                                <FiClock className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">En attente</p>
                                <p className="text-xl font-bold text-slate-800 dark:text-white">{stats.pending_count}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                                <FiCheckCircle className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Approuvées ce mois</p>
                                <p className="text-xl font-bold text-slate-800 dark:text-white">{stats.approved_this_month}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                <FiDollarSign className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Payées ce mois</p>
                                <p className="text-xl font-bold text-slate-800 dark:text-white">{stats.paid_this_month}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                                <FiTrendingUp className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Total ce mois</p>
                                <p className="text-xl font-bold text-slate-800 dark:text-white">{formatCurrency(stats.total_paid_this_month)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex gap-6 border-b border-slate-200 dark:border-slate-700 mb-6">
                <button 
                    onClick={() => setActiveTab('bonuses')}
                    className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'bonuses' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    Primes ({bonuses.length})
                </button>
                <button 
                    onClick={() => setActiveTab('types')}
                    className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'types' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    Types de primes ({bonusTypes.length})
                </button>
            </div>

            {activeTab === 'bonuses' && (
                <>
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-4 mb-6">
                        <div className="flex flex-wrap gap-4">
                            <select
                                value={filters.status}
                                onChange={(e) => setFilters({...filters, status: e.target.value})}
                                className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                            >
                                <option value="all">Tous les statuts</option>
                                <option value="pending">En attente</option>
                                <option value="approved">Approuvé</option>
                                <option value="rejected">Refusé</option>
                                <option value="active">Actif</option>
                            </select>
                            <select
                                value={filters.bonus_type_id}
                                onChange={(e) => setFilters({...filters, bonus_type_id: e.target.value})}
                                className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                            >
                                <option value="">Tous les types</option>
                                {bonusTypes.map(type => (
                                    <option key={type.id} value={type.id}>{type.name}</option>
                                ))}
                            </select>
                            <select
                                value={filters.department_id}
                                onChange={(e) => setFilters({...filters, department_id: e.target.value})}
                                className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                            >
                                <option value="">Tous les départements</option>
                                {departments.map(dept => (
                                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 dark:bg-slate-900/50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Employé</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Type</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Montant</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Date effet</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Statut</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Paiement</th>
                                        <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {filteredBonuses.length > 0 ? filteredBonuses.map(bonus => (
                                        <tr key={bonus.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                                                        {bonus.employee?.first_name?.[0]}{bonus.employee?.last_name?.[0]}
                                                    </div>
                                                    <span className="font-medium text-slate-800 dark:text-white">
                                                        {bonus.employee?.first_name} {bonus.employee?.last_name}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                                                {bonus.bonus_type?.name || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-sm font-semibold text-slate-800 dark:text-white">
                                                {formatCurrency(bonus.amount)}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                                                {formatDate(bonus.effective_date)}
                                            </td>
                                            <td className="px-4 py-3">
                                                {getStatusBadge(bonus.status)}
                                            </td>
                                            <td className="px-4 py-3">
                                                {getPaymentBadge(bonus.payment_status)}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    {bonus.status === 'pending' && (
                                                        <>
                                                            <button 
                                                                onClick={() => handleApprove(bonus.id)}
                                                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg"
                                                                title="Approuver"
                                                            >
                                                                <FiCheck size={16} />
                                                            </button>
                                                            <button 
                                                                onClick={() => handleReject(bonus.id)}
                                                                className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                                                title="Refuser"
                                                            >
                                                                <FiXCircle size={16} />
                                                            </button>
                                                        </>
                                                    )}
                                                    {bonus.status === 'approved' && bonus.payment_status === 'unpaid' && (
                                                        <button 
                                                            onClick={() => handleMarkPaid(bonus.id)}
                                                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                                                            title="Marquer payé"
                                                        >
                                                            <FiDollarSign size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="7" className="px-4 py-8 text-center text-slate-500">
                                                Aucune prime trouvée
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {activeTab === 'types' && (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 dark:bg-slate-900/50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Nom</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Code</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Calcul</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Valeur</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Fréquence</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Taxable</th>
                                    <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {bonusTypes.map(type => (
                                    <tr key={type.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30">
                                        <td className="px-4 py-3 font-medium text-slate-800 dark:text-white">
                                            {type.name}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                                            <code className="bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded text-xs">{type.code}</code>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                                            {type.calculation_type === 'fixed' ? 'Fixe' : 
                                             type.calculation_type === 'percentage' ? 'Pourcentage' :
                                             type.calculation_type === 'formula' ? 'Formule' : 'Par paliers'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                                            {formatCurrency(type.default_value || 0)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                                            {type.payment_frequency === 'monthly' ? 'Mensuel' :
                                             type.payment_frequency === 'quarterly' ? 'Trimestriel' :
                                             type.payment_frequency === 'annual' ? 'Annuel' :
                                             type.payment_frequency === 'one_time' ? 'Une fois' : 'Événement'}
                                        </td>
                                        <td className="px-4 py-3">
                                            {type.is_taxable ? (
                                                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">Oui</span>
                                            ) : (
                                                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">Non</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button 
                                                    onClick={() => openEditTypeModal(type)}
                                                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg"
                                                    title="Modifier"
                                                >
                                                    <FiEdit2 size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteType(type.id)}
                                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                                    title="Supprimer"
                                                >
                                                    <FiTrash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                                {editingBonus ? 'Modifier la prime' : 'Nouvelle prime'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-600">
                                <FiClose size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Employé</label>
                                <select
                                    value={formData.employee_id}
                                    onChange={(e) => setFormData({...formData, employee_id: e.target.value})}
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                                    required
                                >
                                    <option value="">Sélectionner un employé</option>
                                    {employees.map(emp => (
                                        <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Type de prime</label>
                                <select
                                    value={formData.bonus_type_id}
                                    onChange={(e) => setFormData({...formData, bonus_type_id: e.target.value})}
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                                    required
                                >
                                    <option value="">Sélectionner un type</option>
                                    {bonusTypes.map(type => (
                                        <option key={type.id} value={type.id}>{type.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Montant</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date d'effet</label>
                                    <input
                                        type="date"
                                        value={formData.effective_date}
                                        onChange={(e) => setFormData({...formData, effective_date: e.target.value})}
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date fin</label>
                                    <input
                                        type="date"
                                        value={formData.end_date}
                                        onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Justification</label>
                                <textarea
                                    value={formData.justification}
                                    onChange={(e) => setFormData({...formData, justification: e.target.value})}
                                    rows={2}
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">
                                    Annuler
                                </button>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                                    {editingBonus ? 'Mettre à jour' : 'Créer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showBulkModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Attribution groupée</h3>
                            <button onClick={() => setShowBulkModal(false)} className="p-2 text-slate-400 hover:text-slate-600">
                                <FiClose size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleBulkSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Département (optionnel)</label>
                                <select
                                    value={bulkData.department_id}
                                    onChange={(e) => setBulkData({...bulkData, department_id: e.target.value})}
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                                >
                                    <option value="">Sélectionner un département</option>
                                    {departments.map(dept => (
                                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Type de prime</label>
                                <select
                                    value={bulkData.bonus_type_id}
                                    onChange={(e) => setBulkData({...bulkData, bonus_type_id: e.target.value})}
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                                    required
                                >
                                    <option value="">Sélectionner un type</option>
                                    {bonusTypes.map(type => (
                                        <option key={type.id} value={type.id}>{type.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Montant</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={bulkData.amount}
                                    onChange={(e) => setBulkData({...bulkData, amount: e.target.value})}
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date d'effet</label>
                                    <input
                                        type="date"
                                        value={bulkData.effective_date}
                                        onChange={(e) => setBulkData({...bulkData, effective_date: e.target.value})}
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date fin</label>
                                    <input
                                        type="date"
                                        value={bulkData.end_date}
                                        onChange={(e) => setBulkData({...bulkData, end_date: e.target.value})}
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setShowBulkModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">
                                    Annuler
                                </button>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                                    Attribuer
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showTypeModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                                {editingType ? 'Modifier le type' : 'Nouveau type de prime'}
                            </h3>
                            <button onClick={() => setShowTypeModal(false)} className="p-2 text-slate-400 hover:text-slate-600">
                                <FiClose size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleTypeSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nom</label>
                                <input
                                    type="text"
                                    value={typeData.name}
                                    onChange={(e) => setTypeData({...typeData, name: e.target.value})}
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Code</label>
                                <input
                                    type="text"
                                    value={typeData.code}
                                    onChange={(e) => setTypeData({...typeData, code: e.target.value})}
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                                <textarea
                                    value={typeData.description}
                                    onChange={(e) => setTypeData({...typeData, description: e.target.value})}
                                    rows={2}
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Type de calcul</label>
                                <select
                                    value={typeData.calculation_type}
                                    onChange={(e) => setTypeData({...typeData, calculation_type: e.target.value})}
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                                >
                                    <option value="fixed">Montant fixe</option>
                                    <option value="percentage">Pourcentage du salaire</option>
                                    <option value="formula">Formule personnalisée</option>
                                    <option value="tiered">Par paliers</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                {typeData.calculation_type === 'fixed' && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Montant</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={typeData.default_value}
                                            onChange={(e) => setTypeData({...typeData, default_value: e.target.value})}
                                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                                        />
                                    </div>
                                )}
                                {typeData.calculation_type === 'percentage' && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Pourcentage (%)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={typeData.percentage_value}
                                            onChange={(e) => setTypeData({...typeData, percentage_value: e.target.value})}
                                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                                        />
                                    </div>
                                )}
                                {typeData.calculation_type === 'formula' && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Formule</label>
                                        <input
                                            type="text"
                                            placeholder="{base_salary} * 0.10"
                                            value={typeData.formula}
                                            onChange={(e) => setTypeData({...typeData, formula: e.target.value})}
                                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                                        />
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Fréquence</label>
                                    <select
                                        value={typeData.payment_frequency}
                                        onChange={(e) => setTypeData({...typeData, payment_frequency: e.target.value})}
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                                    >
                                        <option value="monthly">Mensuel</option>
                                        <option value="quarterly">Trimestriel</option>
                                        <option value="annual">Annuel</option>
                                        <option value="one_time">Une fois</option>
                                        <option value="event_based">Événement</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="is_taxable"
                                    checked={typeData.is_taxable}
                                    onChange={(e) => setTypeData({...typeData, is_taxable: e.target.checked})}
                                    className="w-4 h-4 rounded border-slate-300"
                                />
                                <label htmlFor="is_taxable" className="text-sm text-slate-700 dark:text-slate-300">
                                    Prime soumise aux taxes
                                </label>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setShowTypeModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">
                                    Annuler
                                </button>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                                    {editingType ? 'Mettre à jour' : 'Créer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PrimesPage;
