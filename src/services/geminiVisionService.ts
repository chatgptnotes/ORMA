import { GoogleGenerativeAI } from '@google/generative-ai';

// Get API key from environment variables (support both patterns)
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || 
                import.meta.env.GEMINI_API_KEY || 
                process.env.VITE_GEMINI_API_KEY || 
                process.env.GEMINI_API_KEY;

if (!API_KEY) {
    console.warn('Gemini API key not found. OCR functionality will be limited to mock data.');
}

const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

export interface ExtractedTextResult {
    extractedText: string;
    confidence: number;
    processingTime: number;
}

export interface ImagePreprocessingOptions {
    enhanceContrast?: boolean;
    resizeForOCR?: boolean;
    denoiseImage?: boolean;
    maxWidth?: number;
    maxHeight?: number;
}

/**
 * Preprocess image for better OCR accuracy
 */
async function preprocessImage(
    base64Image: string,
    mimeType: string,
    options: ImagePreprocessingOptions = {}
): Promise<{ base64: string; mimeType: string }> {
    try {
        // If no preprocessing options are enabled, return original
        if (!options.enhanceContrast && !options.resizeForOCR && !options.denoiseImage) {
            return { base64: base64Image, mimeType };
        }

        // Create canvas for image manipulation
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.warn('Canvas context not available, skipping preprocessing');
            return { base64: base64Image, mimeType };
        }

        // Load image
        const img = new Image();
        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = `data:${mimeType};base64,${base64Image}`;
        });

        // Set canvas size with optional resizing
        let { width, height } = img;
        if (options.resizeForOCR) {
            const maxWidth = options.maxWidth || 1920;
            const maxHeight = options.maxHeight || 1080;
            
            if (width > maxWidth || height > maxHeight) {
                const scale = Math.min(maxWidth / width, maxHeight / height);
                width *= scale;
                height *= scale;
            }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw image
        ctx.drawImage(img, 0, 0, width, height);

        // Apply preprocessing filters
        if (options.enhanceContrast || options.denoiseImage) {
            const imageData = ctx.getImageData(0, 0, width, height);
            const data = imageData.data;

            for (let i = 0; i < data.length; i += 4) {
                let r = data[i];
                let g = data[i + 1];
                let b = data[i + 2];

                // Enhance contrast
                if (options.enhanceContrast) {
                    const factor = 1.2; // Contrast factor
                    r = Math.min(255, Math.max(0, factor * (r - 128) + 128));
                    g = Math.min(255, Math.max(0, factor * (g - 128) + 128));
                    b = Math.min(255, Math.max(0, factor * (b - 128) + 128));
                }

                // Simple denoising (reduce noise in low-contrast areas)
                if (options.denoiseImage) {
                    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
                    if (gray > 240 || gray < 15) {
                        // Very light or dark pixels - potential noise
                        const smoothing = 0.9;
                        r = r * smoothing + (gray > 240 ? 255 : 0) * (1 - smoothing);
                        g = g * smoothing + (gray > 240 ? 255 : 0) * (1 - smoothing);
                        b = b * smoothing + (gray > 240 ? 255 : 0) * (1 - smoothing);
                    }
                }

                data[i] = r;
                data[i + 1] = g;
                data[i + 2] = b;
            }

            ctx.putImageData(imageData, 0, 0);
        }

        // Convert back to base64
        const processedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
        const processedBase64 = processedDataUrl.split(',')[1];

        console.log('Image preprocessing completed');
        return { base64: processedBase64, mimeType: 'image/jpeg' };

    } catch (error) {
        console.warn('Image preprocessing failed, using original:', error);
        return { base64: base64Image, mimeType };
    }
}

/**
 * Extract text from an image using Gemini Vision API
 */
export async function extractTextFromImage(
    base64Image: string,
    mimeType: string = 'image/jpeg',
    preprocessingOptions?: ImagePreprocessingOptions
): Promise<ExtractedTextResult> {
    const startTime = Date.now();
    
    try {
        if (!genAI) {
            throw new Error('Gemini API not configured. Please check your API key.');
        }

        // Preprocess image if options are provided
        let processedImage = { base64: base64Image, mimeType };
        if (preprocessingOptions) {
            console.log('Preprocessing image for better OCR...');
            processedImage = await preprocessImage(base64Image, mimeType, {
                enhanceContrast: true,
                resizeForOCR: true,
                denoiseImage: true,
                maxWidth: 1920,
                maxHeight: 1080,
                ...preprocessingOptions
            });
        }

        // Get the vision model
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Prepare the image data
        const imagePart = {
            inlineData: {
                data: processedImage.base64,
                mimeType: processedImage.mimeType
            }
        };

        // Create a comprehensive prompt for passport/document text extraction
        const prompt = `
Please extract ALL text from this document image. This could be a PASSPORT, EMIRATES ID, or VISA document. Pay special attention to:

1. Personal Information:
   - Full name in English (surname and given names)
   - Full name in Arabic (if present)
   - Date of birth
   - Place of birth
   - Gender/Sex
   - Nationality

2. Document Identification:
   - PASSPORT NUMBER (format: Letter followed by 7-8 digits, e.g., A1234567)
   - EMIRATES ID NUMBER (format: XXX-YYYY-XXXXXXX-X, e.g., 784-1970-5109524-4)
   - VISA NUMBER (any alphanumeric visa identification)
   - Document type/authority

3. Document Validity:
   - Date of issue
   - Date of expiry  
   - Place of issue
   - Issuing authority

4. Emirates ID Specific:
   - Emirates residence (which emirate)
   - Area code
   - Names in both English and Arabic

5. VISA Specific:
   - VISA type (tourist, business, etc.)
   - VISA category
   - Port of entry
   - Purpose of visit
   - Sponsor information
   - Duration of stay
   - Entries allowed

6. Family Information:
   - Father's name
   - Mother's name
   - Spouse name (if present)

7. Address & Contact:
   - Address
   - Any other visible text

8. Machine Readable Zone (MRZ):
   - Any machine-readable text at the bottom
   - OCR characters and codes

CRITICAL INSTRUCTIONS FOR EMIRATES ID EXTRACTION:
- Emirates ID numbers ALWAYS follow pattern XXX-YYYY-XXXXXXX-X (e.g., 784-1970-5109524-4)
- If you see ANY 15-digit number with hyphens (like 784-1970-5109524-4), put it in "emiratesIdNumber" field
- If you see a 15-digit number WITHOUT hyphens (like 784197051095244), put it in "emiratesIdNumber" field
- NEVER put Emirates ID numbers in the "passportNumber" field
- Emirates ID numbers may appear after text like "ID Number", "رقم الهوية", or standalone
- If this is an Emirates ID document, you MUST extract the ID number even if other fields are missing

Return the response in this JSON format:
{
  "extractedText": "All extracted text here...",
  "structuredData": {
    "surname": "extracted surname",
    "givenName": "extracted given name",
    "fullName": "complete full name",
    "fullNameArabic": "full name in Arabic if present",
    "firstNameEnglish": "first name in English",
    "lastNameEnglish": "last name in English", 
    "firstNameArabic": "first name in Arabic if present",
    "lastNameArabic": "last name in Arabic if present",
    "dateOfBirth": "DD/MM/YYYY",
    "passportNumber": "passport number (only if this is a passport, format: Letter+digits)",
    "emiratesIdNumber": "CRITICAL: Emirates ID number (any 15-digit number, format: XXX-YYYY-XXXXXXX-X like 784-1970-5109524-4 or 784197051095244)",
    "visaNumber": "VISA number (only if this is a VISA)",
    "visaType": "type of VISA if present",
    "visaCategory": "VISA category if present",
    "nationality": "nationality",
    "gender": "M/F",
    "placeOfBirth": "place of birth",
    "dateOfIssue": "DD/MM/YYYY",
    "dateOfExpiry": "DD/MM/YYYY",
    "placeOfIssue": "place of issue",
    "emiratesResidence": "emirate of residence if Emirates ID",
    "areaCode": "area code if present",
    "portOfEntry": "port of entry if VISA",
    "purposeOfVisit": "purpose of visit if VISA",
    "sponsorInformation": "sponsor details if VISA",
    "durationOfStay": "duration of stay if VISA",
    "entriesAllowed": "entries allowed if VISA",
    "issuingCountry": "issuing country if VISA",
    "issuingAuthority": "issuing authority",
    "fatherName": "father's name if present",
    "motherName": "mother's name if present",
    "spouseName": "spouse name if present",
    "address": "address if present",
    "mrzLine1": "first MRZ line if present",
    "mrzLine2": "second MRZ line if present"
  }
}
`;

        console.log('Sending image to Gemini Vision API for text extraction...');
        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();

        const processingTime = Date.now() - startTime;
        console.log(`Gemini Vision API response received in ${processingTime}ms`);

        return {
            extractedText: text,
            confidence: 0.95, // Gemini generally has high confidence
            processingTime
        };

    } catch (error) {
        const processingTime = Date.now() - startTime;
        console.error('Error extracting text from image:', error);
        
        // Return a fallback response with error information
        return {
            extractedText: `Error extracting text: ${error instanceof Error ? error.message : 'Unknown error'}`,
            confidence: 0,
            processingTime
        };
    }
}

/**
 * Parse JSON response from Gemini Vision API
 */
export function parseGeminiResponse(response: string): any {
    console.log('🔍 GEMINI PARSE: Raw Gemini response received:');
    console.log('🔍 GEMINI PARSE: Response length:', response.length);
    console.log('🔍 GEMINI PARSE: Full response:', response);
    
    // Check if response contains Emirates ID pattern
    const emiratesPattern = /\b\d{3}-\d{4}-\d{7}-\d{1}\b/;
    const emiratesMatch = response.match(emiratesPattern);
    if (emiratesMatch) {
        console.log('🔍 GEMINI PARSE: ✅ FOUND EMIRATES ID PATTERN in raw response:', emiratesMatch[0]);
    } else {
        console.log('🔍 GEMINI PARSE: ❌ NO EMIRATES ID PATTERN found in raw response');
    }
    
    try {
        // Try to extract JSON from the response first
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            console.log('🔍 GEMINI PARSE: Found JSON in response:', jsonMatch[0]);
            const parsed = JSON.parse(jsonMatch[0]);
            console.log('🔍 GEMINI PARSE: Parsed JSON object:', parsed);
            console.log('🔍 GEMINI PARSE: JSON emiratesIdNumber field:', parsed.emiratesIdNumber);
            
            // RAW TEXT FALLBACK: If no emiratesIdNumber in structured data, scan raw text
            if (!parsed.structuredData?.emiratesIdNumber && !parsed.emiratesIdNumber) {
                console.log('🔍 GEMINI PARSE: No emiratesIdNumber in structured data, scanning raw text...');
                const rawText = parsed.extractedText || response;
                const emiratesPattern = /\b\d{3}-?\d{4}-?\d{7}-?\d{1}\b/g;
                const emiratesMatches = rawText.match(emiratesPattern);
                
                if (emiratesMatches) {
                    // Clean up the match to proper format
                    let cleanId = emiratesMatches[0].replace(/-/g, '');
                    if (cleanId.length === 15) {
                        cleanId = `${cleanId.slice(0,3)}-${cleanId.slice(3,7)}-${cleanId.slice(7,14)}-${cleanId.slice(14)}`;
                        console.log('🔍 GEMINI PARSE: ✅ RAW TEXT FALLBACK - Found Emirates ID:', cleanId);
                        
                        // Add to structured data
                        if (!parsed.structuredData) parsed.structuredData = {};
                        parsed.structuredData.emiratesIdNumber = cleanId;
                        console.log('🔍 GEMINI PARSE: Added emiratesIdNumber to structuredData via fallback');
                    }
                }
            }
            
            return parsed;
        }
        
        // If no JSON found, parse the text manually for Indian passport format
        const structuredData = parseIndianPassportText(response);
        
        return {
            extractedText: response,
            structuredData
        };
    } catch (error) {
        console.warn('Could not parse Gemini response as JSON:', error);
        
        // Fallback: try to parse text manually
        const structuredData = parseIndianPassportText(response);
        
        return {
            extractedText: response,
            structuredData
        };
    }
}

/**
 * Parse Indian passport text format manually
 */
function parseIndianPassportText(text: string): any {
    const data: any = {};
    
    try {
        // Extract Father's name
        const fatherMatch = text.match(/(?:पिता|Father|Legal Guardian)[^:]*[:]\s*([^\n]+)/i);
        if (fatherMatch) {
            data.fatherName = fatherMatch[1].trim();
        }
        
        // Extract Mother's name
        const motherMatch = text.match(/(?:माता|Mother)[^:]*[:]\s*([^\n]+)/i);
        if (motherMatch) {
            data.motherName = motherMatch[1].trim();
        }
        
        // Extract Spouse name
        const spouseMatch = text.match(/(?:पति|पत्नी|Spouse)[^:]*[:]\s*([^\n]+)/i);
        if (spouseMatch) {
            data.spouseName = spouseMatch[1].trim();
        }
        
        // Extract Address
        const addressMatch = text.match(/(?:पता|Address)[^:]*[:]\s*([^\n]+(?:\n[^:\n]+)*)/i);
        if (addressMatch) {
            // Clean up address by removing PIN code references
            data.address = addressMatch[1]
                .replace(/PIN:\d+/g, '')
                .replace(/\s+/g, ' ')
                .trim();
        }
        
        // Extract PIN Code
        const pinMatch = text.match(/PIN:\s*(\d{6})/);
        if (pinMatch) {
            data.pinCode = pinMatch[1];
        }
        
        // Extract Old Passport Number
        const oldPassportMatch = text.match(/(?:पुराने|Old Passport)[^:]*[:][^T]*([T]\d+)/i);
        if (oldPassportMatch) {
            data.oldPassportNumber = oldPassportMatch[1];
        }
        
        // Extract File Number
        const fileMatch = text.match(/(?:फाईल|File)[^:]*[:]\s*([^\n]+)/i);
        if (fileMatch) {
            data.fileNumber = fileMatch[1].trim();
        }
        
        // Extract Date (looking for DD/MM/YYYY format)
        const dateMatch = text.match(/(\d{2}\/\d{2}\/\d{4})/);
        if (dateMatch) {
            data.dateOfIssue = dateMatch[1];
        }
        
        // Extract any standalone numbers that might be passport numbers
        const numberMatches = text.match(/[A-Z]\d{7,8}/g);
        if (numberMatches && numberMatches.length > 0) {
            data.possiblePassportNumbers = numberMatches;
        }
        
        console.log('Parsed Indian passport data:', data);
        return data;
        
    } catch (error) {
        console.warn('Error parsing Indian passport text:', error);
        return {};
    }
}

/**
 * Validate and clean extracted passport data
 */
export function validatePassportData(data: any): any {
    const cleaned: any = {};
    
    // Clean and validate each field
    if (data.surname && typeof data.surname === 'string') {
        cleaned.surname = data.surname.trim().toUpperCase();
    }
    
    if (data.givenName && typeof data.givenName === 'string') {
        cleaned.givenName = data.givenName.trim().toUpperCase();
    }
    
    if (data.passportNumber && typeof data.passportNumber === 'string') {
        cleaned.passportNumber = data.passportNumber.trim().toUpperCase();
    }
    
    if (data.nationality && typeof data.nationality === 'string') {
        cleaned.nationality = data.nationality.trim().toUpperCase();
    }
    
    if (data.gender && typeof data.gender === 'string') {
        const gender = data.gender.trim().toUpperCase();
        cleaned.gender = gender === 'M' || gender === 'MALE' ? 'MALE' : 
                        gender === 'F' || gender === 'FEMALE' ? 'FEMALE' : gender;
    }
    
    // Clean date fields
    const dateFields = ['dateOfBirth', 'dateOfIssue', 'dateOfExpiry'];
    dateFields.forEach(field => {
        if (data[field]) {
            cleaned[field] = cleanDate(data[field]);
        }
    });
    
    // Clean text fields
    const textFields = ['placeOfBirth', 'placeOfIssue', 'fatherName', 'motherName', 'spouseName', 'address'];
    textFields.forEach(field => {
        if (data[field] && typeof data[field] === 'string') {
            cleaned[field] = data[field].trim();
        }
    });
    
    // Clean MRZ fields
    if (data.mrzLine1) {
        cleaned.mrzLine1 = data.mrzLine1.trim();
    }
    if (data.mrzLine2) {
        cleaned.mrzLine2 = data.mrzLine2.trim();
    }
    
    return cleaned;
}

/**
 * Clean and format date strings
 */
function cleanDate(dateStr: string): string {
    if (!dateStr) return dateStr;
    
    // Remove common OCR artifacts and normalize
    const cleaned = dateStr.replace(/[^\d\/\-\.]/g, '').trim();
    
    // Try to parse and reformat to DD/MM/YYYY
    const datePatterns = [
        /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/,  // DD/MM/YYYY or DD-MM-YYYY
        /^(\d{2,4})[\/-](\d{1,2})[\/-](\d{1,2})$/,  // YYYY/MM/DD or YYYY-MM-DD
        /^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/         // DD.MM.YYYY
    ];
    
    for (const pattern of datePatterns) {
        const match = cleaned.match(pattern);
        if (match) {
            let [, part1, part2, part3] = match;
            
            // Assume first pattern is DD/MM/YYYY
            if (pattern === datePatterns[0] || pattern === datePatterns[2]) {
                const day = part1.padStart(2, '0');
                const month = part2.padStart(2, '0');
                const year = part3.length === 2 ? '20' + part3 : part3;
                return `${day}/${month}/${year}`;
            }
            // Second pattern is YYYY/MM/DD
            else if (pattern === datePatterns[1]) {
                const year = part1.length === 2 ? '20' + part1 : part1;
                const month = part2.padStart(2, '0');
                const day = part3.padStart(2, '0');
                return `${day}/${month}/${year}`;
            }
        }
    }
    
    return cleaned;
}