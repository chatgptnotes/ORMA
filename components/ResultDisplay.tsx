import React from 'react';
import { PassportData } from '../types';

interface ResultDisplayProps {
  data: PassportData;
  onUpdate: (updatedData: PassportData) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
}

const PairedDataRow: React.FC<{
  item1?: { label: string; value: string | null; fieldKey: keyof PassportData };
  item2?: { label: string; value: string | null; fieldKey: keyof PassportData };
  onChange: (field: keyof PassportData, value: string) => void;
}> = ({ item1, item2, onChange }) => {
  const renderInput = (item?: { label: string; value: string | null; fieldKey: keyof PassportData }) => {
    if (!item) return null;
    return (
        <input
            type="text"
            value={item.value ?? ''}
            onChange={(e) => onChange(item.fieldKey, e.target.value)}
            className="w-full bg-slate-100 dark:bg-slate-700/50 focus:bg-white dark:focus:bg-slate-700 rounded p-2 border border-transparent focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition"
            aria-label={item.label}
        />
    );
  };
    
  return (
    <tr>
      <td className="px-4 py-2 text-sm font-medium text-slate-500 dark:text-slate-400 w-[20%]">{item1?.label}</td>
      <td className="px-1 py-1 text-sm text-slate-900 dark:text-slate-200 font-mono w-[30%]">
        {renderInput(item1)}
      </td>
      <td className="border-l border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-500 dark:text-slate-400 w-[20%]">{item2?.label}</td>
      <td className="px-1 py-1 text-sm text-slate-900 dark:text-slate-200 font-mono w-[30%]">
        {renderInput(item2)}
      </td>
    </tr>
  );
};

const SingleDataRow: React.FC<{ 
    label: string; 
    value: string | null;
    fieldKey: keyof PassportData;
    onChange: (field: keyof PassportData, value: string) => void;
}> = ({ label, value, fieldKey, onChange }) => {
    return (
        <div className="py-2 sm:grid sm:grid-cols-5 sm:gap-4 items-center">
            <dt className="text-sm font-medium text-slate-500 dark:text-slate-400 sm:col-span-1">{label}</dt>
            <dd className="mt-1 sm:mt-0 sm:col-span-4 font-mono tracking-wide">
                <input
                    type="text"
                    value={value ?? ''}
                    onChange={(e) => onChange(fieldKey, e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-700/50 focus:bg-white dark:focus:bg-slate-700 rounded p-2 border border-transparent focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition"
                    aria-label={label}
                />
            </dd>
        </div>
    );
};


const ResultDisplay: React.FC<ResultDisplayProps> = ({ data, onUpdate, onSubmit, isSubmitting = false }) => {
  const handleChange = (field: keyof PassportData, value: string) => {
    onUpdate({ ...data, [field]: value || null });
  };

  const personalAndFamilyFields = [
    { label: "Surname", value: data.surname, fieldKey: 'surname' as keyof PassportData },
    { label: "Given Name(s)", value: data.givenName, fieldKey: 'givenName' as keyof PassportData },
    { label: "Sex", value: data.sex, fieldKey: 'sex' as keyof PassportData },
    { label: "Date of Birth", value: data.dateOfBirth, fieldKey: 'dateOfBirth' as keyof PassportData },
    { label: "Place of Birth", value: data.placeOfBirth, fieldKey: 'placeOfBirth' as keyof PassportData },
    { label: "Father's Name", value: data.fatherName, fieldKey: 'fatherName' as keyof PassportData },
    { label: "Mother's Name", value: data.motherName, fieldKey: 'motherName' as keyof PassportData },
    { label: "Spouse's Name", value: data.spouseName, fieldKey: 'spouseName' as keyof PassportData },
  ];

  const passportDetailsFields = [
    { label: "Passport No.", value: data.passportNumber, fieldKey: 'passportNumber' as keyof PassportData },
    { label: "Date of Issue", value: data.dateOfIssue, fieldKey: 'dateOfIssue' as keyof PassportData },
    { label: "Date of Expiry", value: data.dateOfExpiry, fieldKey: 'dateOfExpiry' as keyof PassportData },
    { label: "Place of Issue", value: data.placeOfIssue, fieldKey: 'placeOfIssue' as keyof PassportData },
    { label: "File Number", value: data.fileNumber, fieldKey: 'fileNumber' as keyof PassportData },
  ];

  const numRows = Math.max(personalAndFamilyFields.length, passportDetailsFields.length);
  const tableRows = Array.from({ length: numRows }).map((_, i) => (
    <PairedDataRow 
        key={i} 
        item1={personalAndFamilyFields[i]} 
        item2={passportDetailsFields[i]} 
        onChange={handleChange}
    />
  ));

  return (
    <div className="w-full max-w-4xl mx-auto mt-8">
      <div className="bg-white dark:bg-slate-800 shadow-xl rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
        <div className="px-4 py-5 sm:px-6 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg leading-6 font-semibold text-slate-900 dark:text-white">
            Passport Information Form
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
            Review, edit, and add details below.
          </p>
        </div>
        
        <div className="border-t border-slate-200 dark:border-slate-700">
          <table className="min-w-full table-fixed">
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {tableRows}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-5 sm:px-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
          <h4 className="text-md font-semibold text-slate-700 dark:text-slate-300 mb-2">Machine Readable Zone (MRZ)</h4>
          <SingleDataRow label="Line 1" value={data.mrzLine1} fieldKey="mrzLine1" onChange={handleChange} />
          <SingleDataRow label="Line 2" value={data.mrzLine2} fieldKey="mrzLine2" onChange={handleChange} />
        </div>

        <div className="border-t border-slate-200 dark:border-slate-700 px-4 py-5 sm:px-6">
            <h4 className="text-md font-semibold text-slate-700 dark:text-slate-300 mb-2">Contact & Other Information</h4>
            <SingleDataRow label="Address" value={data.address} fieldKey="address" onChange={handleChange} />
            <SingleDataRow label="Nationality" value={data.nationality} fieldKey="nationality" onChange={handleChange} />
            <SingleDataRow label="Country of Residence" value={data.countryOfResidence} fieldKey="countryOfResidence" onChange={handleChange} />
            <SingleDataRow label="Visa Information" value={data.visaInformation} fieldKey="visaInformation" onChange={handleChange} />
            <SingleDataRow label="Contact Number" value={data.contactNumber} fieldKey="contactNumber" onChange={handleChange} />
            <SingleDataRow label="Email Address" value={data.emailAddress} fieldKey="emailAddress" onChange={handleChange} />
        </div>
        
        <div className="px-4 py-4 sm:px-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-end">
            <button
                type="button"
                onClick={onSubmit}
                disabled={isSubmitting}
                className="inline-flex items-center justify-center px-6 py-2 border border-transparent text-base font-medium rounded-md text-white bg-sky-600 hover:bg-sky-700 disabled:bg-sky-400 disabled:cursor-not-allowed shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-50 dark:focus:ring-offset-slate-900 focus:ring-sky-500"
            >
                {isSubmitting && (
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                )}
                {isSubmitting ? 'Saving...' : 'Save Information'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default ResultDisplay;