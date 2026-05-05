import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { FiPlus, FiEdit2, FiTrash2, FiFolder, FiUsers, FiEye } from 'react-icons/fi';

const DepartmentList = () => {
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchDepartments();
    }, []);

    const fetchDepartments = async () => {
        try {
            setLoading(true);
            const response = await api.get('/departments');
            const responseData = response.data.data;
            let deptData = [];
            if (Array.isArray(responseData)) {
                deptData = responseData;
            } else if (responseData && Array.isArray(responseData.data)) {
                deptData = responseData.data;
            } else if (responseData && responseData.data && Array.isArray(responseData.data.data)) {
                deptData = responseData.data.data;
            }
            setDepartments(deptData);
        } catch (err) {
            console.error('Error fetching departments:', err);
            setError('Failed to load departments');
            setDepartments([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce département?')) return;
        
        try {
            await api.delete(`/departments/${id}`);
            fetchDepartments();
            setShowModal(false);
        } catch (err) {
            alert(err.response?.data?.message || 'Error deleting department');
        }
    };

    const getColorClass = (index) => {
        const colors = ['indigo', 'purple', 'cyan', 'pink', 'amber', 'emerald', 'rose', 'blue'];
        return colors[index % colors.length];
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Départements</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Gérez la structure organisationnelle</p>
                </div>
                <button 
                    onClick={() => navigate('/departments/new')}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all"
                >
                    <FiPlus size={18} />
                    <span>Ajouter</span>
                </button>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {departments.map((dept, index) => (
                    <div key={dept.id} className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-100 dark:border-slate-700 hover:shadow-lg transition-shadow group">
                        <div className="flex items-center justify-between mb-4">
                            <button 
                                onClick={() => navigate(`/departments/${dept.id}`)}
                                className={`w-12 h-12 bg-${getColorClass(index)}-100 dark:bg-${getColorClass(index)}-900/30 rounded-xl flex items-center justify-center hover:scale-105 transition-transform cursor-pointer`}
                            >
                                <FiFolder className={`text-${getColorClass(index)}-600`} />
                            </button>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => navigate(`/departments/${dept.id}`)}
                                    className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                                    title="Voir détails"
                                >
                                    <FiEye size={16} />
                                </button>
                                <button 
                                    onClick={() => navigate(`/departments/${dept.id}/edit`)}
                                    className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                                >
                                    <FiEdit2 size={16} />
                                </button>
                                <button 
                                    onClick={() => handleDelete(dept.id)}
                                    className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                                >
                                    <FiTrash2 size={16} />
                                </button>
                            </div>
                        </div>
                        <button 
                            onClick={() => navigate(`/departments/${dept.id}`)}
                            className="text-left w-full"
                        >
                            <h3 className="font-bold text-slate-800 dark:text-white text-lg group-hover:text-indigo-600 transition-colors">{dept.name}</h3>
                            {dept.description && (
                                <p className="text-sm text-slate-500 mt-1 line-clamp-2">{dept.description}</p>
                            )}
                            <div className="flex items-center gap-2 mt-3 text-sm text-slate-500">
                                <FiUsers size={14} />
                                <span>{dept.employees_count || 0} employés</span>
                            </div>
                            {dept.manager && (
                                <div className="flex items-center gap-1 mt-1 text-xs text-indigo-600 dark:text-indigo-400">
                                    <span>Responsable: {dept.manager.first_name} {dept.manager.last_name}</span>
                                </div>
                            )}
                        </button>
                    </div>
                ))}
            </div>

            {departments.length === 0 && (
                <div className="text-center py-12">
                    <FiFolder className="mx-auto h-12 w-12 text-slate-400" />
                    <h3 className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">Aucun département</h3>
                    <p className="mt-1 text-sm text-slate-500">Commencez par créer un département.</p>
                </div>
            )}
        </div>
    );
};

export default DepartmentList;
