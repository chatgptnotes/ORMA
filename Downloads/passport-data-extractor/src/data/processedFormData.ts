import { ProcessedFormData } from '../types/formTypes';
import processedFormDataJson from './processedFormData.json';

// Type-safe form data export
export const processedFormData = processedFormDataJson as ProcessedFormData;