export interface PassportData {
  surname: string | null;
  givenName: string | null;
  sex: 'M' | 'F' | 'X' | null;
  dateOfBirth: string | null;
  placeOfBirth: string | null;
  dateOfIssue: string | null;
  dateOfExpiry: string | null;
  placeOfIssue: string | null;
  passportNumber: string | null;
  fatherName: string | null;
  motherName: string | null;
  spouseName: string | null;
  address: string | null;
  fileNumber: string | null;
  mrzLine1: string | null;
  mrzLine2: string | null;
  nationality: string | null;
  countryOfResidence: string | null;
  visaInformation: string | null;
  contactNumber: string | null;
  emailAddress: string | null;
}

export interface ImageFile {
    file: File;
    dataUrl: string;
    base64: string;
}