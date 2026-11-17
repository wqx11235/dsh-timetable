import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import fs from 'fs';
const base = '/tmp/kbpdf/node_modules/pdfjs-dist/';

export async function parseKbPdf(buf){
  const doc = await pdfjs.getDocument({ data: buf, cMapUrl: base + 'cmaps/', cMapPacked: true,
    standardFontDataUrl: base + 'standard_fonts/' }).promise;
  let items = [];
  for (let p = 1; p <= doc.numPages; p++){
    const page = await doc.getPage(p);
    const tc = await page.getTextContent();
    for (const it of tc.items){
      const s = it.str;
      if (!s || !s.trim()) continue;
      items.push({ p, s, x: it.transform[4], y: it.transform[5], rot: Math.abs(it.transform[1]) > Math.abs(it.transform[0]) });
    }
  }
  return items;
}

export function buildCourses(items){
  // 若整页旋转 90°，日列在 y 轴、节次在 x 轴；否则反过来
  const rotated = items.filter(i => i.rot).length > items.length * 0.6;
  const pos = items.map(i => rotated ? { ...i, c: i.y, r: i.x } : { ...i, c: i.x, r: i.y });
  const heads = pos.filter(i => /^星期[一二三四五六日]$/.test(i.s));
  let centers, names = ['一','二','三','四','五','六','日'];
  if (heads.length === 7){
    centers = heads.map(h => ({ c: h.c, name: h.s }));
    centers.sort((a, b) => a.c - b.c);
  } else {
    // 没有表头：按周一..周日顺序等分估算
    const cs = pos.map(i => i.c);
    const min = Math.min(...cs), max = Math.max(...cs);
    centers = names.map((n, i) => ({ c: min + (max - min) * (i + 0.5) / 7, name: '星期' + n }));
  }
  const rHead = heads.length ? heads.reduce((a, h) => a + h.r, 0) / heads.length : 0;
  const gap = centers.length > 1 ? Math.abs(centers[1].c - centers[0].c) : 100;
  const lo = centers[0].c - gap * 0.5, hi = centers[6].c + gap * 0.5;
  const rows = centers.map(() => []);
  for (const it of pos){
    if (it.c < lo || it.c > hi) continue;
    if (it.s.indexOf('打印时间') >= 0) continue;
    if (heads.length && it.p === 1 && it.r <= rHead + 12) continue;
    if (/^(时间段|节次|星期[一二三四五六日]$)/.test(it.s)) continue;
    if (it.s.indexOf('课表') >= 0 || it.s.indexOf('学号') >= 0) continue;
    let bi = 0, best = 1e9;
    centers.forEach((ct, i) => { const d = Math.abs(it.c - ct.c); if (d < best){ best = d; bi = i; } });
    rows[bi].push(it);
  }
  const courses = [];
  rows.forEach((arr, di) => {
    arr.sort((a, b) => (a.p - b.p) || (a.r - b.r));
    const text = arr.map(i => i.s).join('').replace(/\s+/g, '');
    let start = 0;
    const parts = [];
    const re = /学分[:：]\s*[\d.]+/g;
    let m;
    while ((m = re.exec(text))){
      parts.push(text.slice(start, m.index + m[0].length));
      start = m.index + m[0].length;
    }
    if (text.slice(start).trim()) parts.push(text.slice(start));
    for (let raw of parts){
      raw = raw.replace(/^[◇◆★○●]+/, '').trim();
      const mj = raw.match(/\((\d+)-(\d+)节\)/);
      if (!mj || mj.index === 0) continue;
      const name = raw.slice(0, mj.index).replace(/[★○●◇◆]/g, '').trim();
      const rest = raw.slice(mj.index + mj[0].length);
      const weeksText = rest.split(/\/校区/)[0].replace(/^[,，]/, '').trim();
      const g = (re2) => { const x = raw.match(re2); return x ? x[1].trim() : ''; };
      courses.push({
        name, day: di + 1, dayName: '星期' + names[di],
        jcs: [Number(mj[1]), Number(mj[2])],
        weeksText, room: g(/\/场地:([^\/]*)/), teacher: g(/\/教师:([^\/]*)/),
        klass: g(/\/教学班:([^\/]*)/), exam: g(/\/考核方式:([^\/]*)/),
        credit: g(/学分[:：]\s*([\d.]+)/), campus: g(/\/校区:([^\/]*)/)
      });
    }
  });
  return courses;
}

const items = await parseKbPdf(new Uint8Array(fs.readFileSync('/root/workspace/jwxt/kb.pdf')));
console.log('items', items.length, 'rotated?', items.filter(i => i.rot).length);
const cs = buildCourses(items);
console.log('courses', cs.length);
cs.forEach(c => console.log(c.dayName, c.jcs[0] + '-' + c.jcs[1], '|', c.name, '|', c.weeksText, '|', c.room, '|', c.teacher));
fs.writeFileSync('/tmp/pdfcourses.json', JSON.stringify(cs, null, 1));
