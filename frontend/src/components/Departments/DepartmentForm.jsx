import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';

const DepartmentForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = Boolean(id);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        manager_id: ''
    });
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(isEdit);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchEmployees();
        if (isEdit) {
            fetchDepartment();
        }
    }, [id]);

    const fetchDepartment = async () => {
        try {
            const response = await api.get(`/departments/${id}`);
            const dept = response.data.data || response.data;
            setFormData({
                name: dept.name || '',
                description: dept.description || '',
                manager_id: dept.manager_id || ''
            });
        } catch (err) {
            console.error('Error fetching department:', err);
            setError('Failed to load department');
        } finally {
            setFetching(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            const response = await api.get('/employees');
            const data = response.data.data?.data || response.data.data || response.data || [];
            setEmployees(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error fetching employees:', err);
            setEmployees([]);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isEdit) {
                await api.put(`/departments/${id}`, formData);
            } else {
                await api.post('/departments', formData);
            }
            navigate('/departments');
        } catch (err) {
            console.error('Error saving department:', err);
            const errorMsg = err.response?.data?.message || 
                           (err.response?.data?.errors ? Object.values(err.response.data.errors).flat().join(', ') : 'Failed to save department');
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                    {isEdit ? 'Modifier le département' : 'Nouveau département'}
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">
                    {isEdit ? 'Modifiez les informations du département' : 'Créez un nouveau département'}
                </p>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Nom du département *
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            placeholder="Ex: Ressources Humaines"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Description
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={4}
                            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            placeholder="Description du département..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Responsable
                        </label>
                        <select
                            name="manager_id"
                            value={formData.manager_id}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                            <option value="">Sélectionner un responsable</option>
                            {employees.map(emp => (
                                <option key={emp.id} value={emp.id}>
                                    {emp.first_name} {emp.last_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-4 pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50"
                        >
                            {loading ? 'Enregistrement...' : (isEdit ? 'Mettre à jour' : 'Créer')}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/departments')}
                            className="px-6 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                        >
                            Annuler
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DepartmentForm;
