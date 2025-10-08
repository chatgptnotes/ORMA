/**
 * Name Parsing Utility
 *
 * Parses full names into First, Middle, and Last name components.
 * Handles various naming conventions including Indian formats.
 */

export interface ParsedName {
  firstName: string;
  middleName: string;
  lastName: string;
  fullName: string;
}

/**
 * Parse a full name into First, Middle, and Last name components
 *
 * Handles formats:
 * - "First Last" → First: "First", Middle: "", Last: "Last"
 * - "First Middle Last" → First: "First", Middle: "Middle", Last: "Last"
 * - "First Middle1 Middle2 Last" → First: "First", Middle: "Middle1 Middle2", Last: "Last"
 * - "SURNAME, First Middle" → First: "First", Middle: "Middle", Last: "SURNAME"
 *
 * @param fullName - The full name to parse
 * @returns ParsedName object with firstName, middleName, lastName, and fullName
 */
export function parseFullName(fullName: string): ParsedName {
  if (!fullName || fullName.trim() === '') {
    return {
      firstName: '',
      middleName: '',
      lastName: '',
      fullName: ''
    };
  }

  // Clean up the name - remove extra spaces, trim
  const cleanName = fullName.trim().replace(/\s+/g, ' ');

  // Handle "SURNAME, First Middle" format (common in passports)
  if (cleanName.includes(',')) {
    const parts = cleanName.split(',').map(p => p.trim());
    const lastName = parts[0]; // Before comma is surname
    const remainingName = parts[1] || '';
    const nameParts = remainingName.split(' ').filter(p => p.length > 0);

    if (nameParts.length === 0) {
      return {
        firstName: '',
        middleName: '',
        lastName: lastName,
        fullName: cleanName
      };
    } else if (nameParts.length === 1) {
      return {
        firstName: nameParts[0],
        middleName: '',
        lastName: lastName,
        fullName: cleanName
      };
    } else {
      // Multiple parts after comma - first is firstName, rest are middle names
      return {
        firstName: nameParts[0],
        middleName: nameParts.slice(1).join(' '),
        lastName: lastName,
        fullName: cleanName
      };
    }
  }

  // Handle standard "First [Middle...] Last" format
  const nameParts = cleanName.split(' ').filter(p => p.length > 0);

  if (nameParts.length === 0) {
    return {
      firstName: '',
      middleName: '',
      lastName: '',
      fullName: cleanName
    };
  } else if (nameParts.length === 1) {
    // Only one name - treat as first name
    return {
      firstName: nameParts[0],
      middleName: '',
      lastName: '',
      fullName: cleanName
    };
  } else if (nameParts.length === 2) {
    // Two names - First Last
    return {
      firstName: nameParts[0],
      middleName: '',
      lastName: nameParts[1],
      fullName: cleanName
    };
  } else {
    // Three or more names - First Middle(s) Last
    return {
      firstName: nameParts[0],
      middleName: nameParts.slice(1, -1).join(' '),
      lastName: nameParts[nameParts.length - 1],
      fullName: cleanName
    };
  }
}

/**
 * Extract PIN code from an address string
 * Looks for 6-digit Indian PIN codes
 *
 * @param address - Address string to extract PIN code from
 * @returns PIN code if found, empty string otherwise
 */
export function extractPinCode(address: string): string {
  if (!address) return '';

  // Indian PIN codes are 6 digits
  const pinCodePattern = /\b\d{6}\b/;
  const match = address.match(pinCodePattern);

  return match ? match[0] : '';
}

/**
 * Calculate age from date of birth
 *
 * @param dateOfBirth - Date of birth in DD/MM/YYYY or YYYY-MM-DD format
 * @returns Age in years
 */
export function calculateAge(dateOfBirth: string): number {
  if (!dateOfBirth) return 0;

  try {
    let dobDate: Date;

    // Handle DD/MM/YYYY format
    if (dateOfBirth.includes('/')) {
      const parts = dateOfBirth.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
        const year = parseInt(parts[2], 10);
        dobDate = new Date(year, month, day);
      } else {
        return 0;
      }
    }
    // Handle YYYY-MM-DD format
    else if (dateOfBirth.includes('-')) {
      dobDate = new Date(dateOfBirth);
    }
    else {
      return 0;
    }

    const today = new Date();
    let age = today.getFullYear() - dobDate.getFullYear();
    const monthDiff = today.getMonth() - dobDate.getMonth();

    // Adjust age if birthday hasn't occurred yet this year
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dobDate.getDate())) {
      age--;
    }

    return age;
  } catch (error) {
    console.error('Error calculating age:', error);
    return 0;
  }
}

/**
 * Format a list of uploaded document names
 *
 * @param documents - Array of document objects with 'name' and 'type' properties
 * @returns Formatted string of document names
 */
export function formatUploadedDocuments(documents: Array<{ name?: string; type?: string }>): string {
  if (!documents || documents.length === 0) {
    return '';
  }

  return documents
    .map(doc => {
      // Return just the document type or name, not the file extension
      if (doc.type) {
        return doc.type;
      } else if (doc.name) {
        // Remove file extension and clean up
        return doc.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
      }
      return '';
    })
    .filter(name => name.length > 0)
    .join(', ');
}
