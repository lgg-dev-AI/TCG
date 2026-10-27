const fs = require('fs');
const readline = require('readline');

async function searchLog() {
  const fileStream = fs.createReadStream('C:\\Users\\Luis\\.gemini\\antigravity\\brain\\7753ee19-7e56-46fd-9c35-4a7eeedc39e5\\.system_generated\\logs\\transcript.jsonl');
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    if (line.includes('task-553') || line.includes('playwright')) {
      console.log(line.substring(0, 500) + '...');
    }
  }
}

searchLog().catch(console.error);
