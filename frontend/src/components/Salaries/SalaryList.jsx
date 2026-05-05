import { useState, useEffect } from 'react';
import api from '../../services/api';
import { FiPlus, FiDownload, FiDollarSign, FiUsers, FiClock, FiEdit, FiTrash2 } from 'react-icons/fi';

const SalaryList = () => {
    const [salaries, setSalaries] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editSalary, setEditSalary] = useState(null);
    const [formData, setFormData] = useState({
        employee_id: '',
        month: '',
        gross_amount: '',
        tax_amount: '0',
        bonus: '0',
        deductions: '0',
        payment_date: '',
        status: 'pending'
    });

    useEffect(() => {
        fetchSalaries();
        fetchEmployees();
    }, []);

    const fetchSalaries = async () => {
        try {
            setLoading(true);
            const response = await api.get('/salaries');
            const responseData = response.data.data;
            let data = [];
            if (Array.isArray(responseData)) {
                data = responseData;
            } else if (responseData && Array.isArray(responseData.data)) {
                data = responseData.data;
            } else if (responseData && responseData.data && Array.isArray(responseData.data.data)) {
                data = responseData.data.data;
            }
            // Handle missing employee gracefully
            data = data.map(salary => ({
                ...salary,
                employee: salary.employee || { first_name: 'Inconnu', last_name: '' }
            }));
            setSalaries(data);
        } catch (err) {
            console.error('Error fetching salaries:', err);
            setSalaries([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            const response = await api.get('/employees');
            const responseData = response.data.data;
            let data = [];
            if (Array.isArray(responseData)) {
                data = responseData;
            } else if (responseData && Array.isArray(responseData.data)) {
                data = responseData.data;
            } else if (responseData && responseData.data && Array.isArray(responseData.data.data)) {
                data = responseData.data.data;
            }
            setEmployees(data);
        } catch (err) {
            console.error('Error fetching employees:', err);
            setEmployees([]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const grossAmount = parseFloat(formData.gross_amount) || 0;
            const taxAmount = parseFloat(formData.tax_amount) || 0;
            const bonus = parseFloat(formData.bonus) || 0;
            const deductions = parseFloat(formData.deductions) || 0;
            const netAmount = grossAmount - taxAmount + bonus - deductions;
            
            const payload = {
                ...formData,
                net_amount: netAmount.toFixed(2)
            };
            
            if (editSalary) {
                await api.put(`/salaries/${editSalary.id}`, payload);
            } else {
                await api.post('/salaries', payload);
            }
            setShowModal(false);
            setEditSalary(null);
            setFormData({
                employee_id: '',
                month: '',
                gross_amount: '',
                tax_amount: '0',
                bonus: '0',
                deductions: '0',
                payment_date: '',
                status: 'pending'
            });
            fetchSalaries();
        } catch (err) {
            alert(err.response?.data?.message || 'Erreur lors de la sauvegarde du salaire');
        }
    };

    const handleEdit = (salary) => {
        setEditSalary(salary);
        setFormData({
            employee_id: salary.employee_id || salary.employee?.id || '',
            month: salary.month || '',
            gross_amount: salary.gross_amount || salary.base_salary || '',
            tax_amount: salary.tax_amount?.toString() || '0',
            bonus: salary.bonus?.toString() || '0',
            deductions: salary.deductions?.toString() || '0',
            payment_date: salary.payment_date ? salary.payment_date.split('T')[0] : '',
            status: salary.status || 'pending'
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditSalary(null);
        setFormData({
            employee_id: '',
            month: '',
            gross_amount: '',
            tax_amount: '0',
            bonus: '0',
            deductions: '0',
            payment_date: '',
            status: 'pending'
        });
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce salaire?')) return;
        try {
            await api.delete(`/salaries/${id}`);
            fetchSalaries();
        } catch (err) {
            // If API delete fails, try with force
            try {
                await api.delete(`/salaries/${id}?force=true`);
                fetchSalaries();
            } catch (err2) {
                alert(err.response?.data?.message || 'Erreur lors de la suppression du salaire');
            }
        }
    };

    const handleExport = async () => {
        const month = prompt('Entrez le mois (YYYY-MM):', new Date().toISOString().slice(0, 7));
        if (!month) return;
        try {
            const response = await api.get(`/salaries/export/monthly/${month}`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `salaires_${month}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            alert(err.response?.data?.message || 'Erreur lors de l\'exportation des salaires');
        }
    };

    const calculateNet = (base, bonuses, deductions) => {
        return (parseFloat(base) + parseFloat(bonuses) - parseFloat(deductions)).toFixed(2);
    };

    const totalMass = salaries
        .filter(s => s.status === 'paid')
        .reduce((sum, s) => {
            const gross = parseFloat(s.gross_amount) || parseFloat(s.base_salary) || 0;
            const bonus = parseFloat(s.bonus) || 0;
            const tax = parseFloat(s.tax_amount) || 0;
            const deductions = parseFloat(s.deductions) || 0;
            return sum + gross + bonus - tax - deductions;
        }, 0);
    
    const paidCount = salaries.filter(s => s.status === 'paid').length;
    const pendingCount = salaries.filter(s => s.status === 'pending').length;

    const getStatusBadge = (status) => {
        if (status === 'paid') {
            return (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                    Payé
                </span>
            );
        }
        return (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                En attente
            </span>
        );
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MAD' }).format(amount);
    };

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Gestion des Salaires</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Visualisez et gérez la paie</p>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                    >
                        <FiDownload size={18} />
                        <span>Exporter</span>
                    </button>
                    <button 
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all"
                    >
                        <FiPlus size={18} />
                        <span>Nouveau salaire</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl p-6 text-white">
                    <p className="text-indigo-200 text-sm font-medium">Masse salariale mensuelle</p>
                    <p className="text-3xl font-bold mt-2">{formatCurrency(totalMass)}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-100 dark:border-slate-700">
                    <p className="text-slate-500 text-sm">Employés payé(s)</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{paidCount}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-100 dark:border-slate-700">
                    <p className="text-slate-500 text-sm">En attente</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{pendingCount}</p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-900/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Employé</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Salaire brut</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Bonus</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Déductions</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Salaire net</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Statut</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {salaries.map((salary) => (
                                <tr key={salary.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 font-bold text-sm">
                                                {salary.employee?.first_name?.[0]}{salary.employee?.last_name?.[0]}
                                            </div>
                                            <span className="font-medium text-slate-800 dark:text-white">
                                                {salary.employee?.first_name} {salary.employee?.last_name}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-800 dark:text-white font-semibold">
                                        {formatCurrency(salary.gross_amount)}
                                    </td>
                                    <td className="px-6 py-4 text-emerald-600">
                                        +{formatCurrency(salary.bonus || 0)}
                                    </td>
                                    <td className="px-6 py-4 text-rose-600">
                                        -{formatCurrency((parseFloat(salary.tax_amount) || 0) + (parseFloat(salary.deductions) || 0))}
                                    </td>
                                    <td className="px-6 py-4 text-slate-800 dark:text-white font-bold">
                                        {formatCurrency(salary.net_amount || (parseFloat(salary.gross_amount) - parseFloat(salary.tax_amount || 0) + parseFloat(salary.bonus || 0) - parseFloat(salary.deductions || 0)))}
                                    </td>
                                    <td className="px-6 py-4">
                                        {getStatusBadge(salary.status)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => handleEdit(salary)}
                                                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                                                title="Modifier"
                                            >
                                                <FiEdit size={16} />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(salary.id)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                                title="Supprimer"
                                            >
                                                <FiTrash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {salaries.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-slate-500">
                                        Aucun salaire enregistré
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md mx-4">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">
                            {editSalary ? 'Modifier le salaire' : 'Nouveau salaire'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Employé</label>
                                <select
                                    value={formData.employee_id}
                                    onChange={(e) => setFormData({...formData, employee_id: e.target.value})}
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                                    required
                                >
                                    <option value="">Sélectionner un employé</option>
                                    {employees.map(emp => (
                                        <option key={emp.id} value={emp.id}>
                                            {emp.first_name} {emp.last_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Mois</label>
                                <input
                                    type="month"
                                    value={formData.month}
                                    onChange={(e) => setFormData({...formData, month: e.target.value})}
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Salaire brut (MAD)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.gross_amount}
                                    onChange={(e) => setFormData({...formData, gross_amount: e.target.value})}
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Impôts (MAD)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.tax_amount}
                                    onChange={(e) => setFormData({...formData, tax_amount: e.target.value})}
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Prime (MAD)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.bonus}
                                        onChange={(e) => setFormData({...formData, bonus: e.target.value})}
                                        className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Déductions (MAD)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.deductions}
                                        onChange={(e) => setFormData({...formData, deductions: e.target.value})}
                                        className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date de paiement</label>
                                    <input
                                        type="date"
                                        value={formData.payment_date}
                                        onChange={(e) => setFormData({...formData, payment_date: e.target.value})}
                                        className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Statut</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                                        className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                                    >
                                        <option value="pending">En attente</option>
                                        <option value="paid">Payé</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="submit" className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                                    {editSalary ? 'Mettre à jour' : 'Enregistrer'}
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

export default SalaryList;
