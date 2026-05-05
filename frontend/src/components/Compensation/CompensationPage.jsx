import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { 
    FiDollarSign, FiTrendingUp, FiPieChart, FiEdit, FiCheck, FiX,
    FiPlus, FiSave, FiUsers, FiCalendar
} from 'react-icons/fi';

const CompensationPage = () => {
    const { hasRole, isAdmin } = useAuth();
    const [activeTab, setActiveTab] = useState('scales');
    const [loading, setLoading] = useState(true);
    
    // Salary Scales
    const [scales, setScales] = useState([]);
    const [editingScale, setEditingScale] = useState(null);
    const [scaleForm, setScaleForm] = useState({
        min_salary: 0, max_salary: 0, mid_salary: 0,
        allowance_transport: 0, allowance_housing: 0, allowance_food: 0, is_active: true
    });
    
    // Merit Increases
    const [meritIncreases, setMeritIncreases] = useState([]);
    const [meritFilter, setMeritFilter] = useState('all');
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [requestForm, setRequestForm] = useState({
        employee_id: '', proposed_increase_percent: '', reason: '', effective_date: ''
    });
    const [employees, setEmployees] = useState([]);
    
    // Budget vs Actual
    const [budgetData, setBudgetData] = useState([]);
    const [budgetTotals, setBudgetTotals] = useState({});
    const [budgetYear, setBudgetYear] = useState(new Date().getFullYear());
    const [showBudgetModal, setShowBudgetModal] = useState(false);
    const [budgetForm, setBudgetForm] = useState({ department_id: '', year: budgetYear, annual_budget: 0 });
    const [departments, setDepartments] = useState([]);

    useEffect(() => {
        fetchData();
    }, [activeTab, meritFilter, budgetYear]);

    const fetchData = () => {
        setLoading(true);
        if (activeTab === 'scales') fetchSalaryScales();
        else if (activeTab === 'merits') fetchMeritIncreases();
        else if (activeTab === 'budget') fetchBudgetVsActual();
        setLoading(false);
    };

    const fetchSalaryScales = async () => {
        try {
            const res = await api.get('/salary-scales');
            setScales(res.data.data || []);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchMeritIncreases = async () => {
        try {
            const params = meritFilter !== 'all' ? `?status=${meritFilter}` : '';
            const res = await api.get(`/merit-increases${params}`);
            setMeritIncreases(res.data.data || []);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchBudgetVsActual = async () => {
        try {
            const res = await api.get(`/budget-vs-actual?year=${budgetYear}`);
            setBudgetData(res.data.data || []);
            setBudgetTotals(res.data.totals || {});
        } catch (err) {
            console.error(err);
        }
    };

    const fetchEmployees = async () => {
        try {
            const res = await api.get('/employees');
            let empData = res.data.data?.data || res.data.data || [];
            if (!Array.isArray(empData)) empData = [];
            setEmployees(empData);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchDepartments = async () => {
        try {
            const res = await api.get('/departments/active');
            let deptData = res.data.data;
            if (deptData && typeof deptData === 'object' && 'data' in deptData) {
                deptData = deptData.data;
            }
            if (!Array.isArray(deptData)) deptData = [];
            setDepartments(deptData);
        } catch (err) {
            console.error(err);
        }
    };

    const handleUpdateScale = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/salary-scales/${editingScale.id}`, scaleForm);
            setEditingScale(null);
            fetchSalaryScales();
            alert('Échelle mise à jour!');
        } catch (err) {
            alert(err.response?.data?.message || 'Erreur');
        }
    };

    const handleRequestMerit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/merit-increases', requestForm);
            setShowRequestModal(false);
            setRequestForm({ employee_id: '', proposed_increase_percent: '', reason: '', effective_date: '' });
            fetchMeritIncreases();
            alert('Demande soumise!');
        } catch (err) {
            alert(err.response?.data?.message || 'Erreur');
        }
    };

    const handleApproveMerit = async (id) => {
        if (!window.confirm('Approuver cette augmentation?')) return;
        try {
            await api.post(`/merit-increases/${id}/approve`);
            fetchMeritIncreases();
            alert('Approuvé!');
        } catch (err) {
            alert(err.response?.data?.message || 'Erreur');
        }
    };

    const handleRejectMerit = async (id) => {
        const reason = prompt('Motif du rejet:');
        if (!reason) return;
        try {
            await api.post(`/merit-increases/${id}/reject`, { rejection_reason: reason });
            fetchMeritIncreases();
        } catch (err) {
            alert(err.response?.data?.message || 'Erreur');
        }
    };

    const handleSetBudget = async (e) => {
        e.preventDefault();
        try {
            await api.post('/department-budgets', budgetForm);
            setShowBudgetModal(false);
            fetchBudgetVsActual();
            alert('Budget défini!');
        } catch (err) {
            alert(err.response?.data?.message || 'Erreur');
        }
    };

    const openEditScale = (scale) => {
        setEditingScale(scale);
        setScaleForm({
            min_salary: scale.min_salary || 0,
            max_salary: scale.max_salary || 0,
            mid_salary: scale.mid_salary || 0,
            allowance_transport: scale.allowance_transport || 0,
            allowance_housing: scale.allowance_housing || 0,
            allowance_food: scale.allowance_food || 0,
            is_active: scale.is_active ?? true
        });
    };

    const openBudgetModal = () => {
        fetchDepartments();
        setShowBudgetModal(true);
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(val || 0);
    };

    const tabs = [
        { id: 'scales', label: 'Grilles Salariales', icon: FiDollarSign },
        { id: 'merits', label: 'Augmentations', icon: FiTrendingUp },
        { id: 'budget', label: 'Budget vs Réel', icon: FiPieChart }
    ];

    return (
        <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Gestion de la Rémunération</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Salaires, augmentations et budgets</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg whitespace-nowrap transition-all ${
                            activeTab === tab.id
                                ? 'bg-indigo-600 text-white'
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                    >
                        <tab.icon size={18} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            ) : (
                <>
                    {/* Salary Scales Tab */}
                    {activeTab === 'scales' && (
                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-slate-50 dark:bg-slate-900/50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Poste</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Type</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Min (MAD)</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Mid (MAD)</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Max (MAD)</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Transport</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Statut</th>
                                            <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                        {scales.length === 0 ? (
                                            <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-500">Aucune échelle</td></tr>
                                        ) : scales.map(scale => (
                                            <tr key={scale.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                                <td className="px-4 py-3 font-medium text-slate-800 dark:text-white">{scale.position}</td>
                                                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{scale.contract_type}</td>
                                                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{formatCurrency(scale.min_salary)}</td>
                                                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{formatCurrency(scale.mid_salary)}</td>
                                                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{formatCurrency(scale.max_salary)}</td>
                                                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{formatCurrency(scale.allowance_transport)}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 text-xs rounded-full ${scale.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                                                        {scale.is_active ? 'Actif' : 'Inactif'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <button onClick={() => openEditScale(scale)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg">
                                                        <FiEdit size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Merit Increases Tab */}
                    {activeTab === 'merits' && (
                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
                                <select
                                    value={meritFilter}
                                    onChange={(e) => setMeritFilter(e.target.value)}
                                    className="px-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 rounded-lg"
                                >
                                    <option value="all">Tous</option>
                                    <option value="pending">En attente</option>
                                    <option value="approved">Approuvés</option>
                                    <option value="rejected">Rejetés</option>
                                </select>
                                <button
                                    onClick={() => { fetchEmployees(); setShowRequestModal(true); }}
                                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                                >
                                    <FiPlus size={18} /> Demander une augmentation
                                </button>
                            </div>

                            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-slate-50 dark:bg-slate-900/50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Employé</th>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Salaire Actuel</th>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Augmentation</th>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Nouveau Salaire</th>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Statut</th>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Date Effet</th>
                                                {isAdmin() && <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase">Actions</th>}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                            {meritIncreases.length === 0 ? (
                                                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">Aucune demande</td></tr>
                                            ) : meritIncreases.map(merit => (
                                                <tr key={merit.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-white">
                                                        {merit.employee?.first_name} {merit.employee?.last_name}
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{formatCurrency(merit.current_salary)}</td>
                                                    <td className="px-4 py-3 text-emerald-600 font-medium">+{merit.proposed_increase_percent}%</td>
                                                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{formatCurrency(merit.new_salary)}</td>
                                                    <td className="px-4 py-3">
                                                        <span className={`px-2 py-1 text-xs rounded-full ${
                                                            merit.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                                            merit.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                                                            'bg-red-100 text-red-700'
                                                        }`}>
                                                            {merit.status === 'pending' ? 'En attente' : merit.status === 'approved' ? 'Approuvé' : 'Rejeté'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{merit.effective_date}</td>
                                                    {isAdmin() && (
                                                        <td className="px-4 py-3 text-right">
                                                            {merit.status === 'pending' && (
                                                                <>
                                                                    <button onClick={() => handleApproveMerit(merit.id)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg mr-1">
                                                                        <FiCheck size={16} />
                                                                    </button>
                                                                    <button onClick={() => handleRejectMerit(merit.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                                                                        <FiX size={16} />
                                                                    </button>
                                                                </>
                                                            )}
                                                        </td>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Budget vs Actual Tab */}
                    {activeTab === 'budget' && (
                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    <FiCalendar className="text-slate-400" />
                                    <select
                                        value={budgetYear}
                                        onChange={(e) => setBudgetYear(e.target.value)}
                                        className="px-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 rounded-lg"
                                    >
                                        {[2023, 2024, 2025, 2026, 2027].map(y => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                </div>
                                <button
                                    onClick={openBudgetModal}
                                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                                >
                                    <FiPlus size={18} /> Définir Budget
                                </button>
                            </div>

                            {/* Summary Cards */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
                                    <p className="text-sm text-slate-500">Budget Total</p>
                                    <p className="text-xl font-bold text-slate-800 dark:text-white">{formatCurrency(budgetTotals.total_budget)}</p>
                                </div>
                                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
                                    <p className="text-sm text-slate-500">Coût Réel Total</p>
                                    <p className="text-xl font-bold text-slate-800 dark:text-white">{formatCurrency(budgetTotals.total_actual_ctc)}</p>
                                </div>
                                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
                                    <p className="text-sm text-slate-500">Variance</p>
                                    <p className={`text-xl font-bold ${budgetTotals.total_variance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                        {formatCurrency(budgetTotals.total_variance)}
                                    </p>
                                </div>
                                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
                                    <p className="text-sm text-slate-500">Employés</p>
                                    <p className="text-xl font-bold text-slate-800 dark:text-white">{budgetTotals.total_employees}</p>
                                </div>
                            </div>

                            {/* Department Table */}
                            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-slate-50 dark:bg-slate-900/50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Département</th>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Employés</th>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Budget</th>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Coût Réel (CTC)</th>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Variance</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                            {budgetData.length === 0 ? (
                                                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">Aucune donnée</td></tr>
                                            ) : budgetData.map((item, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-white">{item.department}</td>
                                                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{item.employee_count}</td>
                                                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{formatCurrency(item.budget)}</td>
                                                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{formatCurrency(item.actual_ctc)}</td>
                                                    <td className={`px-4 py-3 font-medium ${item.variance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                        {formatCurrency(item.variance)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Edit Scale Modal */}
            {editingScale && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Modifier l'échelle: {editingScale.position}</h2>
                        <form onSubmit={handleUpdateScale} className="space-y-4">
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs text-slate-500 mb-1">Min</label>
                                    <input type="number" value={scaleForm.min_salary} onChange={(e) => setScaleForm({...scaleForm, min_salary: e.target.value})} 
                                        className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700" />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-500 mb-1">Mid</label>
                                    <input type="number" value={scaleForm.mid_salary} onChange={(e) => setScaleForm({...scaleForm, mid_salary: e.target.value})} 
                                        className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700" />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-500 mb-1">Max</label>
                                    <input type="number" value={scaleForm.max_salary} onChange={(e) => setScaleForm({...scaleForm, max_salary: e.target.value})} 
                                        className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700" />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs text-slate-500 mb-1">Transport</label>
                                    <input type="number" value={scaleForm.allowance_transport} onChange={(e) => setScaleForm({...scaleForm, allowance_transport: e.target.value})} 
                                        className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700" />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-500 mb-1">Logement</label>
                                    <input type="number" value={scaleForm.allowance_housing} onChange={(e) => setScaleForm({...scaleForm, allowance_housing: e.target.value})} 
                                        className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700" />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-500 mb-1">Nourriture</label>
                                    <input type="number" value={scaleForm.allowance_food} onChange={(e) => setScaleForm({...scaleForm, allowance_food: e.target.value})} 
                                        className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700" />
                                </div>
                            </div>
                            <label className="flex items-center gap-2">
                                <input type="checkbox" checked={scaleForm.is_active} onChange={(e) => setScaleForm({...scaleForm, is_active: e.target.checked})} />
                                <span className="text-sm text-slate-700 dark:text-slate-300">Active</span>
                            </label>
                            <div className="flex gap-3 pt-2">
                                <button type="submit" className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                                    <FiSave size={16} className="inline mr-2" /> Sauvegarder
                                </button>
                                <button type="button" onClick={() => setEditingScale(null)} className="flex-1 py-2.5 border border-slate-300 rounded-lg hover:bg-slate-50">
                                    Annuler
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Request Merit Increase Modal */}
            {showRequestModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Demander une augmentation</h2>
                        <form onSubmit={handleRequestMerit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Employé</label>
                                <select value={requestForm.employee_id} onChange={(e) => setRequestForm({...requestForm, employee_id: e.target.value})}
                                    className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700" required>
                                    <option value="">Sélectionner</option>
                                    {employees.map(emp => (
                                        <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">% d'augmentation</label>
                                <input type="number" min="0" max="50" step="0.5" value={requestForm.proposed_increase_percent} 
                                    onChange={(e) => setRequestForm({...requestForm, proposed_increase_percent: e.target.value})}
                                    className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date d'effet</label>
                                <input type="date" value={requestForm.effective_date} 
                                    onChange={(e) => setRequestForm({...requestForm, effective_date: e.target.value})}
                                    className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Motif</label>
                                <textarea value={requestForm.reason} onChange={(e) => setRequestForm({...requestForm, reason: e.target.value})}
                                    className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700" rows="3" />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="submit" className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                                    Soumettre
                                </button>
                                <button type="button" onClick={() => setShowRequestModal(false)} className="flex-1 py-2.5 border border-slate-300 rounded-lg hover:bg-slate-50">
                                    Annuler
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Set Budget Modal */}
            {showBudgetModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Définir le budget</h2>
                        <form onSubmit={handleSetBudget} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Département</label>
                                <select value={budgetForm.department_id} onChange={(e) => setBudgetForm({...budgetForm, department_id: e.target.value})}
                                    className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700" required>
                                    <option value="">Sélectionner</option>
                                    {departments.map(dept => (
                                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Année</label>
                                <input type="number" value={budgetForm.year} onChange={(e) => setBudgetForm({...budgetForm, year: e.target.value})}
                                    className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Budget Annuel (MAD)</label>
                                <input type="number" value={budgetForm.annual_budget} onChange={(e) => setBudgetForm({...budgetForm, annual_budget: e.target.value})}
                                    className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700" required />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="submit" className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                                    Sauvegarder
                                </button>
                                <button type="button" onClick={() => setShowBudgetModal(false)} className="flex-1 py-2.5 border border-slate-300 rounded-lg hover:bg-slate-50">
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

export default CompensationPage;
