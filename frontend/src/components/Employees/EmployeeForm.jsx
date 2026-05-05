import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const EmployeeForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { hasPermission, isAdmin, isRH } = useAuth();
    const [loading, setLoading] = useState(false);
    const [departments, setDepartments] = useState([]);
    const [users, setUsers] = useState([]);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        position: '',
        department_id: '',
        hire_date: '',
        salary: '',
        contract_type: 'CDI',
        status: 'active',
        nationality: '',
        birth_date: '',
        address: '',
        city: '',
        postal_code: '',
        country: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        create_user: false,
        user_id: '',
        user_name: '',
        user_email: '',
        user_password: ''
    });
    const [errors, setErrors] = useState({});

    const fetchEmployee = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/employees/${id}`);
            const employee = response.data.data;
            setFormData({
                first_name: employee.first_name || '',
                last_name: employee.last_name || '',
                email: employee.email || '',
                phone: employee.phone || '',
                position: employee.position || '',
                department_id: employee.department_id || '',
                hire_date: employee.hire_date ? employee.hire_date.split('T')[0] : '',
                salary: employee.salary || '',
                contract_type: employee.contract_type || 'CDI',
                status: employee.status || 'active',
                nationality: employee.nationality || '',
                birth_date: employee.birth_date ? employee.birth_date.split('T')[0] : '',
                address: employee.address || '',
                city: employee.city || '',
                postal_code: employee.postal_code || '',
                country: employee.country || '',
                emergency_contact_name: employee.emergency_contact_name || '',
                emergency_contact_phone: employee.emergency_contact_phone || '',
                create_user: !!employee.user_id,
                user_id: employee.user_id || '',
                user_name: employee.user?.name || '',
                user_email: employee.user?.email || '',
                user_password: ''
            });
        } catch (error) {
            console.error('Erreur chargement employé:', error);
            alert('Erreur lors du chargement de l\'employé');
            navigate('/employees');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Effacer l'erreur pour ce champ
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    // Fetch employee data if editing
    useEffect(() => {
        if (id) {
            fetchEmployee();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    // Fetch departments on mount
    useEffect(() => {
        let mounted = true;
        const loadData = async () => {
            try {
                let deptResponse;
                
                // If HR (not Admin), only show HR department
                if (isRH() && !isAdmin()) {
                    deptResponse = await api.get('/departments?name=RH&status=active');
                } else {
                    deptResponse = await api.get('/departments?status=active&per_page=100');
                }
                
                const [usersResponse] = await Promise.all([
                    api.get('/users')
                ]);
                
                let deptData = deptResponse.data?.data?.data || deptResponse.data?.data || [];
                if (!Array.isArray(deptData)) deptData = [];
                
                let usersData = usersResponse.data?.data?.data || usersResponse.data?.data || usersResponse.data || [];
                if (!Array.isArray(usersData)) usersData = [];
                
                if (mounted) {
                    setDepartments(deptData);
                    setUsers(usersData.filter(u => !u.employee));
                }
            } catch (error) {
                console.error('Erreur chargement données:', error);
            }
        };
        loadData();
        return () => { mounted = false; };
    }, [isRH, isAdmin]);

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.first_name.trim()) {
            newErrors.first_name = 'Le prénom est requis';
        }
        if (!formData.last_name.trim()) {
            newErrors.last_name = 'Le nom est requis';
        }
        if (!formData.email.trim()) {
            newErrors.email = 'L\'email est requis';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'L\'email n\'est pas valide';
        }
        if (!formData.position.trim()) {
            newErrors.position = 'Le poste est requis';
        }
        if (!formData.department_id) {
            newErrors.department_id = 'Le département est requis';
        }
        if (!formData.hire_date) {
            newErrors.hire_date = 'La date d\'embauche est requise';
        }
        if (!formData.salary) {
            newErrors.salary = 'Le salaire est requis';
        } else if (formData.salary <= 0) {
            newErrors.salary = 'Le salaire doit être supérieur à 0';
        }

        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!isAdmin()) {
            alert('Vous n\'avez pas l\'autorisation de créer ou modifier des employés.');
            return;
        }
        
        const newErrors = validateForm();
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        if (formData.create_user && !formData.user_id && !formData.user_password) {
            newErrors.user_password = 'Le mot de passe est requis';
            setErrors(newErrors);
            return;
        }
        
        if (formData.create_user && formData.user_password && formData.user_password.length < 8) {
            newErrors.user_password = 'Le mot de passe doit contenir au moins 8 caractères';
            setErrors(newErrors);
            return;
        }

        setLoading(true);
        try {
            console.log('Submitting with data:', formData);
            const submitData = { ...formData };
            
            // Create new user if needed (only for new employees)
            if (formData.create_user && !formData.user_id && !id) {
                const userName = formData.user_name || `${formData.first_name} ${formData.last_name}`;
                const userEmail = formData.user_email || formData.email;
                
                const userResponse = await api.post('/users', {
                    name: userName,
                    email: userEmail,
                    password: formData.user_password,
                    password_confirmation: formData.user_password
                });
                submitData.user_id = userResponse.data.data.id;
            }
            
            // Handle user link changes when editing
            if (id) {
                // If create_user is unchecked and employee has a user, unlink it
                if (!formData.create_user && formData.user_id) {
                    submitData.user_id = null;
                }
                // If create_user is checked and user_id is selected, keep the link
                else if (formData.create_user && formData.user_id) {
                    submitData.user_id = formData.user_id;
                }
                // If create_user is checked but no user_id and has password, create new user
                else if (formData.create_user && !formData.user_id && formData.user_password) {
                    const userName = formData.user_name || `${submitData.first_name} ${submitData.last_name}`;
                    const userEmail = formData.user_email || submitData.email;
                    
                    const userResponse = await api.post('/users', {
                        name: userName,
                        email: userEmail,
                        password: formData.user_password,
                        password_confirmation: formData.user_password
                    });
                    submitData.user_id = userResponse.data.data.id;
                }
            }
            
            // Remove other user-related fields
            const userFields = ['create_user', 'user_name', 'user_email', 'user_password'];
            if (id) {
                userFields.forEach(field => delete submitData[field]);
            }
            
            console.log('API call data:', submitData);
            
            if (id) {
                await api.put(`/employees/${id}`, submitData);
                alert('Employé modifié avec succès');
            } else {
                await api.post('/employees', submitData);
                alert('Employé créé avec succès');
            }
            navigate('/employees');
        } catch (error) {
            console.error('Erreur sauvegarde:', error);
            alert('Erreur: ' + (error.response?.data?.message || JSON.stringify(error.response?.data?.errors) || error.message));
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else if (error.response?.data?.message) {
                alert(error.response.data.message);
            } else {
                alert('Erreur lors de la sauvegarde');
            }
        } finally {
            setLoading(false);
        }
    };

    if (loading && id) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">
                    {id ? 'Modifier un employé' : 'Nouvel employé'}
                </h1>
                <p className="text-gray-600 mt-1">
                    {id ? 'Modifiez les informations de l\'employé' : 'Ajoutez un nouvel employé'}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Informations personnelles */}
                    <div className="md:col-span-2">
                        <h2 className="text-lg font-semibold text-gray-700 mb-4">Informations personnelles</h2>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Prénom <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="first_name"
                            value={formData.first_name}
                            onChange={handleChange}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                errors.first_name ? 'border-red-500' : 'border-gray-300'
                            }`}
                        />
                        {errors.first_name && (
                            <p className="mt-1 text-sm text-red-600">{errors.first_name}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nom <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="last_name"
                            value={formData.last_name}
                            onChange={handleChange}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                errors.last_name ? 'border-red-500' : 'border-gray-300'
                            }`}
                        />
                        {errors.last_name && (
                            <p className="mt-1 text-sm text-red-600">{errors.last_name}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                errors.email ? 'border-red-500' : 'border-gray-300'
                            }`}
                        />
                        {errors.email && (
                            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Téléphone
                        </label>
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Date de naissance
                        </label>
                        <input
                            type="date"
                            name="birth_date"
                            value={formData.birth_date}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nationalité
                        </label>
                        <input
                            type="text"
                            name="nationality"
                            value={formData.nationality}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Adresse */}
                    <div className="md:col-span-2 mt-4">
                        <h2 className="text-lg font-semibold text-gray-700 mb-4">Adresse</h2>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Adresse
                        </label>
                        <input
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Ville
                        </label>
                        <input
                            type="text"
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Code postal
                        </label>
                        <input
                            type="text"
                            name="postal_code"
                            value={formData.postal_code}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Pays
                        </label>
                        <input
                            type="text"
                            name="country"
                            value={formData.country}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Informations professionnelles */}
                    <div className="md:col-span-2 mt-4">
                        <h2 className="text-lg font-semibold text-gray-700 mb-4">Informations professionnelles</h2>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Poste <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="position"
                            value={formData.position}
                            onChange={handleChange}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                errors.position ? 'border-red-500' : 'border-gray-300'
                            }`}
                        />
                        {errors.position && (
                            <p className="mt-1 text-sm text-red-600">{errors.position}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Département <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="department_id"
                            value={formData.department_id}
                            onChange={handleChange}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                errors.department_id ? 'border-red-500' : 'border-gray-300'
                            }`}
                            required
                        >
                            <option value="">Sélectionner un département</option>
                            {departments.map(dept => (
                                <option key={dept.id} value={dept.id}>{dept.name}</option>
                            ))}
                        </select>
                        {errors.department_id && (
                            <p className="mt-1 text-sm text-red-600">{errors.department_id}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Date d'embauche <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            name="hire_date"
                            value={formData.hire_date}
                            onChange={handleChange}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                errors.hire_date ? 'border-red-500' : 'border-gray-300'
                            }`}
                        />
                        {errors.hire_date && (
                            <p className="mt-1 text-sm text-red-600">{errors.hire_date}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Type de contrat
                        </label>
                        <select
                            name="contract_type"
                            value={formData.contract_type}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="CDI">CDI</option>
                            <option value="CDD">CDD</option>
                            <option value="Stage">Stage</option>
                            <option value="Freelance">Freelance</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Salaire (mensuel) <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                name="salary"
                                value={formData.salary}
                                onChange={handleChange}
                                min="0"
                                step="0.01"
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                    errors.salary ? 'border-red-500' : 'border-gray-300'
                                }`}
                            />
                            <span className="absolute right-3 top-2 text-gray-500">DH</span>
                        </div>
                        {errors.salary && (
                            <p className="mt-1 text-sm text-red-600">{errors.salary}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Statut
                        </label>
                        <select
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="active">Actif</option>
                            <option value="inactive">Inactif</option>
                            <option value="suspended">Suspendu</option>
                        </select>
                    </div>

                    {/* Contact d'urgence */}
                    <div className="md:col-span-2 mt-4">
                        <h2 className="text-lg font-semibold text-gray-700 mb-4">Contact d'urgence</h2>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nom du contact
                        </label>
                        <input
                            type="text"
                            name="emergency_contact_name"
                            value={formData.emergency_contact_name}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Téléphone du contact
                        </label>
                        <input
                            type="tel"
                            name="emergency_contact_phone"
                            value={formData.emergency_contact_phone}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Compte Utilisateur */}
                <div className="bg-gray-50 p-6 rounded-lg mt-6">
                    <div className="flex items-center gap-3 mb-4">
                        <input
                            type="checkbox"
                            id="create_user"
                            name="create_user"
                            checked={formData.create_user}
                            onChange={(e) => setFormData(prev => ({ ...prev, create_user: e.target.checked }))}
                            className="w-4 h-4 text-blue-600"
                        />
                        <label htmlFor="create_user" className="text-lg font-semibold text-gray-700">
                            Créer un compte utilisateur
                        </label>
                    </div>

                    {formData.create_user && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Lier à un utilisateur existant
                                </label>
                                <select
                                    name="user_id"
                                    value={formData.user_id}
                                    onChange={(e) => setFormData(prev => ({ 
                                        ...prev, 
                                        user_id: e.target.value,
                                        user_name: e.target.value ? users.find(u => u.id == e.target.value)?.name || '' : '',
                                        user_email: e.target.value ? users.find(u => u.id == e.target.value)?.email || '' : ''
                                    }))}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                >
                                    <option value="">-- Créer un nouvel utilisateur --</option>
                                    {users.map(user => (
                                        <option key={user.id} value={user.id}>{user.name} ({user.email})</option>
                                    ))}
                                </select>
                            </div>

                            {!formData.user_id && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Nom d'utilisateur
                                        </label>
                                        <input
                                            type="text"
                                            name="user_name"
                                            value={formData.user_name}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            name="user_email"
                                            value={formData.user_email}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Mot de passe <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="password"
                                            name="user_password"
                                            value={formData.user_password}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Minimum 8 caractères</p>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Boutons d'action */}
                <div className="flex justify-end space-x-4 mt-8">
                    <button
                        type="button"
                        onClick={() => navigate('/employees')}
                        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Enregistrement...' : (id ? 'Modifier' : 'Créer')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EmployeeForm;