import axios from 'axios';

export interface ApiDocument {
    id: number;
    name: string;
    size: number;
    content_type: string;
    path: string;
    created_at: string;
    owner_id: number;
    last_modified_by: string;
    versions: {
        id: number;
        version_number: number;
        path: string;
        created_at: string;
        size?: number;
        document_id: number;
        last_modified_by: string;
    }[];
}

export const uploadDocument = async (file: File, onProgress?: (percent: number) => void, userId?: string): Promise<ApiDocument> => {
    const formData = new FormData();
    formData.append('file', file);

    const headers: Record<string, string> = {};
    if (userId) {
        headers['X-User-ID'] = userId;
    }

    const response = await axios.post<ApiDocument>('/api/documents/upload', formData, {
        headers,
        onUploadProgress: (progressEvent) => {
            if (progressEvent.total && onProgress) {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                onProgress(percentCompleted);
            }
        },
    });
    return response.data;
};

export const getDocuments = async (sort_by: string = 'id', order: 'asc' | 'desc' = 'desc'): Promise<ApiDocument[]> => {
    const params: any = { sort_by, order };
    const response = await axios.get<ApiDocument[]>('/api/documents', { params });
    return response.data;
};

export const getDocument = async (id: number): Promise<ApiDocument> => {
    const response = await axios.get<ApiDocument>(`/api/documents/${id}`);
    return response.data;
};

export const deleteDocument = async (id: number): Promise<void> => {
    await axios.delete(`/api/documents/${id}`);
};