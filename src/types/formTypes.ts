export interface FormField {
  label: string;
  type: string;
  comment: string;
  inputType: 'text' | 'radio' | 'checkbox' | 'select' | 'date' | 'tel' | 'email' | 'file' | 'number';
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
}