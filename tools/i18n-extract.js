'use strict';
/**
 * 界面文案提取器：从 HTML / JS 里抽出所有含中文的用户可见文本，
 * 生成 src/i18n/keys.json（唯一键 + 出现位置 + 次数），供翻译与缺键检查使用。
 *
 * 只收「会真正出现在界面上的文字」：
 *   - HTML 的文本节点与 placeholder / title / aria-label / alt；
 *   - JS 字符串字面量里的整句文案；字面量里若拼了 HTML，只取其中的文本与上述属性，
 *     不把整段标签当键（否则词典里会混进 `<div class="...">` 这种永远匹配不上的键）；
 *   - 模板字符串的 ${...} 按出现顺序换成 {0} {1} …，运行时据此生成正则。
 *
 * 用法：
 *   node tools/i18n-extract.js            # 写 src/i18n/keys.json
 *   node tools/i18n-extract.js --check    # 检查 en.json 是否覆盖全部键，缺失则退出码 1
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const CJK = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/;
const ATTRS = ['placeholder', 'title', 'aria-label', 'alt'];

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) {
      // 词典本身与编译产物里全是中文键，扫进来只会污染统计
      if (name === 'i18n') continue;
      walk(p, out);
    } else if (/\.(js|html)$/.test(name)) {
      // 手册是整篇本地化（docs/USER-MANUAL.en.md → manual.en.html），不按句抽键
      if (name === 'i18n-dict.js' || name === 'i18n.js' || name === 'manual.html' || name === 'manual.en.html') continue;
      out.push(p);
    }
  }
  return out;
}

/** 从一段 HTML 里取文本节点与属性值 */
function htmlPieces(html) {
  const out = [];
  const clean = html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ');
  const re = /<[^>]*>|([^<]+)/g;
  let m;
  while ((m = re.exec(clean))) {
    if (m[1] === undefined) continue;
    const t = m[1].replace(/\s+/g, ' ').trim();
    if (t && CJK.test(t)) out.push(t);
  }
  for (const a of ATTRS) {
    const ar = new RegExp(`\\b${a}\\s*=\\s*"([^"]*)"`, 'gi');
    let am;
    while ((am = ar.exec(clean))) {
      const v = am[1].replace(/\s+/g, ' ').trim();
      if (v && CJK.test(v)) out.push(v);
    }
  }
  return out;
}

/**
 * JS 扫描器：跳过注释，逐个取出字符串字面量。
 * 模板字符串里的 ${...} 用花括号配对跳过（内部还可能嵌字符串/模板），换成 {n}。
 */
function jsLiterals(src) {
  const out = [];
  const n = src.length;
  let i = 0;
  let line = 1;
  let slot = 0;

  const skipQuoted = (quote) => {           // i 指向引号
    const startLine = line;
    i += 1;
    let buf = '';
    while (i < n) {
      const c = src[i];
      if (c === '\\') { buf += c + (src[i + 1] || ''); i += 2; continue; }
      if (c === quote) { i += 1; break; }
      if (c === '\n') line += 1;
      buf += c; i += 1;
    }
    return { body: buf, startLine };
  };

  const skipTemplate = () => {              // i 指向反引号
    const startLine = line;
    i += 1;
    let buf = '';
    while (i < n) {
      const c = src[i];
      if (c === '\\') { buf += c + (src[i + 1] || ''); i += 2; continue; }
      if (c === '`') { i += 1; break; }
      if (c === '$' && src[i + 1] === '{') {
        i += 2;
        let depth = 1;
        while (i < n && depth > 0) {
          const d = src[i];
          if (d === '{') depth += 1;
          else if (d === '}') depth -= 1;
          else if (d === "'" || d === '"') { skipQuoted(d); continue; }
          else if (d === '`') { skipTemplate(); continue; }
          if (d === '\n') line += 1;
          if (depth > 0) i += 1;
        }
        i += 1;
        buf += `{${slot++}}`;
        continue;
      }
      if (c === '\n') line += 1;
      buf += c; i += 1;
    }
    return { body: buf, startLine };
  };

  let prev = '';
  while (i < n) {
    const c = src[i];
    if (c === '\n') { line += 1; prev = ''; i += 1; continue; }
    if (c === '/' && src[i + 1] === '/') { while (i < n && src[i] !== '\n') i += 1; continue; }
    if (c === '/' && src[i + 1] === '*') {
      i += 2;
      while (i < n && !(src[i] === '*' && src[i + 1] === '/')) { if (src[i] === '\n') line += 1; i += 1; }
      i += 2;
      continue;
    }
    // 正则字面量：/.../flags。不跳过的话，字符类里的引号会把扫描器带偏
    if (c === '/' && /^(|[([{,;:=!&|?+\-*%<>~^])$/.test(prev)) {
      i += 1;
      let inClass = false;
      while (i < n) {
        const d = src[i];
        if (d === '\\') { i += 2; continue; }
        if (d === '[') inClass = true;
        else if (d === ']') inClass = false;
        else if (d === '/' && !inClass) { i += 1; break; }
        else if (d === '\n') break;
        i += 1;
      }
      while (i < n && /[a-z]/i.test(src[i])) i += 1;
      prev = '/';
      continue;
    }
    if (c === "'" || c === '"') { out.push(skipQuoted(c)); prev = c; continue; }
    if (c === '`') { slot = 0; out.push(skipTemplate()); prev = '`'; continue; }
    if (!/\s/.test(c)) prev = c;
    i += 1;
  }
  return out;
}

/** 字面量 → 若干条可翻译文本 */
const unescape = (s) => s.replace(/\\(.)/g, (_, c) => (c === 'n' || c === 'r' || c === 't' ? ' ' : c));

function literalPieces(body) {
  if (!CJK.test(body)) return [];
  if (/<[a-z!/]/i.test(body)) return htmlPieces(unescape(body));
  const t = unescape(body).replace(/\s+/g, ' ').trim();
  if (!/[\u4e00-\u9fff]/.test(t)) return [];
  return [t];
}

function collect() {
  const keys = new Map();
  const add = (k, rel) => {
    if (!k) return;
    let e = keys.get(k);
    if (!e) keys.set(k, (e = { key: k, count: 0, files: new Set() }));
    e.count += 1;
    e.files.add(rel);
  };

  for (const file of walk(SRC)) {
    const rel = path.relative(ROOT, file).split(path.sep).join('/');
    const src = fs.readFileSync(file, 'utf8');
    if (file.endsWith('.html')) {
      for (const p of htmlPieces(src)) add(p, rel);
    } else {
      for (const lit of jsLiterals(src)) {
        for (const p of literalPieces(lit.body)) add(p, rel);
      }
    }
  }
  return [...keys.values()]
    .map((e) => ({ key: e.key, count: e.count, files: [...e.files].sort() }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
}

function main() {
  const list = collect();
  if (process.argv.includes('--check')) {
    const enPath = path.join(ROOT, 'src', 'i18n', 'en.json');
    const en = fs.existsSync(enPath) ? JSON.parse(fs.readFileSync(enPath, 'utf8')) : {};
    const missing = list.filter((e) => !en[e.key]);
    if (missing.length) {
      console.error(`缺 ${missing.length} 条译文：`);
      for (const m of missing.slice(0, 40)) console.error(`  ${m.key}   (${m.files[0]})`);
      process.exit(1);
    }
    console.log(`译文完整：${list.length} 条键`);
    return;
  }
  const out = path.join(ROOT, 'src', 'i18n', 'keys.json');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(list, null, 2) + '\n', 'utf8');
  console.log(`提取 ${list.length} 条唯一键 → ${path.relative(ROOT, out)}`);
  const byFile = {};
  for (const e of list) for (const f of e.files) byFile[f] = (byFile[f] || 0) + 1;
  for (const [f, n] of Object.entries(byFile).sort((a, b) => b[1] - a[1]).slice(0, 12)) {
    console.log(`  ${String(n).padStart(4)}  ${f}`);
  }
}

main();
