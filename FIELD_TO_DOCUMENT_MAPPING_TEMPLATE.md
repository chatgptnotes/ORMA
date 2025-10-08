# ORMA Form - Field to Document Mapping Template

## 📊 Mapping Progress
- ✅ **46 fields mapped** - COMPLETE! ✨
- 📋 **Total: 46 fields**

### Document Distribution:
- 🔵 **Passport Front**: 11 fields
- 🔵 **Passport Back**: 3 fields
- 🟢 **Emirates ID Back**: 2 fields
- 🟡 **VISA**: 2 fields
- 🟠 **Admin Form**: 21 fields
- ⚪ **Manual Entry**: 7 fields
- ⚫ **Auto-calculated**: 2 fields

## Instructions
For each field below, please specify which document provides the data in the **"Data Source"** column.

## Available Document Sources
- **Passport Front** - First page with photo and personal details
- **Passport Back** - Last/address page with family information
- **Emirates ID Front** - Front side with ID number and names
- **Emirates ID Back** - Back side
- **VISA** - VISA page with sponsor and occupation info
- **Aadhaar Front** - Front side with photo and Aadhaar number
- **Aadhaar Back** - Back side with address
- **Admin Form** - Handwritten Malayalam admin form
- **Manual Entry** - User must enter manually (no auto-fill)
- **Auto-calculated** - System calculates automatically

---

## Form Fields Mapping (42 Fields Total)

| No. | Field Name | Field Type | **Data Source** (👉 FILL THIS) | Notes/Comments |
|-----|------------|------------|-------------------------------|----------------|
| 1 | ORGANISATION | select | **Manual Entry** ✅ | User selects: ORMA/NON ORMA/GRANMA/etc. |
| 2 | Apply For | checkbox | **Manual Entry** ✅ | User selects: NORKA ID/INSURANCE/KSHEMANIDHI |
| 3 | Type | select | **Manual Entry** ✅ | User selects: NEW or RENEWAL |
| 4 | NORKA ID NUMER | text | **Manual Entry** ✅ | Optional - User enters if they have one |
| 5 | KSHEMANIDHI ID NUMBER | text | **Manual Entry** ✅ | Optional - User enters if applicable |
| 6 | Applicant Full Name in CAPITAL | text | **Passport Front** ✅ | Extract and convert to UPPERCASE |
| 7 | First Name | text | **Passport Front** ✅ | Given Name from passport |
| 8 | Middle Name | text | **Passport Front** ✅ | Parse from Full Name |
| 9 | Last Name | text | **Passport Front** ✅ | Surname from passport / Full Name |
| 10 | UAE Mobile Number | tel | **Admin Form** ✅ | Format: +971 5XXXXXXXX |
| 11 | WhatsApp Number | tel | **Admin Form** ✅ | With country code |
| 12 | Permanent Residence Address | text | **Passport Back** ✅ | Address in Kerala/India |
| 13 | PIN Code | text | **Passport Back** ✅ | Extract from address |
| 14 | Email ID | email | **Admin Form** ✅ | Email address |
| 15 | Indian Active Mobile Number | tel | **Admin Form** ✅ | India mobile number |
| 16 | Local Body Type | select | **Admin Form** ✅ | From Panchayath/Municipality/Corporation section |
| 17 | Taluk | text | **Admin Form** ✅ | Taluk name |
| 18 | Village | text | **Admin Form** ✅ | Village name |
| 19 | Local Body Name | text | **Admin Form** ✅ | Name of Panchayath/Municipality/Corporation |
| 20 | District | text | **Admin Form** ✅ | Kerala district |
| 21 | Current Residence Address (Abroad) | text | **Admin Form** ✅ | UAE/abroad address |
| 22 | Aadhaar Number | text | **Admin Form** ✅ | 12-digit Aadhaar number | Nominee's DOB (fallback to Aadhaar) |
| 23 | Nominee Date of Birth | date | **Admin Form** → Aadhaar Front ✅ | 
| 24 | Nominee 1 Name | text | **Admin Form** ✅ | First nominee |
| 25 | Nominee 2 Name | text | **Manual Entry** ✅ | Second nominee (user enters) |
| 26 | Nominee 3 Name | text | **Manual Entry** ✅ | Third nominee (user enters) |
| 27 | Form Collected By | text | **Manual Entry** ✅ | Person who collected form |
| 28 | Uploaded Copies | text | **Auto-calculated** ✅ | System tracks document names |
| 29 | Visa Number | text | **VISA** ✅ | VISA number (UID) |
| 30 | Sponsor/Company Name | text | **Manual Entry** ✅ | Employer/sponsor name |
| 31 | Visa Expiry Date | date | **VISA** ✅ | VISA validity end date |
| 32 | Occupation | text | **Emirates ID Back** ✅ | Job title/occupation |
| 33 | Passport Number | text | **Passport Front** ✅ | Indian passport number |
| 34 | Passport Issue Date | date | **Passport Front** ✅ | Passport issued on |
| 35 | Passport Expiry Date | date | **Passport Front** ✅ | Passport valid until |
| 36 | Passport Issued Place | text | **Passport Front** ✅ | City where issued |
| 37 | Date of Birth | date | **Passport Front** ✅ | Applicant's date of birth |
| 38 | Father/Guardian Name | text | **Passport Back** ✅ | Father or guardian name |
| 39 | Nominee name | text | **Admin Form** ✅ | Primary nominee name |
| 40 | Relationship | text | **Admin Form** ✅ | Relationship with nominee |
| 41 | DOB | date | **Passport Front** ✅ | Date of birth (duplicate field) |
| 42 | Age autocalculate | number | **Auto-calculated** ✅ | Calculated from DOB automatically |
| 43 | Current Occupation | text | **Emirates ID Back** ✅ | Current job |
| 44 | Current Residence | text | **Admin Form** ✅ | Current residence location |
| 45 | Mobile number (IND) | tel | **Admin Form** ✅ | India mobile number |
| 46 | Percentage | number | **Manual Entry** ✅ | Nominee percentage share |

---

## How to Fill This Out

1. **For each field**, decide which document contains that data
2. **Write the document name** in the "Data Source" column (3rd column)
3. **If a field can be filled from multiple documents**, list them in priority order (e.g., "Passport Front, Aadhaar Front")
4. **If user must manually enter**, write "Manual Entry"
5. **If system auto-calculates**, write "Auto-calculated"

## Example:
```
| 6 | Applicant Full Name in CAPITAL | text | Passport Front, Aadhaar Front | Should be in UPPERCASE |
| 22 | Aadhaar Number | text | Aadhaar Front | 12-digit Aadhaar number |
| 38 | Father/Guardian Name | text | Passport Back | Father or guardian name |
```

---

## After You Fill This Out
1. Save this file with your filled data sources
2. I will use this mapping to update the extraction and auto-fill logic
3. The system will then know exactly where to get data for each field

**Start filling in the "Data Source" column above! 👆**
