import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { FiPlus, FiCheck, FiX, FiCalendar, FiClock, FiEdit, FiTrash2, FiArrowLeft } from 'react-icons/fi';

const LeaveRequestList = ({ isEdit: propIsEdit, isNew: propIsNew }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user, isAdmin, isRH, isEmployee, isResponsable } = useAuth();
    const [leaveRequests, setLeaveRequests] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(searchParams.get('status') || 'pending');
    const [showModal, setShowModal] = useState(!!propIsNew);
    const [noticePeriod, setNoticePeriod] = useState(0);
    const [noticeWarning, setNoticeWarning] = useState(null);
    const [handoverRequired, setHandoverRequired] = useState(false);
    const [isEditMode, setIsEditMode] = useState(!!propIsEdit);
    const [editingRequest, setEditingRequest] = useState(null);
    const [currentEmployeeId, setCurrentEmployeeId] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        employee_id: '',
        leave_type: 'annual',
        start_date: '',
        end_date: '',
        reason: '',
        handover_recipient: ''
    });

    useEffect(() => {
        const fetchEmployeeId = async () => {
            if (isEmployee()) {
                const empId = user?.employee?.id;
                if (empId) {
                    setCurrentEmployeeId(empId);
                    setFormData(prev => ({ ...prev, employee_id: empId }));
                } else {
                    try {
                        const profileRes = await api.get('/profile');
                        const fetchedEmpId = profileRes.data.data?.employee?.id || profileRes.data.data?.user?.employee_id || profileRes.data.data?.id;
                        if (fetchedEmpId) {
                            setCurrentEmployeeId(fetchedEmpId);
                            setFormData(prev => ({ ...prev, employee_id: fetchedEmpId }));
                        }
                    } catch (err) {
                        console.error('Error fetching profile:', err);
                    }
                }
            }
        };
        fetchEmployeeId();
    }, [user, isEmployee]);

    useEffect(() => {
        if (currentEmployeeId && !formData.employee_id) {
            setFormData(prev => ({ ...prev, employee_id: currentEmployeeId }));
        }
    }, [currentEmployeeId]);

    useEffect(() => {
        if (propIsNew) {
            setShowModal(true);
        }
    }, [propIsNew]);

    useEffect(() => {
        fetchLeaveRequests();
        fetchNoticePeriod('annual');
        if (!isEmployee()) {
            fetchEmployees();
        }
    }, [activeTab, currentEmployeeId, isEmployee()]);

    useEffect(() => {
        if (id && isEditMode) {
            fetchLeaveRequestById(id);
        }
    }, [id, isEditMode]);

    useEffect(() => {
        const status = searchParams.get('status');
        if (status && ['pending', 'approved', 'rejected'].includes(status)) {
            setActiveTab(status);
        }
    }, [searchParams]);

    const fetchLeaveRequestById = async (requestId) => {
        try {
            const response = await api.get(`/leave-requests/${requestId}`);
            const request = response.data.data;
            setEditingRequest(request);
            setFormData({
                employee_id: request.employee_id,
                leave_type: request.leave_type,
                start_date: request.start_date.split('T')[0],
                end_date: request.end_date.split('T')[0],
                reason: request.reason || '',
                handover_recipient: request.handover_recipient || ''
            });
            fetchNoticePeriod(request.leave_type);
        } catch (err) {
            console.error('Error fetching leave request:', err);
            alert('Erreur lors du chargement de la demande');
            navigate('/leave-requests');
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
            setEmployees([]);
        }
    };

    const fetchNoticePeriod = async (leaveType) => {
        try {
            const response = await api.get(`/leave-policies/${leaveType}/notice-period`);
            setNoticePeriod(response.data.data.notice_period_days);
            setNoticeWarning(null);
        } catch (err) {
            console.error('Error fetching notice period:', err);
            setNoticePeriod(0);
        }
    };

    const handleLeaveTypeChange = (leaveType) => {
        setFormData({...formData, leave_type: leaveType, handover_recipient: ''});
        fetchNoticePeriod(leaveType);
        setHandoverRequired(false);
    };

    const checkNoticePeriod = (startDate) => {
        if (!startDate || noticePeriod === 0) {
            setNoticeWarning(null);
            return;
        }
        const start = new Date(startDate);
        const now = new Date();
        const diffTime = start - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < noticePeriod) {
            setNoticeWarning(`Cette demande ne respecte pas le préavis de ${noticePeriod} jours. Il reste ${diffDays} jour(s) avant le début du congé.`);
        } else {
            setNoticeWarning(null);
        }
    };

    const checkHandover = (startDate, endDate) => {
        if (!startDate || !endDate) return;
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
        
        // Threshold is 5 days by default
        if (diffDays >= 5) {
            setHandoverRequired(true);
        } else {
            setHandoverRequired(false);
            setFormData(prev => ({ ...prev, handover_recipient: '' }));
        }
    };

    const fetchLeaveRequests = async () => {
        try {
            setLoading(true);
            let response;
            
            const isRegularEmployee = isEmployee() && !isAdmin() && !isRH() && !isResponsable();
            
            const statusParam = activeTab !== 'all' ? `&status=${activeTab}` : '';
            
            if (isRegularEmployee) {
                try {
                    response = await api.get(`/my-leave-requests?${statusParam}`);
                } catch {
                    if (currentEmployeeId) {
                        response = await api.get(`/leave-requests?employee_id=${currentEmployeeId}${statusParam}`);
                    } else {
                        response = await api.get(`/leave-requests?${statusParam}`);
                    }
                }
            } else {
                response = await api.get(`/leave-requests?${statusParam}`);
            }
            
            let data = [];
            const responseData = response.data.data;
            
            if (Array.isArray(responseData)) {
                data = responseData;
            } else if (responseData?.data && Array.isArray(responseData.data)) {
                data = responseData.data;
            } else if (responseData?.data?.data && Array.isArray(responseData.data.data)) {
                data = responseData.data.data;
            } else if (responseData?.data && typeof responseData.data === 'object') {
                data = responseData.data;
            }
            
            setLeaveRequests(data);
        } catch (err) {
            console.error('Error fetching leave requests:', err);
            setLeaveRequests([]);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id) => {
        if (!window.confirm('Approuver cette demande?')) return;
        try {
            await api.post(`/leave-requests/${id}/approve`);
            fetchLeaveRequests();
        } catch (err) {
            alert(err.response?.data?.message || 'Erreur lors de l\'approbation de la demande');
        }
    };

    const handleReject = async (id) => {
        const reason = prompt('Motif du rejet:');
        if (!reason) return;
        try {
            await api.post(`/leave-requests/${id}/reject`, { rejection_reason: reason });
            fetchLeaveRequests();
        } catch (err) {
            alert(err.response?.data?.message || 'Erreur lors du rejet de la demande');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette demande?')) return;
        try {
            await api.delete(`/leave-requests/${id}`);
            fetchLeaveRequests();
            navigate('/leave-requests');
        } catch (err) {
            alert(err.response?.data?.message || 'Erreur lors de la suppression de la demande');
        }
    };

    const handleCompleteHandover = async (id) => {
        const notes = prompt('Notes de passation (optionnel):');
        try {
            await api.post(`/leave-requests/${id}/complete-handover`, {
                handover_notes: notes || ''
            });
            fetchLeaveRequests();
            alert('Passation complétée avec succès!');
        } catch (err) {
            alert(err.response?.data?.message || 'Erreur lors de la passation');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const submitData = { ...formData };
            
            if ((isAdmin() || isRH()) && !submitData.employee_id) {
                alert('Veuillez sélectionner un employé.');
                setSubmitting(false);
                return;
            }
            
            if (isEmployee() && !submitData.employee_id) {
                delete submitData.employee_id;
            }
            
            if (isEditMode && id) {
                const response = await api.put(`/leave-requests/${id}`, submitData);
                alert('Demande mise à jour avec succès');
                setIsEditMode(false);
                navigate('/leave-requests');
            } else {
                const response = await api.post('/leave-requests', submitData);
                
                if (response.data.success || response.status === 201) {
                    alert('Demande soumise avec succès!');
                } else if (response.data.warning) {
                    alert(response.data.warning);
                } else if (response.data.handover_required) {
                    alert(response.data.handover_message);
                }
                
                setShowModal(false);
                setFormData({ employee_id: '', leave_type: 'annual', start_date: '', end_date: '', reason: '', handover_recipient: '' });
                setNoticeWarning(null);
                setHandoverRequired(false);
                fetchLeaveRequests();
            }
        } catch (err) {
            console.error('Error creating/updating leave request:', err);
            const errors = err.response?.data?.errors;
            let errorMsg = 'Erreur lors de la soumission';
            if (errors) {
                errorMsg = Object.values(errors).flat().join(', ');
            } else if (err.response?.data?.message) {
                errorMsg = err.response.data.message;
            }
            alert(errorMsg);
        } finally {
            setSubmitting(false);
        }
    };

    const pendingCount = leaveRequests.filter(r => r.status === 'pending').length;
    const approvedCount = leaveRequests.filter(r => r.status === 'approved').length;
    const rejectedCount = leaveRequests.filter(r => r.status === 'rejected').length;

    const getStatusBadge = (status) => {
        const styles = {
            pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
            approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
            rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
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
            other: 'Congé personnel',
            maternity: 'Maternité',
            paternity: 'Paternité',
            unpaid: 'Sans solde',
            internship: 'Stagiaire',
            warning_verbal: 'Avertissement verbal',
            warning_written: 'Avertissement écrit',
            preavis: 'Préavis'
        };
        return types[type] || type;
    };

    return (
        <div>
            {isEditMode && editingRequest ? (
                <div className="max-w-2xl mx-auto">
                    <div className="flex items-center gap-4 mb-6">
                        <button 
                            onClick={() => {
                                setIsEditMode(false);
                                navigate('/leave-requests');
                            }}
                            className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            <FiArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Modifier la demande</h1>
                            <p className="text-slate-500 dark:text-slate-400 mt-1">Mettre à jour les informations de la demande</p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Employé</label>
                                <select
                                    value={formData.employee_id}
                                    onChange={(e) => setFormData({...formData, employee_id: e.target.value})}
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white"
                                    required
                                >
                                    <option value="">Sélectionner un employé</option>
                                    {employees.map(emp => (
                                        <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Type de congés</label>
                                <select
                                    value={formData.leave_type}
                                    onChange={(e) => handleLeaveTypeChange(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white"
                                    required
                                >
                                    <option value="annual">Congé annuel</option>
                                    <option value="sick">Maladie</option>
                                    <option value="personal">Congé personnel</option>
                                    <option value="maternity">Maternité</option>
                                    <option value="paternity">Paternité</option>
                                    <option value="unpaid">Sans solde</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date de début</label>
                                    <input
                                        type="date"
                                        value={formData.start_date}
                                        onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date de fin</label>
                                    <input
                                        type="date"
                                        value={formData.end_date}
                                        onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Raison</label>
                                <textarea
                                    value={formData.reason}
                                    onChange={(e) => setFormData({...formData, reason: e.target.value})}
                                    rows={3}
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white"
                                    placeholder="Motif de la demande (optionnel)"
                                />
                            </div>

                            {noticeWarning && (
                                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                                    <p className="text-sm text-amber-700 dark:text-amber-400">{noticeWarning}</p>
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsEditMode(false);
                                        navigate('/leave-requests');
                                    }}
                                    className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                                >
                                    {submitting ? 'Mise à jour...' : 'Mettre à jour'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : (
                <>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Demandes de Congés</h1>
                            <p className="text-slate-500 dark:text-slate-400 mt-1">Gérez les demandes de congés</p>
                        </div>
                        <button 
                            onClick={() => setShowModal(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all"
                        >
                            <FiPlus size={18} />
                            <span>Nouvelle demande</span>
                        </button>
                    </div>
                </>
            )}

            <div className="flex gap-6 border-b border-slate-200 dark:border-slate-700 mb-6">
                <button 
                    onClick={() => setActiveTab('pending')}
                    className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'pending' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    En attente ({pendingCount})
                </button>
                <button 
                    onClick={() => setActiveTab('approved')}
                    className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'approved' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    Approuvées ({approvedCount})
                </button>
                <button 
                    onClick={() => setActiveTab('rejected')}
                    className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'rejected' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    Refusées ({rejectedCount})
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            ) : (
                <div className="grid gap-4">
                    {leaveRequests.map((req) => (
                        <div key={req.id} className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold">
                                    {req.employee?.first_name?.[0]}{req.employee?.last_name?.[0]}
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-800 dark:text-white">
                                        {req.employee?.first_name} {req.employee?.last_name}
                                    </p>
                                    <p className="text-sm text-slate-500">
                                        {getLeaveTypeLabel(req.leave_type)} • {req.start_date ? req.start_date.split('T')[0] : '-'} - {req.end_date ? req.end_date.split('T')[0] : '-'}
                                        ({req.total_days || req.days || 1} jour{req.total_days > 1 || req.days > 1 ? 's' : ''})
                                    </p>
                                    {req.reason && (
                                        <p className="text-sm text-slate-500 mt-1 italic">"{req.reason}"</p>
                                    )}
                                    {req.handover_required && (
                                        <div className="mt-2 flex items-center gap-2">
                                            {req.handover_completed ? (
                                                <span className="px-2 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs rounded-full flex items-center gap-1">
                                                    <FiCheck className="w-3 h-3" /> Passation complétée
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs rounded-full">
                                                    Passation en attente
                                                </span>
                                            )}
                                            {req.handover_recipient && (
                                                <span className="text-xs text-slate-500">
                                                    → {req.handover_recipient}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {getStatusBadge(req.status)}
                                {req.status === 'pending' && (isAdmin() || isRH() || isResponsable()) && (
                                    <>
                                        {req.handover_required && !req.handover_completed && (
                                            <button 
                                                onClick={() => handleCompleteHandover(req.id)}
                                                className="p-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                                                title="Compléter la passation"
                                            >
                                                <FiClock size={16} />
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => handleApprove(req.id)}
                                            className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                                            title="Approuver"
                                        >
                                            <FiCheck size={16} />
                                        </button>
                                        <button 
                                            onClick={() => handleReject(req.id)}
                                            className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                            title="Rejeter"
                                        >
                                            <FiX size={16} />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(req.id)}
                                            className="p-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700"
                                            title="Supprimer"
                                        >
                                            <FiTrash2 size={16} />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                    {leaveRequests.length === 0 && (
                        <div className="text-center py-12">
                            <FiCalendar className="mx-auto h-12 w-12 text-slate-400" />
                            <h3 className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">Aucune demande</h3>
                            <p className="mt-1 text-sm text-slate-500">Aucune demande de congés trouvée.</p>
                        </div>
                    )}
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Nouvelle demande de congé</h2>
                            <button 
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                            >
                                <FiX size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {(isAdmin() || isRH()) && (
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
                                            <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            {isEmployee() && (
                                <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg text-sm text-slate-600 dark:text-slate-400">
                                    Cette demande sera soumise en votre nom.
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Type de congés</label>
                                <select
                                    value={formData.leave_type}
                                    onChange={(e) => handleLeaveTypeChange(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                                    required
                                >
                                    <option value="annual">Congé annuel</option>
                                    <option value="sick">Maladie</option>
                                    <option value="other">Congé personnel</option>
                                    <option value="maternity">Maternité</option>
                                    <option value="paternity">Paternité</option>
                                    <option value="unpaid">Sans solde</option>
                                </select>
                                {noticePeriod > 0 && (
                                    <div className="mt-2 flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                                        <FiClock className="w-4 h-4" />
                                        <span>Préavis requis: {noticePeriod} jour(s)</span>
                                    </div>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date de début</label>
                                    <input
                                        type="date"
                                        value={formData.start_date}
                                        onChange={(e) => {
                                            setFormData({...formData, start_date: e.target.value});
                                            checkNoticePeriod(e.target.value);
                                        }}
                                        className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date de fin</label>
                                    <input
                                        type="date"
                                        value={formData.end_date}
                                        onChange={(e) => {
                                            setFormData({...formData, end_date: e.target.value});
                                            checkHandover(formData.start_date, e.target.value);
                                        }}
                                        className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                                        required
                                    />
                                </div>
                            </div>
                            {handoverRequired && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Personne prenant en charge la passation
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.handover_recipient}
                                        onChange={(e) => setFormData({...formData, handover_recipient: e.target.value})}
                                        className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                                        placeholder="Nom de la personne..."
                                        required={handoverRequired}
                                    />
                                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                                        Passation requise pour les congés de 5 jours ou plus
                                    </p>
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Motif</label>
                                <textarea
                                    value={formData.reason}
                                    onChange={(e) => setFormData({...formData, reason: e.target.value})}
                                    rows={3}
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                                    placeholder="Raison du congé..."
                                />
                            </div>
                            {noticeWarning && (
                                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                                    <p className="text-sm text-amber-700 dark:text-amber-400">{noticeWarning}</p>
                                </div>
                            )}
                            <div className="flex gap-3 pt-2">
                                <button 
                                    type="submit" 
                                    disabled={submitting}
                                    className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {submitting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Envoi...
                                        </>
                                    ) : 'Soumettre'}
                                </button>
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-slate-300 rounded-lg hover:bg-slate-50">
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

export default LeaveRequestList;
