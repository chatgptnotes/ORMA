import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the Excel file
const workbook = XLSX.readFile('/Users/murali/Downloads/Sample form ref input & output.xlsx');

// Get all sheet names
const sheetNames = workbook.SheetNames;
console.log('Available sheets:', sheetNames);

// Process each sheet
const allData = {};

sheetNames.forEach(sheetName => {
  const worksheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  console.log(`\n=== Sheet: ${sheetName} ===`);
  console.log('Number of rows:', jsonData.length);
  
  if (jsonData.length > 0) {
    console.log('Columns:', jsonData[0]);
    console.log('First few data rows:');
    for (let i = 1; i < Math.min(6, jsonData.length); i++) {
      console.log(jsonData[i]);
    }
  }
  
  // Convert to object format with headers
  if (jsonData.length > 0) {
    const headers = jsonData[0];
    const dataRows = [];
    
    for (let i = 1; i < jsonData.length; i++) {
      const row = {};
      headers.forEach((header, index) => {
        row[header] = jsonData[i][index] || '';
      });
      dataRows.push(row);
    }
    
    allData[sheetName] = dataRows;
  }
});

// Save as JSON file
const outputPath = path.join(__dirname, '..', 'src', 'data', 'formData.json');
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(allData, null, 2));

console.log(`\nData saved to: ${outputPath}`);
console.log('Total sheets processed:', Object.keys(allData).length);
Object.keys(allData).forEach(sheet => {
  console.log(`- ${sheet}: ${allData[sheet].length} records`);
});