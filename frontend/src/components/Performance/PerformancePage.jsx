import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { FiTarget, FiPlus, FiTrash2, FiEdit2, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

const PerformancePage = () => {
    const { isAdmin, isRH } = useAuth();
    const [activeTab, setActiveTab] = useState('goals');
    const [goals, setGoals] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showGoalForm, setShowGoalForm] = useState(false);
    const [goalForm, setGoalForm] = useState({ title: '', employee_id: '', description: '', start_date: '', target_date: '' });
    const [myEmployeeId, setMyEmployeeId] = useState(null);
    const [editingGoal, setEditingGoal] = useState(null);
    const [editForm, setEditForm] = useState({ title: '', description: '', target_date: '', status: '' });

    const isViewer = isAdmin() || isRH();

    useEffect(() => {
        fetchMyEmployeeId();
    }, []);

    const fetchMyEmployeeId = async () => {
        try {
            const { data } = await api.get('/profile');
            if (data.data?.employee?.id) {
                setMyEmployeeId(data.data.employee.id);
            }
        } catch (e) { /* ignore */ }
        loadData();
    };

    const loadData = async () => {
        setLoading(true);
        try {
            let goalsData = [];
            let reviewsData = [];
            let statsData = null;

            if (isViewer) {
                const [goalsRes, reviewsRes, statsRes] = await Promise.allSettled([
                    api.get('/performance/goals', { params: { per_page: 50 } }),
                    api.get('/performance/reviews', { params: { per_page: 50 } }),
                    api.get('/performance/statistics'),
                ]);

                if (goalsRes.status === 'fulfilled') {
                    const d = goalsRes.value.data.data;
                    goalsData = d.data || d || [];
                }
                if (reviewsRes.status === 'fulfilled') {
                    const d = reviewsRes.value.data.data;
                    reviewsData = d.data || d || [];
                }
                if (statsRes.status === 'fulfilled') {
                    statsData = statsRes.value.data.data;
                }
            } else {
                const [perfRes, statsRes] = await Promise.allSettled([
                    api.get('/my-performance'),
                    api.get('/my-performance/statistics'),
                ]);

                if (perfRes.status === 'fulfilled') {
                    goalsData = perfRes.value.data.data.goals || [];
                    reviewsData = perfRes.value.data.data.reviews || [];
                }
                if (statsRes.status === 'fulfilled') {
                    statsData = statsRes.value.data.data;
                }
            }

            setGoals(goalsData);
            setReviews(reviewsData);
            setStats(statsData);
        } catch (error) {
            toast.error('Échec du chargement des données de performance');
        } finally {
            setLoading(false);
        }
    };

    const createGoal = async (e) => {
        e.preventDefault();
        const payload = { ...goalForm };
        if (!isViewer && myEmployeeId) {
            payload.employee_id = myEmployeeId;
        }
        try {
            await api.post('/performance/goals', payload);
            toast.success('Objectif créé');
            setShowGoalForm(false);
            setGoalForm({ title: '', employee_id: '', description: '', start_date: '', target_date: '' });
            loadData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Échec de la création de l\'objectif');
        }
    };

    const updateProgress = async (id, progress) => {
        try {
            await api.post(`/performance/goals/${id}/progress`, { progress });
            toast.success('Progression mise à jour');
            loadData();
        } catch (error) {
            toast.error('Échec de la mise à jour');
        }
    };

    const deleteGoal = async (id) => {
        if (!window.confirm('Supprimer cet objectif ?')) return;
        try {
            await api.delete(`/performance/goals/${id}`);
            toast.success('Objectif supprimé');
            loadData();
        } catch (error) {
            toast.error('Échec de la suppression');
        }
    };

    const startEditGoal = (goal) => {
        setEditingGoal(goal.id);
        setEditForm({
            title: goal.title,
            description: goal.description || '',
            target_date: goal.target_date ? goal.target_date.split('T')[0] : '',
            status: goal.status || 'not_started',
        });
    };

    const saveEditGoal = async (id) => {
        try {
            await api.put(`/performance/goals/${id}`, editForm);
            toast.success('Objectif modifié');
            setEditingGoal(null);
            loadData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Échec de la modification');
        }
    };

    const cycleStatus = async (goal) => {
        const cycle = ['not_started', 'in_progress', 'completed', 'cancelled'];
        const idx = cycle.indexOf(goal.status || 'not_started');
        const nextStatus = cycle[(idx + 1) % cycle.length];
        try {
            await api.put(`/performance/goals/${goal.id}`, { status: nextStatus });
            toast.success(`Statut → ${statusLabels[nextStatus]}`);
            loadData();
        } catch (error) {
            toast.error('Échec du changement de statut');
        }
    };

    const gradeColors = {
        'Excellent': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        'Very Good': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
        'Good': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
        'Needs Improvement': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
        'Poor': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };

    const statusColors = {
        'not_started': 'bg-gray-100 text-gray-800',
        'in_progress': 'bg-blue-100 text-blue-800',
        'completed': 'bg-green-100 text-green-800',
        'cancelled': 'bg-red-100 text-red-800',
    };

    const statusLabels = {
        'not_started': 'Non démarré',
        'in_progress': 'En cours',
        'completed': 'Terminé',
        'cancelled': 'Annulé',
    };

    const gradeLabels = {
        'Excellent': 'Excellent',
        'Very Good': 'Très bien',
        'Good': 'Bien',
        'Needs Improvement': 'À améliorer',
        'Poor': 'Insuffisant',
    };

    if (loading) return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

    return (
        <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Gestion de la Performance</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Objectifs et évaluations</p>
                </div>
                <button onClick={() => setShowGoalForm(!showGoalForm)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2">
                    <FiPlus /> Nouvel Objectif
                </button>
            </div>

            {/* Stats */}
            {stats && (
                <div className="mb-6 grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                        <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.total_goals}</p>
                        <p className="text-sm text-slate-500">Total Objectifs</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                        <p className="text-2xl font-bold text-green-600">{stats.completed_goals}</p>
                        <p className="text-sm text-slate-500">Terminés</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                        <p className="text-2xl font-bold text-blue-600">{stats.in_progress_goals}</p>
                        <p className="text-sm text-slate-500">En cours</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                        <p className="text-2xl font-bold text-indigo-600">{stats.average_score}</p>
                        <p className="text-sm text-slate-500">Score Moyen</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                        <p className="text-2xl font-bold text-purple-600">{stats.goal_completion_rate}%</p>
                        <p className="text-sm text-slate-500">Taux d'achèvement</p>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-2 mb-4 border-b border-slate-200 dark:border-slate-700">
                <button onClick={() => setActiveTab('goals')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'goals' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`}>Objectifs</button>
                <button onClick={() => setActiveTab('reviews')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'reviews' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`}>Évaluations</button>
            </div>

            {/* Goal Form */}
            {showGoalForm && (
                <form onSubmit={createGoal} className="mb-6 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {isViewer && <input type="number" placeholder="ID Employé" value={goalForm.employee_id} onChange={e => setGoalForm({...goalForm, employee_id: e.target.value})} className="p-2 border rounded-lg dark:bg-slate-700 dark:text-white" required />}
                        <input type="text" placeholder="Titre de l'objectif" value={goalForm.title} onChange={e => setGoalForm({...goalForm, title: e.target.value})} className="p-2 border rounded-lg dark:bg-slate-700 dark:text-white" required />
                        <input type="date" value={goalForm.start_date} onChange={e => setGoalForm({...goalForm, start_date: e.target.value})} className="p-2 border rounded-lg dark:bg-slate-700 dark:text-white" required />
                        <input type="date" value={goalForm.target_date} onChange={e => setGoalForm({...goalForm, target_date: e.target.value})} className="p-2 border rounded-lg dark:bg-slate-700 dark:text-white" />
                    </div>
                    <div className="flex gap-2 mt-4">
                        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Créer</button>
                        <button type="button" onClick={() => { setShowGoalForm(false); setGoalForm({ title: '', employee_id: '', description: '', start_date: '', target_date: '' }); }} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded-lg">Annuler</button>
                    </div>
                </form>
            )}

            {/* Goals Tab */}
            {activeTab === 'goals' && (
                <div className="space-y-3">
                    {goals.map(goal => (
                        <div key={goal.id} className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                            {editingGoal === goal.id ? (
                                <div>
                                    <h3 className="font-semibold text-slate-800 dark:text-white mb-3 flex items-center gap-2"><FiEdit2 className="text-indigo-500" /> Modifier l'objectif</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <input type="text" value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} className="p-2 border rounded-lg dark:bg-slate-700 dark:text-white" required />
                                        <select value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})} className="p-2 border rounded-lg dark:bg-slate-700 dark:text-white">
                                            <option value="not_started">Non démarré</option>
                                            <option value="in_progress">En cours</option>
                                            <option value="completed">Terminé</option>
                                            <option value="cancelled">Annulé</option>
                                        </select>
                                        <input type="date" value={editForm.target_date} onChange={e => setEditForm({...editForm, target_date: e.target.value})} className="p-2 border rounded-lg dark:bg-slate-700 dark:text-white" />
                                        <textarea value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} placeholder="Description" className="p-2 border rounded-lg dark:bg-slate-700 dark:text-white" rows={2}></textarea>
                                    </div>
                                    <div className="flex gap-2 mt-3">
                                        <button onClick={() => saveEditGoal(goal.id)} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm">Sauvegarder</button>
                                        <button onClick={() => setEditingGoal(null)} className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg text-sm">Annuler</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <FiTarget className="text-indigo-500" />
                                            <h3 className="font-semibold text-slate-800 dark:text-white">{goal.title}</h3>
                                        </div>
                                        <p className="text-sm text-slate-500 mb-3">{goal.employee?.full_name || '-'}</p>
                                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                                            <div className="bg-indigo-600 h-2 rounded-full transition-all" style={{ width: `${goal.current_progress || 0}%` }}></div>
                                        </div>
                                        <div className="flex items-center justify-between mt-2">
                                            <span className="text-xs text-slate-500">{goal.current_progress || 0}% complété</span>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[goal.status] || 'bg-gray-100 text-gray-800'}`}>{statusLabels[goal.status] || goal.status}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2 ml-4">
                                        <div className="flex items-center gap-1">
                                            {[0, 25, 50, 75, 100].map(pct => (
                                                <button key={pct} onClick={() => updateProgress(goal.id, pct)} className={`w-8 h-8 rounded-full text-xs font-medium transition-all ${(goal.current_progress || 0) === pct ? 'bg-indigo-600 text-white shadow-md' : (goal.current_progress || 0) > pct ? 'bg-green-100 text-green-600 dark:bg-green-900/30' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 hover:bg-indigo-100 dark:hover:bg-indigo-900/20'}`}>{pct}%</button>
                                            ))}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => cycleStatus(goal)} className="w-7 h-7 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-900/20 flex items-center justify-center" title={`Statut : ${statusLabels[goal.status] || goal.status}`}>
                                                <FiCheckCircle className="w-3.5 h-3.5" />
                                            </button>
                                            <button onClick={() => startEditGoal(goal)} className="w-7 h-7 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/20 flex items-center justify-center" title="Modifier">
                                                <FiEdit2 className="w-3.5 h-3.5" />
                                            </button>
                                            {isViewer && (
                                                <button onClick={() => deleteGoal(goal.id)} className="w-7 h-7 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 flex items-center justify-center" title="Supprimer">
                                                    <FiTrash2 className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    {goals.length === 0 && <div className="p-8 text-center text-slate-500">Aucun objectif trouvé</div>}
                </div>
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
                <div className="space-y-3">
                    {reviews.map(review => (
                        <div key={review.id} className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <h3 className="font-semibold text-slate-800 dark:text-white">{review.employee?.full_name || 'Mon Évaluation'}</h3>
                                    <p className="text-sm text-slate-500">Période : {review.period} | {new Date(review.review_date).toLocaleDateString()}</p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-sm font-bold ${gradeColors[review.grade] || 'bg-gray-100 text-gray-800'}`}>{gradeLabels[review.grade] || review.grade || 'N/A'} ({review.overall_score || 0}/10)</span>
                            </div>
                            {review.strengths && <p className="text-sm text-slate-600 dark:text-slate-300"><strong>Points forts :</strong> {review.strengths}</p>}
                            {review.areas_for_improvement && <p className="text-sm text-slate-600 dark:text-slate-300 mt-1"><strong>Points à améliorer :</strong> {review.areas_for_improvement}</p>}
                        </div>
                    ))}
                    {reviews.length === 0 && <div className="p-8 text-center text-slate-500">Aucune évaluation trouvée</div>}
                </div>
            )}
        </div>
    );
};

export default PerformancePage;
