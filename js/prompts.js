/* GWallet — "Copy prompt" builders.
   Each tool has an EDITABLE starter prompt (default below, her edits saved in localStorage under gwallet:data → starters).
   Copy prompt = her starter prompt + her money rules + her current data for that tool (+ pasted data and notes).
   Nothing is sent anywhere; the text is only copied to the clipboard. */
(function () {
  'use strict';
  var GW = (window.GW = window.GW || {});
  var C = function () { return GW.calc; };

  /* Shared context. Coaching, Bolt and ₱350 lines use the phrasing from Penny's v1 notes. */
  var CONTEXT = [
    'About me and my context:',
    '- I am Gwyn Fernandez, a Filipino coach living in Bangkok. I earn and spend in two currencies: Philippine peso (PHP, ₱) and Thai baht (THB, ฿).',
    '- Coaching income in THB: King\'s, SWISH, Pat private.',
    '- Bolt: only King\'s → SWISH on Tue/Thu.',
    '- ₱350 school-day cash rule.',
    '- BNPL: Atome (Atome Card, PHP) and SPayLater / Shopee PayLater ("Spay"). Treat every BNPL balance as debt and flag any new BNPL use.',
    '',
    'Non-negotiables:',
    '- Protect, grow, control, in that order: protect first (emergency fund, no new bad debt), then grow (savings/investing), and keep control (track every peso and baht).',
    '- PHP and THB are separate. Never add them together, never show a combined total, and never convert between them unless I explicitly ask.',
    '- Be direct, practical, and coach-friendly. Actionable steps over theory.'
  ].join('\n');
  var FORMAT = 'Format: short sections with headings, bullets, and tables. Use ₱ for PHP and ฿ for THB and keep every number in its own currency. List your assumptions first if data is missing, and end with up to 3 questions for me.';

  var DEFAULTS = {
    audit: [
      'You are my personal CFO and a certified financial planner. Run a full Financial Audit of my finances. Be practical, specific, and honest. No generic advice.',
      '', CONTEXT, '',
      'What I want back:',
      '1. A health score (0–100) for PHP and for THB separately, with one-line reasons.',
      '2. Savings rate, spending by category, debt-to-income, and net worth for each currency.',
      '3. My top 3 problems and top 3 strengths per currency, including lifestyle creep.',
      '4. Atome and SPayLater (Spay) check: what I owe, whether it breaks my rules, and what to do this month.',
      '5. A prioritized 7-day action list following protect → grow → control, that keeps the ₱350 school-day cash rule and my Bolt days workable.',
      '', FORMAT
    ].join('\n'),
    wealth: [
      'You are my personal CFO and a wealth-building coach. Build a realistic Wealth-Building Plan for my goals.',
      '', CONTEXT, '',
      'What I want back:',
      '1. Separate income streams: coaching income (THB: King\'s, SWISH, Pat private) versus any PHP income.',
      '2. Allocation buckets per currency: Protect (emergency fund / buffer), Grow (savings / investing), Control (bills and lifestyle).',
      '3. For each goal: is it realistic with my surplus in that currency? If not, propose a new date or amount.',
      '4. Priority order: emergency fund, then clearing Atome and SPayLater (Spay), then goals.',
      '5. A 90-day milestone plan tied to my coaching schedule (Bolt only King\'s → SWISH Tue/Thu), with monthly auto-transfer amounts per currency.',
      '', FORMAT
    ].join('\n'),
    cashflow: [
      'You are my personal CFO and a cash-flow analyst. Optimize my monthly Cash Flow.',
      '', CONTEXT, '',
      'What I want back:',
      '1. Map my weekly rhythm: coaching days, Bolt King\'s → SWISH Tue/Thu, and the ₱350 school-day cash rule.',
      '2. Timing gaps between THB coaching income and PHP obligations (Atome, SPayLater / Spay, daily cash), per currency.',
      '3. Days where I risk running short, and the float buffer I need in each currency.',
      '4. Which bills to re-schedule (and to what day) so they land after income.',
      '5. A simple weekly cash checklist and a "pay yourself first" schedule (protect → grow → control). Keep PHP and THB on separate tracks; never sum them.',
      '', FORMAT
    ].join('\n'),
    leaks: [
      'You are my personal CFO and a spending-habits coach. Hunt my Money Leaks.',
      '', CONTEXT, '',
      'What I want back:',
      '1. Every leak ranked by yearly cost, per currency: subscriptions, food delivery, Grab and Bolt rides, 7-Eleven runs, coffee, impulse buys.',
      '2. Atome and SPayLater (Spay): fees, interest, and how much new BNPL I added. A plan to stop new BNPL purchases.',
      '3. Lifestyle creep: discretionary spending that grew without intentional coaching income growth.',
      '4. Concrete Bangkok-friendly swaps, labelled cut / reduce / keep, keeping the ₱350 school-day cash rule.',
      '5. A "plug this week" list with the saving in ₱ and ฿ listed separately.',
      '', FORMAT
    ].join('\n'),
    debt: [
      'You are my personal CFO and a debt-payoff strategist. Run Debt Destroyer for me.',
      '', CONTEXT, '',
      'What I want back:',
      '1. Each debt and BNPL (Atome, SPayLater / Spay, cards) with balance, minimum, and interest or fees, per currency.',
      '2. Avalanche versus snowball for PHP debts and for THB debts separately, and which one fits my coach cash flow.',
      '3. Protect the ₱350 school-day cash and my THB coaching buffers. Don\'t starve operations to overpay.',
      '4. A week-by-week payoff script until the first debt is gone, then a month-by-month table for the next 6 months.',
      '5. "No new bad debt" rules I can follow (protect → grow → control), especially for Atome and Spay.',
      '', FORMAT
    ].join('\n')
  };

  function starter(s, tool) {
    var v = s.starters && typeof s.starters[tool] === 'string' ? s.starters[tool] : null;
    return v !== null && v.trim() ? v : DEFAULTS[tool];
  }
  function isCustom(s, tool) { return !!(s.starters && typeof s.starters[tool] === 'string' && s.starters[tool] !== DEFAULTS[tool]); }

  function f(v, cur) { return C().fmt(v, cur); }
  function table(headers, rows) {
    if (!rows.length) return '_(none entered)_\n';
    var out = '| ' + headers.join(' | ') + ' |\n|' + headers.map(function () { return ' --- '; }).join('|') + '|\n';
    rows.forEach(function (r) { out += '| ' + r.map(function (c) { return String(c === undefined || c === null ? '' : c).replace(/\|/g, '/').replace(/\n/g, ' '); }).join(' | ') + ' |\n'; });
    return out;
  }
  function hasExamples(s, keys) { return keys.some(function (k) { return (s[k] || []).some(function (r) { return r.example; }); }); }

  var DATA = {
    audit: { keys: ['income', 'expenses', 'assets', 'debts'], build: function (s) {
      var out = '';
      GW.CURRENCIES.forEach(function (cur) {
        var sm = C().audit(s, cur).summary;
        out += '\n## ' + cur + ' pocket\n';
        out += '\n**Monthly income**\n' + table(['Source', 'Amount'], C().byCur(s.income, cur).map(function (r) { return [r.name, f(r.amount, cur)]; }));
        out += '\n**Monthly expenses**\n' + table(['Category', 'Amount', 'Type'], C().byCur(s.expenses, cur).map(function (r) { return [r.name, f(r.amount, cur), r.tag || '']; }));
        out += '\n**Assets**\n' + table(['Asset', 'Kind', 'Value'], C().byCur(s.assets, cur).map(function (r) { return [r.name, r.kind || '', f(r.amount, cur)]; }));
        out += '\n**Debts**\n' + table(['Debt', 'Balance', 'APR %', 'Min/month', 'BNPL'], C().byCur(s.debts, cur).map(function (r) { return [r.name, f(r.balance, cur), r.rate, f(r.minPayment, cur), r.bnpl ? 'yes' : '']; }));
        out += '\nGWallet computed: income ' + f(sm.income, cur) + ', expenses ' + f(sm.expenses, cur) + ', net ' + f(sm.net, cur) + ', savings rate ' + C().pct(sm.savingsRate) + ', debt-to-income ' + C().pct(sm.dti) + ', net worth ' + f(sm.netWorth, cur) + '.\n';
      });
      return out;
    } },
    wealth: { keys: ['goals', 'income', 'expenses', 'assets'], build: function (s) {
      var out = '';
      GW.CURRENCIES.forEach(function (cur) {
        var g = C().goals(s, cur), ef = C().emergency(s, cur), sm = C().summary(s, cur);
        out += '\n## ' + cur + ' goals\n';
        out += table(['Goal', 'Target', 'Saved', 'Target date', 'Needed / month'], g.map(function (r) {
          return [r.goal.name, f(r.target, cur), f(r.current, cur), r.goal.date || 'none', r.monthly === null ? 'set a date' : f(r.monthly, cur)];
        }));
        out += '\nMonthly income ' + f(sm.income, cur) + ', expenses ' + f(sm.expenses, cur) + ', surplus ' + f(sm.net, cur) + '. Emergency fund: have ' + f(ef.have, cur) + ', target ' + ef.months + ' months = ' + f(ef.target, cur) + ' (3-month minimum ' + f(ef.min3, cur) + ').\n';
      });
      return out;
    } },
    cashflow: { keys: ['cashflow'], build: function (s) {
      var out = '';
      GW.CURRENCIES.forEach(function (cur) {
        var cf = C().cashflow(s, cur);
        out += '\n## ' + cur + ' month (starting balance ' + f(cf.start, cur) + ')\n';
        out += table(['Day', 'Item', 'In/Out', 'Amount', 'Balance after'], cf.rows.map(function (r) {
          return [r.item.day, r.item.name, r.item.type === 'in' ? 'IN' : 'OUT', f(r.item.amount, cur), f(r.balance, cur)];
        }));
        out += '\nIn ' + f(cf.inflow, cur) + ', out ' + f(cf.outflow, cur) + ', net ' + f(cf.net, cur) + ', lowest balance ' + f(cf.low, cur) + (cf.lowDay ? ' on day ' + cf.lowDay : '') + '.\n';
      });
      return out;
    } },
    leaks: { keys: ['leaks', 'debts'], build: function (s) {
      var out = '', aw = C().bnplAwareness(s);
      GW.CURRENCIES.forEach(function (cur) {
        var l = C().leaks(s, cur);
        out += '\n## ' + cur + ' leaks\n';
        out += table(['Item', 'Kind', 'Amount', 'How often', 'Monthly', 'Yearly'], l.rows.map(function (r) {
          return [r.leak.name, r.leak.kind || '', f(r.leak.amount, cur), r.leak.frequency, f(r.monthly, cur), f(r.yearly, cur)];
        }));
        out += '\nTotal: ' + f(l.monthly, cur) + ' / month, ' + f(l.yearly, cur) + ' / year.\n';
      });
      out += '\n## BNPL check\nAtome: ' + (aw.atome ? 'in use' : 'not listed') + (aw.atomeOwed.PHP || aw.atomeOwed.THB ? ' (owed: ' + GW.CURRENCIES.filter(function (c) { return aw.atomeOwed[c]; }).map(function (c) { return f(aw.atomeOwed[c], c); }).join(' | ') + ')' : '') +
        '. SPayLater / Spay: ' + (aw.spay ? 'in use' : 'not listed') + (aw.spayOwed.PHP || aw.spayOwed.THB ? ' (owed: ' + GW.CURRENCIES.filter(function (c) { return aw.spayOwed[c]; }).map(function (c) { return f(aw.spayOwed[c], c); }).join(' | ') + ')' : '') + '.\n';
      return out;
    } },
    debt: { keys: ['debts'], build: function (s) {
      var out = '';
      GW.CURRENCIES.forEach(function (cur) {
        var extra = s.settings.extra[cur] || 0;
        var av = C().payoff(s, cur, 'avalanche', extra), sn = C().payoff(s, cur, 'snowball', extra);
        out += '\n## ' + cur + ' debts (extra payment ' + f(extra, cur) + ' / month)\n';
        out += table(['Debt', 'Balance', 'APR %', 'Minimum / month', 'BNPL'], C().byCur(s.debts, cur).map(function (r) { return [r.name, f(r.balance, cur), r.rate, f(r.minPayment, cur), (r.bnpl || C().isBnplName(r.name)) ? 'yes' : '']; }));
        if (av.count) {
          out += '\nGWallet estimate: avalanche ' + C().monthsLabel(av.months) + ' (interest ~' + f(av.interest, cur) + '), order: ' + av.order.map(function (d) { return d.name; }).join(' → ') + '.\n';
          out += 'Snowball ' + C().monthsLabel(sn.months) + ' (interest ~' + f(sn.interest, cur) + '), order: ' + sn.order.map(function (d) { return d.name; }).join(' → ') + '.\n';
        }
      });
      return out;
    } }
  };

  function build(tool, s) {
    var rules = (s.rules || []).filter(function (r) { return String(r).trim(); }).map(function (r, i) { return (i + 1) + '. ' + r; }).join('\n');
    var out = starter(s, tool).trim() + '\n\n---\n\n# My money rules (follow these)\n' + (rules || '_(no rules set)_') + '\n';
    out += '\n# My current data (from my GWallet app)\n';
    if (hasExamples(s, DATA[tool].keys)) out += '\n> Note: rows marked "(example)" or "(demo/example)" are placeholders, not my real numbers. Point out where real data is needed.\n';
    out += DATA[tool].build(s);
    var pasted = (s.pasted && s.pasted[tool] || '').trim();
    var notes = (s.notes && s.notes[tool] || '').trim();
    if (pasted) out += '\n## Extra data I pasted\n```\n' + pasted + '\n```\n';
    if (notes) out += '\n## My notes\n' + notes + '\n';
    out += '\nReminder: keep PHP and THB separate in every answer. Never add them together or convert between them.\n';
    return out;
  }

  GW.prompts = {
    DEFAULTS: DEFAULTS, starter: starter, isCustom: isCustom, build: build,
    audit: function (s) { return build('audit', s); },
    wealth: function (s) { return build('wealth', s); },
    cashflow: function (s) { return build('cashflow', s); },
    leaks: function (s) { return build('leaks', s); },
    debt: function (s) { return build('debt', s); }
  };
})();
