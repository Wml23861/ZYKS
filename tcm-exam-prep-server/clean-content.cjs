const fs = require('fs');
const path = require('path');
const input = path.resolve(__dirname, 'seeds/002_zhongji_pdf_full.ts');
let raw = fs.readFileSync(input, 'utf-8');
let n = 0;

// 1. CJK之间多余空格 (中 医 → 中医)
raw = raw.replace(/([一-鿿　-〿＀-￯])[ ]+(?=[一-鿿　-〿＀-￯])/g, '$1'); n++;
// 2. CJK之间全角空格
raw = raw.replace(/([一-鿿])[　]+([一-鿿])/g, '$1$2'); n++;
// 3. 多个全角空格 → 2个
raw = raw.replace(/　{3,}/g, '　　'); n++;
// 4. 空白引用 "  " → 移除
raw = raw.replace(/，?如\s*"[\s　]{1,3}"/g, ''); n++;
// 5. —— → —
raw = raw.replace(/——/g, '—'); n++;
// 6. 长空格行
raw = raw.replace(/\n[　\s]{20,}\n/g, '\n\n'); n++;
// 7. 清理关键词块
raw = raw.replace(/(\*\*🔑 关键词\*\*\n\n)([\s\S]*?)(\n\n\*\*📋)/g, (m,h,k,f) => {
  let c = k.replace(/[🔴🟠🟢📖📌🔑📋🎯🏷️]/g,'').replace(/^\s*[·、，。；：！？\s]+$/gm,'').replace(/\n{2,}/g,'\n').trim();
  if(!c||c.length<3) c='（见正文标注）';
  return h + c + f;
}); n++;
// 8. mark标签内空格
raw = raw.replace(/<mark class="kp-key">([\s\S]*?)<\/mark>/g, (_,inner) => {
  let c = inner.replace(/([一-鿿])[ ]+(?=[一-鿿])/g,'$1').replace(/　/g,'').trim();
  return '<mark class="kp-key">'+c+'</mark>';
}); n++;
// 9. 标题多余空格
raw = raw.replace(/(第[一二三四五六七八]+[章节])[\s　]+/g, '$1 '); n++;
// 10. 清除 \f 和孤立的数字行标记
raw = raw.replace(/\f/g, ''); n++;

console.error('Fixes:', n, '| Size:', raw.length);
fs.writeFileSync(input, raw, 'utf-8');
console.error('Done.');
