import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the Excel file
const workbook = XLSX.readFile('/Users/murali/Downloads/Sample form ref input & output.xlsx');

// Process Input Dataform sheet
const inputSheet = workbook.Sheets['Input Dataform'];
const inputData = XLSX.utils.sheet_to_json(inputSheet, { header: 1, defval: '' });

// Process Output PDF Dataform sheet
const outputSheet = workbook.Sheets['Output PDF Dataform'];
const outputData = XLSX.utils.sheet_to_json(outputSheet, { header: 1, defval: '' });

// Parse input form fields
const formFields = [];
for (let i = 2; i < inputData.length; i++) {
  const row = inputData[i];
  if (row[0] || row[1]) {
    const field = {
      label: row[0] || '',
      type: row[1] || '',
      comment: row[3] || ''
    };
    
    // Determine field type based on comments
    if (field.type.includes('radio button')) {
      field.inputType = 'radio';
      field.options = field.type.split('-')[0].trim().split(' or ').map(opt => opt.trim());
    } else if (field.type.includes('Checkbox')) {
      field.inputType = 'checkbox';
      field.options = field.type.split('-')[0].trim().split(' or ').map(opt => opt.trim());
    } else if (field.type.includes('list')) {
      field.inputType = 'select';
      const listMatch = field.type.match(/([^(]+)/);
      if (listMatch) {
        field.options = listMatch[1].trim().split('/').map(opt => opt.trim());
      }
    } else if (field.comment.includes('DOB') || field.comment.includes('Date')) {
      field.inputType = 'date';
    } else if (field.comment.includes('digit') || field.comment.includes('number')) {
      field.inputType = 'tel';
    } else if (field.comment.includes('Email')) {
      field.inputType = 'email';
    } else if (field.comment.includes('Upload')) {
      field.inputType = 'file';
    } else {
      field.inputType = 'text';
    }
    
    formFields.push(field);
  }
}

// Parse output form structure
const outputFields = [];
for (let i = 3; i < outputData.length; i++) {
  const row = outputData[i];
  if (row[1] || row[2]) {
    outputFields.push({
      number: row[0] || '',
      label: row[1] || '',
      subLabel: row[2] || ''
    });
  }
}

// Create the final data structure
const processedData = {
  inputForm: {
    title: "SUBMISSION FORM",
    fields: formFields
  },
  outputForm: {
    title: "OUTPUT FORM",
    description: "This form should be downloadable with the autofilled Data from the Input form after preview",
    fields: outputFields
  }
};

// Save the processed data
const outputPath = path.join(__dirname, '..', 'src', 'data', 'processedFormData.json');
fs.writeFileSync(outputPath, JSON.stringify(processedData, null, 2));

console.log('Processed form data saved to:', outputPath);
console.log('\nInput form fields:', formFields.length);
console.log('Output form fields:', outputFields.length);

// Also create a TypeScript interface file
const tsInterface = `export interface FormField {
  label: string;
  type: string;
  comment: string;
  inputType: 'text' | 'radio' | 'checkbox' | 'select' | 'date' | 'tel' | 'email' | 'file';
  options?: string[];
}

export interface OutputField {
  number: string;
  label: string;
  subLabel: string;
}

export interface ProcessedFormData {
  inputForm: {
    title: string;
    fields: FormField[];
  };
  outputForm: {
    title: string;
    description: string;
    fields: OutputField[];
  };
}`;

const tsPath = path.join(__dirname, '..', 'src', 'types', 'formTypes.ts');
fs.mkdirSync(path.dirname(tsPath), { recursive: true });
fs.writeFileSync(tsPath, tsInterface);
console.log('\nTypeScript interfaces saved to:', tsPath);