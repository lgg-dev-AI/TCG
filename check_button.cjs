const fs = require('fs');
const html = fs.readFileSync('page_dump.html', 'utf8');

console.log('--- Buttons in page_dump.html ---');
const btnRegex = /<button[^>]*>([\s\S]*?)<\/button>/gi;
let match;
while ((match = btnRegex.exec(html)) !== null) {
  const tag = match[0];
  const content = match[1].trim();
  // Extract title attribute if exists
  const titleMatch = /title="([^"]*)"/i.exec(tag);
  const title = titleMatch ? titleMatch[1] : 'No Title';
  console.log(`Tag: ${tag.substring(0, 80)}... | Title: "${title}" | Text: "${content.substring(0, 40)}"`);
}
