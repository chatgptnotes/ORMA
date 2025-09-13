import React, { useState } from 'react';
import FormBuilder from './components/FormBuilder';
import formData from './data/processedFormData.json';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState<'form' | 'preview'>('form');
  const [formValues, setFormValues] = useState<Record<string, any>>({});

  const handleFormSubmit = (values: Record<string, any>) => {
    setFormValues(values);
    setCurrentView('preview');
  };

  const handleBack = () => {
    setCurrentView('form');
  };

  const handleDownloadPDF = () => {
    // PDF generation logic will be added here
    alert('PDF download functionality will be implemented');
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>ORMA Form Submission System</h1>
      </header>
      
      <main className="app-main">
        {currentView === 'form' ? (
          <FormBuilder 
            formData={formData.inputForm} 
            onSubmit={handleFormSubmit}
            initialValues={formValues}
          />
        ) : (
          <div className="preview-container">
            <div className="preview-header">
              <h2>{formData.outputForm.title}</h2>
              <p>{formData.outputForm.description}</p>
            </div>
            
            <div className="preview-content">
              <div className="form-preview">
                {formData.outputForm.fields.map((field, index) => (
                  <div key={index} className="preview-field">
                    {field.number && <span className="field-number">{field.number}.</span>}
                    <span className="field-label">{field.label}</span>
                    {field.subLabel && <span className="field-sublabel">{field.subLabel}</span>}
                    <span className="field-value">
                      {formValues[field.label] || formValues[field.subLabel] || '-'}
                    </span>
                  </div>
                ))}
              </div>
              
              <div className="preview-actions">
                <button onClick={handleBack} className="btn btn-secondary">
                  Back to Form
                </button>
                <button onClick={handleDownloadPDF} className="btn btn-primary">
                  Download PDF
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;