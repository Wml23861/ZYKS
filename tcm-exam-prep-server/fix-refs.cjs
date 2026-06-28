const fs = require('fs');
const path = require('path');
const seedsDir = path.resolve(__dirname, 'seeds');
const files = fs.readdirSync(seedsDir).filter(f => f.endsWith('.ts'));
const skip = ['002_zhongji_pdf_full.ts', '001_subjects_structure.ts'];
const reps = [
  ["'ch-zhongji-10'","'ch-zhongji-09'"],["'ch-zhongji-09'","'ch-zhongji-08'"],
  ["'ch-zhongji-08'","'ch-zhongji-07'"],["'ch-zhongji-07'","'ch-zhongji-06'"],
  ["'ch-zhongji-06'","'ch-zhongji-05'"],["'ch-zhongji-05'","'ch-zhongji-04'"],
  ["'ch-zhongji-04'","'ch-zhongji-03'"],["'ch-zhongji-03'","'ch-zhongji-02'"],
];
for (const file of files) {
  if (skip.includes(file)) continue;
  const fp = path.join(seedsDir, file);
  let c = fs.readFileSync(fp, 'utf-8');
  let mod = false;
  for (const [o,r] of reps) { if (c.includes(o)) { c = c.split(o).join(r); mod = true; } }
  if (mod) { fs.writeFileSync(fp, c); console.log('Fixed:', file); }
}
console.log('Done. References updated.');
