import React, { useState, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  LinearProgress,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
} from '@mui/material';
import Icon from '@mui/material/Icon';
import { useFiles } from '../hooks/useFiles';

interface FileUploadProps {
  onUploadSuccess?: () => void;
  maxFiles?: number;
  acceptedFileTypes?: string[];
}

const FileUpload: React.FC<FileUploadProps> = ({
  onUploadSuccess,
  maxFiles = 10,
  acceptedFileTypes,
}) => {
  const { uploadFile, uploadProgress, error } = useFiles();
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFileSelection(droppedFiles);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFileSelection(files);
    }
  };

  const handleFileSelection = (files: File[]) => {
    const totalFiles = selectedFiles.length + files.length;

    if (totalFiles > maxFiles) {
      setUploadError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    if (acceptedFileTypes && acceptedFileTypes.length > 0) {
      const invalidFiles = files.filter(
        (file) => !acceptedFileTypes.includes(file.type)
      );

      if (invalidFiles.length > 0) {
        setUploadError(
          `Invalid file type(s): ${invalidFiles.map((f) => f.name).join(', ')}`
        );
        return;
      }
    }

    setSelectedFiles((prev) => [...prev, ...files]);
    setUploadError(null);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploadError(null);
    setUploadSuccess(null);

    try {
      for (const file of selectedFiles) {
        await uploadFile({ file });
      }

      setUploadSuccess(`Successfully uploaded ${selectedFiles.length} file(s)`);
      setSelectedFiles([]);

      if (onUploadSuccess) {
        onUploadSuccess();
      }

      setTimeout(() => setUploadSuccess(null), 3000);
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed');
    }
  };

  const getFileIcon = (file: File): string => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video_library';
    if (file.type.startsWith('audio/')) return 'audio_file';
    if (file.type.includes('pdf')) return 'picture_as_pdf';
    if (
      file.type.includes('word') ||
      file.type.includes('document')
    )
      return 'description';
    if (file.type.includes('sheet') || file.type.includes('excel'))
      return 'table_chart';
    if (file.type.includes('zip') || file.type.includes('compressed'))
      return 'folder_zip';
    return 'insert_drive_file';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <Box>
      <Paper
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        sx={{
          p: 4,
          border: '2px dashed',
          borderColor: isDragging ? 'primary.main' : 'divider',
          backgroundColor: isDragging ? 'action.hover' : 'background.paper',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          '&:hover': {
            borderColor: 'primary.main',
            backgroundColor: 'action.hover',
          },
        }}
        onClick={handleUploadClick}
      >
        <Icon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }}>
          cloud_upload
        </Icon>
        <Typography variant="h6" gutterBottom>
          Drag & Drop Files Here
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          or click to browse
        </Typography>
        <Button variant="contained" sx={{ mt: 1 }}>
          Select Files
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
          accept={acceptedFileTypes?.join(',')}
        />
      </Paper>

      {selectedFiles.length > 0 && (
        <Box mt={3}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              Selected Files ({selectedFiles.length})
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={handleUpload}
              disabled={uploadProgress > 0}
            >
              Upload All
            </Button>
          </Box>

          <List>
            {selectedFiles.map((file, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  <Icon>{getFileIcon(file)}</Icon>
                </ListItemIcon>
                <ListItemText
                  primary={file.name}
                  secondary={formatFileSize(file.size)}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    onClick={() => handleRemoveFile(index)}
                    disabled={uploadProgress > 0}
                  >
                    <Icon>delete</Icon>
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {uploadProgress > 0 && (
        <Box mt={2}>
          <Typography variant="body2" gutterBottom>
            Uploading... {uploadProgress}%
          </Typography>
          <LinearProgress variant="determinate" value={uploadProgress} />
        </Box>
      )}

      {(uploadError || error) && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {uploadError || error}
        </Alert>
      )}

      {uploadSuccess && (
        <Alert severity="success" sx={{ mt: 2 }}>
          {uploadSuccess}
        </Alert>
      )}
    </Box>
  );
};

export default FileUpload;
