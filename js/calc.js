/* GWallet — local, rules-based calculations. Every function works on ONE currency at a time.
   PHP and THB are never added together or converted. */
(function () {
  'use strict';
  var GW = (window.GW = window.GW || {});

  function num(v) { var n = Number(v); return isFinite(n) ? n : 0; }
  function byCur(list, cur) { return (list || []).filter(function (r) { return r.currency === cur; }); }
  function sum(list, key) { return list.reduce(function (a, r) { return a + num(r[key]); }, 0); }

  var FREQ = { daily: 30.4, weekly: 4.33, monthly: 1, quarterly: 1 / 3, yearly: 1 / 12 };
  var BNPL_RE = /atome|spaylater|s\s*pay\s*later|\bspay\b|shopee\s*pay\s*later|shopee\s*paylater/i;

  function isBnplName(s) { return BNPL_RE.test(String(s || '')); }

  function summary(s, cur) {
    var income = sum(byCur(s.income, cur), 'amount');
    var expenses = sum(byCur(s.expenses, cur), 'amount');
    var debts = sum(byCur(s.debts, cur), 'balance');
    var minPay = sum(byCur(s.debts, cur), 'minPayment');
    var assets = sum(byCur(s.assets, cur), 'amount');
    var net = income - expenses;
    return {
      currency: cur, income: income, expenses: expenses, net: net, debts: debts, minPay: minPay,
      assets: assets, netWorth: assets - debts,
      savingsRate: income > 0 ? net / income : null,
      dti: income > 0 ? minPay / income : null
    };
  }

  function audit(s, cur) {
    var sm = summary(s, cur);
    var cats = {};
    byCur(s.expenses, cur).forEach(function (e) {
      var k = String(e.name || 'Unnamed').trim() || 'Unnamed';
      cats[k] = (cats[k] || 0) + num(e.amount);
    });
    var shares = Object.keys(cats).map(function (k) {
      return { name: k, amount: cats[k], share: sm.expenses > 0 ? cats[k] / sm.expenses : 0 };
    }).sort(function (a, b) { return b.amount - a.amount; });
    var bnplExpense = byCur(s.expenses, cur).filter(function (e) { return e.tag === 'bnpl' || isBnplName(e.name); });
    var checks = [];
    if (sm.income <= 0 && sm.expenses <= 0) {
      checks.push({ level: 'info', text: 'No ' + cur + ' income or expenses entered yet.' });
    } else {
      if (sm.savingsRate === null) checks.push({ level: 'bad', text: 'Expenses in ' + cur + ' but no ' + cur + ' income listed. Is this funded from savings?' });
      else if (sm.savingsRate >= 0.2) checks.push({ level: 'good', text: 'Savings rate ' + pct(sm.savingsRate) + ' (target 20% or more). Strong.' });
      else if (sm.savingsRate >= 0.1) checks.push({ level: 'ok', text: 'Savings rate ' + pct(sm.savingsRate) + '. Decent; aim for 20%.' });
      else if (sm.savingsRate >= 0) checks.push({ level: 'warn', text: 'Savings rate ' + pct(sm.savingsRate) + '. Below 10%; look for cuts.' });
      else checks.push({ level: 'bad', text: 'Spending exceeds income by ' + fmt(Math.abs(sm.net), cur) + ' per month.' });
      if (sm.dti !== null) {
        if (sm.dti > 0.36) checks.push({ level: 'bad', text: 'Debt-to-income ' + pct(sm.dti) + ' (minimum payments / income). Above 36% is risky.' });
        else if (sm.dti > 0.2) checks.push({ level: 'warn', text: 'Debt-to-income ' + pct(sm.dti) + '. Keep under 20% if possible.' });
        else checks.push({ level: 'good', text: 'Debt-to-income ' + pct(sm.dti) + '. Healthy.' });
      }
      if (shares[0] && shares[0].share > 0.4) checks.push({ level: 'warn', text: '"' + shares[0].name + '" is ' + pct(shares[0].share) + ' of ' + cur + ' spending.' });
      if (bnplExpense.length) checks.push({ level: 'warn', text: 'BNPL in ' + cur + ' spending (' + bnplExpense.map(function (e) { return e.name; }).join(', ') + '). Rule 3: BNPL counts as debt.' });
      if (sm.netWorth < 0) checks.push({ level: 'warn', text: 'Net worth in ' + cur + ' is negative (assets below debts).' });
    }
    return { summary: sm, shares: shares, checks: checks };
  }

  function monthsUntil(dateStr) {
    if (!dateStr) return null;
    var d = new Date(dateStr + (dateStr.length === 10 ? 'T00:00:00' : ''));
    if (isNaN(d)) return null;
    var now = new Date();
    var m = (d.getFullYear() - now.getFullYear()) * 12 + (d.getMonth() - now.getMonth());
    if (d.getDate() < now.getDate()) m -= 1;
    return Math.max(m, 0);
  }

  function goals(s, cur) {
    return byCur(s.goals, cur).map(function (g) {
      var target = num(g.target), current = num(g.current);
      var remaining = Math.max(target - current, 0);
      var months = monthsUntil(g.date);
      var monthly = remaining <= 0 ? 0 : months === null ? null : months === 0 ? remaining : remaining / months;
      return { goal: g, target: target, current: current, remaining: remaining, months: months, monthly: monthly,
        progress: target > 0 ? Math.min(current / target, 1) : 0 };
    });
  }

  function emergency(s, cur) {
    var sm = summary(s, cur);
    var have = sum(byCur(s.assets, cur).filter(function (a) { return a.kind === 'emergency'; }), 'amount');
    var months = num(s.settings.efMonths) || 6;
    var base = sm.expenses + sm.minPay; // monthly essentials proxy: expenses + minimum debt payments
    return { monthlyNeed: base, min3: base * 3, target: base * months, months: months, have: have,
      coverage: base > 0 ? have / base : null, progress: base * months > 0 ? Math.min(have / (base * months), 1) : 0 };
  }

  function cashflow(s, cur) {
    var items = byCur(s.cashflow, cur).slice().sort(function (a, b) {
      return num(a.day) - num(b.day) || (a.type === 'in' ? -1 : 1);
    });
    var start = num(s.settings.startBalance[cur]);
    var bal = start, low = start, lowDay = null, lowItem = null;
    var rows = items.map(function (it) {
      bal += it.type === 'in' ? num(it.amount) : -num(it.amount);
      if (bal < low) { low = bal; lowDay = num(it.day); lowItem = it.name; }
      return { item: it, balance: bal };
    });
    var inflow = sum(items.filter(function (i) { return i.type === 'in'; }), 'amount');
    var outflow = sum(items.filter(function (i) { return i.type !== 'in'; }), 'amount');
    var net = inflow - outflow;
    var tips = [];
    if (!items.length) tips.push({ level: 'info', text: 'Add your ' + cur + ' income and bills with due days to see the month.' });
    else {
      if (net < 0) tips.push({ level: 'bad', text: 'The month is negative by ' + fmt(Math.abs(net), cur) + '. Cut or postpone outflows before adding anything new.' });
      if (low < 0) tips.push({ level: 'warn', text: 'Balance dips to ' + fmt(low, cur) + ' around day ' + lowDay + ' (' + lowItem + '). Keep a buffer of at least ' + fmt(Math.abs(low), cur) + ' or ask to move that due date after payday.' });
      var firstIn = items.filter(function (i) { return i.type === 'in'; })[0];
      if (firstIn) {
        var before = items.filter(function (i) { return i.type !== 'in' && num(i.day) < num(firstIn.day); });
        if (before.length) tips.push({ level: 'info', text: before.length + ' bill(s) fall before the first income on day ' + firstIn.day + '. Pay them from last month\'s buffer, not BNPL.' });
        if (net > 0) tips.push({ level: 'good', text: 'Move ' + fmt(net * 0.5, cur) + ' (half the surplus) to savings on day ' + firstIn.day + ', right when income lands (protect, then grow).' });
      } else tips.push({ level: 'warn', text: 'No ' + cur + ' income listed. These bills are funded from savings.' });
      var bnpl = items.filter(function (i) { return i.type !== 'in' && isBnplName(i.name); });
      if (bnpl.length) tips.push({ level: 'warn', text: 'BNPL payments this month: ' + fmt(sum(bnpl, 'amount'), cur) + '. Avoid new Atome/SPayLater purchases until these clear.' });
    }
    return { rows: rows, start: start, inflow: inflow, outflow: outflow, net: net, low: low, lowDay: lowDay, end: bal, tips: tips };
  }

  function leaks(s, cur) {
    var rows = byCur(s.leaks, cur).map(function (l) {
      var monthly = num(l.amount) * (FREQ[l.frequency] || 1);
      var bnpl = l.kind === 'bnpl' || isBnplName(l.name);
      var flag = bnpl ? 'BNPL' : (l.kind === 'delivery' || l.kind === 'coffee' || l.kind === 'small' || l.frequency === 'daily' || l.frequency === 'weekly') ? 'Leak' : l.kind === 'subscription' ? 'Review' : '';
      return { leak: l, monthly: monthly, yearly: monthly * 12, bnpl: bnpl, flag: flag };
    }).sort(function (a, b) { return b.monthly - a.monthly; });
    var total = rows.reduce(function (a, r) { return a + r.monthly; }, 0);
    return { rows: rows, monthly: total, yearly: total * 12 };
  }

  function bnplAwareness(s) {
    var hits = [];
    ['expenses', 'leaks', 'debts', 'cashflow', 'bills', 'transactions'].forEach(function (k) {
      (s[k] || []).forEach(function (r) {
        var name = r.name || r.desc;
        if (isBnplName(name) || r.tag === 'bnpl' || r.kind === 'bnpl' || r.bnpl) hits.push({ where: k, name: name, currency: r.currency });
      });
    });
    var has = function (re) { return hits.some(function (h) { return re.test(h.name || ''); }); };
    var inDebts = (s.debts || []).filter(function (d) { return d.bnpl || isBnplName(d.name); });
    function owed(re) {
      var l = (s.debts || []).filter(function (d) { return re.test(d.name || ''); });
      return { PHP: sum(byCur(l, 'PHP'), 'balance'), THB: sum(byCur(l, 'THB'), 'balance'), example: l.some(function (d) { return d.example; }), demo: l.some(function (d) { return d.example && /demo/i.test(d.name || ''); }) };
    }
    return {
      hits: hits,
      atome: has(/atome/i),
      spay: has(/spaylater|s\s*pay\s*later|\bspay\b|shopee/i),
      debtsListed: inDebts.length,
      atomeOwed: owed(/atome/i),
      spayOwed: owed(/spaylater|s\s*pay\s*later|\bspay\b|shopee/i),
      debtTotals: { PHP: sum(byCur(inDebts, 'PHP'), 'balance'), THB: sum(byCur(inDebts, 'THB'), 'balance') }
    };
  }

  /* Debt payoff simulation for ONE currency. strategy: 'avalanche' | 'snowball'. */
  function payoff(s, cur, strategy, extra) {
    var debts = byCur(s.debts, cur).filter(function (d) { return num(d.balance) > 0; }).map(function (d) {
      return { id: d.id, name: d.name, bal: num(d.balance), rate: num(d.rate) / 100 / 12, min: Math.max(num(d.minPayment), 0), apr: num(d.rate), paidMonth: null };
    });
    var order = debts.slice().sort(strategy === 'avalanche'
      ? function (a, b) { return b.apr - a.apr || a.bal - b.bal; }
      : function (a, b) { return a.bal - b.bal || b.apr - a.apr; });
    var budget = debts.reduce(function (a, d) { return a + d.min; }, 0) + Math.max(num(extra), 0);
    var month = 0, interest = 0, stuck = false;
    while (debts.some(function (d) { return d.bal > 0.005; }) && month < 600) {
      month++;
      var avail = budget;
      debts.forEach(function (d) { if (d.bal > 0) { var i = d.bal * d.rate; d.bal += i; interest += i; } });
      debts.forEach(function (d) { if (d.bal > 0) { var p = Math.min(d.min, d.bal, avail); d.bal -= p; avail -= p; } });
      for (var k = 0; k < order.length && avail > 0.005; k++) {
        var t = order[k];
        if (t.bal > 0) { var q = Math.min(t.bal, avail); t.bal -= q; avail -= q; }
      }
      debts.forEach(function (d) { if (d.bal <= 0.005 && d.paidMonth === null) { d.bal = 0; d.paidMonth = month; } });
      if (month === 600) stuck = true;
    }
    if (budget <= 0 && debts.length) stuck = true;
    return {
      order: order.map(function (d) { return { name: d.name, apr: d.apr, paidMonth: d.paidMonth }; }),
      months: stuck ? null : month, interest: interest, budget: budget, count: debts.length,
      total: byCur(s.debts, cur).reduce(function (a, d) { return a + num(d.balance); }, 0)
    };
  }

  function pct(x) { return x === null || x === undefined || !isFinite(x) ? 'n/a' : (Math.round(x * 1000) / 10) + '%'; }
  function fmt(v, cur, opts) {
    var n = num(v);
    var dec = opts && opts.decimals !== undefined ? opts.decimals : (Math.abs(n) < 100 && n % 1 !== 0 ? 2 : 0);
    var s = Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
    return (n < 0 ? '-' : '') + (GW.SYMBOL[cur] || '') + s;
  }
  function monthsLabel(m) {
    if (m === null || m === undefined) return 'Never at this budget';
    if (m === 0) return 'Now';
    var y = Math.floor(m / 12), r = m % 12;
    return ((y ? y + ' yr' + (y > 1 ? 's' : '') + ' ' : '') + (r ? r + ' mo' : '')).trim();
  }

  GW.calc = { num: num, byCur: byCur, sum: sum, summary: summary, audit: audit, goals: goals, emergency: emergency,
    cashflow: cashflow, leaks: leaks, bnplAwareness: bnplAwareness, payoff: payoff,
    isBnplName: isBnplName, pct: pct, fmt: fmt, monthsLabel: monthsLabel, monthsUntil: monthsUntil, FREQ: FREQ };
})();
