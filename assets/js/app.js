/* Soulframe Eternium Garden -- UI and routing.
 * Classic script so the page also works when opened directly from disk.
 */
(function () {
  'use strict';

  var DATA = window.SFData;
  var UI = window.SF_UI;
  var TEMPERS = window.SF_TEMPERS;
  var core = window.SFCore;

  var THEME_KEY = 'sf-eg-theme';
  var LANG_KEY = 'sf-eg-lang';
  var WORLD_LAYOUT_KEY = 'sf-eg-world-layout';
  var WORLD_WIDTH_KEY = 'sf-eg-world-layout-widths';
  var WORLD_WIDTHS = [4, 6, 8, 12];
  var SVG_NS = 'http://www.w3.org/2000/svg';

  var WORLD_MODULES = [
    { key: 'time', labelKey: 'world.time.title', min: 4, max: 8, preferred: 6 },
    { key: 'weather', labelKey: 'world.weather.title', min: 4, max: 8, preferred: 6 },
    { key: 'zenith', labelKey: 'world.zenith.title', min: 4, max: 12, preferred: 6 },
    { key: 'meeting', labelKey: 'world.meeting.title', min: 4, max: 12, preferred: 6 }
  ];
  var DEFAULT_WORLD_LAYOUT = WORLD_MODULES.map(function (module) { return module.key; });

  var main = document.getElementById('main');
  var langSwitch = document.getElementById('language-switch');
  var themeSwitch = document.getElementById('theme-switch');

  var state = {
    lang: 'zh',
    route: 'home',
    cleanup: null,
    tick: null
  };

  var str = {
    zh: {
      weekdays: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
      months: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
    },
    en: {
      weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    }
  };

  var PHASE_RANGES = ['06–14', '14–22', '22–06'];

  var ICONS = {
    search: '<circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.5-3.5"></path>',
    clock: '<circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path>',
    cloud: '<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"></path>',
    store: '<path d="M3 9.5 4.5 4h15L21 9.5"></path><path d="M4 9.5V20h16V9.5"></path><path d="M9 20v-6h6v6"></path><path d="M3 9.5h18"></path>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>',
    compass: '<circle cx="12" cy="12" r="9"></circle><path d="m16 8-2.5 5.5L8 16l2.5-5.5Z"></path>',
    leaf: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10Z"></path><path d="M2 21c0-3 1.9-5.4 5.1-6C9.5 14.5 12 13 13 12"></path>',
    hammer: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.1-3.1a6 6 0 0 1-7.9 8l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 8-7.9Z"></path>',
    package: '<path d="m7.5 4.3 9 5.2"></path><path d="M21 8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path><path d="m3.3 7 8.7 5 8.7-5"></path><path d="M12 22V12"></path>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"></rect><path d="M16 3v4M8 3v4M3 11h18"></path>',
    arrow: '<path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path>',
    info: '<circle cx="12" cy="12" r="9"></circle><path d="M12 11v5M12 8h.01"></path>',
    layout: '<rect x="3" y="4" width="18" height="5" rx="1.5"></rect><rect x="3" y="15" width="11" height="5" rx="1.5"></rect><path d="M18 17h3M8 6h8"></path>',
    drag: '<path d="M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01" stroke-width="3" stroke-linecap="round"></path>',
    sun: '<circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4"></path>',
    wind: '<path d="M12.8 19.6A2 2 0 1 0 14 16H2"></path><path d="M17.5 8a2.5 2.5 0 1 1 2 4H2"></path><path d="M9.8 4.4A2 2 0 1 1 11 8H2"></path>',
    'cloud-sun': '<path d="M12 2v2M4.9 4.9l1.4 1.4M20 12h2M19.1 4.9l-1.4 1.4"></path><path d="M15.9 12.6a4 4 0 0 0-5.9-4.1"></path><path d="M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z"></path>',
    cloudy: '<path d="M17.5 21H9a7 7 0 1 1 6.7-9h1.8a4.5 4.5 0 1 1 0 9Z"></path><path d="M22 10a3 3 0 0 0-3-3h-2.2a5.5 5.5 0 0 0-10.7.5"></path>',
    'cloud-sun-rain': '<path d="M12 2v2M4.9 4.9l1.4 1.4M20 12h2M19.1 4.9l-1.4 1.4"></path><path d="M15.9 12.6a4 4 0 0 0-5.9-4.1"></path><path d="M3 20a5 5 0 1 1 8.9-4H13a3 3 0 0 1 2 5.2"></path><path d="M11 20v2M7 19v2"></path>',
    'cloud-rain-wind': '<path d="M4 14.9A7 7 0 1 1 15.7 8h1.8a4.5 4.5 0 0 1 2.5 8.2"></path><path d="m9.2 22 3-7"></path><path d="m9 13-3 7"></path><path d="m17 13-3 7"></path>',
    'cloud-lightning': '<path d="M6 16.3A7 7 0 1 1 15.7 8h1.8a4.5 4.5 0 0 1 .5 9"></path><path d="m13 12-3 5h4l-3 5"></path>'
  };

  // Official ancestor portraits extracted from the Soulframe cache.
  // Animal portraits are full-body Pacts art; the four human portraits are
  // transparent half-body renders. Dale Seer has no portrait in the current
  // build, so his avatar is a user-supplied wallpaper crop.
  var PORTRAIT_DIR = 'assets/img/ancestors/';
  var PORTRAITS = {
    'Garren Rood': { stem: 'garren-rood', ext: 'png', fit: 'contain' },
    'Bromius': { stem: 'bromius', ext: 'png', fit: 'contain' },
    'Orengall': { stem: 'orengall', ext: 'png', fit: 'contain' },
    'Dale Seer': { stem: 'dale-seer', ext: 'png', fit: 'cover' },
    'Zenith': { stem: 'zenith', ext: 'png', fit: 'cover' },
    'Tuvalkane': { stem: 'tuvalkane', ext: 'png', fit: 'cover' },
    'Verminia': { stem: 'verminia', ext: 'png', fit: 'cover' },
    'Orlick': { stem: 'orlick', ext: 'png', fit: 'cover' }
  };

  function readStorage(key) {
    try { return window.localStorage.getItem(key); } catch (error) { return null; }
  }

  function writeStorage(key, value) {
    try {
      if (value == null) window.localStorage.removeItem(key);
      else window.localStorage.setItem(key, value);
    } catch (error) { /* private mode / disabled storage */ }
  }

  function isKnownWorldModule(key) {
    for (var i = 0; i < WORLD_MODULES.length; i++) {
      if (WORLD_MODULES[i].key === key) return true;
    }
    return false;
  }

  function loadWorldLayout() {
    var parsed = null;
    try { parsed = JSON.parse(readStorage(WORLD_LAYOUT_KEY) || 'null'); }
    catch (error) { parsed = null; }
    if (!Array.isArray(parsed)) return DEFAULT_WORLD_LAYOUT.slice();
    var order = [];
    for (var i = 0; i < parsed.length; i++) {
      var key = parsed[i];
      if (isKnownWorldModule(key) && order.indexOf(key) === -1) order.push(key);
    }
    for (var j = 0; j < DEFAULT_WORLD_LAYOUT.length; j++) {
      var fallback = DEFAULT_WORLD_LAYOUT[j];
      if (order.indexOf(fallback) === -1) order.push(fallback);
    }
    return order;
  }

  function saveWorldLayout(order) {
    writeStorage(WORLD_LAYOUT_KEY, JSON.stringify(order));
  }

  function worldModuleByKey(key) {
    for (var i = 0; i < WORLD_MODULES.length; i++) {
      if (WORLD_MODULES[i].key === key) return WORLD_MODULES[i];
    }
    return null;
  }

  function supportedWorldWidths(module) {
    var widths = [];
    for (var i = 0; i < WORLD_WIDTHS.length; i++) {
      if (WORLD_WIDTHS[i] >= module.min && WORLD_WIDTHS[i] <= module.max) {
        widths.push(WORLD_WIDTHS[i]);
      }
    }
    return widths;
  }

  function loadWorldWidths() {
    var parsed = null;
    try { parsed = JSON.parse(readStorage(WORLD_WIDTH_KEY) || 'null'); }
    catch (error) { parsed = null; }
    if (!parsed || typeof parsed !== 'object') return {};
    var widths = {};
    for (var key in parsed) {
      if (!Object.prototype.hasOwnProperty.call(parsed, key)) continue;
      var module = worldModuleByKey(key);
      var value = parsed[key];
      if (!module || WORLD_WIDTHS.indexOf(value) === -1) continue;
      if (value < module.min || value > module.max) continue;
      widths[key] = value;
    }
    return widths;
  }

  function saveWorldWidths(widths) {
    writeStorage(WORLD_WIDTH_KEY, JSON.stringify(widths));
  }

  function queryParam(name) {
    var match = new RegExp('[?&]' + name + '=([^&]+)').exec(window.location.search);
    if (!match) return '';
    try { return decodeURIComponent(match[1]); } catch (error) { return ''; }
  }

  function removeQueryParam(name) {
    if (!window.history || typeof window.history.replaceState !== 'function') return;
    var pairs = window.location.search.replace(/^\?/, '').split('&');
    var kept = [];
    for (var i = 0; i < pairs.length; i++) {
      if (!pairs[i]) continue;
      if (pairs[i].split('=')[0] === name) continue;
      kept.push(pairs[i]);
    }
    var search = kept.length ? '?' + kept.join('&') : '';
    try {
      window.history.replaceState(null, '', window.location.pathname + search + window.location.hash);
    } catch (error) { /* file:// or restricted history */ }
  }

  function detectLang() {
    var fromQuery = queryParam('lang');
    if (fromQuery === 'zh' || fromQuery === 'en') return fromQuery;
    var saved = readStorage(LANG_KEY);
    if (saved === 'zh' || saved === 'en') return saved;
    var langs = navigator.languages || [navigator.language || navigator.userLanguage || 'zh'];
    for (var i = 0; i < langs.length; i++) {
      if (String(langs[i]).toLowerCase().indexOf('zh') === 0) return 'zh';
    }
    return 'en';
  }

  function t(key, vars) {
    var dict = UI[state.lang] || UI.en;
    var value = dict[key];
    if (value == null) value = UI.en[key];
    if (value == null) value = key;
    if (vars) {
      value = value.replace(/\{(\w+)\}/g, function (match, name) {
        return vars[name] != null ? String(vars[name]) : match;
      });
    }
    return value;
  }

  function locPhaseDeity(phase) {
    return state.lang === 'zh' ? phase.deityZh : phase.deityEn;
  }

  function locPhaseMessage(phase) {
    return state.lang === 'zh' ? phase.messageZh : phase.messageEn;
  }

  function locCharacter(name) {
    var entry = DATA.characters[name];
    return state.lang === 'zh' && entry && entry.zh ? entry.zh : name;
  }

  function locWeather(type) {
    return state.lang === 'zh' ? type.zh : type.en;
  }

  function locTier(tier) {
    var entry = DATA.weather.tiers[tier];
    return entry ? (state.lang === 'zh' ? entry.zh : entry.en) : tier;
  }

  function locEffect(effect) {
    return state.lang === 'zh' ? effect.zh : effect.en;
  }

  function pad2(value) {
    return value < 10 ? '0' + value : String(value);
  }

  function formatTime(ms) {
    var date = new Date(ms);
    return pad2(date.getHours()) + ':' + pad2(date.getMinutes());
  }

  function formatClockTime(ms) {
    var date = new Date(ms);
    return pad2(date.getHours()) + ':' + pad2(date.getMinutes()) + ':' + pad2(date.getSeconds());
  }

  function formatUtcClock(ms) {
    var date = new Date(ms);
    return pad2(date.getUTCHours()) + ':' + pad2(date.getUTCMinutes()) + ':' + pad2(date.getUTCSeconds());
  }

  function formatGameTime(hour) {
    var whole = Math.floor(hour);
    var minutes = Math.floor((hour - whole) * 60);
    return pad2(whole) + ':' + pad2(minutes);
  }

  function dayBarPosition(hour) {
    return (((hour - 6 + 24) % 24) / 24) * 100;
  }

  function formatCountdown(ms) {
    var total = Math.max(0, Math.ceil(ms / 1000));
    var days = Math.floor(total / 86400);
    var hours = Math.floor((total % 86400) / 3600);
    var minutes = Math.floor((total % 3600) / 60);
    var seconds = total % 60;
    var clock = pad2(hours) + ':' + pad2(minutes) + ':' + pad2(seconds);
    if (days > 0) {
      return state.lang === 'zh' ? days + ' 天 ' + clock : days + 'd ' + clock;
    }
    return clock;
  }

  function formatDuration(ms) {
    var minutes = Math.max(1, Math.round(ms / 60000));
    if (minutes < 60) return minutes + ' ' + t('common.minutes');
    var hours = Math.floor(minutes / 60);
    var rest = minutes % 60;
    return hours + ' ' + t('common.hours') + (rest ? ' ' + rest + ' ' + t('common.minutes') : '');
  }

  function formatMinuteSecond(ms) {
    var total = Math.max(0, Math.ceil(ms / 1000));
    var minutes = Math.floor(total / 60);
    var seconds = total % 60;
    return pad2(minutes) + ':' + pad2(seconds);
  }

  function dateLabel(ms, withWeekday) {
    var date = new Date(ms);
    var table = str[state.lang];
    var datePart = state.lang === 'zh'
      ? (date.getMonth() + 1) + '月' + date.getDate() + '日'
      : table.months[date.getMonth()] + ' ' + date.getDate();
    if (!withWeekday) return datePart;
    var weekday = table.weekdays[date.getDay()];
    return state.lang === 'zh' ? datePart + ' ' + weekday : weekday + ', ' + datePart;
  }

  function formatReturn(days) {
    if (days == null) return t('world.meeting.returnsNone');
    if (days === 1) return t('world.meeting.returnsTomorrow');
    return t('world.meeting.returnsDays', { n: days });
  }

  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function appendChildren(node, children) {
    if (children == null) return;
    if (typeof children === 'string' || typeof children === 'number') {
      node.appendChild(document.createTextNode(String(children)));
      return;
    }
    if (children.nodeType) {
      node.appendChild(children);
      return;
    }
    if (Object.prototype.toString.call(children) === '[object Array]') {
      for (var i = 0; i < children.length; i++) appendChildren(node, children[i]);
    }
  }

  function el(tag, options, children) {
    var node = document.createElement(tag);
    options = options || {};
    for (var key in options) {
      if (!Object.prototype.hasOwnProperty.call(options, key)) continue;
      var value = options[key];
      if (value == null || value === false) continue;
      if (key === 'class') node.className = value;
      else if (key === 'text') node.textContent = value;
      else if (key === 'style') {
        for (var prop in value) {
          if (Object.prototype.hasOwnProperty.call(value, prop)) node.style.setProperty(prop, value[prop]);
        }
      } else if (key.indexOf('on') === 0 && typeof value === 'function') {
        node.addEventListener(key.slice(2).toLowerCase(), value);
      } else {
        node.setAttribute(key, value === true ? '' : value);
      }
    }
    appendChildren(node, children);
    return node;
  }

  function icon(name, className) {
    var svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('class', 'icon' + (className ? ' ' + className : ''));
    svg.innerHTML = ICONS[name] || ICONS.info;
    return svg;
  }

  function portrait(name) {
    var item = PORTRAITS[name];
    if (!item) {
      return el('span', {
        class: 'avatar__art avatar__art--fallback',
        text: name ? name.charAt(0) : '?'
      });
    }
    var file = PORTRAIT_DIR + item.stem;
    return el('img', {
      class: 'avatar__art avatar__art--' + item.fit,
      src: file + '-256.' + item.ext,
      srcset: file + '-128.' + item.ext + ' 128w, ' + file + '-256.' + item.ext + ' 256w',
      sizes: '52px',
      width: 52,
      height: 52,
      alt: '',
      loading: 'lazy',
      decoding: 'async'
    });
  }

  function chip(text, className) {
    return el('span', { class: 'chip' + (className ? ' ' + className : '') }, text);
  }

  function cardHead(iconName, title, sub, sideLabel, sideValue, titleId) {
    var titleNode = el('h2', { class: 'card__title', id: titleId || null }, [
      icon(iconName),
      document.createTextNode(title)
    ]);
    var left = el('div', {}, [titleNode]);
    if (sub) left.appendChild(el('p', { class: 'card__sub', text: sub }));
    var right = null;
    if (sideValue) {
      right = el('div', { class: 'card__side' }, [
        el('span', { text: sideLabel }),
        sideValue
      ]);
    }
    return el('div', { class: 'card__head' }, [left, right]);
  }

  function card(id, titleId, className, children) {
    return el('section', {
      class: 'card ' + className,
      id: id,
      'aria-labelledby': titleId
    }, children);
  }

  // ---------------------------------------------------------------
  // Static translation and theme
  // ---------------------------------------------------------------

  function applyStaticTranslations() {
    var nodes = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < nodes.length; i++) {
      var key = nodes[i].getAttribute('data-i18n');
      nodes[i].textContent = t(key);
    }
    var titleNodes = document.querySelectorAll('[data-i18n-title]');
    for (var ti = 0; ti < titleNodes.length; ti++) {
      titleNodes[ti].setAttribute('title', t(titleNodes[ti].getAttribute('data-i18n-title')));
    }
    var ariaNodes = document.querySelectorAll('[data-i18n-aria-label]');
    for (var ai = 0; ai < ariaNodes.length; ai++) {
      ariaNodes[ai].setAttribute('aria-label', t(ariaNodes[ai].getAttribute('data-i18n-aria-label')));
    }
    document.documentElement.lang = state.lang === 'zh' ? 'zh-CN' : 'en';
    syncControls();
    var brand = document.querySelector('.brand');
    if (brand) brand.setAttribute('aria-label', t('app.name'));
    var nav = document.getElementById('site-nav');
    if (nav) nav.setAttribute('aria-label', t('nav.label'));
  }

  function syncLanguageSwitch() {
    if (!langSwitch) return;
    var buttons = langSwitch.querySelectorAll('[data-lang]');
    for (var i = 0; i < buttons.length; i++) {
      var active = buttons[i].getAttribute('data-lang') === state.lang;
      buttons[i].classList.toggle('is-active', active);
      buttons[i].setAttribute('aria-pressed', String(active));
    }
  }

  function syncThemeSwitch(theme) {
    if (!themeSwitch) return;
    var buttons = themeSwitch.querySelectorAll('[data-theme]');
    for (var i = 0; i < buttons.length; i++) {
      var active = buttons[i].getAttribute('data-theme') === theme;
      buttons[i].classList.toggle('is-active', active);
      buttons[i].setAttribute('aria-pressed', String(active));
    }
  }

  function syncControls() {
    syncLanguageSwitch();
    syncThemeSwitch(currentTheme());
  }

  function currentTheme() {
    var fromQuery = queryParam('theme');
    if (fromQuery === 'light' || fromQuery === 'dark') return fromQuery;
    var value = readStorage(THEME_KEY);
    return value === 'light' || value === 'dark' ? value : 'auto';
  }

  function applyTheme(theme, persist) {
    if (theme !== 'light' && theme !== 'dark') theme = 'auto';
    if (theme === 'auto') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', theme);
    syncThemeSwitch(theme);
    var meta = document.querySelector('meta[name="color-scheme"]');
    if (meta) meta.setAttribute('content', theme === 'auto' ? 'light dark' : theme);
    if (persist !== false) {
      if (theme === 'auto') writeStorage(THEME_KEY, null);
      else writeStorage(THEME_KEY, theme);
    }
  }

  // ---------------------------------------------------------------
  // Router
  // ---------------------------------------------------------------

  function parseHash() {
    var raw = window.location.hash.replace(/^#\/?/, '');
    var parts = raw.split('/');
    return {
      page: parts[0] || 'home',
      section: parts[1] || ''
    };
  }

  function updateNav(page) {
    var links = document.querySelectorAll('.nav-list a');
    for (var i = 0; i < links.length; i++) {
      if (links[i].getAttribute('data-route') === page) links[i].setAttribute('aria-current', 'page');
      else links[i].removeAttribute('aria-current');
    }
  }

  function setMeta(page) {
    var brand = t('app.name');
    var title;
    var description;
    if (page === 'home') {
      title = brand;
      description = t('app.description');
    } else if (page === 'live') {
      title = t('world.title') + ' · ' + brand;
      description = t('app.description');
    } else if (page === 'temper') {
      title = t('temper.title') + ' · ' + brand;
      description = t('temper.lede');
    } else {
      title = t('notFound.title') + ' · ' + brand;
      description = t('notFound.body');
    }
    document.title = title;
    var meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', description);
  }

  function focusMain() {
    if (!main) return;
    try { main.focus({ preventScroll: true }); } catch (error) { try { main.focus(); } catch (ignored) {} }
  }

  function scrollToSection(section) {
    if (!section) return;
    var target = document.getElementById(section);
    if (!target) return;
    try { target.scrollIntoView({ block: 'start', behavior: 'auto' }); }
    catch (error) { try { target.scrollIntoView(); } catch (ignored) {} }
  }

  function stopPage() {
    if (state.cleanup) {
      try { state.cleanup(); } catch (error) { /* ignore */ }
      state.cleanup = null;
    }
    state.tick = null;
  }

  function renderRoute(options) {
    options = options || {};
    stopPage();

    var route = parseHash();
    state.route = route.page;
    var node;

    if (route.page === 'home') {
      node = renderHome();
    } else if (route.page === 'live') {
      var page = renderWorld();
      node = page.node;
      state.cleanup = page.cleanup;
      state.tick = page.tick;
    } else if (route.page === 'temper') {
      node = renderTemper();
    } else {
      state.route = 'notfound';
      node = renderNotFound();
    }

    clear(main);
    main.appendChild(node);
    if (page && page.layout) page.layout();
    updateNav(state.route);
    setMeta(state.route);

    if (options.focus !== false) focusMain();
    if (!options.keepScroll) {
      if (route.section && state.route === 'live') {
        window.setTimeout(function () { scrollToSection(route.section); }, 0);
      } else {
        try { window.scrollTo(0, 0); } catch (error) { /* ignore */ }
      }
    }
  }

  // ---------------------------------------------------------------
  // Home
  // ---------------------------------------------------------------

  var TOOLS = [
    {
      id: 'live',
      route: '#/live',
      icon: 'compass',
      nameKey: 'home.tool.world.name',
      descKey: 'home.tool.world.desc',
      available: true,
      keywords: [
        '世界状态', '世界', '时间', '天气', '泽尼斯', '会面', '商店', '密德拉',
        'live', 'state', 'time', 'weather', 'zenith', 'meeting', 'wares', 'midrath'
      ]
    },
    {
      id: 'temper',
      route: '#/temper',
      icon: 'hammer',
      nameKey: 'home.tool.temper.name',
      descKey: 'home.tool.temper.desc',
      available: true,
      keywords: [
        '淬炼', '武器', '词条', '派系', '数值', '效果',
        'temper', 'tempers', 'weapon', 'origin', 'effect', 'stats'
      ]
    }
  ];

  var BILIBILI_ICON =
    '<svg viewBox="0 0 28 24" width="20" height="17" aria-hidden="true" focusable="false">' +
      '<line x1="8" y1="2" x2="11.2" y2="6.4" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>' +
      '<line x1="20" y1="2" x2="16.8" y2="6.4" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>' +
      '<rect x="3" y="6.2" width="22" height="15.6" rx="5.5" fill="none" stroke="currentColor" stroke-width="2.2"/>' +
      '<rect x="9.4" y="11" width="2.7" height="6" rx="1.35" fill="currentColor"/>' +
      '<rect x="15.9" y="11" width="2.7" height="6" rx="1.35" fill="currentColor"/>' +
    '</svg>';

  var DOUYIN_ICON =
    '<svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true" focusable="false">' +
      '<path fill="currentColor" d="M16.6 3c.4 2.2 1.9 3.8 4.1 4v3.1c-1.6 0-3-.5-4.1-1.4v6.4c0 3.4-2.7 6-6 6s-6-2.6-6-6 2.7-6 6-6c.34 0 .67.03 1 .1v3.3c-.31-.1-.65-.16-1-.16-1.6 0-2.9 1.3-2.9 2.9s1.3 2.9 2.9 2.9 2.9-1.3 2.9-2.9V3h3.1z"/>' +
    '</svg>';

  var GITHUB_ICON =
    '<svg viewBox="0 0 98 96" width="19" height="19" aria-hidden="true" focusable="false">' +
      '<path fill="currentColor" d="M41.4395 69.3848C28.8066 67.8535 19.9062 58.7617 19.9062 46.9902C19.9062 42.2051 21.6289 37.0371 24.5 33.5918C23.2559 30.4336 23.4473 23.7344 24.8828 20.959C28.7109 20.4805 33.8789 22.4902 36.9414 25.2656C40.5781 24.1172 44.4062 23.543 49.0957 23.543C53.7852 23.543 57.6133 24.1172 61.0586 25.1699C64.0254 22.4902 69.2891 20.4805 73.1172 20.959C74.457 23.543 74.6484 30.2422 73.4043 33.4961C76.4668 37.1328 78.0937 42.0137 78.0937 46.9902C78.0937 58.7617 69.1934 67.6621 56.3691 69.2891C59.623 71.3945 61.8242 75.9883 61.8242 81.252V91.2051C61.8242 94.0762 64.2168 95.7031 67.0879 94.5547C84.4102 87.9512 98 70.6289 98 49.1914C98 22.1074 75.9883 0 48.9043 0C21.8203 0 0 22.1074 0 49.1914C0 70.4375 13.4941 88.0469 31.6777 94.6504C34.2617 95.6074 36.75 93.8848 36.75 91.3008V83.6445C35.4102 84.2188 33.6875 84.6016 32.1562 84.6016C25.8398 84.6016 22.1074 81.1562 19.4277 74.7441C18.375 72.1602 17.2266 70.6289 15.0254 70.3418C13.877 70.2461 13.4941 69.7676 13.4941 69.1934C13.4941 68.0449 15.4082 67.1836 17.3223 67.1836C20.0977 67.1836 22.4902 68.9062 24.9785 72.4473C26.8926 75.2227 28.9023 76.4668 31.2949 76.4668C33.6875 76.4668 35.2187 75.6055 37.4199 73.4043C39.0469 71.7773 40.291 70.3418 41.4395 69.3848Z"/>' +
    '</svg>';

  var EMAIL_ICON =
    '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" aria-hidden="true" focusable="false">' +
      '<rect x="3" y="5" width="18" height="14" rx="2.5" stroke="currentColor" stroke-width="1.8"/>' +
      '<path d="m4 7 8 6 8-6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>' +
    '</svg>';

  function homeSocialLink(href, label, markup, external) {
    var link = el('a', {
      class: 'home-social-link',
      href: href,
      target: external === false ? null : '_blank',
      rel: external === false ? null : 'noopener noreferrer',
      title: label,
      'aria-label': label
    });
    link.innerHTML = markup;
    return link;
  }

  function compactText(value) {
    var text = String(value || '');
    return (text.normalize ? text.normalize('NFKC') : text).toLowerCase();
  }

  function toolCard(tool) {
    return el('a', {
      class: 'tool-card tool-card--available',
      href: tool.route,
      'data-search': compactText(
        t(tool.nameKey) + ' ' + t(tool.descKey) + ' ' + tool.keywords.join(' ') + ' ' + tool.id
      )
    }, [
      el('span', { class: 'tool-card__icon' }, [icon(tool.icon, 'icon--large')]),
      el('span', { class: 'tool-card__title', text: t(tool.nameKey) })
    ]);
  }

  function renderHome() {
    var title = el('h1', { id: 'home-title', text: t('app.name') });
    var social = el('div', { class: 'home-social', role: 'group', 'aria-label': t('social.label') }, [
      homeSocialLink('https://space.bilibili.com/16730771', t('social.bilibili'), BILIBILI_ICON),
      homeSocialLink('https://www.douyin.com/user/MS4wLjABAAAAFIQ6-Ww8fODvrsOR2oFTtegpwDnpVq_PKHIUbxkvFSE', t('social.douyin'), DOUYIN_ICON),
      homeSocialLink('https://github.com/zjm960929/soulframe-eternium-garden', t('social.github'), GITHUB_ICON),
      homeSocialLink('mailto:zjm960929@outlook.com', t('social.email'), EMAIL_ICON, false)
    ]);

    var input = el('input', {
      id: 'home-search',
      class: 'home-search__input',
      type: 'search',
      name: 'q',
      autocomplete: 'off',
      spellcheck: 'false',
      enterkeyhint: 'search'
    });
    var clearButton = el('button', {
      class: 'home-search__clear',
      type: 'button',
      text: '×',
      'aria-label': t('home.searchClear'),
      hidden: true
    });
    var form = el('form', {
      class: 'home-search',
      onSubmit: function (event) {
        event.preventDefault();
        var first = grid.querySelector('a.tool-card:not([hidden])');
        if (first) window.location.hash = first.getAttribute('href').replace(/^#/, '');
      }
    }, [
      el('label', { class: 'visually-hidden', for: 'home-search', text: t('home.searchLabel') }),
      icon('search', 'home-search__icon'),
      input,
      clearButton
    ]);
    var searchRegion = el('search', { class: 'home-search-region' }, [form]);

    var cards = [];
    var moreTitle = t('home.moreTitle');
    for (var i = 0; i < TOOLS.length; i++) cards.push(toolCard(TOOLS[i]));
    cards.push(el('div', {
      class: 'tool-card tool-card--more',
      'data-search': compactText(moreTitle + ' more tools development 更多功能开发中')
    }, [
      el('span', { class: 'tool-card__icon' }, [icon('leaf', 'icon--large')]),
      el('span', { class: 'tool-card__title', text: moreTitle })
    ]));
    var grid = el('div', { class: 'tool-grid', id: 'tool-grid' }, cards);
    var empty = el('p', { class: 'home-empty', role: 'status', text: t('home.noResults'), hidden: true });

    function applyFilter() {
      var query = compactText(input.value.trim());
      var visible = 0;
      for (var c = 0; c < cards.length; c++) {
        var card = cards[c];
        var match = !query || (card.getAttribute('data-search') || '').indexOf(query) !== -1;
        card.hidden = !match;
        if (match) visible += 1;
      }
      empty.hidden = visible !== 0;
      clearButton.hidden = query.length === 0;
    }

    input.addEventListener('input', applyFilter);
    clearButton.addEventListener('click', function () {
      input.value = '';
      applyFilter();
      input.focus();
    });
    input.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        input.value = '';
        applyFilter();
        input.focus();
      }
    });

    var onKeydown = function (event) {
      var tag = document.activeElement && document.activeElement.tagName;
      if (event.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
        event.preventDefault();
        input.focus();
      }
    };
    document.addEventListener('keydown', onKeydown);
    state.cleanup = function () { document.removeEventListener('keydown', onKeydown); };

    var hero = el('section', { class: 'home-hero', 'aria-labelledby': 'home-title' }, [
      title,
      social,
      searchRegion
    ]);

    grid.appendChild(empty);
    return el('div', { class: 'home' }, [hero, grid]);
  }

  // ---------------------------------------------------------------
  // Not found
  // ---------------------------------------------------------------

  function renderNotFound() {
    return el('div', {}, [
      el('header', { class: 'page-head' }, [
        el('p', { class: 'eyebrow', text: '404' }),
        el('h1', { text: t('notFound.title') }),
        el('p', { class: 'lede', text: t('notFound.body') })
      ]),
      el('p', {}, [
        el('a', { href: '#/', text: t('notFound.back') })
      ])
    ]);
  }

  // ---------------------------------------------------------------
  // World state: data helpers
  // ---------------------------------------------------------------

  function computeWeather(now) {
    try {
      var seconds = Math.floor(now / 1000);
      var id = core.weatherAt(seconds);
      if (!DATA.weather.types[id]) return null;
      return { id: id, periods: core.forecastAt(now, 4) };
    } catch (error) {
      return null;
    }
  }

  function renderEffectTags(tags, type) {
    clear(tags);
    if (!type.effects.length) {
      tags.appendChild(el('span', { class: 'tag tag--muted', text: t('world.weather.noEffects') }));
      return;
    }
    for (var i = 0; i < type.effects.length; i++) {
      var effect = type.effects[i];
      var def = DATA.weather.effects[effect.id];
      var text = (def ? locEffect(def) : effect.id) + ' · ' +
        t(effect.when === 'during' ? 'world.weather.during' : 'world.weather.after');
      if (effect.chance) text += ' · ' + t('world.weather.chance', { n: Math.round(effect.chance * 100) });
      tags.appendChild(el('span', { class: 'tag tag--accent', text: text }));
    }
  }

  function appendForecastRow(container, period) {
    var type = DATA.weather.types[period.id];
    if (!type) return;
    container.appendChild(el('div', { class: 'forecast__row' }, [
      el('span', { class: 'forecast__icon' }, [icon(type.icon)]),
      el('div', { class: 'forecast__name' }, [
        document.createTextNode(locWeather(type)),
        el('span', { class: 'forecast__sub', text: formatDuration(period.end - period.start) })
      ]),
      el('span', { class: 'forecast__when', text: formatTime(period.start) })
    ]));
  }

  function fillWeather(refs, now) {
    clear(refs.iconWrap);
    clear(refs.name);
    clear(refs.meta);
    clear(refs.tags);
    clear(refs.forecast);

    if (!refs.snapshot) {
      refs.iconWrap.appendChild(icon('cloud'));
      refs.name.textContent = t('world.weather.unavailable');
      refs.meta.textContent = '';
      refs.endStrong.textContent = '—';
      refs.countdownStrong.textContent = '—';
      return;
    }

    var snapshot = refs.snapshot;
    var type = DATA.weather.types[snapshot.id];
    var current = snapshot.periods[0];
    refs.iconWrap.appendChild(icon(type.icon));
    refs.name.textContent = locWeather(type);
    refs.meta.textContent = t('world.weather.tier') + (state.lang === 'zh' ? '：' : ': ') + locTier(type.tier);
    refs.endStrong.textContent = formatTime(current.end);
    renderEffectTags(refs.tags, type);

    var upcoming = snapshot.periods.slice(1, 5);
    for (var i = 0; i < upcoming.length; i++) appendForecastRow(refs.forecast, upcoming[i]);
    refs.countdownStrong.textContent = formatCountdown(current.end - now);
  }

  // ---------------------------------------------------------------
  // World state: cards
  // ---------------------------------------------------------------

  function buildTimeCard(clock, refs) {
    var phase = DATA.phases[clock.phase];

    var remaining = el('strong', { class: 'countdown', text: formatMinuteSecond(clock.remaining * 1000) });
    var head = cardHead(
      'clock', t('world.time.title'), null,
      t('world.time.endsIn'), remaining, 'time-title'
    );

    var phaseName = el('div', { class: 'phase-name', text: locPhaseMessage(phase) });
    var gameTime = el('span', { text: formatGameTime(clock.hour) });
    var gameClock = el('div', { class: 'game-clock' }, [
      gameTime,
      el('small', { text: t('world.time.gameClock') })
    ]);

    var segments = [];
    var bar = el('div', { class: 'daybar', 'aria-hidden': 'true' });
    for (var i = 0; i < DATA.phases.length; i++) {
      var segment = el('div', {
        class: 'daybar__seg' + (i === clock.phase ? ' is-active' : '')
      }, [
        el('b', { text: locPhaseDeity(DATA.phases[i]) }),
        el('span', { text: PHASE_RANGES[i] })
      ]);
      segments.push(segment);
      bar.appendChild(segment);
    }
    var marker = el('span', { class: 'daybar__marker' });
    marker.style.setProperty('--marker', dayBarPosition(clock.hour).toFixed(2) + '%');
    bar.appendChild(marker);

    var node = card('time', 'time-title', 'card--time', [
      head,
      el('div', { class: 'time-top' }, [
        el('div', {}, [phaseName, gameClock]),
        bar
      ])
    ]);

    refs.time = {
      phaseName: phaseName,
      gameTime: gameTime,
      remaining: remaining,
      marker: marker,
      segments: segments
    };
    return node;
  }

  function buildWeatherCard(now, refs) {
    var snapshot = computeWeather(now);
    var endStrong = el('strong', { class: 'countdown', text: snapshot ? formatTime(snapshot.periods[0].end) : '—' });
    var head = cardHead(
      'cloud', t('world.weather.title'), null,
      t('world.weather.endsAt'), endStrong, 'weather-title'
    );

    var iconWrap = el('div', { class: 'weather-icon' });
    var name = el('div', { class: 'weather-name' });
    var meta = el('div', { class: 'weather-meta' });
    var countdownStrong = el('strong', { class: 'countdown' });
    var countdown = el('div', { class: 'weather-countdown' }, [
      el('span', { text: t('world.weather.endsIn') }),
      countdownStrong
    ]);
    var tags = el('div', { class: 'tags' });
    var forecastLabel = el('div', { class: 'readout__label', text: t('world.weather.forecast') });
    var forecast = el('div', { class: 'forecast' });

    var node = card('weather', 'weather-title', 'card--weather', [
      head,
      el('div', { class: 'weather-now' }, [
        iconWrap,
        el('div', {}, [name, meta]),
        countdown
      ]),
      tags,
      forecastLabel,
      forecast,
      el('p', { class: 'card__note', text: t('world.weather.note') })
    ]);

    refs.weather = {
      snapshot: snapshot,
      iconWrap: iconWrap,
      name: name,
      meta: meta,
      tags: tags,
      forecast: forecast,
      endStrong: endStrong,
      countdownStrong: countdownStrong
    };
    fillWeather(refs.weather, now);
    return node;
  }

  function renderWareRow(offer, compact) {
    var record = DATA.weapons[offer.name];
    var zhName = record && record.zh;
    var primary = state.lang === 'zh' && zhName ? zhName : offer.name;
    var secondary = '';
    if (state.lang === 'zh') secondary = zhName ? offer.name : t('world.zenith.unknown');
    var nameNode = el('div', { class: 'ware__name' }, [
      document.createTextNode(primary),
      secondary ? el('span', { class: 'ware__en', text: secondary }) : null
    ]);
    var children = [
      el('span', { class: 'slot', text: t('world.zenith.slot.' + offer.slot) }),
      nameNode
    ];
    if (!compact) {
      var price;
      if (record && record.price != null) {
        price = el('span', { class: 'ware__price' }, [
          document.createTextNode(String(record.price)),
          el('small', { text: t('world.zenith.arcs') })
        ]);
      } else {
        price = el('span', {
          class: 'ware__price is-unknown',
          text: t('world.zenith.priceUnknown'),
          title: t('world.zenith.priceNote')
        });
      }
      children.push(price);
    }
    return el('div', { class: 'ware' }, children);
  }

  function buildZenithCard(day, refs) {
    var offers = core.zenithForDay(day);
    var tomorrow = core.zenithForDay(day + 1);
    var reset = el('strong', { class: 'countdown', text: formatCountdown(core.nextUtcReset(Date.now()) - Date.now()) });
    var head = cardHead(
      'store', t('world.zenith.title'), null,
      t('world.zenith.resetIn'), reset, 'zenith-title'
    );

    var wares = el('div', { class: 'wares' });
    for (var i = 0; i < offers.length; i++) wares.appendChild(renderWareRow(offers[i], false));

    var tomorrowList = el('div', { class: 'tomorrow-list' });
    for (var j = 0; j < tomorrow.length; j++) tomorrowList.appendChild(renderWareRow(tomorrow[j], true));

    var details = el('details', {}, [
      el('summary', { text: t('world.zenith.tomorrow') }),
      tomorrowList
    ]);
    details.addEventListener('toggle', function () {
      if (refs.layout) refs.layout();
    });

    var node = card('zenith', 'zenith-title', 'card--zenith', [
      head,
      wares,
      details,
      el('p', { class: 'card__note', text: t('world.zenith.note') })
    ]);

    refs.zenithReset = reset;
    return node;
  }

  function scheduleRow(dayNum) {
    var start = dayNum * core.DAY_MS;
    var character = core.meetingForDay(dayNum);
    var name = character ? locCharacter(character) : '—';
    var secondary = character && state.lang === 'zh' ? character : '';
    return el('tr', {}, [
      el('td', { class: 'date', title: t('world.meeting.fromLocal', { time: formatTime(start) }) }, [
        document.createTextNode(dateLabel(start, true)),
        el('small', { text: formatTime(start) })
      ]),
      el('td', { class: 'character' }, [
        document.createTextNode(name),
        secondary ? el('small', { text: secondary }) : null
      ])
    ]);
  }

  function buildMeetingCard(day, refs) {
    var character = core.meetingForDay(day);
    var reset = el('strong', { class: 'countdown', text: formatCountdown(core.nextUtcReset(Date.now()) - Date.now()) });
    var head = cardHead(
      'users', t('world.meeting.title'), null,
      t('world.meeting.resetIn'), reset, 'meeting-title'
    );

    var name = character ? locCharacter(character) : '—';
    var avatar = el('div', { class: 'avatar', 'aria-hidden': 'true' });
    avatar.appendChild(portrait(character || ''));
    var body = el('div', { class: 'meeting-body' }, [
      el('div', { class: 'meeting-label', text: t('world.meeting.today') }),
      el('div', { class: 'meeting-name', text: name }),
      character && state.lang === 'zh' ? el('div', { class: 'meeting-en', text: character }) : null
    ]);
    var returns = character ? formatReturn(core.daysUntilMeeting(character, day, 60)) : '—';
    var returnNode = el('div', { class: 'meeting-return' }, [
      el('div', { class: 'readout__label', text: t('world.meeting.returns') }),
      el('strong', { text: returns })
    ]);
    var hero = el('div', { class: 'meeting-hero' }, [avatar, body, returnNode]);

    var rows = [];
    for (var i = 1; i <= 7; i++) rows.push(scheduleRow(day + i));
    var table = el('table', { class: 'schedule' }, [
      el('caption', { text: t('world.meeting.next') }),
      el('thead', {}, [
        el('tr', {}, [
          el('th', { scope: 'col', text: t('world.meeting.date') }),
          el('th', { scope: 'col', text: t('world.meeting.character') })
        ])
      ]),
      el('tbody', {}, rows)
    ]);
    var schedule = el('div', { class: 'meeting-schedule' }, [table]);
    var note = el('p', { class: 'card__note', text: t('world.meeting.note') });

    var node = card('meeting', 'meeting-title', 'card--meeting', [
      head,
      hero,
      schedule,
      note
    ]);

    refs.meetingReset = reset;
    return node;
  }

  // ---------------------------------------------------------------
  // World state: live updates
  // ---------------------------------------------------------------

  function updateTime(refs, clock) {
    var time = refs.time;
    var phase = DATA.phases[clock.phase];
    var phaseChanged = refs.phaseIndex !== clock.phase;
    refs.phaseIndex = clock.phase;

    time.phaseName.textContent = locPhaseMessage(phase);
    time.gameTime.textContent = formatGameTime(clock.hour);
    time.remaining.textContent = formatMinuteSecond(clock.remaining * 1000);
    time.marker.style.setProperty('--marker', dayBarPosition(clock.hour).toFixed(2) + '%');

    for (var i = 0; i < time.segments.length; i++) {
      if (i === clock.phase) time.segments[i].classList.add('is-active');
      else time.segments[i].classList.remove('is-active');
    }

    if (phaseChanged && refs.layout) refs.layout();
  }

  function updateWeather(refs, now) {
    var weather = refs.weather;
    if (!weather || !weather.snapshot) return;
    var current = weather.snapshot.periods[0];
    var currentId = null;
    try { currentId = core.weatherAt(Math.floor(now / 1000)); } catch (error) { currentId = null; }
    if (now >= current.end || currentId !== current.id) {
      weather.snapshot = computeWeather(now);
      fillWeather(weather, now);
      if (refs.layout) refs.layout();
      return;
    }
    weather.countdownStrong.textContent = formatCountdown(current.end - now);
  }

  function updateClocks(refs, now) {
    refs.localClock.textContent = formatClockTime(now);
    refs.utcClock.textContent = formatUtcClock(now);
    var reset = formatCountdown(core.nextUtcReset(now) - now);
    if (refs.zenithReset) refs.zenithReset.textContent = reset;
    if (refs.meetingReset) refs.meetingReset.textContent = reset;
  }

  // ---------------------------------------------------------------
  // World state: two-column masonry
  // ---------------------------------------------------------------

  var MASONRY_MIN_WIDTH = 901;
  var MASONRY_ROW_HEIGHT = 8;

  function layoutWorldGrid(grid, cards, widths) {
    if (widths && Object.keys(widths).length) {
      layoutWorldGridWidths(grid, cards, widths);
      return;
    }
    layoutBalancedWorldGrid(grid, cards);
  }

  /**
   * Place the four world modules in two contiguous, height-balanced columns.
   *
   * A plain two-column grid makes both cards in a row share the row's height,
   * so a short module leaves a large hole under it. This measures each card at
   * several candidate column widths, picks the split that minimises the taller
   * column, then gives every card an explicit grid row span (8px rows) so the
   * next card in the same column starts immediately after it.
   */
  function layoutBalancedWorldGrid(grid, cards) {
    var i;
    for (i = 0; i < cards.length; i++) {
      cards[i].style.gridColumn = '';
      cards[i].style.gridRow = '';
    }
    grid.classList.remove('is-masonry');

    if (!grid.isConnected || window.innerWidth < MASONRY_MIN_WIDTH || cards.length < 2) return;

    var computed = window.getComputedStyle(grid);
    var gap = parseFloat(computed.columnGap || computed.gap);
    if (!isFinite(gap)) gap = 18;

    // A wider right column is usually the better fit (the meeting table is the
    // tallest module), so try 4/8, 5/7 and 6/6. Every candidate is measured at
    // its real width; the narrowest column is kept readable by minColumnWidth.
    var candidates = [];
    var minColumnWidth = 340;
    for (var leftSpan = 4; leftSpan <= 6; leftSpan++) {
      var rightSpan = 12 - leftSpan;
      for (var split = 1; split < cards.length; split++) {
        for (i = 0; i < cards.length; i++) {
          cards[i].style.gridRow = '';
          cards[i].style.gridColumn = i < split
            ? '1 / span ' + leftSpan
            : (leftSpan + 1) + ' / span ' + rightSpan;
        }

        var heights = [];
        var fits = true;
        for (i = 0; i < cards.length; i++) {
          var rect = cards[i].getBoundingClientRect();
          heights.push(rect.height);
          if (rect.width < minColumnWidth) fits = false;
        }
        if (!fits) continue;

        var left = 0;
        var right = 0;
        for (i = 0; i < split; i++) left += heights[i];
        for (i = split; i < cards.length; i++) right += heights[i];
        left += gap * (split - 1);
        right += gap * (cards.length - split - 1);

        candidates.push({
          leftSpan: leftSpan,
          rightSpan: rightSpan,
          split: split,
          heights: heights,
          max: Math.max(left, right),
          diff: Math.abs(left - right)
        });
      }
    }

    var best = null;
    for (i = 0; i < candidates.length; i++) {
      var candidate = candidates[i];
      var widthPenalty = Math.abs(candidate.leftSpan - 6);
      if (!best
        || candidate.max < best.max - 0.5
        || (Math.abs(candidate.max - best.max) <= 0.5 && candidate.diff < best.diff - 0.5)
        || (Math.abs(candidate.max - best.max) <= 0.5
          && Math.abs(candidate.diff - best.diff) <= 0.5
          && widthPenalty < Math.abs(best.leftSpan - 6))) {
        best = candidate;
      }
    }

    // Extremely narrow containers should still get a sane two-column layout.
    if (!best) {
      best = {
        leftSpan: 6, rightSpan: 6, split: Math.ceil(cards.length / 2),
        heights: heightsAtColumns(cards, 6, 6, Math.ceil(cards.length / 2))
      };
    }

    var state = [0, 0];
    for (i = 0; i < cards.length; i++) {
      var column = i < best.split ? 0 : 1;
      var units = Math.max(1, Math.ceil((best.heights[i] + gap) / (MASONRY_ROW_HEIGHT + gap)));
      cards[i].style.gridColumn = column === 0
        ? '1 / span ' + best.leftSpan
        : (best.leftSpan + 1) + ' / span ' + best.rightSpan;
      cards[i].style.gridRow = (state[column] + 1) + ' / span ' + units;
      state[column] += units;
    }
    grid.classList.add('is-masonry');
  }

  function heightsAtColumns(cards, leftSpan, rightSpan, split) {
    var heights = [];
    for (var i = 0; i < cards.length; i++) {
      cards[i].style.gridRow = '';
      cards[i].style.gridColumn = i < split
        ? '1 / span ' + leftSpan
        : (leftSpan + 1) + ' / span ' + rightSpan;
    }
    for (var j = 0; j < cards.length; j++) {
      heights.push(cards[j].getBoundingClientRect().height);
    }
    return heights;
  }

  /**
   * Width-aware skyline placement. Explicit width choices use the module's
   * exact 12-column span; "auto" modules try every supported span and prefer
   * their configured width, so the result stays close to the default layout.
   */
  function layoutWorldGridWidths(grid, cards, widths) {
    var i;
    for (i = 0; i < cards.length; i++) {
      cards[i].style.gridColumn = '';
      cards[i].style.gridRow = '';
    }
    grid.classList.remove('is-masonry');
    if (!grid.isConnected || window.innerWidth < MASONRY_MIN_WIDTH || !cards.length) return;

    var computed = window.getComputedStyle(grid);
    var gap = parseFloat(computed.rowGap || computed.columnGap || computed.gap);
    if (!isFinite(gap)) gap = 18;
    var columns = 12;
    var heights = [];
    for (i = 0; i < columns; i++) heights.push(0);

    var measurements = [];
    for (i = 0; i < cards.length; i++) {
      var key = cards[i].getAttribute('data-module-key');
      var module = worldModuleByKey(key);
      if (!module) continue;
      var allowed = supportedWorldWidths(module);
      var selected = widths[key];
      var candidatesWidths = selected ? [selected] : allowed;
      var candidates = [];
      for (var c = 0; c < candidatesWidths.length; c++) {
        cards[i].style.gridColumn = '1 / span ' + candidatesWidths[c];
        cards[i].style.gridRow = '';
        var height = cards[i].getBoundingClientRect().height;
        candidates.push({
          width: candidatesWidths[c],
          units: Math.max(1, Math.ceil((height + gap) / (MASONRY_ROW_HEIGHT + gap)))
        });
      }
      cards[i].style.gridColumn = '';
      cards[i].style.gridRow = '';
      measurements.push({
        card: cards[i],
        candidates: candidates,
        preferred: module.preferred || 6
      });
    }

    for (i = 0; i < measurements.length; i++) {
      var measurement = measurements[i];
      var best = null;
      for (var ci = 0; ci < measurement.candidates.length; ci++) {
        var candidate = measurement.candidates[ci];
        for (var column = 0; column <= columns - candidate.width; column++) {
          var row = 0;
          for (var offset = 0; offset < candidate.width; offset++) {
            row = Math.max(row, heights[column + offset]);
          }
          var distance = Math.abs(candidate.width - measurement.preferred);
          var bestDistance = best ? Math.abs(best.width - measurement.preferred) : Infinity;
          if (!best
            || row < best.row
            || (row === best.row && distance < bestDistance)
            || (row === best.row && distance === bestDistance && candidate.width > best.width)) {
            best = { row: row, column: column, width: candidate.width, units: candidate.units };
          }
        }
      }
      if (!best) {
        best = { row: 0, column: 0, width: 12, units: 1 };
      }
      measurement.card.style.gridColumn = (best.column + 1) + ' / span ' + best.width;
      measurement.card.style.gridRow = (best.row + 1) + ' / span ' + best.units;
      for (var span = 0; span < best.width; span++) {
        heights[best.column + span] = best.row + best.units;
      }
    }
    grid.classList.add('is-masonry');
  }

  var TEMPER_ART_ORDER = ['bow', 'flyblade', 'heavy', 'long-blade', 'magick', 'polearm', 'shield', 'short-blade'];
  var TEMPER_MELEE_ARTS = ['heavy', 'long-blade', 'polearm', 'shield', 'short-blade'];
  var TEMPER_RANGED_ARTS = ['bow', 'flyblade'];
  var TEMPER_ARTS = {
    bow: { en: 'Bow', zh: '弓箭' },
    flyblade: { en: 'Flyblade', zh: '飞刃' },
    heavy: { en: 'Heavy', zh: '重技' },
    'long-blade': { en: 'Long Blade', zh: '长刀' },
    magick: { en: 'Magick', zh: '魔法武器' },
    polearm: { en: 'Polearm', zh: '长柄武器' },
    shield: { en: 'Shield', zh: '剑盾' },
    'short-blade': { en: 'Short Blade', zh: '短刀' }
  };
  var TEMPER_ORIGINS = [
    { key: 'all', en: 'All', zh: '全部' },
    { key: 'universal', en: 'Universal', zh: '通用' },
    { key: 'cassid', en: 'Cassid', zh: '卡西' },
    { key: 'dendrit', en: 'Dendrit', zh: '丹缀' },
    { key: 'feykin', en: 'Feykin', zh: '仙灵裔' },
    { key: 'mendicant', en: 'Mendicant', zh: '苦行者' },
    { key: 'ode', en: "Ode'n", zh: '讴徳' }
  ];

  function addTemperArts(target, keys) {
    for (var i = 0; i < keys.length; i++) {
      if (TEMPER_ARTS[keys[i]] && target.indexOf(keys[i]) === -1) target.push(keys[i]);
    }
  }

  function temperArts(item) {
    var found = [];
    var table = (item.weaponTable || '').split(',');
    for (var i = 0; i < table.length; i++) {
      var token = table[i].trim().replace(/\+.*$/, '').trim();
      if (token === 'ALL' || token === 'All Weapons') addTemperArts(found, TEMPER_ART_ORDER);
      else if (token === 'Melee') addTemperArts(found, TEMPER_MELEE_ARTS);
      else if (token === 'Ranged') addTemperArts(found, TEMPER_RANGED_ARTS);
      else if (token === 'Heavy') addTemperArts(found, ['heavy']);
      else if (token === 'Long Blade') addTemperArts(found, ['long-blade']);
      else if (token === 'Short Blade') addTemperArts(found, ['short-blade']);
      else if (token === 'Polearm') addTemperArts(found, ['polearm']);
      else if (token === 'Shield') addTemperArts(found, ['shield']);
      else if (token === 'Magick') addTemperArts(found, ['magick']);
      else if (token === 'Flyblade') addTemperArts(found, ['flyblade']);
      else if (token === 'Bow') addTemperArts(found, ['bow']);
    }
    if (!found.length) {
      for (var w = 0; w < item.weapons.length; w++) {
        var weapon = item.weapons[w];
        if (weapon === 'All Weapons') addTemperArts(found, TEMPER_ART_ORDER);
        else if (weapon === 'Melee') addTemperArts(found, TEMPER_MELEE_ARTS);
        else if (weapon === 'Bow') addTemperArts(found, ['bow']);
        else if (weapon === 'Magick') addTemperArts(found, ['magick']);
        else if (weapon === 'Flyblade') addTemperArts(found, ['flyblade']);
        else if (weapon === 'Heavy Melee') addTemperArts(found, ['heavy']);
        else if (weapon === 'Light Melee') addTemperArts(found, ['long-blade']);
        else if (weapon === 'Non-Bow') addTemperArts(found, TEMPER_ART_ORDER.filter(function (key) { return key !== 'bow'; }));
        else if (weapon === 'Non-Magick') addTemperArts(found, TEMPER_ART_ORDER.filter(function (key) { return key !== 'magick'; }));
        else if (weapon === 'Light Primaries') addTemperArts(found, ['heavy']);
      }
    }
    return TEMPER_ART_ORDER.filter(function (key) { return found.indexOf(key) !== -1; });
  }

  function renderTemper() {
    var page = el('div', { class: 'temper-page' });
    var items = TEMPERS.items || [];
    var isZh = state.lang === 'zh';
    var filterState = { origin: 'all', art: 'all' };
    var filterButtons = [];
    var cards = [];
    var resetButton;
    var emptyState;
    var filterStatus;

    var header = el('header', { class: 'page-head temper-head' }, [
      el('p', { class: 'eyebrow', text: t('temper.eyebrow') }),
      el('h1', { text: t('temper.title') })
    ]);
    page.appendChild(header);

    function makeFilterChip(type, key, label, iconSrc) {
      var children = [];
      if (iconSrc) {
        children.push(el('img', {
          class: 'temper-filter-chip__icon',
          src: iconSrc,
          alt: '',
          width: 20,
          height: 20,
          loading: 'lazy',
          decoding: 'async'
        }));
      }
      children.push(document.createTextNode(label));
      var chip = el('button', {
        class: 'temper-filter-chip',
        type: 'button',
        'data-filter': type,
        'data-value': key,
        'aria-pressed': key === 'all' ? 'true' : 'false'
      }, children);
      chip.addEventListener('click', function () {
        filterState[type] = key;
        syncFilterButtons();
        applyTemperFilters();
      });
      filterButtons.push({ type: type, key: key, node: chip });
      return chip;
    }

    function syncFilterButtons() {
      for (var i = 0; i < filterButtons.length; i++) {
        var entry = filterButtons[i];
        entry.node.setAttribute('aria-pressed', filterState[entry.type] === entry.key ? 'true' : 'false');
      }
      if (resetButton) resetButton.disabled = filterState.origin === 'all' && filterState.art === 'all';
    }

    function applyTemperFilters() {
      var visible = 0;
      for (var i = 0; i < cards.length; i++) {
        var card = cards[i];
        var originOK = filterState.origin === 'all' || card.getAttribute('data-origin') === filterState.origin;
        var arts = (card.getAttribute('data-arts') || '').split(' ');
        var artOK = filterState.art === 'all' || arts.indexOf(filterState.art) !== -1;
        var show = originOK && artOK;
        card.hidden = !show;
        if (show) visible++;
      }
      if (emptyState) emptyState.hidden = visible !== 0;
      if (filterStatus) filterStatus.textContent = t('temper.filter.results', { n: visible });
    }

    var originChips = [];
    for (var oi = 0; oi < TEMPER_ORIGINS.length; oi++) {
      (function (origin) {
        originChips.push(makeFilterChip(
          'origin',
          origin.key,
          origin.key === 'all' ? t('temper.filter.allOrigins') : (isZh ? origin.zh : origin.en),
          origin.key === 'all' ? '' : 'assets/img/tempers/origins/' + origin.key + '.png'
        ));
      }(TEMPER_ORIGINS[oi]));
    }

    var artChips = [];
    artChips.push(makeFilterChip('art', 'all', t('temper.filter.allWeapons'), ''));
    for (var ai = 0; ai < TEMPER_ART_ORDER.length; ai++) {
      (function (artKey) {
        var art = TEMPER_ARTS[artKey];
        artChips.push(makeFilterChip(
          'art',
          artKey,
          isZh ? art.zh : art.en,
          'assets/img/tempers/arts/' + artKey + '.png'
        ));
      }(TEMPER_ART_ORDER[ai]));
    }

    resetButton = el('button', {
      class: 'temper-filter-reset',
      type: 'button',
      text: t('temper.filter.reset'),
      disabled: true
    });
    resetButton.addEventListener('click', function () {
      filterState.origin = 'all';
      filterState.art = 'all';
      syncFilterButtons();
      applyTemperFilters();
    });

    var filters = el('search', {
      class: 'temper-filters',
      'aria-label': t('temper.filter.label')
    }, [
      el('div', { class: 'temper-filter-row' }, [
        el('span', { class: 'temper-filter-label', text: t('temper.filter.origin') }),
        el('div', {
          class: 'temper-filter-options',
          role: 'group',
          'aria-label': t('temper.filter.origin')
        }, originChips)
      ]),
      el('div', { class: 'temper-filter-row' }, [
        el('span', { class: 'temper-filter-label', text: t('temper.filter.weapon') }),
        el('div', {
          class: 'temper-filter-options',
          role: 'group',
          'aria-label': t('temper.filter.weapon')
        }, artChips)
      ]),
      el('div', { class: 'temper-filter-actions' }, [resetButton])
    ]);
    page.appendChild(filters);

    filterStatus = el('p', {
      class: 'visually-hidden',
      role: 'status',
      'aria-live': 'polite',
      'aria-atomic': 'true'
    });
    page.appendChild(filterStatus);

    var grid = el('div', { class: 'temper-grid' });
    for (var i = 0; i < items.length; i++) {
      (function (item) {
        var name = isZh && item.zh ? item.zh : item.name;
        var altName = isZh ? item.name : (item.zh || '');
        var description = isZh && item.descriptionZh ? item.descriptionZh : item.description;
        var descriptionIsSource = isZh && !item.descriptionZh;
        var icon = el('span', { class: 'temper-icon' }, [
          el('img', {
            class: 'temper-icon__art',
            src: 'assets/img/tempers/icons/' + item.icon,
            alt: '',
            width: 56,
            height: 56,
            loading: 'lazy',
            decoding: 'async'
          }),
          el('img', {
            class: 'temper-icon__frame',
            src: 'assets/img/tempers/frames/' + item.frame + '.png',
            alt: '',
            width: 56,
            height: 56,
            loading: 'lazy',
            decoding: 'async',
            'aria-hidden': 'true'
          })
        ]);
        var titleBlock = el('div', { class: 'temper-card__names' }, [
          el('h2', { class: 'temper-card__title', text: name }),
          altName ? el('p', { class: 'temper-card__alt', text: altName, lang: isZh ? 'en' : 'zh-CN' }) : null
        ]);
        var origin = el('span', {
          class: 'temper-origin temper-origin--' + item.frame
        }, [
          el('img', {
            class: 'temper-origin-icon',
            src: 'assets/img/tempers/origins/' + item.frame + '.png',
            alt: '',
            width: 16,
            height: 16,
            loading: 'lazy',
            decoding: 'async'
          }),
          document.createTextNode(isZh && item.originZh ? item.originZh : item.origin)
        ]);
        var artKeys = temperArts(item);
        var artNodes = [];
        for (var ai = 0; ai < artKeys.length; ai++) {
          (function (artKey) {
            var art = TEMPER_ARTS[artKey];
            var label = isZh ? art.zh : art.en;
            artNodes.push(el('span', {
              class: 'temper-art',
              title: label,
              'aria-label': label,
              role: 'img'
            }, [
              el('img', {
                src: 'assets/img/tempers/arts/' + artKey + '.png',
                alt: '',
                width: 22,
                height: 22,
                loading: 'lazy',
                decoding: 'async'
              })
            ]));
          }(artKeys[ai]));
        }
        var card = el('article', {
          class: 'temper-card',
          'data-origin': item.frame,
          'data-arts': artKeys.join(' ')
        }, [
          el('div', { class: 'temper-card__head' }, [
            icon,
            el('div', { class: 'temper-card__heading' }, [titleBlock]),
            origin
          ]),
          el('p', {
            class: 'temper-desc' + (descriptionIsSource ? ' lang-en' : ''),
            text: description,
            lang: descriptionIsSource ? 'en' : null
          }),
          descriptionIsSource ? el('span', { class: 'temper-source-badge', text: t('temper.untranslated') }) : null,
          el('div', { class: 'temper-weapon' }, [
            el('span', { class: 'temper-meta-label', text: t('temper.weapon') }),
            el('span', { class: 'temper-art-list' }, artNodes)
          ])
        ]);
        cards.push(card);
        grid.appendChild(card);
      }(items[i]));
    }

    emptyState = el('p', { class: 'temper-filter-empty', text: t('temper.filter.empty'), hidden: true });
    page.appendChild(grid);
    page.appendChild(emptyState);
    syncFilterButtons();
    applyTemperFilters();
    return page;
  }

  function renderWorld() {
    var now = Date.now();
    var day = core.dayNum(now);
    var clock = core.clockAt(now / 1000);
    var refs = { day: day, phaseIndex: clock.phase };

    var localClock = el('b', { text: formatClockTime(now) });
    var utcClock = el('b', { text: formatUtcClock(now) });
    var clockLine = el('div', { class: 'clock-line' }, [
      el('span', {}, [document.createTextNode(t('world.local') + ' '), localClock]),
      el('span', {}, [document.createTextNode(t('world.utc') + ' '), utcClock])
    ]);

    var header = el('header', { class: 'page-head' }, [
      el('p', { class: 'eyebrow', text: t('world.eyebrow') }),
      el('h1', { text: t('world.title') }),
      clockLine
    ]);

    var timeCard = buildTimeCard(clock, refs);
    var weatherCard = buildWeatherCard(now, refs);
    var zenithCard = buildZenithCard(day, refs);
    var meetingCard = buildMeetingCard(day, refs);
    var cardMap = {
      time: timeCard,
      weather: weatherCard,
      zenith: zenithCard,
      meeting: meetingCard
    };
    var moduleByKey = {};
    for (var mi = 0; mi < WORLD_MODULES.length; mi++) {
      moduleByKey[WORLD_MODULES[mi].key] = WORLD_MODULES[mi];
    }

    var layoutOrder = loadWorldLayout();
    var layoutWidths = loadWorldWidths();
    var cards = [];
    for (var ci = 0; ci < layoutOrder.length; ci++) {
      var initialCard = cardMap[layoutOrder[ci]];
      initialCard.setAttribute('data-module-key', layoutOrder[ci]);
      cards.push(initialCard);
    }

    var grid = el('div', { class: 'world-grid' }, cards);

    var editorOpen = false;
    var dragKey = null;
    var dragStartOrder = null;
    var dragSourceNode = null;
    var dragPointerX = 0;
    var dragPointerY = 0;
    var autoScrollFrame = 0;
    var pointerDragCleanup = null;
    var AUTO_SCROLL_EDGE = 84;
    var AUTO_SCROLL_MAX = 9;

    var layoutList = el('ol', { class: 'layout-list' });
    var layoutStatus = el('p', { class: 'layout-status', role: 'status', 'aria-live': 'polite' });
    var layoutTitle = el('h2', { id: 'layout-title', text: t('layout.title') });
    var resetLayoutButton = el('button', {
      class: 'button button--ghost',
      type: 'button',
      text: t('layout.reset')
    });
    var closeLayoutButton = el('button', {
      class: 'button button--ghost',
      type: 'button',
      text: t('layout.close')
    });
    var layoutEditor = el('section', {
      class: 'layout-editor',
      id: 'layout-editor',
      hidden: true,
      'aria-labelledby': 'layout-title'
    }, [
      el('div', { class: 'layout-editor__head' }, [
        el('div', {}, [
          layoutTitle,
          el('p', { class: 'layout-editor__hint', id: 'layout-hint', text: t('layout.hint') })
        ]),
        el('div', { class: 'layout-editor__actions' }, [resetLayoutButton, closeLayoutButton])
      ]),
      layoutList,
      layoutStatus
    ]);

    var layoutButton = el('button', {
      class: 'button button--ghost',
      type: 'button',
      'aria-expanded': 'false',
      'aria-controls': 'layout-editor'
    }, [
      icon('layout'),
      document.createTextNode(t('layout.customize'))
    ]);
    header.appendChild(el('div', { class: 'page-actions' }, [layoutButton]));

    function requestDragFrame(callback) {
      if (window.requestAnimationFrame) return window.requestAnimationFrame(callback);
      return window.setTimeout(callback, 16);
    }

    function cancelDragFrame(frame) {
      if (window.cancelAnimationFrame) window.cancelAnimationFrame(frame);
      else window.clearTimeout(frame);
    }

    function applyCardOrder() {
      var next = [];
      var i;
      for (i = 0; i < layoutOrder.length; i++) next.push(cardMap[layoutOrder[i]]);
      cards.length = 0;
      for (i = 0; i < next.length; i++) cards.push(next[i]);
      for (i = 0; i < cards.length; i++) grid.appendChild(cards[i]);
      layoutWorldGrid(grid, cards, layoutWidths);
    }

    function orderWithMove(sourceKey, targetKey, after) {
      var next = [];
      var i;
      for (i = 0; i < layoutOrder.length; i++) {
        if (layoutOrder[i] !== sourceKey) next.push(layoutOrder[i]);
      }
      var targetIndex = next.indexOf(targetKey);
      if (targetIndex < 0) return null;
      next.splice(targetIndex + (after ? 1 : 0), 0, sourceKey);
      return next;
    }

    function reorderChildren(container, orderedNodes, source) {
      if (!source || orderedNodes.indexOf(source) === -1) {
        for (var i = 0; i < orderedNodes.length; i++) container.appendChild(orderedNodes[i]);
        return;
      }
      var sourceIndex = orderedNodes.indexOf(source);
      for (var before = 0; before < sourceIndex; before++) {
        container.insertBefore(orderedNodes[before], source);
      }
      for (var after = orderedNodes.length - 1; after > sourceIndex; after--) {
        container.insertBefore(orderedNodes[after], source.nextSibling);
      }
    }

    function updateLayoutLabels() {
      for (var i = 0; i < layoutOrder.length; i++) {
        var key = layoutOrder[i];
        var item = layoutList.querySelector('[data-layout-key="' + key + '"]');
        if (!item) continue;
        var index = item.querySelector('.layout-item__index');
        if (index) index.textContent = (i < 9 ? '0' : '') + (i + 1);
      }
    }

    function applyListOrder() {
      var orderedItems = [];
      var i;
      for (i = 0; i < layoutOrder.length; i++) {
        var item = layoutList.querySelector('[data-layout-key="' + layoutOrder[i] + '"]');
        if (item) orderedItems.push(item);
      }
      var current = layoutList.children;
      var same = current.length === orderedItems.length;
      for (i = 0; same && i < orderedItems.length; i++) {
        if (current[i] !== orderedItems[i]) same = false;
      }
      if (!same) {
        for (i = 0; i < orderedItems.length; i++) layoutList.appendChild(orderedItems[i]);
      }
      updateLayoutLabels();
    }

    function collectReorderNodes() {
      var nodes = [];
      var i;
      for (i = 0; i < cards.length; i++) nodes.push(cards[i]);
      for (i = 0; i < layoutList.children.length; i++) nodes.push(layoutList.children[i]);
      return nodes;
    }

    function finishAnimations(nodes) {
      for (var i = 0; i < nodes.length; i++) {
        if (!nodes[i].getAnimations) continue;
        var animations = nodes[i].getAnimations();
        for (var a = 0; a < animations.length; a++) animations[a].finish();
      }
    }

    function capturePositions(nodes) {
      var positions = [];
      for (var i = 0; i < nodes.length; i++) {
        positions.push({ node: nodes[i], rect: nodes[i].getBoundingClientRect() });
      }
      return positions;
    }

    function animatePositions(positions) {
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      for (var i = 0; i < positions.length; i++) {
        var node = positions[i].node;
        if (node === dragSourceNode || !node.isConnected || !node.animate) continue;
        var after = node.getBoundingClientRect();
        var dx = positions[i].rect.left - after.left;
        var dy = positions[i].rect.top - after.top;
        if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) continue;
        node.animate([
          { transform: 'translate(' + dx + 'px, ' + dy + 'px)' },
          { transform: 'translate(0, 0)' }
        ], { duration: 240, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' });
      }
    }

    function previewReorder(sourceKey, targetKey, after) {
      var next = orderWithMove(sourceKey, targetKey, after);
      if (!next || next.join('\u0000') === layoutOrder.join('\u0000')) return;
      var scrollX = window.scrollX;
      var scrollY = window.scrollY;
      var reorderNodes = collectReorderNodes();
      finishAnimations(reorderNodes);
      var previousPositions = capturePositions(reorderNodes);
      layoutOrder = next;

      var orderedCards = [];
      var i;
      for (i = 0; i < layoutOrder.length; i++) orderedCards.push(cardMap[layoutOrder[i]]);
      cards.length = 0;
      for (i = 0; i < orderedCards.length; i++) cards.push(orderedCards[i]);
      reorderChildren(grid, orderedCards, dragSourceNode);

      var orderedItems = [];
      for (i = 0; i < layoutOrder.length; i++) {
        var item = layoutList.querySelector('[data-layout-key="' + layoutOrder[i] + '"]');
        if (item) orderedItems.push(item);
      }
      reorderChildren(layoutList, orderedItems, dragSourceNode);
      updateLayoutLabels();
      layoutWorldGrid(grid, cards, layoutWidths);
      if (window.scrollX !== scrollX || window.scrollY !== scrollY) {
        window.scrollTo(scrollX, scrollY);
      }
      animatePositions(previousPositions);
    }

    function savePreview() {
      if (!dragStartOrder) return;
      if (layoutOrder.join('\u0000') === dragStartOrder.join('\u0000')) return;
      saveWorldLayout(layoutOrder);
      layoutStatus.textContent = t('layout.saved');
    }

    function stopAutoScroll() {
      if (autoScrollFrame) cancelDragFrame(autoScrollFrame);
      autoScrollFrame = 0;
    }

    function autoScrollStep() {
      autoScrollFrame = 0;
      if (!dragKey) return;
      var delta = 0;
      if (dragPointerY > 0 && dragPointerY < AUTO_SCROLL_EDGE) {
        delta = -Math.max(2, Math.ceil((1 - dragPointerY / AUTO_SCROLL_EDGE) * AUTO_SCROLL_MAX));
      } else if (dragPointerY > window.innerHeight - AUTO_SCROLL_EDGE) {
        var distance = Math.max(0, window.innerHeight - dragPointerY);
        delta = Math.max(2, Math.ceil((1 - distance / AUTO_SCROLL_EDGE) * AUTO_SCROLL_MAX));
      }
      if (delta) {
        var before = window.scrollY;
        window.scrollBy(0, delta);
        if (window.scrollY !== before) previewAtPoint();
      }
      autoScrollFrame = requestDragFrame(autoScrollStep);
    }

    function startAutoScroll() {
      if (!dragKey || autoScrollFrame) return;
      autoScrollFrame = requestDragFrame(autoScrollStep);
    }

    function previewAtPoint() {
      if (!dragKey) return;
      var hits = document.elementsFromPoint
        ? document.elementsFromPoint(dragPointerX, dragPointerY)
        : [document.elementFromPoint(dragPointerX, dragPointerY)];
      var target = null;
      for (var hi = 0; hi < hits.length; hi++) {
        if (!hits[hi] || !hits[hi].closest) continue;
        var candidate = hits[hi].closest('[data-module-key], [data-layout-key]');
        if (!candidate) continue;
        var candidateKey = candidate.getAttribute('data-module-key') || candidate.getAttribute('data-layout-key');
        if (candidateKey && candidateKey !== dragKey) {
          target = candidate;
          break;
        }
      }
      if (!target) return;
      var key = target.getAttribute('data-module-key') || target.getAttribute('data-layout-key');
      var rect = target.getBoundingClientRect();
      var isList = target.classList.contains('layout-item');
      var after = isList
        ? dragPointerX > rect.left + rect.width / 2
        : dragPointerY > rect.top + rect.height / 2;
      previewReorder(dragKey, key, after);
    }

    function startDragState(key, node, clientX, clientY) {
      dragKey = key;
      dragStartOrder = layoutOrder.slice();
      dragSourceNode = node;
      dragPointerX = isFinite(clientX) ? clientX : 0;
      dragPointerY = isFinite(clientY) ? clientY : 0;
      node.classList.add('is-dragging');
    }

    function endDrag(commit) {
      if (!dragKey && !pointerDragCleanup) return;
      if (commit) savePreview();
      if (pointerDragCleanup) {
        var cleanup = pointerDragCleanup;
        pointerDragCleanup = null;
        cleanup();
      }
      stopAutoScroll();
      var dragging = document.querySelectorAll('.is-dragging');
      for (var i = 0; i < dragging.length; i++) dragging[i].classList.remove('is-dragging');
      var changed = dragStartOrder && layoutOrder.join('\u0000') !== dragStartOrder.join('\u0000');
      if (!commit && changed) {
        layoutOrder = dragStartOrder.slice();
        applyCardOrder();
        layoutStatus.textContent = t('layout.cancelled');
      }
      dragKey = null;
      dragStartOrder = null;
      dragSourceNode = null;
      if (editorOpen) applyListOrder();
    }

    function beginDrag(event, key, node) {
      if (!editorOpen || dragKey) {
        event.preventDefault();
        return;
      }
      startDragState(key, node, event.clientX, event.clientY);
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', key);
      }
    }

    function markDrop(event, node, key) {
      if (!editorOpen || !dragKey || key === dragKey) return;
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
      dragPointerX = isFinite(event.clientX) ? event.clientX : dragPointerX;
      dragPointerY = isFinite(event.clientY) ? event.clientY : dragPointerY;
      startAutoScroll();
      var rect = node.getBoundingClientRect();
      var isList = node.classList.contains('layout-item');
      var after = isList
        ? event.clientX > rect.left + rect.width / 2
        : event.clientY > rect.top + rect.height / 2;
      previewReorder(dragKey, key, after);
    }

    function dropOn(event, node, key) {
      if (!editorOpen || !dragKey) return;
      event.preventDefault();
      if (key !== dragKey) {
        var rect = node.getBoundingClientRect();
        var isList = node.classList.contains('layout-item');
        var after = isList
          ? event.clientX > rect.left + rect.width / 2
          : event.clientY > rect.top + rect.height / 2;
        previewReorder(dragKey, key, after);
      }
      endDrag(true);
    }

    function startPointerDrag(event, key, node, handle) {
      if (!editorOpen || dragKey || event.pointerType === 'mouse' || event.button !== 0) return;
      event.preventDefault();
      startDragState(key, node, event.clientX, event.clientY);
      var pointerId = event.pointerId;
      var rect = node.getBoundingClientRect();
      var offsetX = event.clientX - rect.left;
      var offsetY = event.clientY - rect.top;
      var dragX = 0;
      var dragY = 0;
      node.classList.add('is-lifted');
      node.style.position = 'relative';
      node.style.zIndex = '1000';
      node.style.transition = 'none';
      node.style.transform = 'translate(0, 0)';
      node.draggable = false;
      var handleWasDraggable = handle.draggable;
      handle.draggable = false;
      try { handle.setPointerCapture(pointerId); } catch (error) { /* synthetic pointer */ }

      function onMove(moveEvent) {
        if (moveEvent.pointerId !== pointerId) return;
        moveEvent.preventDefault();
        dragPointerX = moveEvent.clientX;
        dragPointerY = moveEvent.clientY;
        var current = node.getBoundingClientRect();
        var baseLeft = current.left - dragX;
        var baseTop = current.top - dragY;
        dragX = moveEvent.clientX - offsetX - baseLeft;
        dragY = moveEvent.clientY - offsetY - baseTop;
        node.style.transform = 'translate(' + dragX + 'px, ' + dragY + 'px)';
        startAutoScroll();
        previewAtPoint();
      }

      function onEnd(endEvent) {
        if (endEvent.pointerId !== pointerId) return;
        endDrag(true);
      }

      function onCancel(cancelEvent) {
        if (cancelEvent.pointerId !== pointerId) return;
        endDrag(false);
      }

      pointerDragCleanup = function () {
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onEnd);
        document.removeEventListener('pointercancel', onCancel);
        node.classList.remove('is-lifted');
        node.style.position = '';
        node.style.zIndex = '';
        node.style.transition = '';
        node.style.transform = '';
        handle.draggable = handleWasDraggable;
        node.draggable = editorOpen;
      };
      document.addEventListener('pointermove', onMove, { passive: false });
      document.addEventListener('pointerup', onEnd);
      document.addEventListener('pointercancel', onCancel);
    }

    function onDocumentDragOver(event) {
      if (!dragKey) return;
      dragPointerX = isFinite(event.clientX) ? event.clientX : dragPointerX;
      dragPointerY = isFinite(event.clientY) ? event.clientY : dragPointerY;
      startAutoScroll();
    }

    function onDragKeyDown(event) {
      if (event.key === 'Escape' && dragKey) {
        event.preventDefault();
        endDrag(false);
      }
    }

    function keyboardReorder(event, key) {
      if (!event.altKey || (event.key !== 'ArrowUp' && event.key !== 'ArrowDown')) return;
      event.preventDefault();
      var delta = event.key === 'ArrowUp' ? -1 : 1;
      moveModule(key, delta);
      var item = layoutList.querySelector('[data-layout-key="' + key + '"]');
      if (item) window.setTimeout(function () { item.focus({ preventScroll: true }); }, 0);
    }

    function addModuleHandle(key, node) {
      var name = t(moduleByKey[key].labelKey);
      var handle = el('button', {
        class: 'module-drag-handle',
        type: 'button',
        'aria-label': t('layout.dragHandle', { name: name }),
        'aria-describedby': 'layout-hint',
        title: t('layout.dragHandle', { name: name })
      }, [icon('drag')]);
      handle.draggable = true;
      handle.addEventListener('pointerdown', function (event) {
        startPointerDrag(event, key, node, handle);
      });
      handle.addEventListener('keydown', function (event) {
        keyboardReorder(event, key);
      });
      node.insertBefore(handle, node.firstChild);
    }

    function bindCardDrag(key, node) {
      if (node.dataset.dragBound === '1') return;
      node.dataset.dragBound = '1';
      node.addEventListener('dragstart', function (event) { beginDrag(event, key, node); });
      node.addEventListener('dragend', function () { endDrag(true); });
      node.addEventListener('dragover', function (event) { markDrop(event, node, key); });
      node.addEventListener('drop', function (event) { dropOn(event, node, key); });
    }

    function syncModuleEditing() {
      document.documentElement.classList.toggle('layout-editing', editorOpen);
      for (var i = 0; i < layoutOrder.length; i++) {
        var key = layoutOrder[i];
        var node = cardMap[key];
        if (!node) continue;
        node.draggable = editorOpen;
        node.classList.toggle('module--editing', editorOpen);
        var handle = node.querySelector('.module-drag-handle');
        if (!editorOpen) {
          if (handle && handle.parentNode) handle.parentNode.removeChild(handle);
          node.classList.remove('is-dragging');
          continue;
        }
        bindCardDrag(key, node);
        if (!handle) addModuleHandle(key, node);
      }
    }

    function setEditorOpen(open) {
      editorOpen = Boolean(open);
      layoutEditor.hidden = !editorOpen;
      layoutButton.setAttribute('aria-expanded', String(editorOpen));
      if (!editorOpen) {
        endDrag(true);
        layoutButton.focus({ preventScroll: true });
      }
      syncModuleEditing();
    }

    function changeLayoutWidth(key, value) {
      var module = moduleByKey[key];
      if (!module) return;
      var previous = layoutWidths[key] || 'auto';
      if (String(previous) === String(value)) return;
      var nodes = collectReorderNodes();
      finishAnimations(nodes);
      var previousPositions = capturePositions(nodes);
      if (value === 'auto') {
        delete layoutWidths[key];
      } else {
        var width = parseInt(value, 10);
        if (supportedWorldWidths(module).indexOf(width) === -1) return;
        layoutWidths[key] = width;
      }
      saveWorldWidths(layoutWidths);
      layoutWorldGrid(grid, cards, layoutWidths);
      animatePositions(previousPositions);
      layoutStatus.textContent = t('layout.saved');
    }

    function widthOptionLabel(width) {
      if (width === 4) return t('layout.widthThird');
      if (width === 6) return t('layout.widthHalf');
      if (width === 8) return t('layout.widthTwoThirds');
      if (width === 12) return t('layout.widthFull');
      return String(width);
    }

    function renderLayoutEditor() {
      clear(layoutList);
      for (var i = 0; i < layoutOrder.length; i++) {
        (function (key, index) {
          var module = moduleByKey[key];
          var name = t(module.labelKey);
          var grip = el('span', { class: 'layout-item__grip', 'aria-hidden': 'true' }, [icon('drag')]);
          var widthOptions = [el('option', { value: 'auto', text: t('layout.widthAuto') })];
          var widths = supportedWorldWidths(module);
          for (var wi = 0; wi < widths.length; wi++) {
            widthOptions.push(el('option', {
              value: String(widths[wi]),
              text: widthOptionLabel(widths[wi])
            }));
          }
          var widthSelect = el('select', {
            class: 'layout-width__select',
            'aria-label': t('layout.widthFor', { name: name })
          }, widthOptions);
          widthSelect.value = layoutWidths[key] ? String(layoutWidths[key]) : 'auto';
          widthSelect.draggable = false;
          widthSelect.addEventListener('change', function () {
            changeLayoutWidth(key, widthSelect.value);
          });
          widthSelect.addEventListener('dragstart', function (event) { event.preventDefault(); });
          var widthLabel = el('label', { class: 'layout-width' }, [
            el('span', { class: 'visually-hidden', text: t('layout.widthFor', { name: name }) }),
            widthSelect
          ]);
          var item = el('li', {
            class: 'layout-item',
            'data-layout-key': key,
            tabindex: 0,
            'aria-label': name,
            'aria-describedby': 'layout-hint'
          }, [
            grip,
            el('span', { class: 'layout-item__index', text: (index < 9 ? '0' : '') + (index + 1) }),
            el('span', { class: 'layout-item__name', text: name }),
            widthLabel
          ]);
          item.draggable = true;
          grip.draggable = false;
          grip.addEventListener('pointerdown', function (event) {
            startPointerDrag(event, key, item, grip);
          });
          item.addEventListener('dragstart', function (event) {
            if (event.target.closest && event.target.closest('.layout-width')) {
              event.preventDefault();
              return;
            }
            beginDrag(event, key, item);
          });
          item.addEventListener('dragend', function () { endDrag(true); });
          item.addEventListener('dragover', function (event) { markDrop(event, item, key); });
          item.addEventListener('drop', function (event) { dropOn(event, item, key); });
          item.addEventListener('keydown', function (event) { keyboardReorder(event, key); });
          layoutList.appendChild(item);
        }(layoutOrder[i], i));
      }
    }

    function moveModule(key, delta) {
      var index = layoutOrder.indexOf(key);
      var target = index + delta;
      if (index < 0 || target < 0 || target >= layoutOrder.length) return;
      var reorderNodes = collectReorderNodes();
      finishAnimations(reorderNodes);
      var previousPositions = capturePositions(reorderNodes);
      var swap = layoutOrder[index];
      layoutOrder[index] = layoutOrder[target];
      layoutOrder[target] = swap;
      saveWorldLayout(layoutOrder);
      applyCardOrder();
      applyListOrder();
      animatePositions(previousPositions);
      layoutStatus.textContent = t('layout.saved');
      var moved = layoutList.querySelector('.layout-item[data-layout-key="' + key + '"]');
      if (moved) moved.focus({ preventScroll: true });
    }

    function resetLayout() {
      endDrag(false);
      var reorderNodes = collectReorderNodes();
      finishAnimations(reorderNodes);
      var previousPositions = capturePositions(reorderNodes);
      layoutOrder = DEFAULT_WORLD_LAYOUT.slice();
      layoutWidths = {};
      saveWorldLayout(layoutOrder);
      saveWorldWidths(layoutWidths);
      applyCardOrder();
      applyListOrder();
      animatePositions(previousPositions);
      var selects = layoutList.querySelectorAll('.layout-width__select');
      for (var i = 0; i < selects.length; i++) selects[i].value = 'auto';
      layoutStatus.textContent = t('layout.saved');
    }

    layoutButton.addEventListener('click', function () {
      setEditorOpen(layoutEditor.hidden);
    });
    closeLayoutButton.addEventListener('click', function () { setEditorOpen(false); });
    resetLayoutButton.addEventListener('click', resetLayout);
    document.addEventListener('dragover', onDocumentDragOver);
    document.addEventListener('keydown', onDragKeyDown);
    renderLayoutEditor();
    syncModuleEditing();

    var footnote = el('p', { class: 'world-footnote', text: t('world.tzNote') });
    var wrapper = el('div', {}, [header, layoutEditor, grid, footnote]);

    refs.localClock = localClock;
    refs.utcClock = utcClock;

    var layoutFrame = 0;
    var disposed = false;
    var requestFrame = window.requestAnimationFrame || function (callback) {
      return window.setTimeout(callback, 16);
    };
    var cancelFrame = window.cancelAnimationFrame || function (frame) {
      window.clearTimeout(frame);
    };
    function scheduleLayout() {
      if (disposed) return;
      if (layoutFrame) cancelFrame(layoutFrame);
      layoutFrame = requestFrame(function () {
        layoutFrame = 0;
        if (!disposed) layoutWorldGrid(grid, cards, layoutWidths);
      });
    }
    function onResize() { scheduleLayout(); }
    function onVisibility() { if (!document.hidden) scheduleLayout(); }
    window.addEventListener('resize', onResize, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(scheduleLayout).catch(function () { /* ignore */ });
    }
    refs.layout = scheduleLayout;

    function tick() {
      var current = Date.now();
      if (core.dayNum(current) !== refs.day) {
        renderRoute({ focus: false, keepScroll: true });
        return;
      }
      updateClocks(refs, current);
      updateTime(refs, core.clockAt(current / 1000));
      updateWeather(refs, current);
    }

    var timer = window.setInterval(tick, 1000);
    return {
      node: wrapper,
      tick: tick,
      layout: function () { layoutWorldGrid(grid, cards, layoutWidths); },
      cleanup: function () {
        disposed = true;
        window.clearInterval(timer);
        window.removeEventListener('resize', onResize);
        document.removeEventListener('visibilitychange', onVisibility);
        document.removeEventListener('dragover', onDocumentDragOver);
        document.removeEventListener('keydown', onDragKeyDown);
        if (pointerDragCleanup) {
          var cleanupDrag = pointerDragCleanup;
          pointerDragCleanup = null;
          cleanupDrag();
        }
        stopAutoScroll();
        document.documentElement.classList.remove('layout-editing');
        if (layoutFrame) cancelFrame(layoutFrame);
      }
    };
  }

  // ---------------------------------------------------------------
  // Language switching / init
  // ---------------------------------------------------------------

  function setLanguage(lang) {
    if (lang !== 'zh' && lang !== 'en') return;
    if (lang === state.lang) return;
    state.lang = lang;
    removeQueryParam('lang');
    writeStorage(LANG_KEY, lang);
    applyStaticTranslations();
    var route = parseHash();
    renderRoute({ focus: false, keepScroll: true });
    if (route.section) window.setTimeout(function () { scrollToSection(route.section); }, 0);
  }

  function fatal(message) {
    if (!main) return;
    clear(main);
    main.appendChild(el('div', { class: 'error-panel', role: 'alert', text: message }));
  }

  function init() {
    if (!DATA || !UI || !TEMPERS || !core) {
      fatal('Soulframe 永恒花园 / Soulframe Eternium Garden 无法加载数据。 / Failed to load application data.');
      return;
    }

    applyTheme(currentTheme(), false);
    state.lang = detectLang();
    applyStaticTranslations();

    if (themeSwitch) {
      themeSwitch.addEventListener('click', function (event) {
        var button = event.target.closest('[data-theme]');
        if (!button || !themeSwitch.contains(button)) return;
        removeQueryParam('theme');
        applyTheme(button.getAttribute('data-theme'), true);
      });
    }
    if (langSwitch) {
      langSwitch.addEventListener('click', function (event) {
        var button = event.target.closest('[data-lang]');
        if (!button || !langSwitch.contains(button)) return;
        setLanguage(button.getAttribute('data-lang'));
      });
    }

    window.addEventListener('hashchange', function () { renderRoute({ focus: true }); });
    var skipLink = document.querySelector('.skip-link');
    if (skipLink) {
      skipLink.addEventListener('click', function (event) {
        event.preventDefault();
        try { main.scrollIntoView({ block: 'start' }); } catch (error) { /* ignore */ }
        focusMain();
      });
    }
    window.addEventListener('storage', function (event) {
      if (event.key === THEME_KEY) {
        var theme = event.newValue;
        applyTheme(theme === 'light' || theme === 'dark' ? theme : 'auto', false);
      } else if (event.key === LANG_KEY && (event.newValue === 'zh' || event.newValue === 'en')) {
        setLanguage(event.newValue);
      }
    });
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden && state.route === 'live' && state.tick) state.tick();
    });

    renderRoute({ focus: false });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
}());
