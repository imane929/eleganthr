import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { 
    FiAlertTriangle, FiPlus, FiCheck, FiX, FiFileText, FiClock, 
    FiUser, FiCalendar, FiEdit, FiTrash2, FiPrinter, FiDownload
} from 'react-icons/fi';

const WarningList = () => {
    const { isAdmin, isRH } = useAuth();
    const [warnings, setWarnings] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showLetter, setShowLetter] = useState(false);
    const [selectedWarning, setSelectedWarning] = useState(null);
    const [editWarning, setEditWarning] = useState(null);
    const [stats, setStats] = useState(null);
    const [filters, setFilters] = useState({
        status: 'all',
        warning_type: '',
        department_id: ''
    });

    const [formData, setFormData] = useState({
        employee_id: '',
        warning_type: 'verbal',
        severity: 'medium',
        incident_date: '',
        warning_date: new Date().toISOString().split('T')[0],
        description: '',
        consequence: '',
        manager_id: '',
        expiry_months: 6,
        status: 'active',
        attachment: null
    });

    useEffect(() => {
        fetchWarnings();
        fetchEmployees();
        fetchDepartments();
        fetchStats();
    }, [filters]);

    const fetchWarnings = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (filters.status && filters.status !== 'all') params.append('status', filters.status);
            if (filters.warning_type) params.append('warning_type', filters.warning_type);
            if (filters.department_id) params.append('department_id', filters.department_id);
            
            console.log('Fetching warnings with filters:', { 
                status: filters.status, 
                warning_type: filters.warning_type, 
                department_id: filters.department_id 
            });
            
            const response = await api.get(`/warnings?${params.toString()}`);
            const responseData = response.data.data;
            let data = [];
            if (Array.isArray(responseData)) {
                data = responseData;
            } else if (responseData && Array.isArray(responseData.data)) {
                data = responseData.data;
            }
            console.log('Warnings fetched:', data.length);
            setWarnings(data);
        } catch (err) {
            console.error('Error fetching warnings:', err);
            setWarnings([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            const response = await api.get('/employees');
            let empData = response.data.data?.data || response.data.data || [];
            if (!Array.isArray(empData)) empData = [];
            setEmployees(empData);
        } catch (err) {
            console.error('Error fetching employees:', err);
        }
    };

    const fetchDepartments = async () => {
        try {
            const response = await api.get('/departments?status=active&per_page=100');
            let deptData = [];
            
            if (Array.isArray(response.data?.data)) {
                deptData = response.data.data;
            } else if (response.data?.data?.data && Array.isArray(response.data.data.data)) {
                deptData = response.data.data.data;
            }
            
            if (!Array.isArray(deptData)) {
                deptData = [];
            }
            
            console.log('Departments API response:', JSON.stringify(deptData, null, 2));
            setDepartments(deptData);
        } catch (err) {
            console.error('Error fetching departments:', err);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await api.get('/warnings/statistics');
            setStats(response.data.data);
        } catch (err) {
            console.error('Error fetching stats:', err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const formDataToSend = new FormData();
            Object.keys(formData).forEach(key => {
                if (key === 'attachment' && formData[key]) {
                    formDataToSend.append(key, formData[key]);
                } else if (key !== 'attachment') {
                    formDataToSend.append(key, formData[key] || '');
                }
            });
            
            if (editWarning) {
                formDataToSend.append('_method', 'PUT');
                await api.post(`/warnings/${editWarning.id}`, formDataToSend, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                await api.post('/warnings', formDataToSend, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }
            
            closeModal();
            fetchWarnings();
            fetchStats();
            alert(editWarning ? 'Avertissement mis à jour!' : 'Avertissement créé avec succès!');
        } catch (err) {
            alert(err.response?.data?.message || 'Erreur lors de la création');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet avertissement?')) return;
        try {
            await api.delete(`/warnings/${id}`);
            fetchWarnings();
            fetchStats();
        } catch (err) {
            alert(err.response?.data?.message || 'Erreur lors de la suppression');
        }
    };

    const handleResolve = async (id) => {
        const notes = prompt('Notes de résolution:');
        if (!notes) return;
        try {
            await api.post(`/warnings/${id}/resolve`, { resolution_notes: notes });
            fetchWarnings();
            fetchStats();
            alert('Avertissement résolu!');
        } catch (err) {
            alert(err.response?.data?.message || 'Erreur');
        }
    };

    const handleEdit = (warning) => {
        setEditWarning(warning);
        setFormData({
            employee_id: warning.employee_id || warning.employee?.id || '',
            warning_type: warning.warning_type || 'verbal',
            severity: warning.severity || 'medium',
            incident_date: warning.incident_date ? warning.incident_date.split('T')[0] : '',
            warning_date: warning.warning_date ? warning.warning_date.split('T')[0] : new Date().toISOString().split('T')[0],
            description: warning.description || '',
            consequence: warning.consequence || '',
            manager_id: warning.manager_id || '',
            expiry_months: warning.expiry_months || 6,
            status: warning.status || 'active',
            attachment: null
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditWarning(null);
        setFormData({
            employee_id: '',
            warning_type: 'verbal',
            severity: 'medium',
            incident_date: '',
            warning_date: new Date().toISOString().split('T')[0],
            description: '',
            consequence: '',
            manager_id: '',
            expiry_months: 6,
            status: 'active',
            attachment: null
        });
    };

    const handleGenerateLetter = async (warning) => {
        try {
            const response = await api.get(`/warnings/${warning.id}/letter`);
            setSelectedWarning(response.data.data);
            setShowLetter(true);
        } catch (err) {
            alert('Erreur lors de la génération de la lettre');
        }
    };

    const getTypeLabel = (type) => {
        const labels = {
            verbal: 'Avertissement verbal',
            written: 'Avertissement écrit',
            final_written: 'Avertissement écrit final',
            suspension: 'Avis de suspension'
        };
        return labels[type] || type;
    };

    const getSeverityLabel = (severity) => {
        const labels = {
            low: 'Faible',
            medium: 'Moyen',
            high: 'Élevé',
            critical: 'Critique'
        };
        return labels[severity] || severity;
    };

    const getSeverityColor = (severity) => {
        const colors = {
            low: 'bg-blue-100 text-blue-700',
            medium: 'bg-yellow-100 text-yellow-700',
            high: 'bg-orange-100 text-orange-700',
            critical: 'bg-red-100 text-red-700'
        };
        return colors[severity] || 'bg-slate-100 text-slate-700';
    };

    const getStatusBadge = (status) => {
        const badges = {
            active: 'bg-red-100 text-red-700',
            expired: 'bg-slate-100 text-slate-700',
            cleared: 'bg-emerald-100 text-emerald-700'
        };
        return badges[status] || 'bg-slate-100 text-slate-700';
    };

    const canManageWarnings = isAdmin() || isRH();

    return (
        <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Gestion des Avertissements</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Suivi disciplinaire des employés</p>
                </div>
                {canManageWarnings && (
                    <button 
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700"
                    >
                        <FiPlus size={18} /> Nouvel avertissement
                    </button>
                )}
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
                        <p className="text-sm text-slate-500">Total</p>
                        <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.total}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
                        <p className="text-sm text-slate-500">Actifs</p>
                        <p className="text-2xl font-bold text-red-600">{stats.active}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
                        <p className="text-sm text-slate-500">Expirés</p>
                        <p className="text-2xl font-bold text-slate-600">{stats.expired}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
                        <p className="text-sm text-slate-500">Effacés</p>
                        <p className="text-2xl font-bold text-emerald-600">{stats.cleared}</p>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700 mb-6">
                <div className="flex flex-wrap gap-4">
                    <select
                        value={filters.status}
                        onChange={(e) => setFilters({...filters, status: e.target.value})}
                        className="px-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 rounded-lg"
                    >
                        <option value="all">Tous les statuts</option>
                        <option value="active">Actif</option>
                        <option value="expired">Expiré</option>
                        <option value="cleared">Effacé</option>
                    </select>
                    <select
                        value={filters.warning_type}
                        onChange={(e) => setFilters({...filters, warning_type: e.target.value})}
                        className="px-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 rounded-lg"
                    >
                        <option value="">Tous les types</option>
                        <option value="verbal">Avertissement verbal</option>
                        <option value="written">Avertissement écrit</option>
                        <option value="final_written">Avertissement écrit final</option>
                        <option value="suspension">Avis de suspension</option>
                    </select>
                    <select
                        value={filters.department_id}
                        onChange={(e) => {
                            const selectedValue = e.target.value;
                            console.log('Department selected:', { value: selectedValue, name: e.target.options[e.target.selectedIndex]?.text });
                            setFilters({...filters, department_id: selectedValue});
                        }}
                        className="px-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 rounded-lg"
                    >
                        <option value="">Tous les départements</option>
                        {departments.map(dept => (
                            <option key={dept.id} value={dept.id}>{dept.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Warnings List */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 dark:bg-slate-900/50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Employé</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Type</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Sévérité</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Date</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Statut</th>
                                    {canManageWarnings && <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase">Actions</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {warnings.length === 0 ? (
                                    <tr>
                                        <td colSpan={canManageWarnings ? 6 : 5} className="px-4 py-8 text-center text-slate-500">
                                            Aucun avertissement
                                        </td>
                                    </tr>
                                ) : warnings.map(warning => (
                                    <tr key={warning.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-600 font-bold text-sm">
                                                    {warning.employee?.first_name?.[0]}{warning.employee?.last_name?.[0]}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-800 dark:text-white">
                                                        {warning.employee?.first_name} {warning.employee?.last_name}
                                                    </p>
                                                    <p className="text-xs text-slate-500">{warning.employee?.position}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                                            {getTypeLabel(warning.warning_type)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 text-xs rounded-full ${getSeverityColor(warning.severity)}`}>
                                                {getSeverityLabel(warning.severity)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                                            {warning.warning_date.split('T')[0]}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(warning.status)}`}>
                                                {warning.status === 'active' ? 'Actif' : warning.status === 'expired' ? 'Expiré' : 'Effacé'}
                                            </span>
                                        </td>
                                        {canManageWarnings && (
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex justify-end gap-1">
                                                    <button 
                                                        onClick={() => handleGenerateLetter(warning)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                                        title="Générer lettre"
                                                    >
                                                        <FiPrinter size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleEdit(warning)}
                                                        className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg"
                                                        title="Modifier"
                                                    >
                                                        <FiEdit size={16} />
                                                    </button>
                                                    {warning.status === 'active' && (
                                                        <button 
                                                            onClick={() => handleResolve(warning.id)}
                                                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                                                            title="Résoudre"
                                                        >
                                                            <FiCheck size={16} />
                                                        </button>
                                                    )}
                                                    <button 
                                                        onClick={() => handleDelete(warning.id)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                                        title="Supprimer"
                                                    >
                                                        <FiTrash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">
                            {editWarning ? 'Modifier l\'avertissement' : 'Nouvel Avertissement'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Employé</label>
                                <select
                                    value={formData.employee_id}
                                    onChange={(e) => setFormData({...formData, employee_id: e.target.value})}
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700"
                                    required
                                >
                                    <option value="">Sélectionner un employé</option>
                                    {employees.map(emp => (
                                        <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Type</label>
                                    <select
                                        value={formData.warning_type}
                                        onChange={(e) => setFormData({...formData, warning_type: e.target.value})}
                                        className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700"
                                        required
                                    >
                                        <option value="verbal">Avertissement verbal</option>
                                        <option value="written">Avertissement écrit</option>
                                        <option value="final_written">Avertissement écrit final</option>
                                        <option value="suspension">Avis de suspension</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Sévérité</label>
                                    <select
                                        value={formData.severity}
                                        onChange={(e) => setFormData({...formData, severity: e.target.value})}
                                        className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700"
                                        required
                                    >
                                        <option value="low">Faible</option>
                                        <option value="medium">Moyen</option>
                                        <option value="high">Élevé</option>
                                        <option value="critical">Critique</option>
                                    </select>
                                </div>
                            </div>
                            {editWarning && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Statut</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                                        className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700"
                                    >
                                        <option value="active">Actif</option>
                                        <option value="expired">Expiré</option>
                                        <option value="cleared">Effacé</option>
                                    </select>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date de l'incident</label>
                                    <input
                                        type="date"
                                        value={formData.incident_date}
                                        onChange={(e) => setFormData({...formData, incident_date: e.target.value})}
                                        className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date d'avertissement</label>
                                    <input
                                        type="date"
                                        value={formData.warning_date}
                                        onChange={(e) => setFormData({...formData, warning_date: e.target.value})}
                                        className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    rows={3}
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700"
                                    placeholder="Décrivez les faits..."
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Conséquence/Action requise</label>
                                <textarea
                                    value={formData.consequence}
                                    onChange={(e) => setFormData({...formData, consequence: e.target.value})}
                                    rows={2}
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700"
                                    placeholder="Conséquence si récidive..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Pièce jointe (PDF)</label>
                                <input
                                    type="file"
                                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                    onChange={(e) => setFormData({...formData, attachment: e.target.files[0]})}
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Mois avant expiration</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="24"
                                    value={formData.expiry_months}
                                    onChange={(e) => setFormData({...formData, expiry_months: e.target.value})}
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="submit" className="flex-1 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700">
                                    {editWarning ? 'Mettre à jour' : 'Créer'}
                                </button>
                                <button type="button" onClick={closeModal} className="flex-1 py-2.5 border border-slate-300 rounded-lg hover:bg-slate-50">
                                    Annuler
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Letter Modal */}
            {showLetter && selectedWarning && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Lettre d'Avertissement</h2>
                            <button onClick={() => setShowLetter(false)} className="text-slate-500 hover:text-slate-700">
                                <FiX size={24} />
                            </button>
                        </div>
                        <div className="border border-slate-300 p-8 bg-white">
                            <div className="text-center mb-8">
                                <h3 className="text-xl font-bold">LETTRE D'AVERTISSEMENT</h3>
                                <p className="text-sm text-slate-500">Document officiel</p>
                            </div>
                            <div className="space-y-4">
                                <p><strong>Employé:</strong> {selectedWarning.employee_name}</p>
                                <p><strong>Poste:</strong> {selectedWarning.employee_position}</p>
                                <p><strong>Type d'avertissement:</strong> {selectedWarning.warning_type}</p>
                                <p><strong>Sévérité:</strong> {selectedWarning.severity}</p>
                                <p><strong>Date de l'incident:</strong> {selectedWarning.incident_date}</p>
                                <p><strong>Date de l'avertissement:</strong> {selectedWarning.warning_date}</p>
                                <div className="mt-4">
                                    <strong>Description des faits:</strong>
                                    <p className="mt-1 p-3 bg-slate-50 rounded">{selectedWarning.description}</p>
                                </div>
                                {selectedWarning.consequence && (
                                    <div className="mt-4">
                                        <strong>Conséquence:</strong>
                                        <p className="mt-1 p-3 bg-slate-50 rounded">{selectedWarning.consequence}</p>
                                    </div>
                                )}
                                <div className="mt-8 pt-8 border-t">
                                    <p>Signature du responsable RH: _______________________</p>
                                    <p className="mt-2">Date: {selectedWarning.issuer_date}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-4">
                            <button onClick={() => window.print()} className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2">
                                <FiPrinter size={18} /> Imprimer
                            </button>
                            <button onClick={() => setShowLetter(false)} className="flex-1 py-2.5 border border-slate-300 rounded-lg hover:bg-slate-50">
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WarningList;
