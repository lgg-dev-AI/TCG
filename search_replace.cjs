const fs = require('fs');
const code = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');
const lines = code.split('\n');

console.log('--- .replace() matches in AdminPanel.tsx ---');
lines.forEach((line, index) => {
  if (line.includes('.replace(')) {
    console.log(`Line ${index + 1}: ${line.trim()}`);
  }
});
