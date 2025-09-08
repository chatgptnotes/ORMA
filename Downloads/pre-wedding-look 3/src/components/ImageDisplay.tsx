import React from 'react';
import { GeneratedImage } from '../types';

interface ImageDisplayProps {
  originalImage?: string;
  generatedImages: GeneratedImage[];
  isGenerating: boolean;
  onRetry: () => void;
}

const ImageDisplay: React.FC<ImageDisplayProps> = ({ 
  originalImage, 
  generatedImages, 
  isGenerating, 
  onRetry 
}) => {
  if (isGenerating) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
        textAlign: 'center'
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          border: '4px solid #e2e8f0',
          borderTop: '4px solid #4c51bf',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '24px'
        }} />
        
        <h3 style={{
          fontSize: '20px',
          fontWeight: '600',
          color: '#1a202c',
          margin: '0 0 8px 0'
        }}>
          Creating Your Styled Look
        </h3>
        
        <p style={{
          fontSize: '16px',
          color: '#718096',
          margin: '0 0 16px 0',
          maxWidth: '400px',
          lineHeight: '1.5'
        }}>
          Our AI is analyzing your photo and applying the selected hairstyle. This may take a moment...
        </p>
        
        <div style={{
          display: 'flex',
          gap: '4px'
        }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: '8px',
                height: '8px',
                backgroundColor: '#4c51bf',
                borderRadius: '50%',
                animation: `bounce 1.4s ease-in-out ${i * 0.16}s infinite both`
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (generatedImages.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '40px',
        color: '#718096'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎨</div>
        <p>Your styled images will appear here once generated.</p>
      </div>
    );
  }

  const latestImage = generatedImages[0];

  return (
    <div>
      {/* Latest Result - Before/After Comparison */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: originalImage ? '1fr 1fr' : '1fr',
        gap: '24px',
        marginBottom: '32px'
      }}>
        {originalImage && (
          <div>
            <h4 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#1a202c',
              margin: '0 0 12px 0',
              textAlign: 'center'
            }}>
              Original
            </h4>
            <div style={{
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
            }}>
              <img
                src={originalImage}
                alt="Original photo"
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block'
                }}
              />
            </div>
          </div>
        )}
        
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px'
          }}>
            <h4 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#1a202c',
              margin: 0
            }}>
              {latestImage.styleUsed.name}
            </h4>
            
            <div style={{
              display: 'flex',
              gap: '8px'
            }}>
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = latestImage.styledImage;
                  link.download = `styled-${latestImage.styleUsed.name}-${Date.now()}.jpg`;
                  link.click();
                }}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#48bb78',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '500'
                }}
              >
                💾 Download
              </button>
              
              <button
                onClick={onRetry}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#4c51bf',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '500'
                }}
              >
                🔄 Retry
              </button>
            </div>
          </div>
          
          <div style={{
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            position: 'relative'
          }}>
            <img
              src={latestImage.styledImage}
              alt={`Styled with ${latestImage.styleUsed.name}`}
              style={{
                width: '100%',
                height: 'auto',
                display: 'block'
              }}
              onError={(e) => {
                // Fallback for broken images
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  const errorDiv = document.createElement('div');
                  errorDiv.style.cssText = `
                    padding: 40px;
                    text-align: center;
                    background: #f7fafc;
                    color: #718096;
                    border-radius: 12px;
                  `;
                  errorDiv.innerHTML = `
                    <div style=\"font-size: 24px; margin-bottom: 8px;\">⚠️</div>
                    <p>Failed to load styled image</p>
                    <button onclick=\"${onRetry.toString()}()\" style=\"
                      margin-top: 12px;
                      padding: 8px 16px;
                      background: #4c51bf;
                      color: white;
                      border: none;
                      border-radius: 6px;
                      cursor: pointer;
                    \">Try Again</button>
                  `;
                  parent.appendChild(errorDiv);
                }
              }}
            />
            
            {/* Style badge */}
            <div style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              backgroundColor: 'rgba(76, 81, 191, 0.9)',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: '500'
            }}>
              ✨ AI Styled
            </div>
          </div>
        </div>
      </div>

      {/* Previous Results */}
      {generatedImages.length > 1 && (
        <div>
          <h4 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#1a202c',
            margin: '0 0 16px 0'
          }}>
            Previous Styles
          </h4>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '16px'
          }}>
            {generatedImages.slice(1).map((image) => (
              <div
                key={image.id}
                style={{
                  borderRadius: '8px',
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease',
                  ':hover': {
                    transform: 'scale(1.05)'
                  }
                }}
                onClick={() => {
                  // Move clicked image to the front
                  const newOrder = [image, ...generatedImages.filter(img => img.id !== image.id)];
                  // This would need to be handled by parent component
                }}
              >
                <img
                  src={image.styledImage}
                  alt={`Styled with ${image.styleUsed.name}`}
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block'
                  }}
                />
                
                <div style={{
                  padding: '8px',
                  backgroundColor: 'white'
                }}>
                  <p style={{
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#1a202c',
                    margin: 0,
                    textAlign: 'center'
                  }}>
                    {image.styleUsed.name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          @keyframes bounce {
            0%, 80%, 100% { 
              transform: scale(0);
            } 40% { 
              transform: scale(1);
            }
          }
        `}
      </style>
    </div>
  );
};

export default ImageDisplay;