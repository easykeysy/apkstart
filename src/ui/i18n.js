'use strict';
/**
 * 界面翻译运行时（渲染进程，经典脚本，零依赖）。
 *
 * ── 「中文即键」──
 * 词典的键就是源码里那句中文本身：t('设置') → 'Settings'。好处是上游文案不动，
 * 词典缺一条也只是回落到中文，绝不会在界面上冒出 settings.title 这种键名。
 *
 * ── 两种落地方式 ──
 *   1. 静态文本：DOM 扫描器就地替换文本节点与 placeholder/title/aria-label/alt，
 *      所以 index.html / manual.html 里的中文不用加任何标记，也不改一个字的源码；
 *   2. 动态文本：MutationObserver 盯着新增节点与文字变化，模板字符串渲染出来的
 *      卡片、toast、对话框同样会被替换，不需要在 app.js 里逐个包 t()。
 *
 * ── 带变量的句子 ──
 * 提取器把模板字符串的 ${...} 记成 {0} {1}，这里据此生成锚定正则：
 * 键「{0} 分钟前」匹配「5 分钟前」，译文里的 {0} 用捕获组回填。
 *
 * ── 不翻译的地方 ──
 * script/style/textarea/pre/code 一律跳过（日志、包名、命令行不该被翻），
 * 任何带 data-i18n-skip 的子树也跳过 —— 应用名、路径这类用户数据会撞上
 * 同名的界面词（一个叫「设置」的 App 不该被显示成 Settings）。
 */
(function (root) {
  const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'PRE', 'CODE', 'NOSCRIPT', 'KBD', 'SAMP']);
  const ATTRS = ['placeholder', 'title', 'aria-label', 'alt'];
  const SPACE = /\s+/g;

  const norm = (s) => String(s).replace(SPACE, ' ').trim();

  function escapeRe(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  const I18N = {
    locale: 'zh-CN',
    dict: {},
    patterns: [],
    enabled: false,

    init(opts = {}) {
      this.dict = opts.dict || {};
      this.locale = opts.locale || 'zh-CN';
      this.enabled = this.locale !== 'zh-CN' && Object.keys(this.dict).length > 0;
      this.patterns = this.enabled ? this._buildPatterns() : [];
      return this;
    },

    _buildPatterns() {
      const out = [];
      for (const key of Object.keys(this.dict)) {
        if (!/\{\d+\}/.test(key)) continue;
        const parts = key.split(/\{\d+\}/);
        let src = '^';
        parts.forEach((p, i) => {
          src += escapeRe(p);
          if (i < parts.length - 1) src += '(.+?)';
        });
        src += '$';
        out.push({
          re: new RegExp(src),
          value: this.dict[key],
          order: [...key.matchAll(/\{(\d+)\}/g)].map((m) => Number(m[1])),
        });
      }
      // 长的先试，避免「{0} 个应用」抢在「{0} 个应用已安装」前面
      out.sort((a, b) => b.re.source.length - a.re.source.length);
      return out;
    },

    /** 翻译一句；翻不到就原样返回 */
    t(text) {
      if (!this.enabled || text == null) return text;
      const key = norm(text);
      if (!key) return text;
      const hit = this.dict[key];
      if (hit) return hit;
      for (const p of this.patterns) {
        const m = p.re.exec(key);
        if (!m) continue;
        const groups = {};
        p.order.forEach((slot, i) => { groups[slot] = m[i + 1]; });
        return p.value.replace(/\{(\d+)\}/g, (all, n) => (groups[n] != null ? groups[n] : all));
      }
      return text;
    },

    _skipped(el) {
      for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
        if (SKIP_TAGS.has(n.tagName)) return true;
        if (n.hasAttribute && n.hasAttribute('data-i18n-skip')) return true;
      }
      return false;
    },

    _text(node) {
      const raw = node.nodeValue;
      if (!raw || !raw.trim()) return;
      if (!/[\u3400-\u4dbf\u4e00-\u9fff]/.test(raw)) return;
      const out = this.t(raw);
      if (out !== raw) node.nodeValue = out;
    },

    _attrs(el) {
      for (const a of ATTRS) {
        const v = el.getAttribute && el.getAttribute(a);
        if (!v || !/[\u3400-\u4dbf\u4e00-\u9fff]/.test(v)) continue;
        const out = this.t(v);
        if (out !== v) el.setAttribute(a, out);
      }
    },

    /** 替换一棵子树（含自身属性） */
    apply(node) {
      if (!this.enabled || !node) return;
      const isEl = node.nodeType === 1;
      if (isEl && this._skipped(node)) return;
      if (node.nodeType === 3) { this._text(node); return; }
      if (!isEl && node.nodeType !== 9 && node.nodeType !== 11) return;
      if (isEl) this._attrs(node);
      const walk = (el) => {
        for (let n = el.firstChild; n; n = n.nextSibling) {
          if (n.nodeType === 3) this._text(n);
          else if (n.nodeType === 1) {
            if (this._skipped(n)) continue;
            this._attrs(n);
            walk(n);
          }
        }
      };
      walk(node);
    },

    /** 接上观察器，之后动态插入的内容也会被翻译 */
    watch(doc) {
      if (!this.enabled || !doc || !doc.body) return;
      this.apply(doc.body);
      const obs = new (root.MutationObserver || function () {})((records) => {
        for (const r of records) {
          if (r.type === 'characterData') this._text(r.target);
          else if (r.type === 'childList') {
            r.addedNodes.forEach((n) => this.apply(n));
          }
        }
      });
      obs.observe(doc.body, { childList: true, subtree: true, characterData: true });
      this._observer = obs;
    },

    boot() {
      const data = root.__APKSTART_I18N__ || {};
      const locale = root.__APKSTART_LOCALE__ || 'en';
      this.init({ dict: data.dict, locale });
      if (!this.enabled) return this;
      const doc = root.document;
      if (!doc) return this;
      if (doc.readyState === 'loading') {
        doc.addEventListener('DOMContentLoaded', () => this.watch(doc), { once: true });
      } else {
        this.watch(doc);
      }
      return this;
    },
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = I18N;
  if (root && root.document) root.i18n = I18N.boot();
})(typeof window !== 'undefined' ? window : globalThis);
