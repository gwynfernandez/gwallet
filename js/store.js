/* GWallet — data store (localStorage only, key prefix "gwallet:"). Classic script, no modules. */
(function () {
  'use strict';
  var GW = (window.GW = window.GW || {});
  var PREFIX = 'gwallet:';
  var DATA_KEY = PREFIX + 'data';
  var THEME_KEY = PREFIX + 'theme';
  var VERSION = 1;
  var SEED_REV = 2; // bump when example rows change; see migrate()
  var CURRENCIES = ['PHP', 'THB'];
  var SYMBOL = { PHP: '\u20B1', THB: '\u0E3F' };

  function uid() {
    return 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function ym(offsetMonths) {
    var d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + (offsetMonths || 0));
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  }
  function isoDay(day) {
    return ym(0) + '-' + String(day).padStart(2, '0');
  }

  var DEFAULT_RULES = [
    'Protect, grow, control: protect first (emergency fund, no new bad debt), then grow (savings/investing), and keep control (track every peso and baht).',
    'PHP and THB are separate. Never add them together.',
    'Watch Atome and SPayLater (Spay). BNPL counts as debt.'
  ];

  /* Demo: about ₱13,100 of Atome charges in early October. Example only, editable, removed by "Clear examples". */
  function ATOME_DEMO_DEBT() {
    return { name: 'Atome early-Oct charges (demo/example)', currency: 'PHP', balance: 13100, rate: 0, minPayment: 2000, bnpl: true };
  }

  function ex(o) {
    o.id = uid();
    o.example = true;
    return o;
  }

  /* Example placeholders only. These are NOT Gwyn's real figures. */
  function seed() {
    return {
      version: VERSION,
      seedRev: SEED_REV,
      rules: DEFAULT_RULES.slice(),
      income: [
        ex({ name: 'Coaching income (example)', currency: 'THB', amount: 30000 }),
        ex({ name: 'Freelance work (example)', currency: 'PHP', amount: 20000 })
      ],
      expenses: [
        ex({ name: 'Lucky Suki (example)', currency: 'THB', amount: 2000, tag: 'want' }),
        ex({ name: 'Grab (example)', currency: 'THB', amount: 1500, tag: 'want' }),
        ex({ name: '7-Eleven (example)', currency: 'THB', amount: 1200, tag: 'want' }),
        ex({ name: 'Red Blazer (example)', currency: 'THB', amount: 800, tag: 'want' }),
        ex({ name: 'Apple (example)', currency: 'PHP', amount: 500, tag: 'subscription' }),
        ex({ name: 'Atome (example)', currency: 'PHP', amount: 2000, tag: 'bnpl' }),
        ex({ name: 'SPayLater (example)', currency: 'PHP', amount: 1500, tag: 'bnpl' })
      ],
      assets: [
        ex({ name: 'Bank account (example)', currency: 'THB', amount: 15000, kind: 'cash' }),
        ex({ name: 'Savings (example)', currency: 'PHP', amount: 10000, kind: 'emergency' })
      ],
      debts: [
        ex(ATOME_DEMO_DEBT()),
        ex({ name: 'SPayLater (example)', currency: 'PHP', balance: 4500, rate: 0, minPayment: 1500, bnpl: true }),
        ex({ name: 'Credit card (example)', currency: 'THB', balance: 20000, rate: 16, minPayment: 1000, bnpl: false })
      ],
      goals: [
        ex({ name: 'Emergency fund (example)', currency: 'THB', target: 60000, current: 15000, date: ym(12) + '-01' }),
        ex({ name: 'Trip home to PH (example)', currency: 'PHP', target: 30000, current: 5000, date: ym(6) + '-01' })
      ],
      cashflow: [
        ex({ name: 'Rent (example)', type: 'out', currency: 'THB', amount: 8000, day: 1 }),
        ex({ name: 'Credit card min (example)', type: 'out', currency: 'THB', amount: 1000, day: 15 }),
        ex({ name: 'Coaching income (example)', type: 'in', currency: 'THB', amount: 30000, day: 25 }),
        ex({ name: 'Atome (example)', type: 'out', currency: 'PHP', amount: 2000, day: 5 }),
        ex({ name: 'Freelance work (example)', type: 'in', currency: 'PHP', amount: 20000, day: 10 }),
        ex({ name: 'SPayLater (example)', type: 'out', currency: 'PHP', amount: 1500, day: 12 })
      ],
      leaks: [
        ex({ name: 'Grab Food delivery (example)', currency: 'THB', amount: 250, frequency: 'weekly', kind: 'delivery' }),
        ex({ name: 'Coffee (example)', currency: 'THB', amount: 80, frequency: 'daily', kind: 'coffee' }),
        ex({ name: '7-Eleven snacks (example)', currency: 'THB', amount: 60, frequency: 'daily', kind: 'small' }),
        ex({ name: 'Apple subscriptions (example)', currency: 'PHP', amount: 149, frequency: 'monthly', kind: 'subscription' }),
        ex({ name: 'Atome (example)', currency: 'PHP', amount: 2000, frequency: 'monthly', kind: 'bnpl' }),
        ex({ name: 'SPayLater (example)', currency: 'PHP', amount: 1500, frequency: 'monthly', kind: 'bnpl' })
      ],
      transactions: [
        ex({ date: isoDay(1), desc: 'Rent (example)', category: 'Housing', type: 'out', currency: 'THB', amount: 8000 }),
        ex({ date: isoDay(2), desc: 'Lucky Suki (example)', category: 'Food', type: 'out', currency: 'THB', amount: 650 }),
        ex({ date: isoDay(3), desc: 'Grab (example)', category: 'Transport', type: 'out', currency: 'THB', amount: 180 }),
        ex({ date: isoDay(4), desc: 'Atome payment (example)', category: 'BNPL', type: 'out', currency: 'PHP', amount: 2000 }),
        ex({ date: isoDay(5), desc: 'Freelance work (example)', category: 'Income', type: 'in', currency: 'PHP', amount: 20000 })
      ],
      bills: [
        ex({ name: 'Rent (example)', currency: 'THB', amount: 8000, dueDay: 1, paid: false }),
        ex({ name: 'Phone plan (example)', currency: 'THB', amount: 599, dueDay: 8, paid: false }),
        ex({ name: 'Atome (example)', currency: 'PHP', amount: 2000, dueDay: 5, paid: false }),
        ex({ name: 'SPayLater (example)', currency: 'PHP', amount: 1500, dueDay: 12, paid: false })
      ],
      settings: {
        efMonths: 6,
        extra: { PHP: 0, THB: 0 },
        startBalance: { PHP: 0, THB: 0 },
        month: ym(0)
      },
      notes: {},
      pasted: {},
      starters: {}
    };
  }

  var COLLECTIONS = ['income', 'expenses', 'assets', 'debts', 'goals', 'cashflow', 'leaks', 'transactions', 'bills'];

  function normalize(d) {
    var base = seed();
    var out = { version: VERSION, seedRev: Number(d.seedRev) || 1 };
    out.rules = Array.isArray(d.rules) ? d.rules.map(String) : base.rules;
    COLLECTIONS.forEach(function (k) {
      out[k] = Array.isArray(d[k])
        ? d[k].filter(function (r) { return r && typeof r === 'object'; }).map(function (r) {
            if (!r.id) r.id = uid();
            if (CURRENCIES.indexOf(r.currency) < 0) r.currency = 'PHP';
            return r;
          })
        : base[k];
    });
    var s = d.settings && typeof d.settings === 'object' ? d.settings : {};
    out.settings = {
      efMonths: Number(s.efMonths) || 6,
      extra: Object.assign({ PHP: 0, THB: 0 }, s.extra || {}),
      startBalance: Object.assign({ PHP: 0, THB: 0 }, s.startBalance || {}),
      month: /^\d{4}-\d{2}$/.test(s.month || '') ? s.month : ym(0)
    };
    out.notes = d.notes && typeof d.notes === 'object' ? d.notes : {};
    out.pasted = d.pasted && typeof d.pasted === 'object' ? d.pasted : {};
    out.starters = d.starters && typeof d.starters === 'object' ? d.starters : {};
    return migrate(out);
  }

  /* Older saves: add new example rows only if she still has examples (never re-add after "Clear examples"). */
  function migrate(d) {
    if (d.seedRev >= SEED_REV) return d;
    var hasEx = COLLECTIONS.some(function (k) { return d[k].some(function (r) { return r.example; }); });
    if (hasEx) {
      if (!d.expenses.some(function (r) { return /red blazer/i.test(r.name || ''); })) {
        var at = d.expenses.map(function (r) { return /7-eleven/i.test(r.name || ''); }).lastIndexOf(true);
        d.expenses.splice(at >= 0 ? at + 1 : d.expenses.length, 0, ex({ name: 'Red Blazer (example)', currency: 'THB', amount: 800, tag: 'want' }));
      }
      var old = d.debts.filter(function (r) { return r.example && r.name === 'Atome (example)'; })[0];
      if (old) Object.assign(old, ATOME_DEMO_DEBT());
      else if (!d.debts.some(function (r) { return /early-oct/i.test(r.name || ''); })) d.debts.unshift(ex(ATOME_DEMO_DEBT()));
    }
    d.seedRev = SEED_REV;
    return d;
  }

  function load() {
    try {
      var raw = localStorage.getItem(DATA_KEY);
      if (raw) return normalize(JSON.parse(raw));
    } catch (e) {
      console.warn('GWallet: could not read saved data, starting fresh.', e);
    }
    return seed();
  }

  var state = load();
  var saveTimer = null;

  function saveNow() {
    try {
      localStorage.setItem(DATA_KEY, JSON.stringify(GW.state));
    } catch (e) {
      console.warn('GWallet: could not save to localStorage.', e);
    }
  }
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveNow, 150);
  }
  window.addEventListener('beforeunload', function () { clearTimeout(saveTimer); saveNow(); });

  function replace(newData) {
    GW.state = normalize(newData);
    saveNow();
  }

  function reset() {
    try {
      Object.keys(localStorage).forEach(function (k) {
        if (k.indexOf(PREFIX) === 0) localStorage.removeItem(k);
      });
    } catch (e) {}
    GW.state = seed();
    saveNow();
  }

  function clearExamples() {
    var n = 0, s = GW.state;
    COLLECTIONS.forEach(function (k) {
      var before = s[k].length;
      s[k] = s[k].filter(function (r) { return !r.example; });
      n += before - s[k].length;
    });
    saveNow();
    return n;
  }

  function countExamples() {
    var s = GW.state;
    return COLLECTIONS.reduce(function (n, k) {
      return n + s[k].filter(function (r) { return r.example; }).length;
    }, 0);
  }

  function getTheme() {
    try { return localStorage.getItem(THEME_KEY) || 'dark'; } catch (e) { return 'dark'; }
  }
  function setTheme(t) {
    try { localStorage.setItem(THEME_KEY, t); } catch (e) {}
  }

  GW.store = {
    PREFIX: PREFIX, DATA_KEY: DATA_KEY, THEME_KEY: THEME_KEY, VERSION: VERSION,
    COLLECTIONS: COLLECTIONS,
    save: save, saveNow: saveNow, replace: replace, reset: reset,
    clearExamples: clearExamples, countExamples: countExamples,
    getTheme: getTheme, setTheme: setTheme, uid: uid, ym: ym, seed: seed
  };
  GW.CURRENCIES = CURRENCIES;
  GW.SYMBOL = SYMBOL;
  GW.state = state;
  // Persist the first-run seed.
  try { if (!localStorage.getItem(DATA_KEY)) saveNow(); } catch (e) {}
})();
