const sqlite3 = require('sqlite3').default || require('sqlite3');
const path = require('path');

const dbPath = path.resolve('database.sqlite');
console.log('Resolving SQLite DB Path:', dbPath);
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database opening error:', err);
    return;
  }
  console.log('Connected to SQLite database.');
});

db.all('SELECT * FROM products', [], (err, rows) => {
  if (err) {
    console.error('Error querying products:', err);
    return;
  }
  console.log('--- Products in DB ---');
  rows.forEach(row => {
    console.log(`ID: ${row.id} | Name: "${row.name}" | Category: "${row.category}"`);
  });
  db.close();
});
