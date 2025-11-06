import api from './api';

export interface UploadedFile {
  id: number;
  user: number;
  username: string;
  filename: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  storage_path: string;
  storage_url: string;
  bucket_id: string;
  file_category: 'document' | 'image' | 'video' | 'audio' | 'archive' | 'other';
  metadata: Record<string, any>;
  file_extension: string;
  human_readable_size: string;
  is_image: boolean;
  is_video: boolean;
  is_audio: boolean;
  is_document: boolean;
  created_at: string;
  updated_at: string;
}

export interface FileUploadOptions {
  file: File;
  bucket_id?: string;
  metadata?: Record<string, any>;
  onProgress?: (progress: number) => void;
}

export interface DownloadUrlResponse {
  download_url: string;
  expires_in: number;
}

class FileService {
  private readonly BASE_URL = '/files';

  async getAll(): Promise<UploadedFile[]> {
    try {
      const response = await api.get(`${this.BASE_URL}/`);

      if (response.data && Array.isArray(response.data.results)) {
        return response.data.results;
      }
      if (Array.isArray(response.data)) {
        return response.data;
      }
      console.warn('Unexpected file response format:', response.data);
      return [];
    } catch (error) {
      console.error('Failed to fetch files:', error);
      throw error;
    }
  }

  async upload(options: FileUploadOptions): Promise<UploadedFile> {
    try {
      const formData = new FormData();
      formData.append('file', options.file);

      if (options.bucket_id) {
        formData.append('bucket_id', options.bucket_id);
      }

      if (options.metadata) {
        formData.append('metadata', JSON.stringify(options.metadata));
      }

      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent: any) => {
          if (options.onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            options.onProgress(progress);
          }
        },
      };

      const response = await api.post(`${this.BASE_URL}/upload/`, formData, config);
      return response.data;
    } catch (error: any) {
      console.error('File upload failed:', error);
      throw new Error(error.response?.data?.error || 'File upload failed');
    }
  }

  async delete(fileId: number): Promise<void> {
    try {
      await api.delete(`${this.BASE_URL}/${fileId}/delete_file/`);
    } catch (error: any) {
      console.error('File deletion failed:', error);
      throw new Error(error.response?.data?.error || 'File deletion failed');
    }
  }

  async getDownloadUrl(fileId: number): Promise<DownloadUrlResponse> {
    try {
      const response = await api.get(`${this.BASE_URL}/${fileId}/download_url/`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to get download URL:', error);
      throw new Error(error.response?.data?.error || 'Failed to get download URL');
    }
  }

  async getByCategory(category: string): Promise<UploadedFile[]> {
    try {
      const response = await api.get(`${this.BASE_URL}/by_category/`, {
        params: { category },
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch files by category:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch files by category');
    }
  }

  async getById(fileId: number): Promise<UploadedFile> {
    try {
      const response = await api.get(`${this.BASE_URL}/${fileId}/`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch file:', error);
      throw error;
    }
  }

  validateFile(file: File, maxSize: number = 50 * 1024 * 1024): { valid: boolean; error?: string } {
    if (!file) {
      return { valid: false, error: 'No file selected' };
    }

    if (file.size > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024);
      return {
        valid: false,
        error: `File size exceeds maximum limit of ${maxSizeMB}MB`
      };
    }

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'video/mp4',
      'video/quicktime',
      'audio/mpeg',
      'audio/wav',
      'application/zip',
    ];

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'File type not supported'
      };
    }

    return { valid: true };
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  getFileIcon(file: UploadedFile): string {
    if (file.is_image) return 'image';
    if (file.is_video) return 'video_library';
    if (file.is_audio) return 'audio_file';
    if (file.is_document) return 'description';
    if (file.file_category === 'archive') return 'folder_zip';
    return 'insert_drive_file';
  }
}

export default new FileService();
