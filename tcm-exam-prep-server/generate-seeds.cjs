/**
 * PDF 结构分析器 - 解析 zyjcll-utf8.txt 的章节结构
 * 用法: node generate-seeds.js
 */

const fs = require('fs');
const path = require('path');

const pdfPath = path.resolve(__dirname, '..', 'pdf', 'zyjcll-utf8.txt');
const text = fs.readFileSync(pdfPath, 'utf-8');

const CHAPTER_PATTERN = /^第([一二三四五六七八]+)章\s+(\S+)/;
const SECTION_PATTERN = /^第([一二三四五六七八]+)节\s+(\S+)/;
const SUBSECTION_PATTERN = /^([一二三四五六七八]+)、(\S+)/;
const cnNum = { '一':1,'二':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,'九':9,'十':10 };
function parseCnNum(s) {
  if (s.length === 1) return cnNum[s] || 0;
  if (s === '十') return 10;
  return 10 + (cnNum[s[1]] || 0);
}

const lines = text.split('\n');
const structure = [];
let currentChapter = null, currentSection = null, currentSub = null, currentContent = [];
let tocEnd = 0;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].trim().includes('绪') && lines[i].trim().includes('论') && i > 300) {
    tocEnd = i; break;
  }
}

for (let i = tocEnd; i < lines.length; i++) {
  let ln = lines[i].trim();
  if (!ln || ln === '\f' || /^\d+$/.test(ln)) continue;

  const chM = ln.match(CHAPTER_PATTERN);
  if (chM) {
    if (currentSub) { currentSub.content = currentContent.join('\n'); currentContent = []; }
    if (currentSection && currentChapter) { currentChapter.sections.push(currentSection); currentSection = null; }
    if (currentChapter) { structure.push(currentChapter); }
    currentChapter = { num: parseCnNum(chM[1]), title: chM[2], sections: [] };
    console.log('Ch', currentChapter.num, ':', currentChapter.title);
    continue;
  }

  const secM = ln.match(SECTION_PATTERN);
  if (secM) {
    if (currentSub) { currentSub.content = currentContent.join('\n'); currentContent = []; }
    if (currentSection && currentChapter) { currentChapter.sections.push(currentSection); }
    currentSection = { num: parseCnNum(secM[1]), title: secM[2], subs: [] };
    currentSub = null;
    console.log('  Sec', currentSection.num, ':', currentSection.title);
    continue;
  }

  const subM = ln.match(SUBSECTION_PATTERN);
  if (subM && currentSection) {
    if (currentSub) { currentSub.content = currentContent.join('\n'); currentContent = []; }
    currentSub = { num: parseCnNum(subM[1]), title: subM[2], content: '' };
    currentSection.subs.push(currentSub);
    currentContent = [ln];
    continue;
  }

  if (currentSub) currentContent.push(ln);
}

if (currentSub) currentSub.content = currentContent.join('\n');
if (currentSection && currentChapter) currentChapter.sections.push(currentSection);
if (currentChapter) structure.push(currentChapter);

let total = 0;
for (const ch of structure) {
  let sc = 0;
  for (const sec of ch.sections) sc += sec.subs.length;
  console.log('Ch', ch.num, ch.title + ':', ch.sections.length + '节,' + sc + '个小节');
  total += sc;
}
console.log('Total subsections:', total);

fs.writeFileSync(path.resolve(__dirname, 'pdf-structure.json'), JSON.stringify(structure, null, 2));
console.log('Saved to pdf-structure.json');
