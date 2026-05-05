import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { FiPlus, FiEdit2, FiTrash2, FiShield, FiUser } from 'react-icons/fi';

const UserList = () => {
    const { isAdmin } = useAuth();
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalUsers, setTotalUsers] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedRole, setSelectedRole] = useState(null);
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [editUser, setEditUser] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        password_confirmation: ''
    });

    useEffect(() => {
        fetchUsers();
        fetchRoles();
        fetchDepartments();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await api.get('/users');
            const responseData = response.data.data;
            let data = [];
            if (Array.isArray(responseData)) {
                data = responseData;
                setTotalUsers(data.length);
            } else if (responseData && Array.isArray(responseData.data)) {
                data = responseData.data;
                setTotalUsers(responseData.total || data.length);
            } else if (responseData && responseData.data && Array.isArray(responseData.data.data)) {
                data = responseData.data.data;
                setTotalUsers(responseData.data.total || data.length);
            } else {
                setTotalUsers(0);
            }
            setUsers(data);
        } catch (err) {
            console.error('Error fetching users:', err);
            setUsers([]);
            setTotalUsers(0);
        } finally {
            setLoading(false);
        }
    };

    const fetchRoles = async () => {
        try {
            const response = await api.get('/roles');
            const responseData = response.data.data;
            let data = [];
            if (Array.isArray(responseData)) {
                data = responseData;
            } else if (responseData && Array.isArray(responseData.data)) {
                data = responseData.data;
            } else if (responseData && responseData.data && Array.isArray(responseData.data.data)) {
                data = responseData.data.data;
            }
            setRoles(data);
        } catch (err) {
            console.error('Error fetching roles:', err);
            setRoles([]);
        }
    };

    const fetchDepartments = async () => {
        try {
            const response = await api.get('/departments');
            const responseData = response.data.data;
            let data = [];
            if (Array.isArray(responseData)) {
                data = responseData;
            } else if (responseData && Array.isArray(responseData.data)) {
                data = responseData.data;
            } else if (responseData && responseData.data && Array.isArray(responseData.data.data)) {
                data = responseData.data.data;
            }
            setDepartments(data);
        } catch (err) {
            console.error('Error fetching departments:', err);
            setDepartments([]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editUser) {
                await api.put(`/users/${editUser.id}`, {
                    name: formData.name,
                    email: formData.email,
                    ...(formData.password && { password: formData.password }),
                    ...(formData.password_confirmation && { password_confirmation: formData.password_confirmation })
                });
            } else {
                await api.post('/users', formData);
            }
            closeModal();
            fetchUsers();
        } catch (err) {
            if (err.response?.status === 401) {
                alert('Session expirée. Veuillez vous reconnecter.');
            } else {
                const errors = err.response?.data?.errors;
                if (errors) {
                    const errorMsg = Object.entries(errors).map(([field, messages]) => 
                        `${field}: ${messages.join(', ')}`
                    ).join('\n');
                    alert(errorMsg);
                } else {
                    alert(err.response?.data?.message || 'Erreur lors de la sauvegarde de l\'utilisateur');
                }
            }
        }
    };

    const handleEdit = (user) => {
        setEditUser(user);
        setFormData({
            name: user.name || '',
            email: user.email || '',
            password: '',
            password_confirmation: ''
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditUser(null);
        setFormData({ name: '', email: '', password: '', password_confirmation: '' });
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur?')) return;
        try {
            await api.delete(`/users/${id}`);
            fetchUsers();
        } catch (err) {
            alert(err.response?.data?.message || 'Erreur lors de la suppression de l\'utilisateur');
        }
    };

    const handleAssignRole = async () => {
        if (!selectedUser || !selectedRole) return;
        try {
            const payload = { role_id: selectedRole };
            if (selectedRoleIsResponsable && selectedDepartment) {
                payload.department_id = selectedDepartment;
            }
            await api.post(`/users/${selectedUser.id}/assign-role`, payload);
            setShowRoleModal(false);
            setSelectedRole(null);
            setSelectedDepartment('');
            fetchUsers();
        } catch (err) {
            alert(err.response?.data?.message || 'Erreur lors de l\'assignation du rôle');
        }
    };

    const selectedRoleIsResponsable = selectedRole && roles.find(r => String(r.id) === String(selectedRole))?.name?.toLowerCase() === 'responsable';

    const handleRemoveRole = async (userId, roleId) => {
        if (!window.confirm('Retirer ce rôle?')) return;
        try {
            await api.post(`/users/${userId}/remove-role`, { role_id: roleId });
            fetchUsers();
        } catch (err) {
            alert(err.response?.data?.message || 'Erreur lors de la suppression du rôle');
        }
    };

    const openRoleModal = (user) => {
        setSelectedUser(user);
        setSelectedRole(null);
        setSelectedDepartment('');
        setShowRoleModal(true);
    };

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Utilisateurs</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">{totalUsers} utilisateur(s)</p>
                </div>
                <button 
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all"
                >
                    <FiPlus size={18} />
                    <span>Nouvel utilisateur</span>
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-900/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Utilisateur</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Email</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Rôles</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                                                {user.name?.[0]?.toUpperCase()}
                                            </div>
                                            <span className="font-medium text-slate-800 dark:text-white">{user.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{user.email}</td>
                                    <td className="px-6 py-4">
                                        {user.employee && (
                                            <div className="mb-2 text-xs">
                                                <span className="text-indigo-600 dark:text-indigo-400">
                                                    {user.employee.position || 'Employé'}
                                                </span>
                                                {user.employee.department && (
                                                    <span className="text-slate-500"> • {user.employee.department.name}</span>
                                                )}
                                            </div>
                                        )}
                                        <div className="flex flex-wrap gap-2">
                                            {user.roles?.map((role) => (
                                                <span key={role.id} className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-full text-xs font-medium">
                                                    <FiShield size={12} />
                                                    {role.name}
                                                    <button 
                                                        onClick={() => handleRemoveRole(user.id, role.id)}
                                                        className="ml-1 text-indigo-400 hover:text-indigo-600"
                                                    >
                                                        ×
                                                    </button>
                                                </span>
                                            ))}
                                            <button 
                                                onClick={() => openRoleModal(user)}
                                                className="px-2 py-1 border border-dashed border-slate-300 dark:border-slate-600 text-slate-500 rounded-full text-xs hover:border-indigo-500 hover:text-indigo-500"
                                            >
                                                + Ajouter
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => handleEdit(user)}
                                                className="p-2 text-slate-400 hover:text-amber-600 transition-colors"
                                                title="Modifier"
                                            >
                                                <FiEdit2 size={16} />
                                            </button>
                                            <button 
                                                onClick={() => openRoleModal(user)}
                                                className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                                                title="Gérer les rôles"
                                            >
                                                <FiShield size={16} />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(user.id)}
                                                className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                                                title="Supprimer"
                                            >
                                                <FiTrash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-slate-500">
                                        Aucun utilisateur trouvé
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md mx-4">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">
                            {editUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nom</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Mot de passe {editUser && '(laisser vide pour garder)'}
                                    </label>
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                                        className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                                        {...(editUser ? {} : { required: true })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Confirmer</label>
                                    <input
                                        type="password"
                                        value={formData.password_confirmation}
                                        onChange={(e) => setFormData({...formData, password_confirmation: e.target.value})}
                                        className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                                        {...(editUser ? {} : { required: true })}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="submit" className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                                    {editUser ? 'Mettre à jour' : 'Créer'}
                                </button>
                                <button type="button" onClick={closeModal} className="flex-1 py-2.5 border border-slate-300 rounded-lg hover:bg-slate-50">
                                    Annuler
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showRoleModal && selectedUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md mx-4">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">
                            Assigner un rôle à {selectedUser.name}
                        </h2>
                        <div className="space-y-3 mb-4">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                Sélectionner un rôle
                            </label>
                            <select
                                value={selectedRole || ''}
                                onChange={(e) => setSelectedRole(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                            >
                                <option value="">-- Choisir un rôle --</option>
                                {roles.map((role) => (
                                    <option key={role.id} value={role.id}>{role.name}</option>
                                ))}
                            </select>
                        </div>
                        {selectedRoleIsResponsable && (
                            <div className="space-y-3 mb-4">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Sélectionner le département
                                </label>
                                <select
                                    value={selectedDepartment}
                                    onChange={(e) => setSelectedDepartment(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                                    required
                                >
                                    <option value="">-- Choisir un département --</option>
                                    {departments.map((dept) => (
                                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div className="flex gap-3">
                            <button 
                                onClick={handleAssignRole}
                                disabled={!selectedRole || (selectedRoleIsResponsable && !selectedDepartment)}
                                className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Assigner
                            </button>
                            <button 
                                onClick={() => {
                                    setShowRoleModal(false);
                                    setSelectedRole(null);
                                    setSelectedDepartment('');
                                }} 
                                className="flex-1 py-2.5 border border-slate-300 rounded-lg hover:bg-slate-50"
                            >
                                Annuler
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserList;
