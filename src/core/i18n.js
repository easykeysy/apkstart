'use strict';
/**
 * 主进程侧翻译：复用渲染进程那份运行时（同一套「中文即键」查表与 {n} 正则），
 * 让原生对话框、托盘菜单、窗口标题与页面里的译文永远同源。
 *
 * 用法：启动时 setLocale(settings.ui.locale)，之后 t('...') 即可；
 * installHooks() 把 dialog / Menu 的入口包一层，历史代码里的 147 处中文
 * 提示不用逐个改也能翻到。
 */
const I18N = require('../ui/i18n.js');
const EN = require('../i18n/en.json');

let locale = 'en';

function setLocale(next) {
  locale = next === 'zh-CN' ? 'zh-CN' : 'en';
  I18N.init({ dict: EN, locale });
  return locale;
}

const t = (s) => I18N.t(s);

/** 递归翻译菜单模板里的 label / sublabel */
function translateTemplate(items) {
  if (!Array.isArray(items)) return items;
  for (const it of items) {
    if (!it || typeof it !== 'object') continue;
    if (typeof it.label === 'string') it.label = t(it.label);
    if (typeof it.sublabel === 'string') it.sublabel = t(it.sublabel);
    if (Array.isArray(it.submenu)) translateTemplate(it.submenu);
    else if (it.submenu && Array.isArray(it.submenu.items)) translateTemplate(it.submenu.items);
  }
  return items;
}

/**
 * 只在英文界面下包一层 Electron 入口。中文界面保持原样，
 * 这样 zh-CN 用户走的是上游那条一行未改的路径。
 */
function installHooks(electron) {
  const { dialog, Menu } = electron;
  if (!dialog || dialog.__apkstartI18n) return;
  dialog.__apkstartI18n = true;

  const box = dialog.showMessageBox.bind(dialog);
  dialog.showMessageBox = (...args) => {
    if (locale !== 'en') return box(...args);
    const src = args.length > 1 ? args[1] : args[0];
    if (!src || typeof src !== 'object') return box(...args);
    const o = { ...src };
    if (typeof o.message === 'string') o.message = t(o.message);
    if (typeof o.detail === 'string') o.detail = t(o.detail);
    if (typeof o.title === 'string') o.title = t(o.title);
    if (Array.isArray(o.buttons)) o.buttons = o.buttons.map((b) => t(b));
    return args.length > 1 ? box(args[0], o) : box(o);
  };

  const errBox = dialog.showErrorBox.bind(dialog);
  dialog.showErrorBox = (title, content) => (
    locale === 'en' ? errBox(t(title), t(content)) : errBox(title, content)
  );

  const build = Menu.buildFromTemplate.bind(Menu);
  Menu.buildFromTemplate = (template) => build(locale === 'en' ? translateTemplate(template) : template);
}

module.exports = { t, setLocale, installHooks, locale: () => locale };
