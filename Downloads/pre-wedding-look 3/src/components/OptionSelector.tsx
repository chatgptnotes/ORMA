import React, { useState } from 'react';
import { HairstyleOption } from '../types';
import { BRIDE_HAIRSTYLES, GROOM_HAIRSTYLES } from '../constants';

interface OptionSelectorProps {
  onStyleSelect: (style: HairstyleOption) => void;
  selectedStyle: HairstyleOption | null;
  isGenerating: boolean;
}

const OptionSelector: React.FC<OptionSelectorProps> = ({ 
  onStyleSelect, 
  selectedStyle, 
  isGenerating 
}) => {
  const [activeCategory, setActiveCategory] = useState<'bride' | 'groom'>('bride');

  const currentStyles = activeCategory === 'bride' ? BRIDE_HAIRSTYLES : GROOM_HAIRSTYLES;

  return (
    <div>
      {/* Category Toggle */}
      <div style={{
        display: 'flex',
        marginBottom: '24px',
        backgroundColor: '#f7fafc',
        borderRadius: '12px',
        padding: '4px'
      }}>
        <button
          onClick={() => setActiveCategory('bride')}
          style={{
            flex: 1,
            padding: '12px 24px',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '500',
            backgroundColor: activeCategory === 'bride' ? '#4c51bf' : 'transparent',
            color: activeCategory === 'bride' ? 'white' : '#4a5568',
            transition: 'all 0.2s ease'
          }}
        >
          👰 Bride Styles
        </button>
        
        <button
          onClick={() => setActiveCategory('groom')}
          style={{
            flex: 1,
            padding: '12px 24px',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '500',
            backgroundColor: activeCategory === 'groom' ? '#4c51bf' : 'transparent',
            color: activeCategory === 'groom' ? 'white' : '#4a5568',
            transition: 'all 0.2s ease'
          }}
        >
          🤵 Groom Styles
        </button>
      </div>

      {/* Style Options Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '16px'
      }}>
        {currentStyles.map((style) => {
          const isSelected = selectedStyle?.id === style.id;
          const isDisabled = isGenerating && !isSelected;
          
          return (
            <div
              key={style.id}
              onClick={() => !isDisabled && onStyleSelect(style)}
              style={{
                border: `2px solid ${isSelected ? '#4c51bf' : '#e2e8f0'}`,
                borderRadius: '12px',
                padding: '16px',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                backgroundColor: isSelected ? 'rgba(76, 81, 191, 0.05)' : 'white',
                transition: 'all 0.2s ease',
                opacity: isDisabled ? 0.5 : 1,
                transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                boxShadow: isSelected 
                  ? '0 4px 12px rgba(76, 81, 191, 0.2)' 
                  : '0 2px 4px rgba(0, 0, 0, 0.1)'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '8px',
                  backgroundColor: '#f7fafc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  flexShrink: 0
                }}>
                  {activeCategory === 'bride' ? '💐' : '✨'}
                </div>
                
                <div style={{ flex: 1 }}>
                  <h4 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#1a202c',
                    margin: '0 0 8px 0'
                  }}>
                    {style.name}
                  </h4>
                  
                  <p style={{
                    fontSize: '14px',
                    color: '#718096',
                    margin: '0 0 12px 0',
                    lineHeight: '1.4'
                  }}>
                    {style.description}
                  </p>
                  
                  {isSelected && isGenerating && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: '#4c51bf',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid #e2e8f0',
                        borderTop: '2px solid #4c51bf',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }} />
                      Generating...
                    </div>
                  )}
                </div>
                
                {isSelected && (
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: '#4c51bf',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '12px'
                  }}>
                    ✓
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Instructions */}
      <div style={{
        marginTop: '24px',
        padding: '16px',
        backgroundColor: '#ebf8ff',
        borderRadius: '8px',
        border: '1px solid #bee3f8'
      }}>
        <p style={{
          fontSize: '14px',
          color: '#2b6cb0',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>💡</span>
          Click on any style to generate your personalized look. The AI will apply the chosen hairstyle to your photo.
        </p>
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

export default OptionSelector;