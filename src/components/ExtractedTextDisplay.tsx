import React from 'react';
import './ExtractedTextDisplay.css';

interface ExtractedTextDisplayProps {
  text: string;
  fileName: string;
}

const ExtractedTextDisplay: React.FC<ExtractedTextDisplayProps> = ({ text, fileName }) => {
  if (!text) return null;
  
  return (
    <div className="extracted-text-display">
      <div className="text-header">
        <h3>📄 Extracted Text from {fileName}</h3>
        <button 
          className="copy-btn"
          onClick={() => {
            navigator.clipboard.writeText(text);
            alert('Text copied to clipboard!');
          }}
        >
          📋 Copy Text
        </button>
      </div>
      <div className="text-content">
        <pre>{text}</pre>
      </div>
    </div>
  );
};

export default ExtractedTextDisplay;