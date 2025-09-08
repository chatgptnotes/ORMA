import React, { useCallback, useState, useRef } from 'react';
import { UploadedImage } from '../types';
import { ACCEPTED_IMAGE_TYPES, MAX_FILE_SIZE } from '../constants';

interface ImageUploaderProps {
  onImageUpload: (image: UploadedImage) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      return 'Please upload a JPEG, PNG, or WebP image.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File size must be less than 5MB.';
    }
    return null;
  };

  const processFile = useCallback(async (file: File) => {
    const error = validateFile(file);
    if (error) {
      alert(error);
      return;
    }

    setIsUploading(true);
    
    try {
      const url = URL.createObjectURL(file);
      const uploadedImage: UploadedImage = {
        file,
        url,
        preview: url
      };
      
      onImageUpload(uploadedImage);
    } catch (error) {
      console.error('Error processing file:', error);
      alert('Error processing the image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }, [onImageUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processFile(files[0]);
    }
  }, [processFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  }, [processFile]);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div style={{ position: 'relative' }}>
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(',')}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        style={{
          border: `2px dashed ${isDragging ? '#4c51bf' : '#cbd5e0'}`,
          borderRadius: '12px',
          padding: '32px',
          textAlign: 'center',
          cursor: 'pointer',
          backgroundColor: isDragging ? 'rgba(76, 81, 191, 0.1)' : '#f7fafc',
          transition: 'all 0.3s ease',
          minHeight: '200px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px'
        }}
      >
        {isUploading ? (
          <>
            <div style={{
              width: '32px',
              height: '32px',
              border: '3px solid #e2e8f0',
              borderTop: '3px solid #4c51bf',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <p style={{ color: '#4a5568', fontSize: '16px', margin: 0 }}>
              Processing image...
            </p>
          </>
        ) : (
          <>
            <div style={{ fontSize: '48px' }}>📷</div>
            <div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#2d3748',
                margin: '0 0 8px 0'
              }}>
                Upload Your Photo
              </h3>
              <p style={{
                color: '#718096',
                fontSize: '14px',
                margin: 0
              }}>
                Drag and drop or click to select
              </p>
              <p style={{
                color: '#a0aec0',
                fontSize: '12px',
                margin: '4px 0 0 0'
              }}>
                JPEG, PNG, WebP up to 5MB
              </p>
            </div>
          </>
        )}
      </div>
      
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default ImageUploader;