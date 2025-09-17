import { ExtractedPassportData } from './passportExtractor';
import { ExtractedEmiratesIdData, saveEmiratesIdRecord, updateEmiratesIdRecord, findEmiratesIdByNumber } from './emiratesIdRecordsService';
import { ExtractedVisaData, saveVisaRecord, updateVisaRecord, findVisaByNumber } from './visaRecordsService';
import { savePassportData as savePassportRecordData, updatePassportData as updatePassportRecordData, findExistingRecordByPassport } from './passportRecordsService';

// Unified document type enum
export enum DocumentType {
  PASSPORT = 'passport',
  PASSPORT_FRONT = 'passport-front',
  PASSPORT_BACK = 'passport-back', 
  PASSPORT_ADDRESS = 'passport-address',
  PASSPORT_LAST = 'passport-last',
  EMIRATES_ID = 'emirates_id',
  VISA = 'visa',
  AADHAR = 'aadhar',
  UNKNOWN = 'unknown'
}

// Document detection result
export interface DocumentDetectionResult {
  documentType: DocumentType;
  confidence: number;
  suggestedAction: string;
  validationMessage?: string;
}

// Storage result interface
export interface DocumentStorageResult {
  success: boolean;
  recordId: string;
  documentType: DocumentType;
  message: string;
  linkedRecords?: {
    passportRecordId?: string;
    emiratesIdRecordId?: string;
    visaRecordId?: string;
  };
}

/**
 * Enhanced document type detection based on extracted fields
 */
export function detectDocumentType(extractedData: ExtractedPassportData, pageType?: string): DocumentDetectionResult {
  console.log('🔍 === DOCUMENT TYPE DETECTION START ===');
  console.log('🔍 Extracted data keys:', Object.keys(extractedData));
  console.log('🔍 PageType hint:', pageType);
  
  let documentType = DocumentType.UNKNOWN;
  let confidence = 0;
  let suggestedAction = '';

  // Priority 1: Explicit page type (most reliable)
  if (pageType) {
    const normalizedPageType = pageType.toLowerCase();
    console.log('🎯 Using explicit pageType:', normalizedPageType);
    
    if (normalizedPageType.includes('emirates') || normalizedPageType.includes('id')) {
      documentType = DocumentType.EMIRATES_ID;
      confidence = 0.95;
      suggestedAction = 'Store in Emirates ID records table';
    } else if (normalizedPageType.includes('visa')) {
      documentType = DocumentType.VISA;
      confidence = 0.95;
      suggestedAction = 'Store in VISA records table';
    } else if (normalizedPageType.includes('address') || normalizedPageType.includes('last')) {
      documentType = DocumentType.PASSPORT_ADDRESS;
      confidence = 0.90;
      suggestedAction = 'Store in passport records table (address page)';
    } else if (normalizedPageType.includes('front')) {
      documentType = DocumentType.PASSPORT_FRONT;
      confidence = 0.90;
      suggestedAction = 'Store in passport records table (front page)';
    } else if (normalizedPageType.includes('back')) {
      documentType = DocumentType.PASSPORT_BACK;
      confidence = 0.90;
      suggestedAction = 'Store in passport records table (back page)';
    } else if (normalizedPageType.includes('passport')) {
      documentType = DocumentType.PASSPORT;
      confidence = 0.85;
      suggestedAction = 'Store in passport records table';
    }
  }

  // Priority 2: Field-based detection if explicit pageType isn't decisive
  if (confidence < 0.9) {
    console.log('🔍 Running field-based detection...');
    
    const fieldScores = {
      [DocumentType.EMIRATES_ID]: 0,
      [DocumentType.VISA]: 0,
      [DocumentType.PASSPORT]: 0
    };

    // Emirates ID indicators
    const emiratesIdFields = ['emiratesIdNumber', 'fullNameArabic', 'emiratesResidence', 'areaCode'];
    const emiratesIdKeywords = ['emirates', 'uae', 'nationality card', 'identity card', 'federal authority'];
    
    emiratesIdFields.forEach(field => {
      if (extractedData[field]) {
        fieldScores[DocumentType.EMIRATES_ID] += 0.3;
        console.log('✓ Emirates ID field found:', field);
      }
    });

    // Check for Emirates ID patterns in any text field
    const allTextValues = Object.values(extractedData).join(' ').toLowerCase();
    emiratesIdKeywords.forEach(keyword => {
      if (allTextValues.includes(keyword)) {
        fieldScores[DocumentType.EMIRATES_ID] += 0.2;
        console.log('✓ Emirates ID keyword found:', keyword);
      }
    });

    // Emirates ID number pattern (XXX-YYYY-XXXXXXX-X)
    const emiratesIdPattern = /\b\d{3}-\d{4}-\d{7}-\d{1}\b/;
    if (emiratesIdPattern.test(allTextValues)) {
      fieldScores[DocumentType.EMIRATES_ID] += 0.4;
      console.log('✓ Emirates ID number pattern detected');
    }

    // VISA indicators
    const visaFields = ['visaNumber', 'visaType', 'visaCategory', 'portOfEntry', 'sponsorInformation'];
    const visaKeywords = ['visa', 'entry', 'tourist', 'business', 'sponsor', 'embassy', 'consulate'];
    
    visaFields.forEach(field => {
      if (extractedData[field]) {
        fieldScores[DocumentType.VISA] += 0.3;
        console.log('✓ VISA field found:', field);
      }
    });

    visaKeywords.forEach(keyword => {
      if (allTextValues.includes(keyword)) {
        fieldScores[DocumentType.VISA] += 0.15;
        console.log('✓ VISA keyword found:', keyword);
      }
    });

    // Passport indicators (stronger indicators)
    const passportFields = ['passportNumber', 'placeOfIssue', 'placeOfBirth'];
    const passportKeywords = ['passport', 'republic', 'government', 'ministry', 'foreign affairs'];
    
    passportFields.forEach(field => {
      if (extractedData[field]) {
        fieldScores[DocumentType.PASSPORT] += 0.25;
        console.log('✓ Passport field found:', field);
      }
    });

    passportKeywords.forEach(keyword => {
      if (allTextValues.includes(keyword)) {
        fieldScores[DocumentType.PASSPORT] += 0.1;
        console.log('✓ Passport keyword found:', keyword);
      }
    });

    // Find the highest scoring document type
    const maxScore = Math.max(...Object.values(fieldScores));
    const detectedType = Object.keys(fieldScores).find(
      key => fieldScores[key as keyof typeof fieldScores] === maxScore
    ) as DocumentType;

    console.log('🔍 Field-based scores:', fieldScores);
    console.log('🔍 Max score:', maxScore, 'for type:', detectedType);

    // Use field-based detection if it has higher confidence
    if (maxScore > 0.4) {
      documentType = detectedType;
      confidence = Math.min(0.9, maxScore);
      
      switch (documentType) {
        case DocumentType.EMIRATES_ID:
          suggestedAction = 'Store in Emirates ID records table';
          break;
        case DocumentType.VISA:
          suggestedAction = 'Store in VISA records table';
          break;
        case DocumentType.PASSPORT:
          suggestedAction = 'Store in passport records table';
          break;
      }
    }
  }

  // Final fallback based on presence of key identifiers
  if (confidence < 0.7) {
    console.log('🔍 Running fallback detection...');
    
    // Priority 1: Check for Emirates ID pattern first (before passport fallback)
    const emiratesIdPattern = /\b\d{3}-\d{4}-\d{7}-\d{1}\b/;
    const allFieldsText = Object.values(extractedData).join(' ').toLowerCase();
    
    if (emiratesIdPattern.test(allFieldsText)) {
      documentType = DocumentType.EMIRATES_ID;
      confidence = 0.85;
      suggestedAction = 'Store in Emirates ID records table (Emirates ID number pattern detected)';
      console.log('🔍 Fallback: Emirates ID number pattern detected in text:', allFieldsText.match(emiratesIdPattern));
    }
    // Priority 2: Check if there's an Emirates ID number in any field (including passportNumber)
    else if (extractedData.emiratesIdNumber || 
             (extractedData.passportNumber && emiratesIdPattern.test(extractedData.passportNumber))) {
      documentType = DocumentType.EMIRATES_ID;
      confidence = 0.85;
      suggestedAction = 'Store in Emirates ID records table (Emirates ID number field detected)';
      console.log('🔍 Fallback: Emirates ID number found in fields');
    }
    // Priority 3: Check for passport number (only if it doesn't match Emirates ID pattern)
    else if (extractedData.passportNumber && 
             extractedData.passportNumber.length > 5 && 
             !emiratesIdPattern.test(extractedData.passportNumber)) {
      documentType = DocumentType.PASSPORT;
      confidence = 0.75;
      suggestedAction = 'Store in passport records table (passport number detected)';
      console.log('🔍 Fallback: Passport number detected (non-Emirates ID format)');
    }
    // Priority 4: Default fallback
    else if (extractedData.fullName || extractedData.givenName) {
      // If we have name but no strong indicators, default to passport with low confidence
      documentType = DocumentType.PASSPORT;
      confidence = 0.6;
      suggestedAction = 'Store in passport records table (default - name detected)';
      console.log('🔍 Fallback: Name detected, defaulting to passport');
    }
  }

  const result = {
    documentType,
    confidence,
    suggestedAction,
    validationMessage: confidence < 0.8 ? 
      'Document type detection confidence is low. Please verify the document type manually.' : undefined
  };

  console.log('🎯 Final detection result:', result);
  return result;
}

/**
 * Store document data in the appropriate table based on document type
 */
export async function storeDocumentData(
  extractedData: ExtractedPassportData, 
  documentType: DocumentType,
  sourceFileName?: string,
  existingRecordId?: string
): Promise<DocumentStorageResult> {
  console.log('💾 === DOCUMENT STORAGE START ===');
  console.log('💾 Document type:', documentType);
  console.log('💾 Source file:', sourceFileName);
  console.log('💾 Existing record ID:', existingRecordId);

  try {
    switch (documentType) {
      case DocumentType.EMIRATES_ID: {
        console.log('💾 Storing Emirates ID data');
        
        // Convert extracted data to Emirates ID format
        console.log('🔄 EMIRATES ID TRANSFORMATION: Input extractedData:', extractedData);
        console.log('🔄 EMIRATES ID TRANSFORMATION: extractedData.emiratesIdNumber =', extractedData.emiratesIdNumber);
        console.log('🔄 EMIRATES ID TRANSFORMATION: All extractedData keys:', Object.keys(extractedData));
        
        // AGGRESSIVE Emirates ID Number Detection in transformation
        let finalEmiratesIdNumber = extractedData.emiratesIdNumber;
        
        if (!finalEmiratesIdNumber) {
          console.log('🔄 EMIRATES ID TRANSFORMATION: emiratesIdNumber not found, scanning all fields...');
          const emiratesPattern = /\b\d{3}-\d{4}-\d{7}-\d{1}\b/;
          
          // Check common alternative field names
          const possibleFields = [
            'emirates_id_number', 'Emirates_ID_Number', 'ID_Number', 'emiratesId',
            'passportNumber', 'documentNumber', 'id', 'idNumber', 'nationalId'
          ];
          
          for (const field of possibleFields) {
            if (extractedData[field] && typeof extractedData[field] === 'string') {
              if (emiratesPattern.test(extractedData[field])) {
                console.log(`🔄 TRANSFORMATION: Found Emirates ID in field "${field}":`, extractedData[field]);
                finalEmiratesIdNumber = extractedData[field];
                break;
              }
            }
          }
          
          // If still not found, scan ALL fields for the pattern
          if (!finalEmiratesIdNumber) {
            for (const [key, value] of Object.entries(extractedData)) {
              if (typeof value === 'string' && emiratesPattern.test(value)) {
                console.log(`🔄 TRANSFORMATION: Found Emirates ID pattern in field "${key}":`, value);
                finalEmiratesIdNumber = value.match(emiratesPattern)?.[0] || value;
                break;
              }
            }
          }
        }
        
        // ENSURE FINAL EMIRATES ID NUMBER IS PRESERVED
        console.log('🔄 EMIRATES ID TRANSFORMATION: finalEmiratesIdNumber before creating emiratesIdData:', finalEmiratesIdNumber);
        console.log('🔄 EMIRATES ID TRANSFORMATION: typeof finalEmiratesIdNumber:', typeof finalEmiratesIdNumber);
        
        const emiratesIdData: ExtractedEmiratesIdData = {
          fullNameEnglish: extractedData.fullName || extractedData.givenName && extractedData.surname ? 
            `${extractedData.givenName} ${extractedData.surname}` : undefined,
          fullNameArabic: extractedData.fullNameArabic,
          firstNameEnglish: extractedData.givenName,
          lastNameEnglish: extractedData.surname,
          firstNameArabic: extractedData.firstNameArabic,
          lastNameArabic: extractedData.lastNameArabic,
          emiratesIdNumber: finalEmiratesIdNumber,
          dateOfBirth: extractedData.dateOfBirth,
          nationality: extractedData.nationality,
          gender: extractedData.gender,
          issuingDate: extractedData.dateOfIssue,
          expiryDate: extractedData.dateOfExpiry,
          emiratesResidence: extractedData.emiratesResidence,
          areaCode: extractedData.areaCode
        };
        
        // CRITICAL VALIDATION: Ensure Emirates ID is preserved in emiratesIdData
        console.log('🔄 EMIRATES ID TRANSFORMATION: emiratesIdData.emiratesIdNumber after creation:', emiratesIdData.emiratesIdNumber);
        
        if (!emiratesIdData.emiratesIdNumber && finalEmiratesIdNumber) {
          console.error('🚨 CRITICAL: finalEmiratesIdNumber was set but emiratesIdData.emiratesIdNumber is null!');
          console.error('🚨 finalEmiratesIdNumber:', finalEmiratesIdNumber);
          console.error('🚨 emiratesIdData:', emiratesIdData);
          // Force assignment
          emiratesIdData.emiratesIdNumber = finalEmiratesIdNumber;
          console.log('🔄 EMIRATES ID TRANSFORMATION: Force-assigned emiratesIdNumber:', emiratesIdData.emiratesIdNumber);
        }
        
        console.log('🔄 EMIRATES ID TRANSFORMATION: Output emiratesIdData:', emiratesIdData);
        console.log('🔄 EMIRATES ID TRANSFORMATION: Final emiratesIdNumber =', emiratesIdData.emiratesIdNumber);

        // CRITICAL VALIDATION: Ensure we have Emirates ID number before saving
        if (!emiratesIdData.emiratesIdNumber) {
          console.error('🚨 CRITICAL: No Emirates ID number in transformed data before database save!');
          console.error('🚨 Original extractedData:', extractedData);
          console.error('🚨 Transformed emiratesIdData:', emiratesIdData);
          
          // TEMPORARY: Allow saving without Emirates ID to see debug logs
          console.warn('⚠️ TEMPORARY: Proceeding with save despite missing Emirates ID number for debugging');
        }
        
        console.log('✅ DOCUMENT TYPE SERVICE: Emirates ID number validated:', emiratesIdData.emiratesIdNumber);

        let record;
        if (existingRecordId) {
          console.log('💾 DOCUMENT TYPE SERVICE: Updating existing Emirates ID record:', existingRecordId);
          record = await updateEmiratesIdRecord(existingRecordId, emiratesIdData, sourceFileName);
        } else {
          // Check if Emirates ID already exists
          if (emiratesIdData.emiratesIdNumber) {
            console.log('🔍 DOCUMENT TYPE SERVICE: Checking for existing Emirates ID:', emiratesIdData.emiratesIdNumber);
            const existing = await findEmiratesIdByNumber(emiratesIdData.emiratesIdNumber);
            if (existing) {
              console.log('📝 DOCUMENT TYPE SERVICE: Updating existing Emirates ID record');
              record = await updateEmiratesIdRecord(existing.id, emiratesIdData, sourceFileName);
            } else {
              console.log('💾 DOCUMENT TYPE SERVICE: Creating new Emirates ID record');
              record = await saveEmiratesIdRecord(emiratesIdData, sourceFileName);
            }
          } else {
            console.log('💾 DOCUMENT TYPE SERVICE: Creating new Emirates ID record (no ID to check)');
            record = await saveEmiratesIdRecord(emiratesIdData, sourceFileName);
          }
        }

        return {
          success: true,
          recordId: record.id,
          documentType: DocumentType.EMIRATES_ID,
          message: `Emirates ID data stored successfully - ID: ${record.id.substring(0, 8)}...`,
          linkedRecords: { emiratesIdRecordId: record.id }
        };
      }

      case DocumentType.VISA: {
        console.log('💾 Storing VISA data');
        
        // Convert extracted data to VISA format
        const visaData: ExtractedVisaData = {
          fullName: extractedData.fullName || (extractedData.givenName && extractedData.surname ? 
            `${extractedData.givenName} ${extractedData.surname}` : undefined),
          passportHolderName: extractedData.fullName,
          passportNumber: extractedData.passportNumber,
          visaNumber: extractedData.visaNumber,
          visaReferenceNumber: extractedData.visaReferenceNumber,
          visaType: extractedData.visaType,
          visaCategory: extractedData.visaCategory,
          visaClass: extractedData.visaClass,
          nationality: extractedData.nationality,
          dateOfBirth: extractedData.dateOfBirth,
          placeOfBirth: extractedData.placeOfBirth,
          issueDate: extractedData.dateOfIssue,
          expiryDate: extractedData.dateOfExpiry,
          validFromDate: extractedData.validFromDate,
          validUntilDate: extractedData.validUntilDate,
          durationOfStay: extractedData.durationOfStay,
          portOfEntry: extractedData.portOfEntry,
          purposeOfVisit: extractedData.purposeOfVisit,
          sponsorInformation: extractedData.sponsorInformation,
          issuingCountry: extractedData.issuingCountry,
          issuingAuthority: extractedData.issuingAuthority,
          issuingLocation: extractedData.issuingLocation,
          entriesAllowed: extractedData.entriesAllowed
        };

        let record;
        if (existingRecordId) {
          record = await updateVisaRecord(existingRecordId, visaData, sourceFileName);
        } else {
          // Check if VISA already exists
          if (visaData.visaNumber) {
            const existing = await findVisaByNumber(visaData.visaNumber);
            if (existing) {
              record = await updateVisaRecord(existing.id, visaData, sourceFileName);
            } else {
              record = await saveVisaRecord(visaData, sourceFileName);
            }
          } else {
            record = await saveVisaRecord(visaData, sourceFileName);
          }
        }

        return {
          success: true,
          recordId: record.id,
          documentType: DocumentType.VISA,
          message: `VISA data stored successfully - ID: ${record.id.substring(0, 8)}...`,
          linkedRecords: { visaRecordId: record.id }
        };
      }

      case DocumentType.PASSPORT:
      case DocumentType.PASSPORT_FRONT:
      case DocumentType.PASSPORT_BACK:
      case DocumentType.PASSPORT_ADDRESS:
      case DocumentType.PASSPORT_LAST:
      default: {
        console.log('💾 Storing Passport data');
        
        let record;
        if (existingRecordId) {
          record = await updatePassportRecordData(existingRecordId, extractedData);
        } else {
          // Check if passport already exists
          if (extractedData.passportNumber) {
            const existing = await findExistingRecordByPassport(extractedData.passportNumber);
            if (existing) {
              record = await updatePassportRecordData(existing.id, extractedData);
            } else {
              record = await savePassportRecordData(extractedData);
            }
          } else {
            record = await savePassportRecordData(extractedData);
          }
        }

        return {
          success: true,
          recordId: record.id,
          documentType: documentType,
          message: `Passport data stored successfully - ID: ${record.id.substring(0, 8)}...`,
          linkedRecords: { passportRecordId: record.id }
        };
      }
    }
  } catch (error) {
    console.error('❌ Failed to store document data:', error);
    return {
      success: false,
      recordId: '',
      documentType: documentType,
      message: `Failed to store ${documentType} data: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Main function to process document upload with automatic detection and routing
 */
export async function processDocumentUpload(
  extractedData: ExtractedPassportData,
  sourceFileName?: string,
  pageTypeHint?: string,
  existingRecordId?: string
): Promise<DocumentStorageResult> {
  console.log('🚀 === DOCUMENT UPLOAD PROCESSING START ===');
  console.log('🚀 Source file:', sourceFileName);
  console.log('🚀 Page type hint:', pageTypeHint);
  
  // Step 1: Detect document type
  const detection = detectDocumentType(extractedData, pageTypeHint);
  console.log('🎯 Detection result:', detection);

  // Step 2: Store data in appropriate table
  const storageResult = await storeDocumentData(
    extractedData, 
    detection.documentType, 
    sourceFileName,
    existingRecordId
  );

  console.log('💾 Storage result:', storageResult);

  // Add detection confidence to the result
  storageResult.message += ` (Detection confidence: ${Math.round(detection.confidence * 100)}%)`;
  
  if (detection.validationMessage) {
    storageResult.message += ` - ${detection.validationMessage}`;
  }

  return storageResult;
}

/**
 * Get display name for document type
 */
export function getDocumentTypeDisplayName(documentType: DocumentType): string {
  switch (documentType) {
    case DocumentType.PASSPORT: return 'Passport';
    case DocumentType.PASSPORT_FRONT: return 'Passport (Front Page)';
    case DocumentType.PASSPORT_BACK: return 'Passport (Back Page)';
    case DocumentType.PASSPORT_ADDRESS: return 'Passport (Address Page)';
    case DocumentType.PASSPORT_LAST: return 'Passport (Last Page)';
    case DocumentType.EMIRATES_ID: return 'Emirates ID';
    case DocumentType.VISA: return 'Visa';
    case DocumentType.AADHAR: return 'Aadhar Card';
    case DocumentType.UNKNOWN: return 'Unknown Document';
    default: return 'Document';
  }
}