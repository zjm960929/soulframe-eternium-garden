/* Soulframe Eternium Garden -- UI and routing.
 * Classic script so the page also works when opened directly from disk.
 */
(function () {
  'use strict';

  var DATA = window.SFData;
  var UI = window.SF_UI;
  var core = window.SFCore;

  var THEME_KEY = 'sf-eg-theme';
  var LANG_KEY = 'sf-eg-lang';
  var WORLD_LAYOUT_KEY = 'sf-eg-world-layout';
  var SVG_NS = 'http://www.w3.org/2000/svg';

  var WORLD_MODULES = [
    { key: 'time', labelKey: 'world.time.title' },
    { key: 'weather', labelKey: 'world.weather.title' },
    { key: 'zenith', labelKey: 'world.zenith.title' },
    { key: 'meeting', labelKey: 'world.meeting.title' }
  ];
  var DEFAULT_WORLD_LAYOUT = WORLD_MODULES.map(function (module) { return module.key; });

  var main = document.getElementById('main');
  var langSelect = document.getElementById('lang-select');
  var themeSelect = document.getElementById('theme-select');

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
    if (langSelect) {
      langSelect.value = state.lang;
      langSelect.setAttribute('aria-label', t('controls.language'));
    }
    if (themeSelect) themeSelect.setAttribute('aria-label', t('controls.theme'));
    var brand = document.querySelector('.brand');
    if (brand) brand.setAttribute('aria-label', t('app.name'));
    var nav = document.getElementById('site-nav');
    if (nav) nav.setAttribute('aria-label', t('nav.label'));
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
    if (themeSelect) themeSelect.value = theme;
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
    } else if (page === 'world') {
      title = t('world.title') + ' · ' + brand;
      description = t('world.lede');
    } else if (page === 'more') {
      title = t('more.title') + ' · ' + brand;
      description = t('more.lede');
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
    } else if (route.page === 'world') {
      var page = renderWorld();
      node = page.node;
      state.cleanup = page.cleanup;
      state.tick = page.tick;
    } else if (route.page === 'more') {
      node = renderMore();
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
      if (route.section && state.route === 'world') {
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
      id: 'world',
      route: '#/world',
      icon: 'compass',
      nameKey: 'home.tool.world.name',
      descKey: 'home.tool.world.desc',
      available: true,
      keywords: [
        '世界状态', '世界', '时间', '天气', '泽尼斯', '会面', '商店', '密德拉',
        'world', 'state', 'time', 'weather', 'zenith', 'meeting', 'wares', 'midrath'
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

  function homeSocialLink(href, label, markup) {
    var link = el('a', {
      class: 'home-social-link',
      href: href,
      target: '_blank',
      rel: 'noopener noreferrer',
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
      homeSocialLink('https://www.douyin.com/user/MS4wLjABAAAAFIQ6-Ww8fODvrsOR2oFTtegpwDnpVq_PKHIUbxkvFSE', t('social.douyin'), DOUYIN_ICON)
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
      'data-search': compactText(moreTitle + ' more tools development 更多功能开发中'),
      'aria-disabled': 'true'
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

    return el('div', { class: 'home' }, [hero, grid, empty]);
  }

  // ---------------------------------------------------------------
  // More
  // ---------------------------------------------------------------

  function renderMore() {
    var features = [
      { icon: 'hammer', key: 'builds' },
      { icon: 'package', key: 'materials' },
      { icon: 'calendar', key: 'events' }
    ];
    var grid = el('div', { class: 'feature-grid' });
    for (var i = 0; i < features.length; i++) {
      var feature = features[i];
      grid.appendChild(el('article', { class: 'feature-card' }, [
        el('div', { class: 'feature-card__top' }, [
          el('span', { class: 'feature-card__icon' }, [icon(feature.icon)]),
          chip(t('more.soon'))
        ]),
        el('h2', { text: t('more.feature.' + feature.key + '.name') }),
        el('p', { text: t('more.feature.' + feature.key + '.desc') }),
        el('div', { class: 'feature-card__foot', text: t('more.reserved') })
      ]));
    }

    return el('div', {}, [
      el('header', { class: 'page-head' }, [
        el('p', { class: 'eyebrow', text: t('more.eyebrow') }),
        el('h1', { text: t('more.title') }),
        el('p', { class: 'lede', text: t('more.lede') })
      ]),
      grid,
      el('p', { class: 'card__note', text: t('more.note') })
    ]);
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

  /**
   * Place the four world modules in two contiguous, height-balanced columns.
   *
   * A plain two-column grid makes both cards in a row share the row's height,
   * so a short module leaves a large hole under it. This measures each card at
   * several candidate column widths, picks the split that minimises the taller
   * column, then gives every card an explicit grid row span (8px rows) so the
   * next card in the same column starts immediately after it.
   */
  function layoutWorldGrid(grid, cards) {
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

  function renderWorld() {
    var now = Date.now();
    var day = core.dayNum(now);
    var clock = core.clockAt(now / 1000);
    var refs = { day: day, phaseIndex: clock.phase };

    var localClock = el('b', { text: formatClockTime(now) });
    var utcClock = el('b', { text: formatUtcClock(now) });
    var status = el('div', { class: 'status-bar' }, [
      (function () {
        var live = el('span', { class: 'chip chip--accent' });
        live.appendChild(el('span', { class: 'live-dot' }));
        live.appendChild(document.createTextNode(t('world.predicted')));
        return live;
      }()),
      chip(t('world.reset')),
      el('div', { class: 'clock-line' }, [
        el('span', {}, [document.createTextNode(t('world.local') + ' '), localClock]),
        el('span', {}, [document.createTextNode(t('world.utc') + ' '), utcClock])
      ])
    ]);

    var header = el('header', { class: 'page-head' }, [
      el('p', { class: 'eyebrow', text: t('world.eyebrow') }),
      el('h1', { text: t('world.title') }),
      el('p', { class: 'lede', text: t('world.lede') }),
      status
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
    var cards = [];
    for (var ci = 0; ci < layoutOrder.length; ci++) cards.push(cardMap[layoutOrder[ci]]);

    var grid = el('div', { class: 'world-grid' }, cards);

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
          el('p', { class: 'layout-editor__hint', text: t('layout.hint') })
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

    function setEditorOpen(open) {
      layoutEditor.hidden = !open;
      layoutButton.setAttribute('aria-expanded', String(open));
      if (!open) layoutButton.focus({ preventScroll: true });
    }

    function applyCardOrder() {
      var next = [];
      var i;
      for (i = 0; i < layoutOrder.length; i++) next.push(cardMap[layoutOrder[i]]);
      cards.length = 0;
      for (i = 0; i < next.length; i++) cards.push(next[i]);
      for (i = 0; i < cards.length; i++) grid.appendChild(cards[i]);
      layoutWorldGrid(grid, cards);
    }

    function renderLayoutEditor() {
      clear(layoutList);
      for (var i = 0; i < layoutOrder.length; i++) {
        (function (key, index) {
          var module = moduleByKey[key];
          var name = t(module.labelKey);
          var up = el('button', {
            class: 'layout-move',
            type: 'button',
            text: '↑',
            'aria-label': t('layout.moveUp', { name: name }),
            disabled: index === 0
          });
          var down = el('button', {
            class: 'layout-move',
            type: 'button',
            text: '↓',
            'aria-label': t('layout.moveDown', { name: name }),
            disabled: index === layoutOrder.length - 1
          });
          up.addEventListener('click', function () { moveModule(key, -1); });
          down.addEventListener('click', function () { moveModule(key, 1); });
          layoutList.appendChild(el('li', {
            class: 'layout-item',
            'data-layout-key': key
          }, [
            el('span', { class: 'layout-item__index', text: (index < 9 ? '0' : '') + (index + 1) }),
            el('span', { class: 'layout-item__name', text: name }),
            el('span', { class: 'layout-item__actions' }, [up, down])
          ]));
        }(layoutOrder[i], i));
      }
    }

    function moveModule(key, delta) {
      var index = layoutOrder.indexOf(key);
      var target = index + delta;
      if (index < 0 || target < 0 || target >= layoutOrder.length) return;
      var swap = layoutOrder[index];
      layoutOrder[index] = layoutOrder[target];
      layoutOrder[target] = swap;
      saveWorldLayout(layoutOrder);
      applyCardOrder();
      renderLayoutEditor();
      layoutStatus.textContent = t('layout.saved');
      var moved = layoutList.querySelector('.layout-item[data-layout-key="' + key + '"] .layout-move:not([disabled])');
      if (moved) moved.focus({ preventScroll: true });
    }

    function resetLayout() {
      layoutOrder = DEFAULT_WORLD_LAYOUT.slice();
      saveWorldLayout(layoutOrder);
      applyCardOrder();
      renderLayoutEditor();
      layoutStatus.textContent = t('layout.saved');
    }

    layoutButton.addEventListener('click', function () {
      setEditorOpen(layoutEditor.hidden);
    });
    closeLayoutButton.addEventListener('click', function () { setEditorOpen(false); });
    resetLayoutButton.addEventListener('click', resetLayout);
    renderLayoutEditor();

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
        if (!disposed) layoutWorldGrid(grid, cards);
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
      layout: function () { layoutWorldGrid(grid, cards); },
      cleanup: function () {
        disposed = true;
        window.clearInterval(timer);
        window.removeEventListener('resize', onResize);
        document.removeEventListener('visibilitychange', onVisibility);
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
    if (!DATA || !UI || !core) {
      fatal('Soulframe 永恒花园 / Soulframe Eternium Garden 无法加载数据。 / Failed to load application data.');
      return;
    }

    applyTheme(currentTheme(), false);
    state.lang = detectLang();
    applyStaticTranslations();

    if (themeSelect) {
      themeSelect.addEventListener('change', function () {
        removeQueryParam('theme');
        applyTheme(themeSelect.value, true);
      });
    }
    if (langSelect) {
      langSelect.addEventListener('change', function () { setLanguage(langSelect.value); });
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
      if (!document.hidden && state.route === 'world' && state.tick) state.tick();
    });

    renderRoute({ focus: false });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
}());
