import React, { useState, useCallback } from 'react';
import Header from './components/Header';
import ImageUploader from './components/ImageUploader';
import CameraCapture from './components/CameraCapture';
import OptionSelector from './components/OptionSelector';
import ImageDisplay from './components/ImageDisplay';
import Chatbot from './components/Chatbot';
import { generateStyledImage } from './services/geminiService';
import { UploadedImage, HairstyleOption, GeneratedImage } from './types';

const App: React.FC = () => {
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<HairstyleOption | null>(null);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);

  const handleImageUpload = useCallback((image: UploadedImage) => {
    setUploadedImage(image);
    setError(null);
  }, []);

  const handleCameraCapture = useCallback((imageBlob: Blob) => {
    const file = new File([imageBlob], 'camera-capture.jpg', { type: 'image/jpeg' });
    const url = URL.createObjectURL(imageBlob);
    setUploadedImage({
      file,
      url,
      preview: url
    });
    setShowCamera(false);
  }, []);

  const handleStyleSelect = useCallback(async (style: HairstyleOption) => {
    if (!uploadedImage) {
      setError('Please upload an image first');
      return;
    }

    setSelectedStyle(style);
    setIsGenerating(true);
    setError(null);

    try {
      const styledImageUrl = await generateStyledImage(uploadedImage.file, style);
      
      const newGeneratedImage: GeneratedImage = {
        id: Date.now().toString(),
        originalImage: uploadedImage.url,
        styledImage: styledImageUrl,
        styleUsed: style,
        timestamp: Date.now()
      };

      setGeneratedImages(prev => [newGeneratedImage, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate styled image');
    } finally {
      setIsGenerating(false);
    }
  }, [uploadedImage]);

  const handleRetry = useCallback(() => {
    if (selectedStyle) {
      handleStyleSelect(selectedStyle);
    }
  }, [selectedStyle, handleStyleSelect]);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <Header />
      
      <main style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '20px',
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '24px'
      }}>
        {/* Image Upload Section */}
        <section style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '600',
            marginBottom: '16px',
            color: '#1a202c'
          }}>
            Upload Your Photo
          </h2>
          
          <div style={{
            display: 'flex',
            gap: '16px',
            marginBottom: '16px',
            flexWrap: 'wrap'
          }}>
            <ImageUploader onImageUpload={handleImageUpload} />
            <button
              onClick={() => setShowCamera(true)}
              style={{
                padding: '12px 24px',
                backgroundColor: '#4c51bf',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '500'
              }}
            >
              📸 Use Camera
            </button>
          </div>

          {showCamera && (
            <CameraCapture
              onCapture={handleCameraCapture}
              onClose={() => setShowCamera(false)}
            />
          )}

          {error && (
            <div style={{
              backgroundColor: '#feb2b2',
              color: '#742a2a',
              padding: '12px',
              borderRadius: '8px',
              marginTop: '16px'
            }}>
              {error}
            </div>
          )}
        </section>

        {/* Style Selection */}
        {uploadedImage && (
          <section style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '600',
              marginBottom: '16px',
              color: '#1a202c'
            }}>
              Choose Your Style
            </h2>
            
            <OptionSelector
              onStyleSelect={handleStyleSelect}
              selectedStyle={selectedStyle}
              isGenerating={isGenerating}
            />
          </section>
        )}

        {/* Results Display */}
        {(generatedImages.length > 0 || isGenerating) && (
          <section style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '600',
              marginBottom: '16px',
              color: '#1a202c'
            }}>
              Your Styled Look
            </h2>
            
            <ImageDisplay
              originalImage={uploadedImage?.url}
              generatedImages={generatedImages}
              isGenerating={isGenerating}
              onRetry={handleRetry}
            />
          </section>
        )}

        {/* AI Chat Assistant */}
        <section style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '600',
            marginBottom: '16px',
            color: '#1a202c'
          }}>
            AI Styling Assistant
          </h2>
          
          <Chatbot uploadedImage={uploadedImage} selectedStyle={selectedStyle} />
        </section>
      </main>

      <footer style={{
        textAlign: 'center',
        padding: '24px',
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: '14px'
      }}>
        <p>✨ Pre-Wedding Look Styler - Powered by AI ✨</p>
        <p>Transform your special moments with intelligent styling</p>
      </footer>
    </div>
  );
};

export default App;