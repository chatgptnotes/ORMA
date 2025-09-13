import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      verbosity: 0, // Suppress console logs
    });
    
    const pdf = await loadingTask.promise;
    let fullText = '';
    
    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Combine text items
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      
      fullText += `\n--- Page ${pageNum} ---\n${pageText}\n`;
    }
    
    return fullText.trim();
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF. Please try uploading an image instead.');
  }
}

// Parse passport data from extracted text
export function parsePassportDataFromText(text: string): any {
  const data: any = {};
  
  // Common passport field patterns
  const patterns = {
    passportNumber: /(?:passport\s*(?:no|number)?\.?\s*:?\s*)([A-Z]\d{7,8})/i,
    fullName: /(?:name|surname\/given\s*names?)\s*:?\s*([A-Z\s]+)/i,
    surname: /(?:surname|last\s*name)\s*:?\s*([A-Z]+)/i,
    givenName: /(?:given\s*names?|first\s*name)\s*:?\s*([A-Z\s]+)/i,
    dateOfBirth: /(?:date\s*of\s*birth|dob|birth\s*date)\s*:?\s*(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/i,
    nationality: /(?:nationality|citizenship)\s*:?\s*([A-Z]+)/i,
    gender: /(?:sex|gender)\s*:?\s*(M|F|MALE|FEMALE)/i,
    placeOfBirth: /(?:place\s*of\s*birth|birth\s*place)\s*:?\s*([A-Z\s,]+)/i,
    dateOfIssue: /(?:date\s*of\s*issue|issue\s*date|issued\s*on)\s*:?\s*(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/i,
    dateOfExpiry: /(?:date\s*of\s*expiry|expiry\s*date|valid\s*until|expires?)\s*:?\s*(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/i,
    placeOfIssue: /(?:place\s*of\s*issue|issued\s*at|issuing\s*authority)\s*:?\s*([A-Z\s,]+)/i,
  };
  
  // Extract data using patterns
  for (const [field, pattern] of Object.entries(patterns)) {
    const match = text.match(pattern);
    if (match && match[1]) {
      data[field] = match[1].trim();
      
      // Format dates to DD/MM/YYYY
      if (field.includes('date') || field.includes('Date')) {
        const dateStr = match[1].trim();
        // Try to parse and reformat the date
        const dateParts = dateStr.split(/[\/-]/);
        if (dateParts.length === 3) {
          const [day, month, year] = dateParts;
          data[field] = `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
        }
      }
      
      // Normalize gender
      if (field === 'gender') {
        const gender = match[1].trim().toUpperCase();
        data[field] = gender === 'M' || gender === 'MALE' ? 'MALE' : 'FEMALE';
      }
    }
  }
  
  // Try to extract address (usually multi-line)
  const addressMatch = text.match(/(?:address|residence)\s*:?\s*([\s\S]{10,100}?)(?:\n\n|$)/i);
  if (addressMatch && addressMatch[1]) {
    data.address = addressMatch[1].trim().replace(/\s+/g, ' ');
  }
  
  return data;
}