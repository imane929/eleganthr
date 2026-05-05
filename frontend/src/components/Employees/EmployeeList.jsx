import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import {
    MagnifyingGlassIcon,
    ArrowDownTrayIcon,
    PencilIcon,
    TrashIcon,
    EyeIcon,
    ChevronLeftIcon,
    ChevronRightIcon
} from '@heroicons/react/24/outline';

const EmployeeList = () => {
    const { hasPermission, isAdmin, isRH } = useAuth();
    const [employees, setEmployees] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        search: '',
        department_id: '',
        status: '',
        sort_by: 'created_at',
        sort_order: 'desc'
    });
    const [pagination, setPagination] = useState({
        current_page: 1,
        per_page: 10,
        total: 0,
        last_page: 1
    });

    const fetchEmployees = useCallback(async () => {
        setLoading(true);
        try {
            // Filter out empty values
            const cleanFilters = {};
            Object.keys(filters).forEach(key => {
                if (filters[key] && filters[key] !== '') {
                    cleanFilters[key] = filters[key];
                }
            });
            
            const params = new URLSearchParams({
                ...cleanFilters,
                page: pagination.current_page,
                per_page: pagination.per_page
            }).toString();

            const response = await api.get(`/employees?${params}`);
            const responseData = response.data?.data;
            let empData = [];
            
            // Handle paginated response (Laravel paginate)
            if (responseData && responseData.data && Array.isArray(responseData.data)) {
                empData = responseData.data;
                if (responseData.current_page) {
                    setPagination({
                        current_page: responseData.current_page,
                        per_page: responseData.per_page,
                        total: responseData.total,
                        last_page: responseData.last_page
                    });
                }
            } else if (Array.isArray(responseData)) {
                // Non-paginated response
                empData = responseData;
            }
            
            setEmployees(empData);
        } catch (error) {
            console.error('Erreur chargement employés:', error);
            setEmployees([]);
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.current_page, pagination.per_page]);

    const fetchDepartments = useCallback(async () => {
        try {
            const response = await api.get('/departments?status=active&per_page=100');
            let deptData = response.data?.data?.data || response.data?.data || [];
            
            if (!Array.isArray(deptData)) {
                deptData = [];
            }
            
            setDepartments(deptData);
        } catch (error) {
            console.error('Erreur chargement départements:', error);
            setDepartments([]);
        }
    }, []);

    useEffect(() => {
        fetchEmployees();
    }, [fetchEmployees]);

    useEffect(() => {
        fetchDepartments();
    }, []);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, current_page: 1 }));
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchEmployees();
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet employé ?')) {
            return;
        }

        try {
            await api.delete(`/employees/${id}`);
            fetchEmployees(); // Rafraîchir la liste
        } catch (error) {
            console.error('Erreur suppression:', error);
            alert('Erreur lors de la suppression');
        }
    };

    const exportToCSV = async () => {
        try {
            const response = await api.get('/employees/export/csv', {
                responseType: 'blob'
            });
            
            // Créer un lien de téléchargement
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `employes_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Erreur export:', error);
            alert('Erreur lors de l\'export');
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            active: 'bg-green-100 text-green-800',
            inactive: 'bg-red-100 text-red-800',
            suspended: 'bg-yellow-100 text-yellow-800'
        };
        const labels = {
            active: 'Actif',
            inactive: 'Inactif',
            suspended: 'Suspendu'
        };
        
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
                {labels[status] || status}
            </span>
        );
    };

    return (
        <div className="p-4 sm:p-6">
            {/* En-tête */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">Gestion des Employés</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        {pagination.total !== undefined ? `${pagination.total} employé(s)` : ''}
                    </p>
                </div>
                {isAdmin() && (
                    <Link
                        to="/employees/new"
                        className="w-full sm:w-auto inline-flex justify-center items-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="hidden sm:inline">Nouvel Employé</span>
                        <span className="sm:hidden">Ajouter</span>
                    </Link>
                )}
            </div>

            {/* Filtres et recherche */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 mb-6 p-4">
                <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Recherche */}
                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Recherche</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={filters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                                placeholder="Nom, email, matricule..."
                                className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                            <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                        </div>
                    </div>

                    {/* Filtre département */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Département</label>
                        <select
                            value={filters.department_id}
                            onChange={(e) => handleFilterChange('department_id', e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                            <option value="">Tous</option>
                            {departments.map(dept => (
                                <option key={dept.id} value={dept.id}>{dept.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Filtre statut */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Statut</label>
                        <select
                            value={filters.status}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                            <option value="">Tous</option>
                            <option value="active">Actif</option>
                            <option value="inactive">Inactif</option>
                            <option value="suspended">Suspendu</option>
                        </select>
                    </div>
                </form>

                {/* Boutons d'action supplémentaires */}
                <div className="flex flex-wrap justify-end mt-4 gap-2">
                    <button
                        onClick={() => {
                            setFilters({
                                search: '',
                                department_id: '',
                                status: '',
                                sort_by: 'created_at',
                                sort_order: 'desc'
                            });
                            fetchEmployees();
                        }}
                        className="px-3 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
                    >
                        Réinitialiser
                    </button>
                    {hasPermission('export_employees') && (
                        <button
                            onClick={exportToCSV}
                            className="px-3 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center"
                        >
                            <ArrowDownTrayIcon className="h-5 w-5 mr-1" />
                            <span className="hidden sm:inline">Exporter</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Tableau des employés */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                                <thead className="bg-slate-50 dark:bg-slate-900/50">
                                    <tr>
                                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                            Matricule
                                        </th>
                                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                            Employé
                                        </th>
                                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell">
                                            Contact
                                        </th>
                                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden lg:table-cell">
                                            Poste
                                        </th>
                                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden lg:table-cell">
                                            Département
                                        </th>
                                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden xl:table-cell">
                                            Date d'embauche
                                        </th>
                                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden sm:table-cell">
                                            Compte
                                        </th>
                                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                            Statut
                                        </th>
                                        <th className="px-4 sm:px-6 py-3 text-right text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                                    {employees.map((employee) => (
                                        <tr key={employee.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {employee.employee_id}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {employee.first_name} {employee.last_name}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{employee.email}</div>
                                                <div className="text-sm text-gray-500">{employee.phone}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {employee.position}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {employee.department?.name || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {employee.hire_date.split('T')[0]}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {employee.user ? (
                                                    <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                                        Actif
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                                        Non lié
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getStatusBadge(employee.status)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end space-x-2">
                                                    <Link
                                                        to={`/employees/${employee.id}`}
                                                        className="text-blue-600 hover:text-blue-900"
                                                        title="Voir détails"
                                                    >
                                                        <EyeIcon className="h-5 w-5" />
                                                    </Link>
                                                    {hasPermission('edit_employees') && (
                                                        <Link
                                                            to={`/employees/${employee.id}/edit`}
                                                            className="text-green-600 hover:text-green-900"
                                                            title="Modifier"
                                                        >
                                                            <PencilIcon className="h-5 w-5" />
                                                        </Link>
                                                    )}
                                                    {hasPermission('delete_employees') && (
                                                        <button
                                                            onClick={() => handleDelete(employee.id)}
                                                            className="text-red-600 hover:text-red-900"
                                                            title="Supprimer"
                                                        >
                                                            <TrashIcon className="h-5 w-5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {pagination.last_page > 1 && (
                            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                                <div className="flex-1 flex justify-between sm:hidden">
                                    <button
                                        onClick={() => setPagination(prev => ({ ...prev, current_page: prev.current_page - 1 }))}
                                        disabled={pagination.current_page === 1}
                                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Précédent
                                    </button>
                                    <button
                                        onClick={() => setPagination(prev => ({ ...prev, current_page: prev.current_page + 1 }))}
                                        disabled={pagination.current_page === pagination.last_page}
                                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Suivant
                                    </button>
                                </div>
                                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm text-gray-700">
                                            Affichage de <span className="font-medium">{(pagination.current_page - 1) * pagination.per_page + 1}</span> à{' '}
                                            <span className="font-medium">
                                                {Math.min(pagination.current_page * pagination.per_page, pagination.total)}
                                            </span>{' '}
                                            sur <span className="font-medium">{pagination.total}</span> résultats
                                        </p>
                                    </div>
                                    <div>
                                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                            <button
                                                onClick={() => setPagination(prev => ({ ...prev, current_page: 1 }))}
                                                disabled={pagination.current_page === 1}
                                                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <ChevronLeftIcon className="h-5 w-5" />
                                                <ChevronLeftIcon className="h-5 w-5 -ml-3" />
                                            </button>
                                            <button
                                                onClick={() => setPagination(prev => ({ ...prev, current_page: prev.current_page - 1 }))}
                                                disabled={pagination.current_page === 1}
                                                className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <ChevronLeftIcon className="h-5 w-5" />
                                            </button>
                                            
                                            {/* Numéros de page */}
                                            {[...Array(Math.min(5, pagination.last_page))].map((_, i) => {
                                                let pageNum;
                                                if (pagination.last_page <= 5) {
                                                    pageNum = i + 1;
                                                } else if (pagination.current_page <= 3) {
                                                    pageNum = i + 1;
                                                } else if (pagination.current_page >= pagination.last_page - 2) {
                                                    pageNum = pagination.last_page - 4 + i;
                                                } else {
                                                    pageNum = pagination.current_page - 2 + i;
                                                }
                                                
                                                return (
                                                    <button
                                                        key={pageNum}
                                                        onClick={() => setPagination(prev => ({ ...prev, current_page: pageNum }))}
                                                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                            pagination.current_page === pageNum
                                                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                );
                                            })}
                                            
                                            <button
                                                onClick={() => setPagination(prev => ({ ...prev, current_page: prev.current_page + 1 }))}
                                                disabled={pagination.current_page === pagination.last_page}
                                                className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <ChevronRightIcon className="h-5 w-5" />
                                            </button>
                                            <button
                                                onClick={() => setPagination(prev => ({ ...prev, current_page: pagination.last_page }))}
                                                disabled={pagination.current_page === pagination.last_page}
                                                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <ChevronRightIcon className="h-5 w-5" />
                                                <ChevronRightIcon className="h-5 w-5 -ml-3" />
                                            </button>
                                        </nav>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default EmployeeList;