import { useState, useEffect, useCallback } from 'react';
import fileService, { UploadedFile, FileUploadOptions } from '../services/fileService';

interface UseFilesReturn {
  files: UploadedFile[];
  isLoading: boolean;
  error: string | null;
  uploadProgress: number;
  fetchFiles: () => Promise<void>;
  uploadFile: (options: FileUploadOptions) => Promise<UploadedFile>;
  deleteFile: (fileId: number) => Promise<void>;
  getDownloadUrl: (fileId: number) => Promise<string>;
  fetchByCategory: (category: string) => Promise<void>;
}

export const useFiles = (): UseFilesReturn => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fetchFiles = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const fetchedFiles = await fileService.getAll();
      setFiles(fetchedFiles);
    } catch (err: any) {
      console.error('Failed to fetch files:', err);
      setError(err.message || 'Failed to load files');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const uploadFile = useCallback(async (options: FileUploadOptions): Promise<UploadedFile> => {
    try {
      setIsLoading(true);
      setError(null);
      setUploadProgress(0);

      const validation = fileService.validateFile(options.file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      const uploadedFile = await fileService.upload({
        ...options,
        onProgress: (progress) => {
          setUploadProgress(progress);
          if (options.onProgress) {
            options.onProgress(progress);
          }
        },
      });

      setFiles((prev) => [uploadedFile, ...prev]);
      setUploadProgress(100);

      setTimeout(() => setUploadProgress(0), 1000);

      return uploadedFile;
    } catch (err: any) {
      console.error('Failed to upload file:', err);
      setError(err.message || 'Failed to upload file');
      setUploadProgress(0);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteFile = useCallback(async (fileId: number) => {
    try {
      setIsLoading(true);
      setError(null);
      await fileService.delete(fileId);
      setFiles((prev) => prev.filter((file) => file.id !== fileId));
    } catch (err: any) {
      console.error('Failed to delete file:', err);
      setError(err.message || 'Failed to delete file');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getDownloadUrl = useCallback(async (fileId: number): Promise<string> => {
    try {
      setError(null);
      const response = await fileService.getDownloadUrl(fileId);
      return response.download_url;
    } catch (err: any) {
      console.error('Failed to get download URL:', err);
      setError(err.message || 'Failed to get download URL');
      throw err;
    }
  }, []);

  const fetchByCategory = useCallback(async (category: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const fetchedFiles = await fileService.getByCategory(category);
      setFiles(fetchedFiles);
    } catch (err: any) {
      console.error('Failed to fetch files by category:', err);
      setError(err.message || 'Failed to load files');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  return {
    files,
    isLoading,
    error,
    uploadProgress,
    fetchFiles,
    uploadFile,
    deleteFile,
    getDownloadUrl,
    fetchByCategory,
  };
};

export default useFiles;
