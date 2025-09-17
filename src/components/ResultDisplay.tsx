import React, { useState } from 'react';
import { PassportData } from '../types';
import { Edit2, Save, X } from 'lucide-react';

interface ResultDisplayProps {
  data: PassportData;
  onUpdate: (updatedData: PassportData) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ data, onUpdate, onSubmit, isSubmitting }) => {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editedData, setEditedData] = useState<PassportData>(data);

  const handleEdit = (field: string) => {
    setEditingField(field);
  };

  const handleSave = (field: string) => {
    onUpdate(editedData);
    setEditingField(null);
  };

  const handleCancel = () => {
    setEditedData(data);
    setEditingField(null);
  };

  const handleFieldChange = (field: string, value: string) => {
    setEditedData({ ...editedData, [field]: value });
  };

  const renderField = (label: string, field: keyof PassportData) => {
    const value = editedData[field];
    const isEditing = editingField === field;

    return (
      <div className="bg-gray-50 dark:bg-slate-700 px-4 py-3 rounded-lg">
        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</dt>
        <dd className="mt-1 text-sm text-gray-900 dark:text-white flex items-center justify-between">
          {isEditing ? (
            <div className="flex items-center gap-2 w-full">
              <input
                type="text"
                value={value || ''}
                onChange={(e) => handleFieldChange(field, e.target.value)}
                className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-800 dark:text-white"
                autoFocus
              />
              <button
                onClick={() => handleSave(field)}
                className="p-1 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
              >
                <Save className="h-4 w-4" />
              </button>
              <button
                onClick={handleCancel}
                className="p-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <>
              <span>{value || '-'}</span>
              <button
                onClick={() => handleEdit(String(field))}
                className="p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              >
                <Edit2 className="h-4 w-4" />
              </button>
            </>
          )}
        </dd>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-800 shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
          Extracted Information
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
          Review and edit the extracted passport details below.
        </p>
      </div>
      <div className="border-t border-gray-200 dark:border-gray-700">
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
          {renderField('Surname', 'surname')}
          {renderField('Given Name', 'givenName')}
          {renderField('Sex', 'sex')}
          {renderField('Date of Birth', 'dateOfBirth')}
          {renderField('Place of Birth', 'placeOfBirth')}
          {renderField('Date of Issue', 'dateOfIssue')}
          {renderField('Date of Expiry', 'dateOfExpiry')}
          {renderField('Place of Issue', 'placeOfIssue')}
          {renderField('Passport Number', 'passportNumber')}
          {renderField('Father Name', 'fatherName')}
          {renderField('Mother Name', 'motherName')}
          {renderField('Spouse Name', 'spouseName')}
          {renderField('Address', 'address')}
          {renderField('File Number', 'fileNumber')}
          {renderField('Nationality', 'nationality')}
          {renderField('Country of Residence', 'countryOfResidence')}
          {renderField('Contact Number', 'contactNumber')}
          {renderField('Email Address', 'emailAddress')}
        </dl>
        
        {data.mrzLine1 && (
          <div className="px-6 pb-4">
            <div className="bg-gray-100 dark:bg-slate-700 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">MRZ Lines</h4>
              <pre className="text-xs font-mono text-gray-600 dark:text-gray-400">
                {data.mrzLine1}
                {data.mrzLine2 && '\n' + data.mrzLine2}
              </pre>
            </div>
          </div>
        )}

        <div className="px-6 py-4 bg-gray-50 dark:bg-slate-900 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onSubmit}
            disabled={isSubmitting}
            className="w-full sm:w-auto inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              'Save to Database'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultDisplay;