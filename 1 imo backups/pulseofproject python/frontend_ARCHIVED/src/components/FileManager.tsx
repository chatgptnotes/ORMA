import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Typography,
  IconButton,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Paper,
} from '@mui/material';
import Icon from '@mui/material/Icon';
import { useFiles } from '../hooks/useFiles';
import { UploadedFile } from '../services/fileService';
import fileService from '../services/fileService';

interface FileManagerProps {
  onFileSelect?: (file: UploadedFile) => void;
}

const FileManager: React.FC<FileManagerProps> = ({ onFileSelect }) => {
  const { files, isLoading, error, deleteFile, getDownloadUrl, fetchByCategory, fetchFiles } = useFiles();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [previewFile, setPreviewFile] = useState<UploadedFile | null>(null);
  const [deleteConfirmFile, setDeleteConfirmFile] = useState<UploadedFile | null>(null);

  const categories = [
    { value: 'all', label: 'All Files', icon: 'folder' },
    { value: 'image', label: 'Images', icon: 'image' },
    { value: 'video', label: 'Videos', icon: 'video_library' },
    { value: 'audio', label: 'Audio', icon: 'audio_file' },
    { value: 'document', label: 'Documents', icon: 'description' },
    { value: 'archive', label: 'Archives', icon: 'folder_zip' },
    { value: 'other', label: 'Other', icon: 'insert_drive_file' },
  ];

  const handleCategoryChange = (_event: React.SyntheticEvent, newValue: string) => {
    setSelectedCategory(newValue);
    if (newValue === 'all') {
      fetchFiles();
    } else {
      fetchByCategory(newValue);
    }
  };

  const handleDownload = async (file: UploadedFile) => {
    try {
      const downloadUrl = await getDownloadUrl(file.id);
      window.open(downloadUrl, '_blank');
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  const handleDeleteClick = (file: UploadedFile) => {
    setDeleteConfirmFile(file);
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirmFile) {
      try {
        await deleteFile(deleteConfirmFile.id);
        setDeleteConfirmFile(null);
      } catch (err) {
        console.error('Delete failed:', err);
      }
    }
  };

  const handlePreview = (file: UploadedFile) => {
    setPreviewFile(file);
  };

  const getFilePreview = (file: UploadedFile) => {
    if (file.is_image) {
      return (
        <CardMedia
          component="img"
          height="140"
          image={file.storage_url}
          alt={file.original_filename}
          sx={{ objectFit: 'cover' }}
        />
      );
    }

    return (
      <Box
        sx={{
          height: 140,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'action.hover',
        }}
      >
        <Icon sx={{ fontSize: 64, color: 'text.secondary' }}>
          {fileService.getFileIcon(file)}
        </Icon>
      </Box>
    );
  };

  const filteredFiles = selectedCategory === 'all'
    ? files
    : files.filter((file) => file.file_category === selectedCategory);

  if (isLoading && files.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={selectedCategory}
          onChange={handleCategoryChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          {categories.map((category) => (
            <Tab
              key={category.value}
              value={category.value}
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <Icon>{category.icon}</Icon>
                  <span>{category.label}</span>
                </Box>
              }
            />
          ))}
        </Tabs>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {filteredFiles.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Icon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }}>
            folder_open
          </Icon>
          <Typography variant="h6" color="text.secondary">
            No files found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Upload some files to get started
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {filteredFiles.map((file) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={file.id}>
              <Card>
                {getFilePreview(file)}
                <CardContent>
                  <Typography variant="subtitle2" noWrap title={file.original_filename}>
                    {file.original_filename}
                  </Typography>
                  <Box display="flex" gap={1} mt={1}>
                    <Chip
                      label={file.file_category}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                    <Chip
                      label={file.human_readable_size}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                  <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                    {new Date(file.created_at).toLocaleDateString()}
                  </Typography>
                </CardContent>
                <CardActions>
                  {file.is_image && (
                    <IconButton
                      size="small"
                      onClick={() => handlePreview(file)}
                      title="Preview"
                    >
                      <Icon>visibility</Icon>
                    </IconButton>
                  )}
                  <IconButton
                    size="small"
                    onClick={() => handleDownload(file)}
                    title="Download"
                  >
                    <Icon>download</Icon>
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteClick(file)}
                    title="Delete"
                    color="error"
                  >
                    <Icon>delete</Icon>
                  </IconButton>
                  {onFileSelect && (
                    <IconButton
                      size="small"
                      onClick={() => onFileSelect(file)}
                      title="Select"
                    >
                      <Icon>check_circle</Icon>
                    </IconButton>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog
        open={!!previewFile}
        onClose={() => setPreviewFile(null)}
        maxWidth="md"
        fullWidth
      >
        {previewFile && (
          <>
            <DialogTitle>{previewFile.original_filename}</DialogTitle>
            <DialogContent>
              {previewFile.is_image ? (
                <img
                  src={previewFile.storage_url}
                  alt={previewFile.original_filename}
                  style={{ width: '100%', height: 'auto' }}
                />
              ) : (
                <Typography>Preview not available for this file type</Typography>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setPreviewFile(null)}>Close</Button>
              <Button onClick={() => handleDownload(previewFile)} variant="contained">
                Download
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Dialog
        open={!!deleteConfirmFile}
        onClose={() => setDeleteConfirmFile(null)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{deleteConfirmFile?.original_filename}"?
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" mt={1}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmFile(null)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FileManager;
