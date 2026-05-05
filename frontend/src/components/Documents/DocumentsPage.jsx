import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { FiFileText, FiUpload, FiDownload, FiTrash2, FiSearch, FiEye, FiEyeOff } from 'react-icons/fi';
import toast from 'react-hot-toast';

const DocumentsPage = () => {
    const { user } = useAuth();
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('all');
    const [showUpload, setShowUpload] = useState(false);
    const [formData, setFormData] = useState({ title: '', description: '', category: 'policy', is_public: true, employee_id: '', department_id: '' });
    const [file, setFile] = useState(null);

    useEffect(() => { fetchDocuments(); }, [category]);

    const fetchDocuments = async () => {
        try {
            const params = { per_page: 50 };
            if (category !== 'all') params.category = category;
            const { data } = await api.get('/documents', { params });
            setDocuments(data.data.data || data.data);
        } catch (error) {
            toast.error('Failed to load documents');
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) return toast.error('Select a file');
        if (!formData.title) return toast.error('Title is required');

        const data = new FormData();
        data.append('document', file);
        data.append('title', formData.title);
        if (formData.description) data.append('description', formData.description);
        if (formData.category) data.append('category', formData.category);
        data.append('is_public', formData.is_public ? '1' : '0');
        if (formData.employee_id) data.append('employee_id', formData.employee_id);
        if (formData.department_id) data.append('department_id', formData.department_id);

        try {
            await api.post('/documents', data, { headers: { 'Content-Type': 'multipart/form-data' } });
            toast.success('Document uploaded');
            setShowUpload(false);
            setFormData({ title: '', description: '', category: 'policy', is_public: true, employee_id: '', department_id: '' });
            setFile(null);
            fetchDocuments();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Upload failed');
        }
    };

    const handleDownload = async (id) => {
        try {
            const response = await api.get(`/documents/${id}/download`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'document');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            toast.error('Download failed');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this document?')) return;
        try {
            await api.delete(`/documents/${id}`);
            toast.success('Document deleted');
            fetchDocuments();
        } catch (error) {
            toast.error('Delete failed');
        }
    };

    const categoryColors = {
        policy: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
        procedure: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        template: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
        report: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
        form: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
        other: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    };

    const filteredDocs = documents.filter(d =>
        !search || d.title?.toLowerCase().includes(search.toLowerCase()) || d.description?.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

    return (
        <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Documents</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Company policies, procedures, and templates</p>
                </div>
                <button onClick={() => setShowUpload(!showUpload)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2">
                    <FiUpload /> Upload Document
                </button>
            </div>

            {/* Upload Form */}
            {showUpload && (
                <form onSubmit={handleUpload} className="mb-6 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <input type="text" placeholder="Title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="p-2 border rounded-lg dark:bg-slate-700 dark:text-white" required />
                        <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="p-2 border rounded-lg dark:bg-slate-700 dark:text-white">
                            <option value="policy">Policy</option>
                            <option value="procedure">Procedure</option>
                            <option value="template">Template</option>
                            <option value="report">Report</option>
                            <option value="form">Form</option>
                            <option value="other">Other</option>
                        </select>
                        <input type="number" placeholder="Employee ID (optional)" value={formData.employee_id} onChange={e => setFormData({...formData, employee_id: e.target.value})} className="p-2 border rounded-lg dark:bg-slate-700 dark:text-white" />
                        <input type="number" placeholder="Department ID (optional)" value={formData.department_id} onChange={e => setFormData({...formData, department_id: e.target.value})} className="p-2 border rounded-lg dark:bg-slate-700 dark:text-white" />
                        <input type="file" onChange={e => setFile(e.target.files[0])} className="p-2 border rounded-lg dark:bg-slate-700 dark:text-white" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" />
                        <label className="flex items-center gap-2 p-2">
                            <input type="checkbox" checked={formData.is_public} onChange={e => setFormData({...formData, is_public: e.target.checked})} className="w-4 h-4" />
                            <span className="text-sm text-slate-600 dark:text-slate-300 flex items-center gap-1">{formData.is_public ? <FiEye className="w-4 h-4" /> : <FiEyeOff className="w-4 h-4" />} {formData.is_public ? 'Public' : 'Private'}</span>
                        </label>
                    </div>
                    <textarea placeholder="Description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:text-white mt-4" rows={2}></textarea>
                    <div className="flex gap-2 mt-4">
                        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Upload</button>
                        <button type="button" onClick={() => setShowUpload(false)} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded-lg">Cancel</button>
                    </div>
                </form>
            )}

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="relative flex-1">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="Search documents..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-slate-800 dark:text-white dark:border-slate-700" />
                </div>
                <select value={category} onChange={e => setCategory(e.target.value)} className="p-2 border rounded-lg dark:bg-slate-800 dark:text-white dark:border-slate-700">
                    <option value="all">All Categories</option>
                    <option value="policy">Policy</option>
                    <option value="procedure">Procedure</option>
                    <option value="template">Template</option>
                    <option value="report">Report</option>
                    <option value="form">Form</option>
                    <option value="other">Other</option>
                </select>
            </div>

            {/* Documents List */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-slate-900/50">
                        <tr>
                            <th className="text-left p-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Document</th>
                            <th className="text-left p-3 text-sm font-semibold text-slate-600 dark:text-slate-300 hidden sm:table-cell">Category</th>
                            <th className="text-left p-3 text-sm font-semibold text-slate-600 dark:text-slate-300 hidden md:table-cell">Visibility</th>
                            <th className="text-left p-3 text-sm font-semibold text-slate-600 dark:text-slate-300 hidden lg:table-cell">Date</th>
                            <th className="text-right p-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredDocs.map(doc => (
                            <tr key={doc.id} className="border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                <td className="p-3">
                                    <div className="flex items-center gap-2">
                                        <FiFileText className="text-slate-400" />
                                        <div>
                                            <p className="text-sm font-medium text-slate-800 dark:text-white">{doc.title}</p>
                                            <p className="text-xs text-slate-500">{doc.file_name}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-3 hidden sm:table-cell">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${categoryColors[doc.category] || categoryColors.other}`}>{doc.category}</span>
                                </td>
                                <td className="p-3 hidden md:table-cell">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${doc.is_public ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {doc.is_public ? 'Public' : 'Private'}
                                    </span>
                                </td>
                                <td className="p-3 text-sm text-slate-500 hidden lg:table-cell">{new Date(doc.created_at).toLocaleDateString()}</td>
                                <td className="p-3">
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => handleDownload(doc.id)} className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20" title="Download"><FiDownload /></button>
                                        <button onClick={() => handleDelete(doc.id)} className="p-1.5 text-slate-500 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20" title="Delete"><FiTrash2 /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredDocs.length === 0 && <div className="p-8 text-center text-slate-500">No documents found</div>}
            </div>
        </div>
    );
};

export default DocumentsPage;
