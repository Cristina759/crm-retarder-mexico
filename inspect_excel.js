const XLSX = require('xlsx');
const path = './VENTA 2026.xlsx';

try {
  const workbook = XLSX.readFile(path);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);

  if (data.length > 0) {
    console.log('Columns:', Object.keys(data[0]));
    console.log('First 5 rows:');
    console.log(JSON.stringify(data.slice(0, 5), null, 2));
    console.log('Total rows:', data.length);
    
    const totalAmount = data.reduce((sum, row) => {
      // I'll need to know which column is the amount. 
      // For now, I'll just print the keys to help me decide.
      return sum;
    }, 0);
  } else {
    console.log('The sheet is empty.');
  }
} catch (err) {
  console.error('Error reading Excel file:', err.message);
}
