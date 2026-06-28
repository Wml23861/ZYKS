const fs = require('fs');
const path = require('path');

const input = path.resolve(__dirname, 'seeds/zhongji_full_generated.tmp');
const output = path.resolve(__dirname, 'seeds/002_zhongji_pdf_full.ts');
const raw = fs.readFileSync(input, 'utf-8');

// 提取所有 s() 块：用逐字符扫描，追踪模板字符串深度
const blocks = [];
let inBlock = false;
let blockStart = 0;
let parenDepth = 0;
let inTemplate = false;
let escapeNext = false;

for (let i = 0; i < raw.length; i++) {
  const ch = raw[i];
  const next2 = raw.substring(i, i+2);

  if (!inBlock && next2 === 's(' && (i === 0 || raw[i-1] === '\n')) {
    inBlock = true;
    blockStart = i;
    parenDepth = 0;
    inTemplate = false;
    escapeNext = false;
  }

  if (!inBlock) continue;

  if (inTemplate) {
    if (escapeNext) { escapeNext = false; continue; }
    if (ch === '\\') { escapeNext = true; continue; }
    if (ch === '`') { inTemplate = false; continue; }
  } else {
    if (ch === '`') { inTemplate = true; continue; }
    if (ch === '(') { parenDepth++; continue; }
    if (ch === ')') {
      parenDepth--;
      if (parenDepth === 0) {
        // 找到 s() 闭合点，检查后面是否有逗号
        let j = i + 1;
        while (j < raw.length && (raw[j] === ' ' || raw[j] === '\t')) j++;
        if (raw[j] === ',' || raw[j] === '\n') {
          blocks.push(raw.substring(blockStart, j === i+1 ? i+1 : j+1).trim());
          inBlock = false;
          i = j;
          continue;
        }
      }
    }
  }
}

// 过滤章节定义行
const sectionBlocks = blocks.filter(b => b.startsWith("s('sec-zhongji"));
console.error('Found', sectionBlocks.length, 'section blocks');

const header = `import { Knex } from 'knex'

function s(id: string, chId: string, subId: string, title: string, sort: number, content: string, time: number) {
  return { id, chapter_id: chId, subject_id: subId, title, sort_order: sort, content, estimated_study_time: time }
}

export async function seed(knex: Knex): Promise<void> {
  await knex('sections').where('subject_id', 'zhongji').del()
  const sections = [
`;

const footer = `\n  ]\n  await knex('sections').insert(sections)\n  console.log('[002-zhongji] ' + sections.length + ' sections from PDF')\n}\n`;

const final = header + '\n' + sectionBlocks.join(',\n') + footer;
fs.writeFileSync(output, final, 'utf-8');
console.error('Written:', output, fs.statSync(output).size, 'bytes');
