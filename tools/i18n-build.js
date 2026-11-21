'use strict';
/**
 * 词典编译器：src/i18n/en.json → src/ui/i18n-dict.js
 *
 * 运行时（渲染进程）是经典脚本，没有打包器，所以词典以「一份 JS 直接挂到 window」的形式发布，
 * 页面在 app.js 之前同步加载它，第一帧就是英文，不会先闪一下中文再替换。
 *
 * 编译前自校验，任何一条不合格就整体失败、不写产物：
 *   - 键必须出现在 keys.json 里（防止上游删改文案后留下孤儿译文）；
 *   - 值不能为空；
 *   - 键与值里的 {n} 占位符必须一一对应（否则 t() 会把 {1} 原样漏到界面上）。
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const EN = path.join(ROOT, 'src', 'i18n', 'en.json');
const KEYS = path.join(ROOT, 'src', 'i18n', 'keys.json');
const OUT = path.join(ROOT, 'src', 'ui', 'i18n-dict.js');

const SLOT = /\{\d+\}/g;
const slotsOf = (s) => (String(s).match(SLOT) || []).length;

function main() {
  const en = JSON.parse(fs.readFileSync(EN, 'utf8'));
  const keys = fs.existsSync(KEYS)
    ? JSON.parse(fs.readFileSync(KEYS, 'utf8')).map((e) => e.key)
    : null;

  const errors = [];
  const warnings = [];
  if (keys) {
    const known = new Set(keys);
    for (const k of Object.keys(en)) if (!known.has(k)) errors.push(`孤儿译文（键已不在源码里）：${k}`);
  }
  for (const [k, v] of Object.entries(en)) {
    if (typeof v !== 'string' || !v.trim()) errors.push(`空译文：${k}`);
    if (slotsOf(k) !== slotsOf(v)) errors.push(`占位符不匹配（键 ${slotsOf(k)} 个 / 值 ${slotsOf(v)} 个）：${k}`);
    if (v === k) warnings.push(`值与原句相同（等于没翻）：${k}`);
  }
  if (warnings.length) {
    console.warn(`提醒 ${warnings.length} 条（不阻断）：`);
    for (const w of warnings.slice(0, 10)) console.warn('  ' + w);
  }
  if (errors.length) {
    console.error(`词典校验失败（${errors.length} 条）：`);
    for (const e of errors.slice(0, 40)) console.error('  ' + e);
    process.exit(1);
  }

  const body = Object.keys(en).sort()
    .map((k) => `  ${JSON.stringify(k)}: ${JSON.stringify(en[k])}`)
    .join(',\n');
  const out = `/* 由 tools/i18n-build.js 生成，勿手改。源文件：src/i18n/en.json */
window.__APKSTART_I18N__ = {
  locale: 'en',
  dict: {
${body}
  },
};
`;
  fs.writeFileSync(OUT, out, 'utf8');
  const kb = (Buffer.byteLength(out) / 1024).toFixed(0);
  console.log(`词典已生成：${path.relative(ROOT, OUT)}（${Object.keys(en).length} 条，${kb} KB）`);
}

main();
