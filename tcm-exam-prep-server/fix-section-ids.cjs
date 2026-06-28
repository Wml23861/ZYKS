const fs = require('fs');
const path = require('path');
const seedsDir = path.resolve(__dirname, 'seeds');
const files = fs.readdirSync(seedsDir).filter(f => f.endsWith('.ts'));
const skip = ['002_zhongji_pdf_full.ts', '001_subjects_structure.ts'];
const oldIds = Array.from({length:38}, (_,i) => `'sec-zhongji-${String(i+1).padStart(3,'0')}'`);
for (const file of files) {
  if (skip.includes(file)) continue;
  const fp = path.join(seedsDir, file);
  let c = fs.readFileSync(fp, 'utf-8');
  let mod = false;
  for (const oid of oldIds) { if (c.includes(oid)) { c = c.split(oid).join("''"); mod = true; } }
  if (mod) { fs.writeFileSync(fp, c); console.log(file); }
}
console.log('Done.');
