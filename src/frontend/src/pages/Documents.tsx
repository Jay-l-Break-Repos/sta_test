import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Eye, Plus, Trash2 } from 'lucide-react';
import { getDocuments, deleteDocument } from '../services/document.api';
import { showError, showSuccess } from '../utils/toast';

interface Document {
    id: number;
    name: string;
    size: number;
    content_type: string;
    created_at: string;
    owner_id: number;
    last_modified_by: string;
}

export const Documents = () => {
    const navigate = useNavigate();
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [documentToDelete, setDocumentToDelete] = useState<number | null>(null);
    const [documentNameToDelete, setDocumentNameToDelete] = useState<string>('');

    const fetchDocuments = async () => {
        setLoading(true);
        try {
            const response = await getDocuments();
            setDocuments(response);
        } catch (error) {
            console.error('Failed to fetch documents:', error);
            showError('Failed to load documents');
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        fetchDocuments();
    }, []);

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };


    const getFileIcon = (contentType: string, name: string) => {
        const nameLower = name.toLowerCase();

        // Text files (.txt)
        if (nameLower.endsWith('.txt') || contentType === 'text/plain') {
            return <FileText size={20} className="text-gray-600" />;
        }

        // Default
        return <FileText size={20} className="text-gray-500" />;
    };

    const handleDeleteClick = (id: number, name: string) => {
        setDocumentToDelete(id);
        setDocumentNameToDelete(name);
        setConfirmDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (documentToDelete === null) return;

        try {
            await deleteDocument(documentToDelete);
            
            // Remove the deleted document from the list
            setDocuments(documents.filter(doc => doc.id !== documentToDelete));
            
            // Show success message
            showSuccess('Document deleted successfully');
        } catch (error) {
            console.error('Failed to delete document:', error);
            showError('Failed to delete document');
        } finally {
            setConfirmDialogOpen(false);
            setDocumentToDelete(null);
            setDocumentNameToDelete('');
        }
    };

    const handleCancelDelete = () => {
        setConfirmDialogOpen(false);
        setDocumentToDelete(null);
        setDocumentNameToDelete('');
    };


    return (
        <div className="p-6 max-w-[1600px] mx-auto bg-gray-50/50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    <button
                        onClick={() => navigate('/upload')}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium whitespace-nowrap"
                    >
                        <Plus size={20} />
                        Upload Document
                    </button>
                </div>
            </div>

            {/* Main Content Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">


                {/* Table */}
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="flex justify-center flex-col items-center py-20">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
                            <p className="text-gray-500 text-sm">Loading your documents...</p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="py-4 px-4 pl-6 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Name</th>
                                    <th className="py-4 px-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Created</th>
                                    <th className="py-4 px-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Modified By</th>
                                    <th className="py-4 px-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Size</th>
                                    <th className="py-4 px-4 pr-6 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {documents.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="text-center py-16 text-gray-400">
                                            No documents found.
                                        </td>
                                    </tr>
                                ) : (
                                    documents.map((doc) => (
                                        <tr
                                            key={doc.id}
                                            onClick={() => navigate(`/documents/${doc.id}`)}
                                            className="group hover:bg-gray-50/50 cursor-pointer transition-colors"
                                        >
                                            <td className="py-4 px-4 pl-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-gray-50 rounded-lg border border-gray-100 group-hover:bg-white group-hover:border-gray-200 transition-colors">
                                                        {getFileIcon(doc.content_type, doc.name)}
                                                    </div>
                                                    <span className="font-medium text-gray-900 text-sm group-hover:text-indigo-600 transition-colors">
                                                        {doc.name}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 text-gray-500 text-sm text-center whitespace-nowrap">
                                                {new Date(doc.created_at).toLocaleDateString()}
                                                <span className="text-gray-300 mx-1">,</span>
                                                <span className="text-gray-400 text-xs">{new Date(doc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </td>
                                            <td className="py-4 px-4 text-gray-600 text-sm">
                                                {doc.last_modified_by || 'Unknown'}
                                            </td>
                                            <td className="py-4 px-4 text-gray-500 text-sm font-mono text-right">{formatSize(doc.size)}</td>
                                            <td className="py-4 px-4 pr-6 text-right">
                                                <div className="flex gap-2 justify-end">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(`/documents/${doc.id}`);
                                                        }}
                                                        className="p-2 hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 rounded-lg transition-colors"
                                                        title="View"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteClick(doc.id, doc.name);
                                                        }}
                                                        className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Confirmation Dialog */}
            {confirmDialogOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div 
                        className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-md transform transition-all duration-300 scale-100"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-red-50 rounded-xl">
                                        <Trash2 className="text-red-500" size={24} />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900">Delete Document</h3>
                                </div>
                                <button
                                    onClick={handleCancelDelete}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                    aria-label="Close"
                                >
                                    <X size={20} className="text-gray-500" />
                                </button>
                            </div>
                            
                            <p className="text-gray-600 mb-6">Are you sure you want to delete the document "{documentNameToDelete}"? This action cannot be undone.</p>
                            
                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={handleCancelDelete}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmDelete}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
