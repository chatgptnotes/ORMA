# ORMA Auto-Fill Implementation Plan

Based on the complete field-to-document mapping, here's the implementation plan.

## 📊 Mapping Summary

### Passport Front (11 fields)
- Applicant Full Name in CAPITAL → uppercase conversion
- First Name, Middle Name, Last Name → parse from full name
- Passport Number, Issue Date, Expiry Date, Issued Place
- Date of Birth (fields #37 and #41)

### Passport Back (3 fields)
- Permanent Residence Address
- PIN Code → extract from address
- Father/Guardian Name

### Emirates ID Back (2 fields)
- Occupation
- Current Occupation

### VISA (2 fields)
- Visa Number
- Visa Expiry Date

### Admin Form (21 fields)
- UAE Mobile Number, WhatsApp Number, Email ID
- Indian Active Mobile Number, Mobile number (IND)
- Local Body Type, Taluk, Village, Local Body Name, District
- Current Residence Address (Abroad), Current Residence
- Aadhaar Number
- Nominee Date of Birth, Nominee 1 Name, Nominee name, Relationship

### Manual Entry (7 fields)
- ORGANISATION, Apply For, Type
- NORKA ID NUMER, KSHEMANIDHI ID NUMBER
- Nominee 2 Name, Nominee 3 Name
- Form Collected By, Sponsor/Company Name, Percentage

### Auto-calculated (2 fields)
- Uploaded Copies → track document names
- Age autocalculate → from DOB

---

## 🔧 Implementation Steps

### Step 1: Add Name Parsing Utility
Create function to parse First/Middle/Last from Full Name:
- Handle formats: "First Last", "First Middle Last", "Last, First Middle"
- Support Indian naming conventions

### Step 2: Update Passport Extractor
- Ensure all passport fields are extracted
- Add name parsing logic
- Add PIN code extraction from address

### Step 3: Update Handwritten Form Extractor
- Update to extract all 21 admin form fields
- Improve Malayalam text recognition
- Add field validation

### Step 4: Update Field Mapping Function
- Create comprehensive mapping based on document source
- Handle fallback scenarios (Admin Form → Aadhaar Front for Nominee DOB)
- Skip manual entry fields
- Implement auto-calculations

### Step 5: Add Auto-Calculation Logic
- Age calculation from DOB
- Uploaded documents list generation

### Step 6: Testing
- Test with all document types
- Verify each field auto-fills correctly
- Check fallback scenarios

---

## 🎯 Priority Implementation Order

1. ✅ **Name Parsing** - Critical for First/Middle/Last names
2. ✅ **Passport Fields** - Most commonly used (11 fields)
3. ✅ **Admin Form Fields** - Largest group (21 fields)
4. ✅ **Auto-Calculations** - Age and uploaded copies
5. ✅ **Field Mapping Logic** - Tie everything together
6. ✅ **Testing** - Ensure accuracy

---

## 📝 Next Steps

Starting implementation now based on this plan!
