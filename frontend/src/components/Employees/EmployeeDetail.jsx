import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import {
    EnvelopeIcon,
    PhoneIcon,
    CalendarIcon,
    MapPinIcon,

    BriefcaseIcon,
    CurrencyDollarIcon,
    IdentificationIcon,
    ArrowLeftIcon,
    PencilIcon,
    TrashIcon
} from '@heroicons/react/24/outline';

const EmployeeDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { hasPermission, isAdmin } = useAuth();
    const [employee, setEmployee] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('info');

    useEffect(() => {
        fetchEmployee();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const fetchEmployee = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/employees/${id}`);
            setEmployee(response.data.data);
        } catch (error) {
            console.error('Erreur chargement employé:', error);
            alert('Erreur lors du chargement des détails');
            navigate('/employees');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet employé ?')) {
            return;
        }

        try {
            await api.delete(`/employees/${id}`);
            alert('Employé supprimé avec succès');
            navigate('/employees');
        } catch (error) {
            console.error('Erreur suppression:', error);
            alert('Erreur lors de la suppression');
        }
    };

    const formatDate = (date) => {
        if (!date) return '-';
        return date.split('T')[0];
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'MAD',
            minimumFractionDigits: 2
        }).format(amount);
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
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
                {labels[status] || status}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!employee) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">Employé non trouvé</p>
                <Link to="/employees" className="text-blue-600 hover:underline mt-4 block">
                    Retour à la liste
                </Link>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* En-tête avec navigation */}
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link
                        to="/employees"
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">
                            {employee.first_name} {employee.last_name}
                        </h1>
                        <p className="text-gray-600">Matricule: {employee.employee_id}</p>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    {getStatusBadge(employee.status)}
                    {isAdmin() && (
                        <Link
                            to={`/employees/${id}/edit`}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Modifier"
                        >
                            <PencilIcon className="h-5 w-5" />
                        </Link>
                    )}
                    {isAdmin() && hasPermission('delete_employees') && (
                        <button
                            onClick={handleDelete}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Supprimer"
                        >
                            <TrashIcon className="h-5 w-5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('info')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'info'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        Informations
                    </button>
                    <button
                        onClick={() => setActiveTab('contract')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'contract'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        Contrat & Salaire
                    </button>
                    <button
                        onClick={() => setActiveTab('absences')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'absences'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        Absences
                    </button>
                    <button
                        onClick={() => setActiveTab('leaves')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'leaves'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        Congés
                    </button>
                </nav>
            </div>

            {/* Contenu des tabs */}
            <div className="bg-white rounded-lg shadow">
                {activeTab === 'info' && (
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Informations personnelles */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                                    <IdentificationIcon className="h-5 w-5 mr-2 text-gray-400" />
                                    Informations personnelles
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-sm text-gray-500">Nom complet</p>
                                        <p className="font-medium">{employee.first_name} {employee.last_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Date de naissance</p>
                                        <p className="font-medium">{formatDate(employee.birth_date)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Nationalité</p>
                                        <p className="font-medium">{employee.nationality || '-'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Contact */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                                    <EnvelopeIcon className="h-5 w-5 mr-2 text-gray-400" />
                                    Contact
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex items-center">
                                        <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-2" />
                                        <a href={`mailto:${employee.email}`} className="text-blue-600 hover:underline">
                                            {employee.email}
                                        </a>
                                    </div>
                                    <div className="flex items-center">
                                        <PhoneIcon className="h-5 w-5 text-gray-400 mr-2" />
                                        <a href={`tel:${employee.phone}`} className="text-blue-600 hover:underline">
                                            {employee.phone || '-'}
                                        </a>
                                    </div>
                                </div>
                            </div>

                            {/* Adresse */}
                            <div className="md:col-span-2">
                                <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                                    <MapPinIcon className="h-5 w-5 mr-2 text-gray-400" />
                                    Adresse
                                </h3>
                                <p className="font-medium">
                                    {employee.address ? (
                                        <>
                                            {employee.address}<br />
                                            {employee.postal_code} {employee.city}<br />
                                            {employee.country}
                                        </>
                                    ) : (
                                        '-'
                                    )}
                                </p>
                            </div>

                            {/* Contact d'urgence */}
                            {employee.emergency_contact_name && (
                                <div className="md:col-span-2">
                                    <h3 className="text-lg font-semibold text-gray-700 mb-4">Contact d'urgence</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-500">Nom</p>
                                            <p className="font-medium">{employee.emergency_contact_name}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Téléphone</p>
                                            <p className="font-medium">{employee.emergency_contact_phone}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'contract' && (
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                                    <BriefcaseIcon className="h-5 w-5 mr-2 text-gray-400" />
                                    Poste & Département
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-sm text-gray-500">Poste</p>
                                        <p className="font-medium">{employee.position}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Département</p>
                                        <p className="font-medium">{employee.department?.name || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Type de contrat</p>
                                        <p className="font-medium">{employee.contract_type}</p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                                    <CalendarIcon className="h-5 w-5 mr-2 text-gray-400" />
                                    Dates
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-sm text-gray-500">Date d'embauche</p>
                                        <p className="font-medium">{formatDate(employee.hire_date)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Ancienneté</p>
                                        <p className="font-medium">
                                            {Math.floor((new Date() - new Date(employee.hire_date)) / (1000 * 60 * 60 * 24 * 365))} ans
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                                    <CurrencyDollarIcon className="h-5 w-5 mr-2 text-gray-400" />
                                    Rémunération
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p className="text-sm text-gray-500 mb-1">Salaire mensuel</p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {formatCurrency(employee.salary)}
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p className="text-sm text-gray-500 mb-1">Salaire annuel</p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {formatCurrency(employee.salary * 12)}
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p className="text-sm text-gray-500 mb-1">Jours de congés restants</p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {employee.remaining_vacation_days || 0} jours
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'absences' && (
                    <div className="p-6">
                        <p className="text-gray-500 text-center py-8">
                            Historique des absences à venir...
                        </p>
                    </div>
                )}

                {activeTab === 'leaves' && (
                    <div className="p-6">
                        <p className="text-gray-500 text-center py-8">
                            Historique des congés à venir...
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmployeeDetail;