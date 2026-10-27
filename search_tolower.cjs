const fs = require('fs');
const code = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');
const lines = code.split('\n');

console.log('--- toLowerCase() matches in AdminPanel.tsx ---');
lines.forEach((line, index) => {
  if (line.includes('.toLowerCase(')) {
    console.log(`Line ${index + 1}: ${line.trim()}`);
  }
});
