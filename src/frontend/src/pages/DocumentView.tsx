import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Trash2 } from 'lucide-react';
import { type ApiDocument, getDocument, deleteDocument } from '../services/document.api';
import axios from 'axios';
import { showError, showSuccess } from '../utils/toast';


import './DocumentView.css';

export const DocumentView: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [document, setDocument] = useState<ApiDocument | null>(null);
    const [textContent, setTextContent] = useState("");
    const [loading, setLoading] = useState(true);
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

    useEffect(() => {
        const fetchDocument = async () => {
            if (!id) return;
            try {
                // Direct fetch using the new endpoint
                const doc = await getDocument(parseInt(id));
                setDocument(doc);
            } catch (error) {
                showError('Failed to load document');
                console.error(error);
                navigate('/documents');
            } finally {
                setLoading(false);
            }
        };
        fetchDocument();
    }, [id, navigate]);

    useEffect(() => {
        const fetchContent = async () => {
            if (!document) return;

            const isTxtFile = document.name.toLowerCase().endsWith('.txt');

            if (isTxtFile) {
                try {
                    const response = await axios.get(`/api/documents/${document.id}/view`, {
                        params: { raw: true },
                        responseType: 'text'
                    });
                    setTextContent(response.data);
                } catch (e) {
                    console.error('Failed to fetch text content:', e);
                    setTextContent('Failed to load content.');
                }
            }
        };
        fetchContent();
    }, [document]);

    const handleDeleteClick = () => {
        setConfirmDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!id) return;

        try {
            await deleteDocument(parseInt(id));
            showSuccess('Document deleted successfully');
            navigate('/documents');
        } catch (error) {
            console.error('Failed to delete document:', error);
            showError('Failed to delete document');
        } finally {
            setConfirmDialogOpen(false);
        }
    };

    const handleCancelDelete = () => {
        setConfirmDialogOpen(false);
    };

    if (loading || !document) {
        return (
            <div className="loading-container">
                <div className="loading-content">
                    <FileText size={48} style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }} />
                    <p style={{ color: 'var(--text-secondary)' }}>Loading document...</p>
                </div>
            </div>
        );
    }

    // Helper to get file icon based on type
    const getFileIcon = () => {
        return <FileText size={24} color="#64748b" strokeWidth={1.5} />;
    };


    const renderContent = () => {
        const isTxtFile = document.name.toLowerCase().endsWith('.txt');

        if (isTxtFile) {
            return (
                <div className="document-text-content">
                    {textContent || 'Loading content...'}
                </div>
            );
        }

        return (
            <div className="document-preview-placeholder">
                <FileText size={64} style={{ color: 'var(--text-secondary)' }} />
                <h3>Preview not available</h3>
                <p style={{ color: 'var(--text-secondary)' }}>This file type cannot be previewed in the browser.</p>
            </div>
        );
    };

    return (
        <div className="document-view-container">
            <div className="document-view-content">
                {/* Unified Card Container */}
                <div className="document-card">
                    {/* Header Section */}
                    <div className="document-header">
                        {/* Left Section: Back + File Info */}
                        <div className="document-header-left">
                            {/* Back Button */}
                            <button
                                onClick={() => navigate('/documents')}
                                className="back-button"
                                title="Back to Documents"
                            >
                                <ArrowLeft size={18} />
                            </button>

                            {/* Divider */}
                            <div className="file-info-divider" />

                            {/* File Icon */}
                            <div className="file-icon-wrapper">
                                {getFileIcon()}
                            </div>

                            {/* Filename */}
                            {document && (
                                <span className="document-filename">
                                    {document.name}
                                </span>
                            )}

                            {/* File Size */}
                            {document?.size && (
                                <span className="document-filesize">
                                    {(document.size / 1024).toFixed(1)} KB
                                </span>
                            )}
                        </div>

                        {/* Action Buttons Container */}
                        <div className="document-actions">
                            <button
                                onClick={handleDeleteClick}
                                className="action-button delete-button"
                                title="Delete Document"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Content Scroll Area */}
                    <div className="document-scroll-area">
                        {renderContent()}
                    </div>
                </div>
            </div>

            {/* Confirmation Dialog */}
            {confirmDialogOpen && (
                <div className="confirmation-overlay" onClick={(e) => e.stopPropagation()}>
                    <div className="confirmation-dialog" onClick={(e) => e.stopPropagation()}>
                        <div className="confirmation-header">
                            <div className="confirmation-icon">
                                <Trash2 className="text-red-500" size={24} />
                            </div>
                            <h3 className="confirmation-title">Delete Document</h3>
                        </div>
                        
                        <p className="confirmation-message">
                            Are you sure you want to delete the document "{document?.name}"? This action cannot be undone.
                        </p>
                        
                        <div className="confirmation-actions">
                            <button
                                onClick={handleCancelDelete}
                                className="btn-cancel"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                className="btn-delete"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
