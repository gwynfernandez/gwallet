/* GWallet — app shell, router, and views. Classic script (works from file://). No network calls. */
(function () {
  'use strict';
  var GW = window.GW;
  var calc = GW.calc, store = GW.store, charts = GW.charts;
  var S = function () { return GW.state; };
  var CURS = GW.CURRENCIES;

  /* ---------- icons (inline SVG, stroke) ---------- */
  var P = {
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/>',
    audit: '<path d="M9 3h6l1 2h3v16H5V5h3z"/><path d="M9 12l2 2 4-4"/>',
    wealth: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    cashflow: '<path d="M7 7h11l-3-3"/><path d="M17 17H6l3 3"/>',
    leaks: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
    debt: '<path d="M14.5 4 20 9.5 9.5 20H4v-5.5z"/><path d="M12 6.5l5.5 5.5"/>',
    transactions: '<path d="M4 6h16M4 12h16M4 18h10"/>',
    bills: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
    copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    wallet: '<path d="M3 7a2 2 0 0 1 2-2h13v4"/><path d="M3 7v11a2 2 0 0 0 2 2h15V9H5a2 2 0 0 1-2-2z"/><circle cx="16" cy="14.5" r="1.2"/>',
    up: '<path d="M7 17 17 7M9 7h8v8"/>',
    down: '<path d="M17 7 7 17M7 9v8h8"/>',
    shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
    alert: '<path d="M12 3 2 21h20z"/><path d="M12 10v5M12 18v.01"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    download: '<path d="M12 4v12M7 11l5 5 5-5M5 20h14"/>',
    upload: '<path d="M12 20V8M7 13l5-5 5 5M5 4h14"/>',
    spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>'
  };
  function icon(n, cls) { return '<svg class="ico ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + (P[n] || '') + '</svg>'; }

  var NAV = [
    { r: 'home', label: 'Dashboard', ico: 'home' },
    { r: 'audit', label: 'Financial Audit', ico: 'audit', tool: true },
    { r: 'wealth', label: 'Wealth Plan', ico: 'wealth', tool: true },
    { r: 'cashflow', label: 'Cash Flow', ico: 'cashflow', tool: true },
    { r: 'leaks', label: 'Money Leaks', ico: 'leaks', tool: true },
    { r: 'debt', label: 'Debt Destroyer', ico: 'debt', tool: true },
    { r: 'transactions', label: 'Transactions', ico: 'transactions', sep: true },
    { r: 'bills', label: 'Bills', ico: 'bills' },
    { r: 'settings', label: 'Settings', ico: 'settings' }
  ];
  var BOTTOM = [
    { r: 'home', label: 'Home', ico: 'home' },
    { r: 'transactions', label: 'Txns', ico: 'transactions' },
    { r: 'bills', label: 'Bills', ico: 'bills' },
    { r: 'settings', label: 'Settings', ico: 'settings' },
    { r: '__menu', label: 'Menu', ico: 'menu' }
  ];
  var TOOLS = {
    audit: { title: 'Financial Audit', ico: 'audit', color: 'blue', blurb: 'Income, spending, assets and debts per currency. Get a health check.' },
    wealth: { title: 'Wealth-Building Plan', ico: 'wealth', color: 'green', blurb: 'Goals, monthly amounts needed, and your emergency-fund target.' },
    cashflow: { title: 'Cash Flow Optimization', ico: 'cashflow', color: 'cyan', blurb: 'Money in and out by due date. See the month\'s lowest point.' },
    leaks: { title: 'Money Leaks', ico: 'leaks', color: 'yellow', blurb: 'Subscriptions, delivery, coffee, and BNPL (Atome, SPayLater).' },
    debt: { title: 'Debt Destroyer', ico: 'debt', color: 'red', blurb: 'Avalanche vs snowball and your payoff date, per currency.' }
  };

  /* ---------- helpers ---------- */
  function esc(s) { return String(s === undefined || s === null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  var fmt = calc.fmt, pct = calc.pct;
  var toastTimer;
  function toast(msg) {
    var t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2600);
  }
  function copyText(text) {
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      var ok = false; try { ok = document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(ta);
      return Promise.resolve(ok);
    }
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(function () { return true; }, fallback);
    }
    return fallback();
  }
  function monthName(ymStr) {
    var p = ymStr.split('-'); var d = new Date(+p[0], +p[1] - 1, 1);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }
  function daysIn(ymStr) { var p = ymStr.split('-'); return new Date(+p[0], +p[1], 0).getDate(); }
  function curBadge(c) { return '<span class="cur cur-' + c.toLowerCase() + '">' + c + '</span>'; }
  function exampleCount() { return store.countExamples(); }
  var ui = { homeCfCur: 'THB', homeDonutCur: 'THB', txCur: 'ALL', txQuery: '', txMonth: null };

  /* ---------- editable list ("editor") ---------- */
  var CUR_OPTS = [['PHP', 'PHP ₱'], ['THB', 'THB ฿']];
  var DEFAULTS = {
    income: function () { return { name: '', currency: 'THB', amount: 0 }; },
    expenses: function () { return { name: '', currency: 'THB', amount: 0, tag: 'need' }; },
    assets: function () { return { name: '', currency: 'THB', amount: 0, kind: 'cash' }; },
    debts: function () { return { name: '', currency: 'PHP', balance: 0, rate: 0, minPayment: 0, bnpl: false }; },
    goals: function () { return { name: '', currency: 'THB', target: 0, current: 0, date: '' }; },
    cashflow: function () { return { name: '', type: 'out', currency: 'THB', amount: 0, day: 1 }; },
    leaks: function () { return { name: '', currency: 'THB', amount: 0, frequency: 'monthly', kind: 'subscription' }; },
    transactions: function () {
      var m = ui.txMonth || S().settings.month, today = new Date();
      var d = m === store.ym(0) ? String(today.getDate()).padStart(2, '0') : '01';
      return { date: m + '-' + d, desc: '', category: '', type: 'out', currency: ui.txCur === 'PHP' ? 'PHP' : 'THB', amount: 0 };
    },
    bills: function () { return { name: '', currency: 'THB', amount: 0, dueDay: 1, paid: false }; }
  };
  var COLS = {
    income: [{ f: 'name', label: 'Source', type: 'text', w: '2.2fr', ph: 'e.g. Coaching income' }, { f: 'currency', label: 'Cur', type: 'select', opts: CUR_OPTS, w: '84px' }, { f: 'amount', label: 'Per month', type: 'number', w: '1fr' }],
    expenses: [{ f: 'name', label: 'Category', type: 'text', w: '2fr', ph: 'e.g. Rent, Grab' }, { f: 'currency', label: 'Cur', type: 'select', opts: CUR_OPTS, w: '84px' }, { f: 'amount', label: 'Per month', type: 'number', w: '1fr' }, { f: 'tag', label: 'Type', type: 'select', opts: [['need', 'Need'], ['want', 'Want'], ['subscription', 'Subscription'], ['bnpl', 'BNPL'], ['savings', 'Savings']], w: '1fr' }],
    assets: [{ f: 'name', label: 'Asset', type: 'text', w: '2fr', ph: 'e.g. Bank account' }, { f: 'currency', label: 'Cur', type: 'select', opts: CUR_OPTS, w: '84px' }, { f: 'amount', label: 'Value', type: 'number', w: '1fr' }, { f: 'kind', label: 'Kind', type: 'select', opts: [['cash', 'Cash/bank'], ['emergency', 'Emergency fund'], ['investment', 'Investment'], ['other', 'Other']], w: '1.1fr' }],
    debts: [{ f: 'name', label: 'Debt', type: 'text', w: '1.8fr', ph: 'e.g. Credit card' }, { f: 'currency', label: 'Cur', type: 'select', opts: CUR_OPTS, w: '84px' }, { f: 'balance', label: 'Balance', type: 'number', w: '1fr' }, { f: 'rate', label: 'APR %', type: 'number', w: '.7fr' }, { f: 'minPayment', label: 'Min / mo', type: 'number', w: '.9fr' }, { f: 'bnpl', label: 'BNPL', type: 'checkbox', w: '46px' }],
    goals: [{ f: 'name', label: 'Goal', type: 'text', w: '1.8fr', ph: 'e.g. Emergency fund' }, { f: 'currency', label: 'Cur', type: 'select', opts: CUR_OPTS, w: '84px' }, { f: 'target', label: 'Target', type: 'number', w: '1fr' }, { f: 'current', label: 'Saved', type: 'number', w: '1fr' }, { f: 'date', label: 'Target date', type: 'date', w: '1.2fr' }],
    cashflow: [{ f: 'name', label: 'Item', type: 'text', w: '1.8fr', ph: 'e.g. Salary, Rent' }, { f: 'type', label: 'In/Out', type: 'select', opts: [['in', 'In'], ['out', 'Out']], w: '80px' }, { f: 'currency', label: 'Cur', type: 'select', opts: CUR_OPTS, w: '84px' }, { f: 'amount', label: 'Amount', type: 'number', w: '1fr' }, { f: 'day', label: 'Due day', type: 'day', w: '78px' }],
    leaks: [{ f: 'name', label: 'Spend', type: 'text', w: '1.8fr', ph: 'e.g. Netflix, coffee' }, { f: 'currency', label: 'Cur', type: 'select', opts: CUR_OPTS, w: '84px' }, { f: 'amount', label: 'Amount', type: 'number', w: '.9fr' }, { f: 'frequency', label: 'How often', type: 'select', opts: [['daily', 'Daily'], ['weekly', 'Weekly'], ['monthly', 'Monthly'], ['quarterly', 'Quarterly'], ['yearly', 'Yearly']], w: '1fr' }, { f: 'kind', label: 'Kind', type: 'select', opts: [['subscription', 'Subscription'], ['delivery', 'Delivery'], ['coffee', 'Coffee'], ['small', 'Small spend'], ['bnpl', 'BNPL'], ['other', 'Other']], w: '1fr' }],
    transactions: [{ f: 'date', label: 'Date', type: 'date', w: '1.1fr' }, { f: 'desc', label: 'Description', type: 'text', w: '1.8fr', ph: 'e.g. Grab ride' }, { f: 'category', label: 'Category', type: 'text', w: '1fr', ph: 'Food' }, { f: 'type', label: 'In/Out', type: 'select', opts: [['in', 'In'], ['out', 'Out']], w: '80px' }, { f: 'currency', label: 'Cur', type: 'select', opts: CUR_OPTS, w: '84px' }, { f: 'amount', label: 'Amount', type: 'number', w: '1fr' }],
    bills: [{ f: 'name', label: 'Bill', type: 'text', w: '2fr', ph: 'e.g. Rent, phone' }, { f: 'currency', label: 'Cur', type: 'select', opts: CUR_OPTS, w: '84px' }, { f: 'amount', label: 'Amount', type: 'number', w: '1fr' }, { f: 'dueDay', label: 'Due day', type: 'day', w: '78px' }, { f: 'paid', label: 'Paid', type: 'checkbox', w: '46px' }]
  };

  function field(key, row, c) {
    var v = row[c.f], a = 'data-k="' + key + '" data-id="' + esc(row.id) + '" data-f="' + c.f + '" aria-label="' + esc(c.label) + '"';
    var inner;
    if (c.type === 'select') inner = '<select ' + a + '>' + c.opts.map(function (o) { return '<option value="' + o[0] + '"' + (String(v) === o[0] ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select>';
    else if (c.type === 'checkbox') inner = '<input type="checkbox" ' + a + (v ? ' checked' : '') + '>';
    else if (c.type === 'number') inner = '<input type="number" inputmode="decimal" step="any" min="0" ' + a + ' value="' + esc(v === 0 || v ? v : '') + '">';
    else if (c.type === 'day') inner = '<input type="number" inputmode="numeric" min="1" max="31" step="1" ' + a + ' value="' + esc(v || '') + '">';
    else if (c.type === 'date') inner = '<input type="date" ' + a + ' value="' + esc(v || '') + '">';
    else inner = '<input type="text" ' + a + ' value="' + esc(v) + '" placeholder="' + esc(c.ph || '') + '">';
    return '<label class="ef ef-' + c.type + ' ef-' + c.f + '"><span class="ef-l">' + esc(c.label) + '</span>' + inner + '</label>';
  }
  function editor(key, opts) {
    opts = opts || {};
    var cols = COLS[key];
    var rows = S()[key].filter(opts.filter || function () { return true; });
    var tpl = cols.map(function (c) { return c.w; }).join(' ') + ' 40px';
    var h = '<div class="editor" data-editor="' + key + '" style="--tpl:' + tpl + '">';
    h += '<div class="erow ehead" aria-hidden="true">' + cols.map(function (c) { return '<span>' + esc(c.label) + '</span>'; }).join('') + '<span></span></div>';
    if (!rows.length) h += '<div class="empty">' + esc(opts.empty || 'Nothing here yet. Add a row.') + '</div>';
    rows.forEach(function (r) {
      h += '<div class="erow' + (r.example ? ' is-example' : '') + '" data-row="' + esc(r.id) + '">' + cols.map(function (c) { return field(key, r, c); }).join('') +
        '<button class="icon-btn del" data-del="' + key + '" data-id="' + esc(r.id) + '" aria-label="Delete row" title="Delete">' + icon('trash') + '</button>' +
        (r.example ? '<span class="ex-badge">example</span>' : '') + '</div>';
    });
    h += '</div><button class="btn btn-ghost btn-sm add" data-add="' + key + '">' + icon('plus') + (opts.addLabel || 'Add row') + '</button>';
    return h;
  }
  function findRow(key, id) { return S()[key].filter(function (r) { return r.id === id; })[0]; }

  /* ---------- layout bits ---------- */
  function card(title, body, opts) {
    opts = opts || {};
    return '<section class="card ' + (opts.cls || '') + '"' + (opts.id ? ' id="' + opts.id + '"' : '') + '>' +
      (title ? '<div class="card-head"><h3>' + title + '</h3>' + (opts.right || '') + '</div>' : '') + body + '</section>';
  }
  function seg(name, value, options) {
    return '<div class="seg" role="group" data-seg="' + name + '">' + options.map(function (o) {
      return '<button type="button" data-seg-v="' + o + '" class="' + (o === value ? 'on' : '') + '" aria-pressed="' + (o === value) + '">' + o + '</button>';
    }).join('') + '</div>';
  }
  function bar(p, color) { return '<div class="bar"><i style="width:' + Math.round(Math.max(0, Math.min(p, 1)) * 100) + '%;background:' + (color || 'var(--primary)') + '"></i></div>'; }
  function levelIco(l) { return l === 'good' ? 'shield' : l === 'info' ? 'spark' : 'alert'; }
  function checks(list) {
    return '<ul class="checks">' + list.map(function (c) { return '<li class="lvl-' + c.level + '">' + icon(levelIco(c.level)) + '<span>' + esc(c.text) + '</span></li>'; }).join('') + '</ul>';
  }
  function examplesBanner() {
    var n = exampleCount();
    if (!n) return '';
    return '<div class="banner">' + icon('spark') + '<div><b>Showing example placeholders.</b> These are not your real numbers (' + n + ' rows marked "example"). Replace them or clear them in one tap.</div><button class="btn btn-sm btn-primary" data-action="clear-examples">Clear examples</button></div>';
  }
  function pageHead(title, sub, right) {
    return '<div class="page-head"><div><h1>' + title + '</h1>' + (sub ? '<p class="muted">' + sub + '</p>' : '') + '</div>' + (right ? '<div class="page-actions">' + right + '</div>' : '') + '</div>';
  }

  /* ---------- tool page scaffold ---------- */
  function toolPage(tool, inputsHtml) {
    var t = TOOLS[tool], s = S();
    var right = '<button class="btn btn-primary" data-action="copy-prompt" data-tool="' + tool + '">' + icon('copy') + 'Copy prompt</button>' +
      '<button class="btn btn-ghost" data-action="preview-prompt" data-tool="' + tool + '">Preview</button>';
    var h = pageHead('<span class="h-ico ic-' + t.color + '">' + icon(t.ico) + '</span>' + t.title, t.blurb + ' Calculated locally, per currency. PHP and THB are never combined.', right);
    h += examplesBanner();
    h += '<div class="tool-grid"><div class="tool-inputs">' + starterCard(tool) + inputsHtml +
      card('Paste your data', '<p class="muted small">Paste anything extra (bank SMS, app screenshots typed out, statement lines). It is saved in this browser only and included in the copied prompt.</p><textarea class="area" data-text="pasted" data-tool="' + tool + '" rows="5" placeholder="e.g. 03/10 GRAB *TRIP 189.00 THB">' + esc(s.pasted[tool] || '') + '</textarea>') +
      '</div><div class="tool-results"><div id="results"></div>' +
      card('My notes', '<p class="muted small">Private notes, saved in this browser only.</p><textarea class="area" data-text="notes" data-tool="' + tool + '" rows="4" placeholder="What I want to change this month...">' + esc(s.notes[tool] || '') + '</textarea>') +
      card('Ask a chat AI', '<p class="muted small">"Copy prompt" copies your starter prompt plus your money rules and current data. Paste it into ChatGPT, Grok, or any chat AI. GWallet itself never sends anything.</p><button class="btn btn-primary btn-block" data-action="copy-prompt" data-tool="' + tool + '">' + icon('copy') + 'Copy prompt</button>') +
      '</div></div>';
    return h;
  }

  function starterState(tool) {
    var c = GW.prompts.isCustom(S(), tool);
    return '<span class="pill' + (c ? ' pill-on' : '') + '" id="starterState">' + (c ? 'Edited' : 'Default') + '</span>';
  }
  function starterCard(tool) {
    var txt = GW.prompts.starter(S(), tool);
    return card('Starter prompt', '<p class="muted small">Edit this to change how the chat AI helps you. Copy prompt sends this text, then your money rules and current data below it. Saved in this browser only.</p>' +
      '<textarea class="area starter" data-starter="' + tool + '" rows="9" aria-label="Starter prompt for ' + esc(TOOLS[tool].title) + '">' + esc(txt) + '</textarea>' +
      '<div class="starter-foot"><button type="button" class="linkbtn" data-action="reset-starter" data-tool="' + tool + '">Reset to default</button><button type="button" class="btn btn-primary btn-sm" data-action="copy-prompt" data-tool="' + tool + '">' + icon('copy') + 'Copy prompt</button></div>',
      { right: starterState(tool), cls: 'starter-card' });
  }

  /* ================= VIEWS ================= */
  var views = {};

  /* ---------- Home ---------- */
  views.home = {
    render: function () {
      var s = S(), m = s.settings.month;
      var php = calc.summary(s, 'PHP'), thb = calc.summary(s, 'THB');
      var aw = calc.bnplAwareness(s);
      var atomePHP = calc.sum(calc.byCur(s.expenses, 'PHP').filter(function (e) { return /atome/i.test(e.name || ''); }), 'amount');
      var atomeOwed = aw.atomeOwed;
      var hour = new Date().getHours();
      var greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
      var months = []; for (var i = -11; i <= 1; i++) months.push(store.ym(i));
      if (months.indexOf(m) < 0) months.unshift(m);
      var right = '<label class="date-sel">' + icon('calendar') + '<select id="monthSel" aria-label="Month">' + months.map(function (x) { return '<option value="' + x + '"' + (x === m ? ' selected' : '') + '>' + monthName(x) + '</option>'; }).join('') + '</select></label>';
      var h = '<div class="page-head home-head"><div><h1>Hi Gwyn <span class="wave" aria-hidden="true">👋</span></h1><p class="muted">' + greet + '. Here\'s your money in pesos and baht, kept separate.</p></div><div class="page-actions">' + right + '</div></div>';
      h += examplesBanner();

      function kpi(ico, color, label, main, sub, extra) {
        return '<div class="card kpi"><div class="kpi-ico ic-' + color + '">' + icon(ico) + '</div><div class="kpi-body"><div class="kpi-label">' + label + '</div><div class="kpi-val">' + main + '</div>' + (sub ? '<div class="kpi-sub">' + sub + '</div>' : '') + (extra || '') + '</div></div>';
      }
      function rateTag(r) { if (r === null) return '<span class="tag">n/a</span>'; return '<span class="tag ' + (r >= 0.2 ? 'pos' : r >= 0 ? 'mid' : 'neg') + '">' + icon(r >= 0 ? 'up' : 'down') + pct(r) + '</span>'; }
      h += '<div class="kpis">';
      h += kpi('wallet', 'blue', 'Total Balance', '<span class="split"><span>' + fmt(php.assets, 'PHP') + '</span><span class="pipe">|</span><span>' + fmt(thb.assets, 'THB') + '</span></span>', 'PHP | THB · from your assets, never summed');
      h += kpi('wealth', 'green', 'Monthly Income (THB)', fmt(thb.income, 'THB'), 'PHP pocket: ' + fmt(php.income, 'PHP'));
      h += kpi('debt', 'red', 'Monthly Expenses (PHP)', fmt(php.expenses, 'PHP'), 'THB pocket: ' + fmt(thb.expenses, 'THB'),
        '<div class="kpi-note">' + icon('alert') + (atomeOwed.PHP > 0 ? 'Atome: ' + fmt(atomeOwed.PHP, 'PHP') + ' owed' + (atomeOwed.example ? ' (early-Oct demo)' : '') + '. BNPL counts as debt.' : atomePHP > 0 ? 'Atome: ' + fmt(atomePHP, 'PHP') + '/mo. BNPL counts as debt.' : aw.atome ? 'Atome is in use. BNPL counts as debt.' : 'No Atome spend listed.') + '</div>');
      h += kpi('spark', 'purple', 'Net / Savings rate', '<span class="split"><span>' + fmt(php.net, 'PHP') + '</span><span class="pipe">|</span><span>' + fmt(thb.net, 'THB') + '</span></span>', '<span class="rates">PHP ' + rateTag(php.savingsRate) + ' THB ' + rateTag(thb.savingsRate) + '</span>');
      h += '</div>';

      // charts row
      h += '<div class="grid-2-1">';
      h += card('Cash Flow', '<p class="muted small card-sub">Money in vs out across the month, from your Cash Flow list</p><div class="legend"><span><i style="background:var(--green)"></i>Income</span><span><i style="background:var(--primary)"></i>Expenses</span></div><div id="cfChart" class="chart-box"></div>',
        { right: seg('homeCf', ui.homeCfCur, CURS), cls: 'chart-card' });
      function pl(sm) {
        var c = sm.currency;
        return '<div class="pl"><div class="pl-cur">' + curBadge(c) + '<span class="muted small">' + (c === 'PHP' ? 'Philippine peso' : 'Thai baht') + '</span></div>' +
          '<div class="pl-row"><span>Income</span><b class="pos">' + fmt(sm.income, c) + '</b></div>' +
          '<div class="pl-row"><span>Expenses</span><b class="neg">' + fmt(sm.expenses, c) + '</b></div>' +
          '<div class="pl-row"><span>Debts</span><b>' + fmt(sm.debts, c) + '</b></div>' +
          '<div class="pl-row pl-net"><span>Net / month</span><b class="' + (sm.net >= 0 ? 'pos' : 'neg') + '">' + fmt(sm.net, c) + '</b></div></div>';
      }
      h += card('Pocket Summary', pl(php) + pl(thb), { right: '<span class="pill">Never combined</span>' });
      h += '</div>';

      h += '<div class="grid-1-1">';
      h += card('Expense Breakdown', '<div class="donut-wrap"><div id="donut" class="donut"></div><ul id="donutLegend" class="dlegend"></ul></div>', { right: seg('homeDonut', ui.homeDonutCur, CURS) });
      var goalRows = [];
      CURS.forEach(function (c) { calc.goals(s, c).forEach(function (g) { goalRows.push(g); }); });
      var gh = goalRows.length ? goalRows.slice(0, 5).map(function (g) {
        var c = g.goal.currency;
        return '<div class="goal-row"><div class="goal-top"><span>' + esc(g.goal.name || 'Untitled goal') + ' ' + curBadge(c) + '</span><b>' + Math.round(g.progress * 100) + '%</b></div>' + bar(g.progress, g.progress >= 1 ? 'var(--green)' : 'linear-gradient(90deg,var(--cyan),var(--primary))') + '<div class="goal-meta muted small">' + fmt(g.current, c) + ' of ' + fmt(g.target, c) + (g.monthly ? ' · ' + fmt(g.monthly, c) + '/mo needed' : '') + '</div></div>';
      }).join('') : '<div class="empty">No goals yet. <a href="#/wealth">Add one in Wealth Plan</a>.</div>';
      h += card('Goals Progress', gh, { right: '<a class="link" href="#/wealth">Open plan ' + icon('arrow') + '</a>' });
      h += '</div>';

      // tools
      h += '<div class="section-head"><h2>Your CFO tools</h2><p class="muted small">Inputs, local results, and a ready-made chat-AI prompt in each.</p></div><div class="tools">';
      Object.keys(TOOLS).forEach(function (k) {
        var t = TOOLS[k];
        h += '<a class="card tool-card" href="#/' + k + '"><span class="tool-ico ic-' + t.color + '">' + icon(t.ico) + '</span><h3>' + t.title + '</h3><p class="muted small">' + t.blurb + '</p><span class="link">Open ' + icon('arrow') + '</span></a>';
      });
      h += '</div>';

      // bottom row
      var tx = s.transactions.filter(function (t) { return String(t.date || '').slice(0, 7) === m; }).sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); }).slice(0, 6);
      var txh = tx.length ? '<div class="table-wrap"><table class="tbl"><thead><tr><th>Date</th><th>Description</th><th>Type</th><th class="r">Amount</th></tr></thead><tbody>' + tx.map(function (t) {
        return '<tr><td class="muted">' + esc(t.date) + '</td><td>' + esc(t.desc) + (t.example ? ' <span class="ex-badge inline">example</span>' : '') + '</td><td><span class="tag ' + (t.type === 'in' ? 'pos' : 'neg') + '">' + (t.type === 'in' ? 'Income' : 'Expense') + '</span></td><td class="r ' + (t.type === 'in' ? 'pos' : 'neg') + '">' + (t.type === 'in' ? '+' : '-') + fmt(t.amount, t.currency) + '</td></tr>';
      }).join('') + '</tbody></table></div>' : '<div class="empty">No transactions in ' + monthName(m) + '. <a href="#/transactions">Add one</a>.</div>';
      var today = new Date().getDate();
      var bills = s.bills.filter(function (b) { return !b.paid; }).slice().sort(function (a, b) {
        var da = (calc.num(a.dueDay) - today + 31) % 31, db = (calc.num(b.dueDay) - today + 31) % 31; return da - db;
      }).slice(0, 5);
      var bh = bills.length ? '<ul class="activity">' + bills.map(function (b) {
        var bn = calc.isBnplName(b.name);
        return '<li><span class="act-ico ic-' + (bn ? 'yellow' : 'blue') + '">' + icon(bn ? 'alert' : 'bills') + '</span><div><b>' + esc(b.name) + '</b><small class="muted">Due day ' + esc(b.dueDay) + (bn ? ' · BNPL' : '') + '</small></div><span class="neg">' + fmt(b.amount, b.currency) + '</span></li>';
      }).join('') + '</ul>' : '<div class="empty">No unpaid bills. <a href="#/bills">Manage bills</a>.</div>';
      h += '<div class="grid-2-1">';
      h += card('Recent Transactions', txh, { right: '<a class="link" href="#/transactions">View all ' + icon('arrow') + '</a>' });
      h += card('Upcoming Bills', bh, { right: '<a class="link" href="#/bills">View all ' + icon('arrow') + '</a>' });
      h += '</div>';
      h += card('My money rules', '<ol class="rules">' + s.rules.map(function (r) { return '<li>' + esc(r) + '</li>'; }).join('') + '</ol>', { cls: 'rules-card', right: '<a class="link" href="#/settings#rules">Edit ' + icon('arrow') + '</a>' });
      return h;
    },
    after: function () { drawHomeCharts(); }
  };
  function drawHomeCharts() {
    var s = S(), cur = ui.homeCfCur, box = $('#cfChart');
    if (box) {
      var n = daysIn(s.settings.month), inc = [], out = [], ci = 0, co = 0;
      var items = calc.byCur(s.cashflow, cur);
      for (var d = 1; d <= n; d++) {
        items.forEach(function (it) { if (Math.min(calc.num(it.day), n) === d) { if (it.type === 'in') ci += calc.num(it.amount); else co += calc.num(it.amount); } });
        inc.push(ci); out.push(co);
      }
      var mn = monthName(s.settings.month).split(' ')[0].slice(0, 3);
      charts.line(box, [{ name: 'Income', color: '#22C55E', values: inc, fill: true }, { name: 'Expenses', color: '#2F6BFF', values: out, fill: true }], {
        sym: GW.SYMBOL[cur], label: 'Cumulative cash flow ' + cur, height: 230,
        xLabel: function (i) { return mn + ' ' + (i + 1); }, tipTitle: function (i) { return mn + ' ' + (i + 1) + ' · ' + cur; },
        format: function (v) { return fmt(v, cur); }
      });
    }
    var dbox = $('#donut');
    if (dbox) {
      var dc = ui.homeDonutCur, a = calc.audit(s, dc), colors = ['#2F6BFF', '#22D3EE', '#8B5CF6', '#22C55E', '#FACC15', '#EF4444', '#6366F1'];
      var sl = a.shares.slice(0, 6).map(function (x, i) { return { name: x.name, value: x.amount, share: x.share, color: colors[i] }; });
      if (a.shares.length > 6) { var rest = a.shares.slice(6).reduce(function (t, x) { return t + x.amount; }, 0); sl.push({ name: 'Other', value: rest, share: rest / a.summary.expenses, color: '#64748B' }); }
      charts.donut(dbox, sl, { center: fmt(a.summary.expenses, dc), sub: 'Expenses / mo', label: 'Expense breakdown ' + dc });
      $('#donutLegend').innerHTML = sl.length ? sl.map(function (x) { return '<li><i style="background:' + x.color + '"></i><span class="dl-name">' + esc(x.name) + '</span><span class="muted">' + pct(x.share) + '</span><b>' + fmt(x.value, dc) + '</b></li>'; }).join('') : '<li class="muted">No ' + dc + ' expenses yet. <a href="#/audit">Add in Audit</a>.</li>';
    }
  }

  /* ---------- Audit ---------- */
  views.audit = {
    render: function () {
      return toolPage('audit',
        card('Monthly income', editor('income', { addLabel: 'Add income' })) +
        card('Monthly expenses by category', editor('expenses', { addLabel: 'Add expense' })) +
        card('Assets', editor('assets', { addLabel: 'Add asset' })) +
        card('Debts', '<p class="muted small">Shared with Debt Destroyer. Tick BNPL for Atome, SPayLater, and similar.</p>' + editor('debts', { addLabel: 'Add debt' })));
    },
    live: function () {
      var s = S();
      $('#results').innerHTML = CURS.map(function (c) {
        var a = calc.audit(s, c), sm = a.summary;
        var stats = '<div class="stats">' +
          stat('Income', fmt(sm.income, c), 'pos') + stat('Expenses', fmt(sm.expenses, c), 'neg') + stat('Net', fmt(sm.net, c), sm.net >= 0 ? 'pos' : 'neg') +
          stat('Savings rate', pct(sm.savingsRate)) + stat('Debt-to-income', pct(sm.dti)) + stat('Net worth', fmt(sm.netWorth, c), sm.netWorth >= 0 ? '' : 'neg') + '</div>';
        var shares = a.shares.length ? '<h4>Expense share</h4>' + a.shares.map(function (x) { return '<div class="share"><span>' + esc(x.name) + '</span><span class="muted">' + fmt(x.amount, c) + ' · ' + pct(x.share) + '</span>' + bar(x.share) + '</div>'; }).join('') : '';
        return card(curBadge(c) + ' Health check', stats + checks(a.checks) + shares, { cls: 'result-card' });
      }).join('');
    }
  };
  function stat(label, val, cls) { return '<div class="stat"><span class="muted small">' + label + '</span><b class="' + (cls || '') + '">' + val + '</b></div>'; }

  /* ---------- Wealth ---------- */
  views.wealth = {
    render: function () {
      var s = S();
      var ef = '<div class="inline-form"><label>Emergency fund target <select data-setting="efMonths">' + [3, 4, 5, 6, 9, 12].map(function (n) { return '<option value="' + n + '"' + (Number(s.settings.efMonths) === n ? ' selected' : '') + '>' + n + ' months of expenses</option>'; }).join('') + '</select></label></div><p class="muted small">Uses monthly expenses plus minimum debt payments per currency. Mark savings as "Emergency fund" in Audit &gt; Assets to count them.</p>';
      return toolPage('wealth', card('Goals', editor('goals', { addLabel: 'Add goal' })) + card('Emergency fund', ef));
    },
    live: function () {
      var s = S();
      $('#results').innerHTML = CURS.map(function (c) {
        var e = calc.emergency(s, c), gs = calc.goals(s, c);
        var efh = '<div class="ef-box"><div class="goal-top"><span>Emergency fund (' + e.months + ' mo)</span><b>' + Math.round(e.progress * 100) + '%</b></div>' + bar(e.progress, 'var(--green)') +
          '<div class="muted small">Have ' + fmt(e.have, c) + ' · 3-month minimum ' + fmt(e.min3, c) + ' · target ' + fmt(e.target, c) + (e.coverage !== null ? ' · covers ' + (Math.round(e.coverage * 10) / 10) + ' months' : '') + '</div></div>';
        var gh = gs.length ? gs.map(function (g) {
          return '<div class="goal-row"><div class="goal-top"><span>' + esc(g.goal.name || 'Untitled') + '</span><b>' + Math.round(g.progress * 100) + '%</b></div>' + bar(g.progress, 'linear-gradient(90deg,var(--cyan),var(--primary))') +
            '<div class="muted small">' + fmt(g.current, c) + ' of ' + fmt(g.target, c) + ' · ' + (g.remaining <= 0 ? 'Done 🎉' : g.monthly === null ? 'Set a target date to get a monthly amount' : '<b class="hl">' + fmt(g.monthly, c) + '/mo</b> for ' + g.months + ' mo') + '</div></div>';
        }).join('') : '<div class="empty">No ' + c + ' goals.</div>';
        var need = gs.reduce(function (t, g) { return t + (g.monthly || 0); }, 0), sm = calc.summary(s, c);
        var tips = [];
        if (e.have < e.min3) tips.push({ level: 'warn', text: 'Protect first: build the ' + c + ' emergency fund to at least ' + fmt(e.min3, c) + ' before investing.' });
        if (need > 0 && sm.net < need) tips.push({ level: 'bad', text: 'Goals need ' + fmt(need, c) + '/mo but your ' + c + ' surplus is ' + fmt(sm.net, c) + '. Push a date back or trim a target.' });
        else if (need > 0) tips.push({ level: 'good', text: 'Goals need ' + fmt(need, c) + '/mo; surplus ' + fmt(sm.net, c) + ' covers it. Automate it on payday.' });
        return card(curBadge(c) + ' Plan', efh + gh + (tips.length ? checks(tips) : ''), { cls: 'result-card' });
      }).join('');
    }
  };

  /* ---------- Cash flow ---------- */
  views.cashflow = {
    render: function () {
      var s = S();
      var sb = '<div class="inline-form">' + CURS.map(function (c) { return '<label>' + c + ' balance on day 1 <input type="number" step="any" inputmode="decimal" data-setting="startBalance.' + c + '" value="' + esc(s.settings.startBalance[c]) + '"></label>'; }).join('') + '</div>';
      return toolPage('cashflow', card('Starting balances', sb) + card('Monthly in / out with due days', editor('cashflow', { addLabel: 'Add item' })));
    },
    live: function () {
      var s = S();
      $('#results').innerHTML = CURS.map(function (c) {
        var cf = calc.cashflow(s, c);
        var st = '<div class="stats">' + stat('In', fmt(cf.inflow, c), 'pos') + stat('Out', fmt(cf.outflow, c), 'neg') + stat('Month net', fmt(cf.net, c), cf.net >= 0 ? 'pos' : 'neg') +
          stat('Lowest point', fmt(cf.low, c) + (cf.lowDay ? ' <small class="muted">day ' + cf.lowDay + '</small>' : ''), cf.low < 0 ? 'neg' : '') + stat('Ends at', fmt(cf.end, c)) + '</div>';
        var tl = cf.rows.length ? '<div class="timeline">' + cf.rows.map(function (r) {
          return '<div class="tl-row"><span class="tl-day">' + esc(r.item.day) + '</span><span class="tl-name">' + esc(r.item.name) + '</span><span class="' + (r.item.type === 'in' ? 'pos' : 'neg') + '">' + (r.item.type === 'in' ? '+' : '-') + fmt(r.item.amount, c) + '</span><span class="tl-bal ' + (r.balance < 0 ? 'neg' : '') + '">' + fmt(r.balance, c) + '</span></div>';
        }).join('') + '</div>' : '';
        return card(curBadge(c) + ' This month', st + tl + checks(cf.tips), { cls: 'result-card' });
      }).join('');
    }
  };

  /* ---------- Leaks ---------- */
  views.leaks = {
    render: function () {
      return toolPage('leaks', card('Recurring & small spends', '<p class="muted small">Subscriptions, delivery, coffee, convenience-store runs, and BNPL. Set how often to see the real monthly and yearly cost.</p>' + editor('leaks', { addLabel: 'Add spend' })));
    },
    live: function () {
      var s = S(), aw = calc.bnplAwareness(s);
      function flag(name, on, owed) {
        var amt = CURS.filter(function (c) { return owed[c] > 0; }).map(function (c) { return fmt(owed[c], c); }).join(' | ');
        return '<div class="bnpl-flag ' + (on ? 'on' : '') + '">' + icon(on ? 'alert' : 'shield') + '<div><b>' + name + '</b>' +
          (amt ? '<span class="bnpl-amt">' + amt + ' owed' + (owed.example ? ' <span class="ex-badge inline">' + (owed.demo ? 'demo/example' : 'example') + '</span>' : '') + '</span>' : '') +
          '<small>' + (on ? 'In use. Counts as debt. No new purchases until cleared.' : 'Not found in your lists.') + '</small></div></div>';
      }
      var aware = card('BNPL awareness', '<div class="bnpl-grid">' + flag('Atome', aw.atome, aw.atomeOwed) + flag('SPayLater / Shopee PayLater (Spay)', aw.spay, aw.spayOwed) + '</div>' +
        '<p class="muted small">BNPL debts in Debt Destroyer: ' + aw.debtsListed + (aw.debtsListed ? ' (' + CURS.filter(function (c) { return aw.debtTotals[c] > 0; }).map(function (c) { return fmt(aw.debtTotals[c], c); }).join(' | ') + ')' : '') + '. ' +
        ((aw.atome || aw.spay) && !aw.debtsListed ? '<b class="neg">You use BNPL but have no BNPL debt listed. Add the balances in Debt Destroyer.</b>' : 'Rule 3: watch Atome and SPayLater.') + '</p>', { cls: 'result-card warn-card' });
      $('#results').innerHTML = aware + CURS.map(function (c) {
        var l = calc.leaks(s, c);
        var rows = l.rows.length ? '<div class="table-wrap"><table class="tbl"><thead><tr><th>Spend</th><th class="r">Monthly</th><th class="r">Yearly</th></tr></thead><tbody>' + l.rows.map(function (r) {
          return '<tr><td>' + esc(r.leak.name) + (r.flag ? ' <span class="tag ' + (r.flag === 'BNPL' ? 'warn' : r.flag === 'Leak' ? 'neg' : 'mid') + '">' + r.flag + '</span>' : '') + '</td><td class="r">' + fmt(r.monthly, c) + '</td><td class="r neg">' + fmt(r.yearly, c) + '</td></tr>';
        }).join('') + '</tbody></table></div>' : '<div class="empty">No ' + c + ' spends listed.</div>';
        var top = l.rows[0];
        var tips = [];
        if (top) tips.push({ level: 'warn', text: 'Biggest leak: ' + top.leak.name + ' at ' + fmt(top.yearly, c) + '/year. Cutting it in half saves ' + fmt(top.yearly / 2, c) + '.' });
        var daily = l.rows.filter(function (r) { return r.leak.frequency === 'daily'; });
        if (daily.length) tips.push({ level: 'info', text: 'Daily habits (' + daily.map(function (r) { return r.leak.name; }).join(', ') + ') cost ' + fmt(daily.reduce(function (t, r) { return t + r.yearly; }, 0), c) + '/year.' });
        return card(curBadge(c) + ' Leaks', '<div class="stats">' + stat('Per month', fmt(l.monthly, c), 'neg') + stat('Per year', fmt(l.yearly, c), 'neg') + '</div>' + rows + (tips.length ? checks(tips) : ''), { cls: 'result-card' });
      }).join('');
    }
  };

  /* ---------- Debt ---------- */
  views.debt = {
    render: function () {
      var s = S();
      var ex = '<div class="inline-form">' + CURS.map(function (c) { return '<label>Extra ' + c + ' per month <input type="number" min="0" step="any" inputmode="decimal" data-setting="extra.' + c + '" value="' + esc(s.settings.extra[c]) + '"></label>'; }).join('') + '</div><p class="muted small">Extra goes on top of all minimum payments, in that currency only.</p>';
      return toolPage('debt', card('Debts', '<p class="muted small">Tick BNPL for Atome, SPayLater (Spay), and similar. BNPL counts as debt.</p>' + editor('debts', { addLabel: 'Add debt' })) + card('Extra payment', ex));
    },
    live: function () {
      var s = S();
      $('#results').innerHTML = CURS.map(function (c) {
        var extra = s.settings.extra[c] || 0;
        var av = calc.payoff(s, c, 'avalanche', extra), sn = calc.payoff(s, c, 'snowball', extra);
        if (!av.count) return card(curBadge(c) + ' Payoff', '<div class="empty">No ' + c + ' debts. 🎉</div>', { cls: 'result-card' });
        function col(name, r, desc) {
          return '<div class="strat"><h4>' + name + '</h4><p class="muted small">' + desc + '</p><ol>' + r.order.map(function (d) { return '<li>' + esc(d.name) + ' <span class="muted small">' + d.apr + '%' + (d.paidMonth ? ' · paid mo ' + d.paidMonth : '') + '</span></li>'; }).join('') + '</ol><div class="strat-foot"><b>' + calc.monthsLabel(r.months) + '</b><span class="muted small">interest ~' + fmt(r.interest, c) + '</span></div></div>';
        }
        var tips = [];
        var diff = sn.interest - av.interest;
        if (av.months === null) tips.push({ level: 'bad', text: 'At this budget the ' + c + ' debts never clear. Raise minimums or add an extra payment.' });
        else if (diff > 1) tips.push({ level: 'good', text: 'Avalanche saves about ' + fmt(diff, c) + ' in interest versus snowball.' });
        else tips.push({ level: 'info', text: 'Both methods cost about the same here. Snowball gives quicker wins.' });
        if (calc.byCur(s.debts, c).some(function (d) { return d.bnpl || calc.isBnplName(d.name); })) tips.push({ level: 'warn', text: 'BNPL in ' + c + ': freeze new Atome/SPayLater purchases while paying these down.' });
        if (!extra) tips.push({ level: 'info', text: 'Try an extra ' + fmt(Math.max(Math.round(av.budget * 0.1 / 100) * 100, 100), c) + '/mo above to see how much faster you finish.' });
        return card(curBadge(c) + ' Payoff', '<div class="stats">' + stat('Total debt', fmt(av.total, c), 'neg') + stat('Monthly budget', fmt(av.budget, c)) + '</div><div class="strats">' + col('Avalanche', av, 'Highest interest first. Least interest.') + col('Snowball', sn, 'Smallest balance first. Quick wins.') + '</div>' + checks(tips), { cls: 'result-card' });
      }).join('');
    }
  };

  /* ---------- Transactions ---------- */
  views.transactions = {
    render: function () {
      var s = S();
      ui.txMonth = ui.txMonth || s.settings.month;
      var months = []; for (var i = -11; i <= 1; i++) months.push(store.ym(i));
      if (months.indexOf(ui.txMonth) < 0) months.unshift(ui.txMonth);
      var filters = '<div class="filters"><label class="date-sel">' + icon('calendar') + '<select id="txMonth" aria-label="Month">' + months.map(function (x) { return '<option value="' + x + '"' + (x === ui.txMonth ? ' selected' : '') + '>' + monthName(x) + '</option>'; }).join('') + '<option value="ALL"' + (ui.txMonth === 'ALL' ? ' selected' : '') + '>All dates</option></select></label>' +
        seg('txCur', ui.txCur, ['ALL', 'PHP', 'THB']) + '<input class="search-inline" id="txQuery" type="search" placeholder="Filter..." value="' + esc(ui.txQuery) + '" aria-label="Filter transactions"></div>';
      var f = txFilter();
      return pageHead('<span class="h-ico ic-blue">' + icon('transactions') + '</span>Transactions', 'A simple log per currency. Stored in this browser only.') + examplesBanner() +
        '<div id="results"></div>' + card('Entries', filters + editor('transactions', { filter: f, addLabel: 'Add transaction', empty: 'No transactions match these filters.' }));
    },
    live: function () {
      var s = S(), m = ui.txMonth;
      $('#results').innerHTML = '<div class="grid-1-1">' + CURS.map(function (c) {
        var list = calc.byCur(s.transactions, c).filter(function (t) { return m === 'ALL' || String(t.date || '').slice(0, 7) === m; });
        var inc = calc.sum(list.filter(function (t) { return t.type === 'in'; }), 'amount'), out = calc.sum(list.filter(function (t) { return t.type !== 'in'; }), 'amount');
        return card(curBadge(c) + ' ' + (m === 'ALL' ? 'All time' : monthName(m)), '<div class="stats">' + stat('In', fmt(inc, c), 'pos') + stat('Out', fmt(out, c), 'neg') + stat('Net', fmt(inc - out, c), inc - out >= 0 ? 'pos' : 'neg') + stat('Entries', list.length) + '</div>');
      }).join('') + '</div>';
    }
  };
  function txFilter() {
    var m = ui.txMonth, c = ui.txCur, q = ui.txQuery.toLowerCase();
    return function (t) {
      if (t.__new) return true;
      if (m && m !== 'ALL' && String(t.date || '').slice(0, 7) !== m) return false;
      if (c !== 'ALL' && t.currency !== c) return false;
      if (q && (String(t.desc) + ' ' + String(t.category)).toLowerCase().indexOf(q) < 0) return false;
      return true;
    };
  }

  /* ---------- Bills ---------- */
  views.bills = {
    render: function () {
      return pageHead('<span class="h-ico ic-cyan">' + icon('bills') + '</span>Bills', 'Recurring bills with due days, per currency. Tick paid as you go.', '<button class="btn btn-ghost" data-action="unpay-all">Reset paid for new month</button>') + examplesBanner() +
        '<div id="results"></div>' + card('Bills', editor('bills', { addLabel: 'Add bill' }));
    },
    live: function () {
      var s = S(), today = new Date().getDate();
      $('#results').innerHTML = '<div class="grid-1-1">' + CURS.map(function (c) {
        var list = calc.byCur(s.bills, c), unpaid = list.filter(function (b) { return !b.paid; });
        var next = unpaid.slice().sort(function (a, b) { return ((calc.num(a.dueDay) - today + 31) % 31) - ((calc.num(b.dueDay) - today + 31) % 31); })[0];
        var bn = calc.sum(list.filter(function (b) { return calc.isBnplName(b.name); }), 'amount');
        return card(curBadge(c) + ' Bills', '<div class="stats">' + stat('Monthly total', fmt(calc.sum(list, 'amount'), c)) + stat('Still unpaid', fmt(calc.sum(unpaid, 'amount'), c), unpaid.length ? 'neg' : 'pos') + stat('Next due', next ? esc(next.name) + ' <small class="muted">day ' + esc(next.dueDay) + '</small>' : 'All paid') + stat('BNPL bills', fmt(bn, c), bn ? 'warn' : '') + '</div>');
      }).join('') + '</div>';
    }
  };

  /* ---------- Settings ---------- */
  views.settings = {
    render: function () {
      var s = S(), theme = store.getTheme();
      var th = '<div class="theme-opts">' + [['dark', 'Dark', 'moon'], ['light', 'Light', 'sun'], ['system', 'System', 'spark']].map(function (o) {
        return '<button class="theme-opt ' + (theme === o[0] ? 'on' : '') + '" data-theme-set="' + o[0] + '">' + icon(o[2]) + o[1] + '</button>';
      }).join('') + '</div><p class="muted small">Dark is the default. Saved in this browser.</p>';
      var data = '<div class="btn-row"><button class="btn btn-primary" data-action="export">' + icon('download') + 'Export JSON</button>' +
        '<label class="btn btn-ghost">' + icon('upload') + 'Import JSON<input type="file" id="importFile" accept="application/json,.json" hidden></label>' +
        '<button class="btn btn-ghost" data-action="clear-examples"' + (exampleCount() ? '' : ' disabled') + '>Clear examples (' + exampleCount() + ')</button>' +
        '<button class="btn btn-danger" data-action="reset">' + icon('trash') + 'Reset everything</button></div>' +
        '<p class="muted small">Export saves a backup file you can import on another phone or browser. Reset deletes all GWallet data in this browser and restores the example placeholders.</p>';
      var rules = '<div id="rulesList">' + s.rules.map(function (r, i) {
        return '<div class="rule-row"><span class="rule-n">' + (i + 1) + '</span><textarea class="area" rows="2" data-rule="' + i + '" aria-label="Rule ' + (i + 1) + '">' + esc(r) + '</textarea><button class="icon-btn del" data-rule-del="' + i + '" aria-label="Delete rule">' + icon('trash') + '</button></div>';
      }).join('') + '</div><div class="btn-row"><button class="btn btn-ghost btn-sm" data-action="add-rule">' + icon('plus') + 'Add rule</button><button class="btn btn-ghost btn-sm" data-action="default-rules">Restore default rules</button></div>';
      var priv = '<ul class="plain"><li>No signup, no login, personal use only.</li><li>All data is stored in this browser\'s <code>localStorage</code> under keys starting with <code>gwallet:</code> (<code>gwallet:data</code>, <code>gwallet:theme</code>).</li><li>No network calls, no analytics, no external fonts or CDNs. A Content-Security-Policy blocks remote requests.</li><li>"Copy prompt" only copies text to your clipboard. You choose where to paste it.</li><li>Clearing browser data deletes GWallet data, so export a backup regularly.</li></ul>';
      return pageHead('<span class="h-ico ic-purple">' + icon('settings') + '</span>Settings', 'Theme, backups, and your money rules.') +
        '<div class="grid-1-1">' + card('Theme', th) + card('Your data', data) + '</div>' +
        card('My money rules', rules, { id: 'rules' }) + card('Privacy', priv);
    }
  };

  /* ================= ROUTER ================= */
  var current = null;
  function route() {
    var h = (location.hash || '').replace(/^#\/?/, '').split(/[?#]/)[0] || 'home';
    if (!views[h]) h = 'home';
    current = h;
    var v = views[h];
    var y = window.__keepScroll ? window.scrollY : 0;
    $('#view').innerHTML = v.render();
    if (v.live) v.live();
    if (v.after) v.after();
    $$('[data-route]').forEach(function (a) { var on = a.getAttribute('data-route') === h; a.classList.toggle('active', on); if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    var navItem = NAV.filter(function (n) { return n.r === h; })[0];
    document.title = (navItem ? navItem.label + ' · ' : '') + 'GWallet';
    closeDrawer();
    window.scrollTo(0, y);
    window.__keepScroll = false;
    if (/#rules$/.test(location.hash)) { var r = $('#rules'); if (r) r.scrollIntoView(); }
  }
  function rerender() { window.__keepScroll = true; route(); }
  function live() { var v = views[current]; if (v && v.live) v.live(); if (current === 'home') drawHomeCharts(); }

  function buildNav() {
    $('#sideNav').innerHTML = NAV.map(function (n) {
      return (n.sep ? '<div class="nav-sep"></div>' : '') + (n.r === 'audit' ? '<div class="nav-label">CFO tools</div>' : '') +
        '<a href="#/' + n.r + '" data-route="' + n.r + '">' + icon(n.ico) + '<span>' + n.label + '</span></a>';
    }).join('');
    $('#bottomNav').innerHTML = BOTTOM.map(function (n) {
      return n.r === '__menu' ? '<button type="button" id="bottomMenu" aria-label="Open menu">' + icon(n.ico) + '<span>' + n.label + '</span></button>'
        : '<a href="#/' + n.r + '" data-route="' + n.r + '">' + icon(n.ico) + '<span>' + n.label + '</span></a>';
    }).join('');
    $('#menuBtn').innerHTML = icon('menu');
    $('.search-ico').innerHTML = icon('search');
  }
  function openDrawer() { document.body.classList.add('drawer-open'); $('#scrim').hidden = false; $('#menuBtn').setAttribute('aria-expanded', 'true'); }
  function closeDrawer() { document.body.classList.remove('drawer-open'); $('#scrim').hidden = true; $('#menuBtn').setAttribute('aria-expanded', 'false'); }

  /* ---------- theme ---------- */
  function effectiveTheme(t) { return t === 'system' ? (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark') : t === 'light' ? 'light' : 'dark'; }
  function applyTheme() {
    var t = effectiveTheme(store.getTheme());
    document.documentElement.setAttribute('data-theme', t);
    $('#themeBtn').innerHTML = icon(t === 'dark' ? 'sun' : 'moon');
    $('#themeBtn').setAttribute('aria-label', t === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
    var meta = document.querySelector('meta[name="theme-color"]'); if (meta) meta.setAttribute('content', t === 'dark' ? '#010A1C' : '#F4F7FC');
    if (current === 'home') drawHomeCharts();
  }

  /* ---------- prompt modal ---------- */
  function showPrompt(tool) {
    var text = GW.prompts[tool](S());
    var m = document.createElement('div');
    m.className = 'modal';
    m.innerHTML = '<div class="modal-box" role="dialog" aria-modal="true" aria-label="Prompt preview"><div class="card-head"><h3>Prompt preview</h3><button class="icon-btn" data-close aria-label="Close">' + icon('x') + '</button></div><textarea class="area prompt-text" readonly rows="18">' + esc(text) + '</textarea><div class="btn-row"><button class="btn btn-primary" data-copy>' + icon('copy') + 'Copy prompt</button><button class="btn btn-ghost" data-close>Close</button></div></div>';
    document.body.appendChild(m);
    m.addEventListener('click', function (e) {
      if (e.target === m || e.target.closest('[data-close]')) m.remove();
      else if (e.target.closest('[data-copy]')) copyText(text).then(function (ok) { toast(ok ? 'Prompt copied. Paste it into ChatGPT or Grok.' : 'Select the text and copy it manually.'); });
    });
  }

  /* ---------- events ---------- */
  function onField(el) {
    var k = el.getAttribute('data-k'), id = el.getAttribute('data-id'), f = el.getAttribute('data-f');
    var row = findRow(k, id); if (!row) return;
    var c = COLS[k].filter(function (x) { return x.f === f; })[0];
    var v;
    if (c.type === 'checkbox') v = el.checked;
    else if (c.type === 'number') v = el.value === '' ? 0 : Math.max(Number(el.value), 0);
    else if (c.type === 'day') v = Math.min(Math.max(parseInt(el.value, 10) || 1, 1), 31);
    else v = el.value;
    row[f] = v;
    if ((f === 'name' || f === 'desc') && row.example && !/example/i.test(v)) row.example = false;
    if (!row.example) { var rEl = el.closest('.erow'); if (rEl) { rEl.classList.remove('is-example'); var b = rEl.querySelector('.ex-badge'); if (b) b.remove(); } }
    if (k === 'debts' && f === 'name' && calc.isBnplName(v)) row.bnpl = true;
    store.save(); live();
  }
  function setSetting(path, val) {
    var s = S().settings, p = path.split('.');
    if (p.length === 2) s[p[0]][p[1]] = Number(val) || 0; else s[p[0]] = Number(val) || val;
    store.save(); live();
  }

  document.addEventListener('input', function (e) {
    var el = e.target;
    if (el.hasAttribute('data-k')) {
      if (el.type === 'checkbox' || el.tagName === 'SELECT') return; // handled on change
      onField(el);
    } else if (el.hasAttribute('data-text')) {
      S()[el.getAttribute('data-text')][el.getAttribute('data-tool')] = el.value; store.save();
    } else if (el.hasAttribute('data-starter')) {
      var tl = el.getAttribute('data-starter'), st = S().starters;
      if (el.value === GW.prompts.DEFAULTS[tl]) delete st[tl]; else st[tl] = el.value;
      store.save();
      var pill = $('#starterState'); if (pill) pill.outerHTML = starterState(tl);
    } else if (el.hasAttribute('data-rule')) {
      S().rules[+el.getAttribute('data-rule')] = el.value; store.save();
    } else if (el.hasAttribute('data-setting') && el.tagName === 'INPUT') {
      setSetting(el.getAttribute('data-setting'), el.value);
    } else if (el.id === 'txQuery') {
      ui.txQuery = el.value; clearTimeout(window.__txq); window.__txq = setTimeout(function () { rerender(); var q = $('#txQuery'); if (q) { q.focus(); q.setSelectionRange(q.value.length, q.value.length); } }, 250);
    }
  });
  document.addEventListener('change', function (e) {
    var el = e.target;
    if (el.hasAttribute('data-k')) {
      onField(el);
      if (el.getAttribute('data-k') === 'transactions') rerender();
    }
    else if (el.hasAttribute('data-setting') && el.tagName === 'SELECT') setSetting(el.getAttribute('data-setting'), el.value);
    else if (el.id === 'monthSel') { S().settings.month = el.value; ui.txMonth = el.value; store.save(); rerender(); }
    else if (el.id === 'txMonth') { ui.txMonth = el.value; rerender(); }
    else if (el.id === 'importFile') importFile(el.files && el.files[0]);
  });
  document.addEventListener('click', function (e) {
    var t = e.target.closest('button, a'); if (!t) return;
    if (t.hasAttribute('data-add')) {
      var k = t.getAttribute('data-add'), row = DEFAULTS[k](); row.id = store.uid();
      S()[k].push(row); store.save(); rerender();
      var inp = $('[data-row="' + row.id + '"] input, [data-row="' + row.id + '"] select'); if (inp) { inp.focus(); inp.scrollIntoView({ block: 'center' }); }
      return;
    }
    if (t.hasAttribute('data-del')) {
      var key = t.getAttribute('data-del'), id = t.getAttribute('data-id');
      S()[key] = S()[key].filter(function (r) { return r.id !== id; }); store.save(); rerender(); toast('Row deleted'); return;
    }
    if (t.hasAttribute('data-seg-v')) {
      var segName = t.parentNode.getAttribute('data-seg'), v = t.getAttribute('data-seg-v');
      if (segName === 'homeCf') ui.homeCfCur = v; else if (segName === 'homeDonut') ui.homeDonutCur = v; else if (segName === 'txCur') { ui.txCur = v; rerender(); return; }
      $$('button', t.parentNode).forEach(function (b) { var on = b === t; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
      drawHomeCharts(); return;
    }
    if (t.hasAttribute('data-theme-set')) { store.setTheme(t.getAttribute('data-theme-set')); applyTheme(); rerender(); return; }
    if (t.hasAttribute('data-rule-del')) { S().rules.splice(+t.getAttribute('data-rule-del'), 1); store.save(); rerender(); return; }
    if (t.id === 'bottomMenu') { document.body.classList.contains('drawer-open') ? closeDrawer() : openDrawer(); return; }
    var a = t.getAttribute('data-action'); if (!a) return;
    var tool = t.getAttribute('data-tool');
    if (a === 'copy-prompt') { var text = GW.prompts[tool](S()); copyText(text).then(function (ok) { if (ok) toast('Prompt copied. Paste it into ChatGPT or Grok.'); else showPrompt(tool); }); }
    else if (a === 'preview-prompt') showPrompt(tool);
    else if (a === 'reset-starter') {
      if (!GW.prompts.isCustom(S(), tool) || confirm('Replace your edited starter prompt with the default?')) {
        delete S().starters[tool]; store.save();
        var ta = $('[data-starter="' + tool + '"]'); if (ta) ta.value = GW.prompts.DEFAULTS[tool];
        var pl = $('#starterState'); if (pl) pl.outerHTML = starterState(tool);
        toast('Starter prompt reset to default');
      }
    }
    else if (a === 'clear-examples') { if (confirm('Remove all rows marked "example"? Your own rows stay.')) { var n = store.clearExamples(); rerender(); toast(n + ' example rows cleared'); } }
    else if (a === 'export') exportData();
    else if (a === 'reset') { if (confirm('Delete ALL GWallet data in this browser and restore the example placeholders? Export a backup first if you need it.')) { store.reset(); applyTheme(); rerender(); toast('GWallet reset'); } }
    else if (a === 'add-rule') { S().rules.push(''); store.save(); rerender(); var ta = $$('[data-rule]').pop(); if (ta) ta.focus(); }
    else if (a === 'default-rules') { if (confirm('Replace your rules with the three default rules?')) { S().rules = store.seed().rules; store.save(); rerender(); } }
    else if (a === 'unpay-all') { S().bills.forEach(function (b) { b.paid = false; }); store.save(); rerender(); toast('All bills marked unpaid'); }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { var m = $('.modal'); if (m) m.remove(); closeDrawer(); }
  });

  function exportData() {
    store.saveNow();
    var payload = { app: 'GWallet', format: 1, exportedAt: new Date().toISOString(), theme: store.getTheme(), data: S() };
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    var d = new Date();
    a.href = URL.createObjectURL(blob);
    a.download = 'gwallet-backup-' + d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') + '.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
    toast('Backup downloaded');
  }
  function importFile(file) {
    if (!file) return;
    var r = new FileReader();
    r.onload = function () {
      try {
        var obj = JSON.parse(r.result);
        var data = obj && obj.app === 'GWallet' && obj.data ? obj.data : obj;
        var known = ['rules'].concat(store.COLLECTIONS).some(function (k) { return data && Array.isArray(data[k]); });
        if (!known) throw new Error('Not a GWallet backup');
        if (!confirm('Replace the current GWallet data with this backup?')) return;
        store.replace(data);
        if (obj.theme) store.setTheme(obj.theme);
        applyTheme(); rerender(); toast('Backup imported');
      } catch (err) { alert('Could not import: ' + err.message); }
    };
    r.readAsText(file);
  }

  /* ---------- boot ---------- */
  buildNav();
  applyTheme();
  $('#menuBtn').addEventListener('click', function () { document.body.classList.contains('drawer-open') ? closeDrawer() : openDrawer(); });
  $('#scrim').addEventListener('click', closeDrawer);
  $('#themeBtn').addEventListener('click', function () {
    store.setTheme(effectiveTheme(store.getTheme()) === 'dark' ? 'light' : 'dark'); applyTheme();
    if (current === 'settings') rerender();
  });
  $('#searchForm').addEventListener('submit', function (e) {
    e.preventDefault(); ui.txQuery = $('#searchInput').value.trim(); ui.txMonth = 'ALL'; ui.txCur = 'ALL';
    if (current === 'transactions') rerender(); else location.hash = '#/transactions';
  });
  if (window.matchMedia) {
    var mq = window.matchMedia('(prefers-color-scheme: light)');
    var onMq = function () { if (store.getTheme() === 'system') applyTheme(); };
    if (mq.addEventListener) mq.addEventListener('change', onMq); else if (mq.addListener) mq.addListener(onMq);
  }
  var rz; window.addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(function () { if (current === 'home') drawHomeCharts(); }, 150); });
  window.addEventListener('hashchange', route);
  window.addEventListener('storage', function (e) { if (e.key && e.key.indexOf(store.PREFIX) === 0) location.reload(); });
  if (!location.hash) history.replaceState(null, '', '#/home');
  route();
})();
