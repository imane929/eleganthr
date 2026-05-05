import { useState, useEffect } from 'react';
import api from '../../services/api';
import { FiPlus, FiCheck, FiClock, FiAlertTriangle, FiCalendar, FiUsers, FiEdit, FiTrash2 } from 'react-icons/fi';

const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return dateStr.split('T')[0];
};

const AbsenceList = () => {
    const [absences, setAbsences] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editAbsence, setEditAbsence] = useState(null);
    const [formData, setFormData] = useState({
        employee_id: '',
        date: '',
        type: 'unjustified',
        reason: ''
    });

    useEffect(() => {
        fetchAbsences();
        fetchEmployees();
    }, []);

    const fetchAbsences = async () => {
        try {
            setLoading(true);
            const response = await api.get('/absences');
            const responseData = response.data.data;
            let data = [];
            if (Array.isArray(responseData)) {
                data = responseData;
            } else if (responseData && Array.isArray(responseData.data)) {
                data = responseData.data;
            } else if (responseData && responseData.data && Array.isArray(responseData.data.data)) {
                data = responseData.data.data;
            }
            setAbsences(data);
        } catch (err) {
            console.error('Error fetching absences:', err);
            setAbsences([]);
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

    const handleJustify = async (id) => {
        const justification = prompt('Entrez la justification:');
        if (!justification) return;
        
        try {
            await api.post(`/absences/${id}/justify`, { justification });
            fetchAbsences();
        } catch (err) {
            alert(err.response?.data?.message || 'Erreur lors de la justification de l\'absence');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette absence?')) return;
        try {
            await api.delete(`/absences/${id}`);
            fetchAbsences();
        } catch (err) {
            alert(err.response?.data?.message || 'Erreur lors de la suppression de l\'absence');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editAbsence) {
                await api.put(`/absences/${editAbsence.id}`, formData);
            } else {
                await api.post('/absences', formData);
            }
            setShowModal(false);
            setEditAbsence(null);
            setFormData({ employee_id: '', date: '', type: 'unjustified', reason: '' });
            fetchAbsences();
        } catch (err) {
            alert(err.response?.data?.message || 'Error saving absence');
        }
    };

    const handleEdit = (absence) => {
        setEditAbsence(absence);
        setFormData({
            employee_id: absence.employee_id || absence.employee?.id || '',
            date: absence.date ? absence.date.split('T')[0] : '',
            type: absence.type || 'unjustified',
            reason: absence.reason || ''
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditAbsence(null);
        setFormData({ employee_id: '', date: '', type: 'unjustified', reason: '' });
    };

    const justifiedCount = absences.filter(a => a.status === 'justified').length;
    const unjustifiedCount = absences.filter(a => a.status !== 'justified').length;
    const totalCount = absences.length;
    const presenceRate = totalCount > 0 ? ((1 - unjustifiedCount / 50) * 100).toFixed(1) : 100;

    const getStatusBadge = (status) => {
        if (status === 'justified') {
            return (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                    Justifiée
                </span>
            );
        }
        return (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">
                Non justifiée
            </span>
        );
    };

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Gestion des Absences</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Suivez et gérez les absences</p>
                </div>
                <button 
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all"
                >
                    <FiPlus size={18} />
                    <span>Signaler une absence</span>
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-sm text-slate-500 dark:text-slate-400">Total Absences</p>
                        <FiClock className="text-rose-500" />
                    </div>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white">{totalCount}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-sm text-slate-500 dark:text-slate-400">Justifiées</p>
                        <FiCheck className="text-emerald-500" />
                    </div>
                    <p className="text-2xl font-bold text-emerald-600">{justifiedCount}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-sm text-slate-500 dark:text-slate-400">Non justifiées</p>
                        <FiAlertTriangle className="text-amber-500" />
                    </div>
                    <p className="text-2xl font-bold text-amber-600">{unjustifiedCount}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-sm text-slate-500 dark:text-slate-400">Taux présence</p>
                        <FiUsers className="text-indigo-500" />
                    </div>
                    <p className="text-2xl font-bold text-indigo-600">{presenceRate}%</p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-700">
                    <h3 className="font-bold text-slate-800 dark:text-white">Historique des absences</h3>
                </div>
                
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-900/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Employé</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Date</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Motif</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Statut</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {absences.map((absence) => (
                                <tr key={absence.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 font-bold text-sm">
                                                {absence.employee?.first_name?.[0]}{absence.employee?.last_name?.[0]}
                                            </div>
                                            <span className="font-medium text-slate-800 dark:text-white">
                                                {absence.employee?.first_name} {absence.employee?.last_name}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{formatDate(absence.date)}</td>
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{absence.reason || '-'}</td>
                                    <td className="px-6 py-4">
                                        {getStatusBadge(absence.status)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => handleEdit(absence)}
                                                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                                                title="Modifier"
                                            >
                                                <FiEdit size={16} />
                                            </button>
                                            {absence.status !== 'justified' && (
                                                <button 
                                                    onClick={() => handleJustify(absence.id)}
                                                    className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                                                    title="Justifier"
                                                >
                                                    <FiCheck size={16} />
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => handleDelete(absence.id)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                                title="Supprimer"
                                            >
                                                <FiTrash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {absences.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                                        Aucune absence enregistrée
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
                            {editAbsence ? 'Modifier l\'absence' : 'Signaler une absence'}
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
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date</label>
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Type</label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                                    required
                                >
                                    <option value="unjustified">Non justifiée</option>
                                    <option value="justified">Justifiée</option>
                                    <option value="sick">Maladie</option>
                                    <option value="personal">Personnel</option>
                                    <option value="other">Autre</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Motif</label>
                                <textarea
                                    value={formData.reason}
                                    onChange={(e) => setFormData({...formData, reason: e.target.value})}
                                    rows={3}
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                                    placeholder="Raison de l'absence..."
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="submit" className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                                    {editAbsence ? 'Mettre à jour' : 'Enregistrer'}
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

export default AbsenceList;
