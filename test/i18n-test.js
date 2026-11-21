'use strict';
/**
 * 界面翻译（English-first）测试
 *
 * 三件事必须成立，否则英文界面会露馅：
 *   1. 词典校验：每条译文非空、占位符与键一一对应、没有源码里已不存在的孤儿键；
 *   2. 查表语义：精确命中、{n} 正则命中、翻不到时原样返回中文（回落而不是空屏）；
 *   3. 生成产物：src/ui/i18n-dict.js 与 src/i18n/en.json 一致（改完词典忘了编译会被这里抓住）。
 */

const fs = require('fs');
const path = require('path');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failed++;
    console.error(`  ✗ ${name}\n    ${e.message}`);
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || '断言失败');
}

const ROOT = path.join(__dirname, '..');
const I18N = require(path.join(ROOT, 'src/ui/i18n.js'));
const en = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/i18n/en.json'), 'utf8'));

// keys.json 是提取产物、不入库：CI 里是干净检出，先跑一遍提取再校验孤儿键。
const KEYS_FILE = path.join(ROOT, 'src', 'i18n', 'keys.json');
if (!fs.existsSync(KEYS_FILE)) {
  require('child_process').execFileSync(process.execPath, [path.join(ROOT, 'tools', 'i18n-extract.js')], {
    cwd: ROOT,
    stdio: 'ignore',
  });
}
const keys = JSON.parse(fs.readFileSync(KEYS_FILE, 'utf8')).map((e) => e.key);

const CJK = /[\u3400-\u4dbf\u4e00-\u9fff]/;
const slots = (s) => (String(s).match(/\{\d+\}/g) || []).length;

console.log('\n[界面翻译 · 词典]');

test('每条译文都非空', () => {
  const empty = Object.entries(en).filter(([, v]) => !String(v).trim());
  assert(empty.length === 0, `空译文 ${empty.length} 条：${empty.slice(0, 3).map(([k]) => k)}`);
});

test('键与值的 {n} 占位符一一对应', () => {
  const bad = Object.entries(en).filter(([k, v]) => slots(k) !== slots(v));
  assert(bad.length === 0, `占位符不匹配 ${bad.length} 条：${bad.slice(0, 3).map(([k]) => k)}`);
});

test('没有源码里已不存在的孤儿键', () => {
  const known = new Set(keys);
  const orphans = Object.keys(en).filter((k) => !known.has(k));
  assert(orphans.length === 0, `孤儿键 ${orphans.length} 条：${orphans.slice(0, 3)}`);
});

test('译文不是原样照抄（除语言名等专有名词）', () => {
  const SAME_OK = new Set(['日本語', '繁體中文', 'English（镜像原生）']);
  const same = Object.entries(en).filter(([k, v]) => k === v && !SAME_OK.has(k));
  assert(same.length === 0, `未翻译 ${same.length} 条：${same.slice(0, 3).map(([k]) => k)}`);
});

console.log('\n[界面翻译 · 查表]');

I18N.init({ dict: en, locale: 'en' });

test('精确命中', () => {
  assert(I18N.t('设置') === 'Settings', `实际：${I18N.t('设置')}`);
  assert(I18N.t('打开') === 'Open', `实际：${I18N.t('打开')}`);
});

test('前后空白不影响命中，且不丢空格', () => {
  assert(I18N.t('  设置 ') === 'Settings');
});

test('{n} 正则命中并回填', () => {
  assert(I18N.t('5 分钟前') === '5 min ago', `实际：${I18N.t('5 分钟前')}`);
  assert(I18N.t('3 个应用') === '3 apps', `实际：${I18N.t('3 个应用')}`);
});

test('翻不到时原样返回中文（回落，不空屏）', () => {
  const s = '这是一句词典里没有的话';
  assert(I18N.t(s) === s);
});

test('中文界面下不做任何替换', () => {
  I18N.init({ dict: en, locale: 'zh-CN' });
  assert(I18N.t('设置') === '设置');
  I18N.init({ dict: en, locale: 'en' });
});

test('英文内容不会被二次翻译', () => {
  assert(I18N.t('Settings') === 'Settings');
});

console.log('\n[界面翻译 · 生成产物]');

test('src/ui/i18n-dict.js 与 en.json 条数一致', () => {
  const src = fs.readFileSync(path.join(ROOT, 'src/ui/i18n-dict.js'), 'utf8');
  const count = (src.match(/^\s{2,6}"/gm) || []).length;
  assert(count === Object.keys(en).length, `产物 ${count} 条 / 源 ${Object.keys(en).length} 条，请运行 npm run i18n`);
});

test('产物里没有残留的中文键', () => {
  const src = fs.readFileSync(path.join(ROOT, 'src/ui/i18n-dict.js'), 'utf8');
  const body = src.slice(src.indexOf('dict: {'));
  const keysInFile = [...body.matchAll(/^\s{2,6}"([^"]+)":/gm)].map((m) => m[1]);
  const cjkKeys = keysInFile.filter((k) => CJK.test(k));
  assert(cjkKeys.length === keysInFile.length, '产物键应当全是中文原文（键即原文）');
});

console.log(`\n界面翻译测试：${passed} 通过 / ${failed} 失败\n`);
if (failed) process.exit(1);
