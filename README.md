# GWallet

A personal finance web app for Gwyn Fernandez: a Filipino living in Bangkok who earns and spends in **PHP (₱)** and **THB (฿)**.
It is a dark "finance dashboard" UI with five CFO tools and "Copy prompt" buttons that turn your data into a ready-to-paste ChatGPT/Grok finance prompt.

- No signup, no login, personal use only.
- **PHP and THB are never added together, combined, or auto-converted.** Every figure is calculated per currency.
- No network calls, analytics, CDNs, or external fonts. A Content-Security-Policy in `index.html` blocks remote requests.

## How to open it

**Option 1: open the file directly.** No server needed.

```
file:///workspace/gwallet/index.html
```

You can double-click `index.html` or drag it into Chrome, Safari, Edge, or Firefox. The app uses classic `<script>` tags (no ES modules), so `file://` works.

**Option 2: use any static server.**

```bash
cd /workspace/gwallet
python3 -m http.server 8787
# then open http://127.0.0.1:8787/
```

Routes: `#/home`, `#/audit`, `#/wealth`, `#/cashflow`, `#/leaks`, `#/debt`, `#/transactions`, `#/bills`, `#/settings`.

## Where your data is stored

Everything stays in **this browser's `localStorage`**, under keys with the `gwallet:` prefix:

| Key | What it holds |
| --- | --- |
| `gwallet:data` | All lists (income, expenses, assets, debts, goals, cash flow, leaks, transactions, bills), money rules, settings, edited starter prompts, pasted data, and notes |
| `gwallet:theme` | `dark` (default), `light`, or `system` |

Data is per browser and per origin. `file://` and `http://127.0.0.1:8787` each keep **separate** storage. Clearing site data deletes it.
To back up or move devices, go to **Settings → Export JSON**, then **Import JSON** on the other browser. **Reset everything** wipes all `gwallet:*` keys and restores the example placeholders.

## Copy prompt and starter prompts

Each CFO tool has an editable **Starter prompt** box, prefilled with a default for that tool (protect/grow/control, PHP and THB kept separate, Atome and SPayLater (Spay), coaching income, Bolt, and the ₱350 school-day cash rule).
Her edits are saved per tool. **Reset to default** restores the original. **Copy prompt** copies the starter prompt, then her money rules, then her current data for that tool, plus any pasted data and notes.

## Example data

The first run seeds **example placeholders** (every row is labelled "(example)" and shows an EXAMPLE badge). None of these are real figures. They include a demo of about ₱13,100 in early-October Atome charges (a Debts row labelled "demo/example"), which feeds the Atome note on the Monthly Expenses (PHP) card and the Atome flag in Money Leaks.
Use **Clear examples** (the banner on each screen, or Settings) to remove them all in one tap. Your own rows stay.

## Files

```
index.html        App shell (sidebar, top bar, bottom nav) and script tags
styles.css        All styling. Design tokens are in one :root block at the top; the light theme overrides colours only
app.js            Router, views (Home, 5 tools, Transactions, Bills, Settings), editable lists, events
js/store.js       localStorage load/save, example seed, export/import/reset helpers
js/calc.js        Rules-based maths per currency (audit, goals, emergency fund, cash flow, leaks, BNPL, debt payoff)
js/charts.js      Inline-SVG line chart and donut (no chart library)
js/prompts.js     "Copy prompt" builders for each tool
screenshots/      Verification screenshots (phone 390×844, desktop 1280×800, dark and light)
design/           Pinterest design reference
```

## Restyling

Colours, radii, spacing, and fonts are CSS variables in the `:root` block at the top of `styles.css`. `[data-theme="light"]` only swaps colour tokens.
Fonts use a system stack (`Inter, 'Plus Jakarta Sans', system-ui, …`). If Inter or Plus Jakarta Sans is installed locally it is used; nothing is downloaded.
