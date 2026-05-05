import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { FiArrowLeft, FiPlus, FiEdit2, FiUsers, FiMail, FiPhone, FiBriefcase, FiX, FiSearch, FiCheck } from 'react-icons/fi';

const DepartmentDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [department, setDepartment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [allEmployees, setAllEmployees] = useState([]);
    const [loadingEmployees, setLoadingEmployees] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedEmployees, setSelectedEmployees] = useState([]);

    useEffect(() => {
        fetchDepartment();
    }, [id]);

    const fetchDepartment = async () => {
        try {
            const response = await api.get(`/departments/${id}`);
            const dept = response.data.data || response.data;
            setDepartment(dept);
        } catch (err) {
            console.error('Error fetching department:', err);
            setError('Échec du chargement du département');
        } finally {
            setLoading(false);
        }
    };

    const fetchAllEmployees = async () => {
        setLoadingEmployees(true);
        try {
            const response = await api.get('/employees?per_page=100');
            const employees = response.data.data?.data || response.data.data || response.data || [];
            setAllEmployees(Array.isArray(employees) ? employees : []);
        } catch (err) {
            console.error('Error fetching employees:', err);
            setAllEmployees([]);
        } finally {
            setLoadingEmployees(false);
        }
    };

    const openAddModal = () => {
        setSelectedEmployees([]);
        setSearchTerm('');
        fetchAllEmployees();
        setShowAddModal(true);
    };

    const toggleEmployeeSelection = (employeeId) => {
        setSelectedEmployees(prev => 
            prev.includes(employeeId)
                ? prev.filter(id => id !== employeeId)
                : [...prev, employeeId]
        );
    };

    const handleAssignEmployees = async () => {
        if (selectedEmployees.length === 0) return;
        
        setSubmitting(true);
        try {
            await Promise.all(
                selectedEmployees.map(empId => 
                    api.put(`/employees/${empId}`, { department_id: id })
                )
            );
            setShowAddModal(false);
            setSelectedEmployees([]);
            fetchDepartment();
        } catch (err) {
            console.error('Error assigning employees:', err);
            alert('Erreur lors de l\'assignation des employés');
        } finally {
            setSubmitting(false);
        }
    };

    const handleRemoveEmployee = async (employeeId) => {
        if (!window.confirm('Voulez-vous vraiment retirer cet employé du département?')) return;
        
        try {
            await api.put(`/employees/${employeeId}`, { department_id: null });
            fetchDepartment();
        } catch (err) {
            console.error('Error removing employee:', err);
            alert('Erreur lors du retrait de l\'employé');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (error || !department) {
        return (
            <div className="p-6">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error || 'Département non trouvé'}
                </div>
                <button
                    onClick={() => navigate('/departments')}
                    className="mt-4 text-indigo-600 hover:text-indigo-800"
                >
                    Retour aux départements
                </button>
            </div>
        );
    }

    const currentEmployeeIds = (department.employees || []).map(e => e.id);
    const availableEmployees = allEmployees.filter(e => !currentEmployeeIds.includes(e.id));
    const filteredEmployees = availableEmployees.filter(e => 
        `${e.first_name} ${e.last_name} ${e.email} ${e.position || ''}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div>
            <button
                onClick={() => navigate('/departments')}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 mb-4"
            >
                <FiArrowLeft size={18} />
                Retour aux départements
            </button>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-6 mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{department.name}</h1>
                        {department.description && (
                            <p className="text-slate-500 mt-1">{department.description}</p>
                        )}
                        <span className={`inline-block mt-2 px-3 py-1 text-xs font-semibold rounded-full ${
                            department.status === 'active' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                            {department.status === 'active' ? 'Actif' : 'Inactif'}
                        </span>
                    </div>
                    <button
                        onClick={() => navigate(`/departments/${id}/edit`)}
                        className="flex items-center gap-2 px-4 py-2 text-indigo-600 border border-indigo-600 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                    >
                        <FiEdit2 size={16} />
                        Modifier
                    </button>
                </div>

                {department.manager && (
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                        <p className="text-sm text-slate-500">Responsable:</p>
                        <p className="font-medium text-slate-800 dark:text-white">
                            {department.manager.first_name} {department.manager.last_name}
                        </p>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <FiUsers size={20} />
                    Employés ({department.employees?.length || 0})
                </h2>
                <button
                    onClick={openAddModal}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all"
                >
                    <FiPlus size={18} />
                    Ajouter des employés
                </button>
            </div>

            {(!department.employees || department.employees.length === 0) ? (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-12 text-center">
                    <FiUsers className="mx-auto h-12 w-12 text-slate-400" />
                    <h3 className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">Aucun employé</h3>
                    <p className="mt-1 text-sm text-slate-500">Ce département n'a pas encore d'employés.</p>
                    <button
                        onClick={openAddModal}
                        className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        Ajouter des employés
                    </button>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-700/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Employé</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Poste</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Statut</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {department.employees.map((employee) => (
                                <tr key={employee.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <Link to={`/employees/${employee.id}`} className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                                                <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                                                    {employee.first_name?.[0]}{employee.last_name?.[0]}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-800 dark:text-white">
                                                    {employee.first_name} {employee.last_name}
                                                </p>
                                                <p className="text-sm text-slate-500">{employee.employee_id}</p>
                                            </div>
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                            <FiBriefcase size={14} />
                                            {employee.position}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2 text-slate-500">
                                            <FiMail size={14} />
                                            {employee.email}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                            employee.status === 'active'
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                : employee.status === 'inactive'
                                                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                        }`}>
                                            {employee.status === 'active' ? 'Actif' : 
                                             employee.status === 'inactive' ? 'Inactif' : 'Suspendu'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <button
                                            onClick={() => handleRemoveEmployee(employee.id)}
                                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                                        >
                                            Retirer
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                                Ajouter des employés à {department.name}
                            </h3>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                                <FiX size={20} />
                            </button>
                        </div>

                        <div className="p-6 border-b border-slate-100 dark:border-slate-700">
                            <div className="relative">
                                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Rechercher un employé..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            {loadingEmployees ? (
                                <div className="flex items-center justify-center h-32">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                                </div>
                            ) : filteredEmployees.length === 0 ? (
                                <div className="text-center py-8 text-slate-500">
                                    {searchTerm ? 'Aucun employé trouvé' : 'Aucun employé disponible'}
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {filteredEmployees.map((employee) => (
                                        <div
                                            key={employee.id}
                                            onClick={() => toggleEmployeeSelection(employee.id)}
                                            className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all ${
                                                selectedEmployees.includes(employee.id)
                                                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                                    : 'border-slate-200 dark:border-slate-600 hover:border-indigo-300'
                                            }`}
                                        >
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                                selectedEmployees.includes(employee.id)
                                                    ? 'bg-indigo-600 border-indigo-600'
                                                    : 'border-slate-300'
                                            }`}>
                                                {selectedEmployees.includes(employee.id) && (
                                                    <FiCheck className="text-white" size={14} />
                                                )}
                                            </div>
                                            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                                                <span className="text-slate-600 dark:text-slate-300 font-semibold text-sm">
                                                    {employee.first_name?.[0]}{employee.last_name?.[0]}
                                                </span>
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-slate-800 dark:text-white">
                                                    {employee.first_name} {employee.last_name}
                                                </p>
                                                <p className="text-sm text-slate-500">
                                                    {employee.position || 'Sans poste'} • {employee.email}
                                                </p>
                                            </div>
                                            {employee.department_id && (
                                                <span className="text-xs text-slate-400">Autre département</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-between p-6 border-t border-slate-100 dark:border-slate-700">
                            <p className="text-sm text-slate-500">
                                {selectedEmployees.length} employé(s) sélectionné(s)
                            </p>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="px-6 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleAssignEmployees}
                                    disabled={selectedEmployees.length === 0 || submitting}
                                    className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50"
                                >
                                    {submitting ? 'Ajout...' : `Ajouter ${selectedEmployees.length > 0 ? `(${selectedEmployees.length})` : ''}`}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DepartmentDetail;
