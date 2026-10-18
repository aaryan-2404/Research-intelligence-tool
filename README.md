# 🛰️ RESEARCH RADAR | Research Intelligence Terminal

> A fast, lightweight, keyboard-accessible **Research Intelligence Terminal** built for institutional equity research analysts and investment professionals. Designed to filter signal from daily information noise across company announcements, corporate earnings, regulatory circulars, and sector developments.

Built for the **Aequitas Research Intelligence Assessment**.

---

## ⚡ Quickstart

### 1. Prerequisites
- **Node.js**: v18+ (tested on v24)
- **Package Manager**: `pnpm` (recommended) or `npm`

### 2. Installation & Run
```bash
# Install dependencies
pnpm install
# Or: npm install

# Run the development server
pnpm dev
# Or: npm run dev

# Open in browser:
# http://localhost:3000
```

### 3. Run Automated Tests
```bash
# Execute unit test suite (Vitest)
pnpm test
# Or: npm test
```

### 4. Build for Production
```bash
pnpm build
pnpm preview
```

---

## 🏛️ Dataset & Provenance Architecture

The application provides **instant multi-dataset flexibility** and is pre-loaded with:
1. **Official Aequitas Benchmark Pack (`Aequitas_Research_Intelligence_Assignment_Data/`):**
   - **`research_feed.csv`**: 250 records across 10 sectors (*Industrials, Technology, Healthcare, Energy, Financials, Materials, Consumer Staples, Consumer Discretionary, Communication Services, Macro & Policy*).
   - **`company_master.csv`**: Master metadata, statutory descriptions, and alias mappings for 15 primary listed companies.
   - **`watchlist.csv`**: Official 8 focus equities (`ARANYABANK`, `VARDHAN`, `SURYANET`, `EAM`, `HELIXORA`, `ASTERMO`, `SYNAPTIX`, `ORBITTEL`).
   - **`raw_documents/`**: 250 full disclosure text files (`RF0001.txt` to `RF0250.txt`) linked directly into the viewer for original source inspection.
2. **Built-in Offline Sample Demo Feed:**
   - 46 realistic research intelligence records with explicit sample labeling (`is_sample: true`) to demonstrate the tool end-to-end without requiring external files.
3. **Dynamic CSV / JSON Ingestion Engine:**
   - Client-side drag-and-drop file uploader with auto-detection for common column headers (`title`, `headline`, `source`, `published_at`, `company`, `ticker`, `sector`, `summary`, `content`).
   - Fallback column-mapping modal for unfamiliar CSV formats, duplicate detection, and a 1-click "Reset to Benchmark" button.
   - 100% offline; zero API keys or external server dependencies.

---

## 🖥️ Layout Architecture: The Split-Pane Research Workbench

Designed specifically for institutional equity research workflows, the workspace features a 3-pane split screen:
1. **Left Column (20%): Sources & Coverage Basket**
   - 8 Focus Equities with live unread badge counters.
   - AlphaSense-style **`[ONLY]`** isolation buttons next to *Exchange Filings*, *Rating Agencies*, *Broker Notes*, and *Trade Journals*.
   - Date Horizon presets (`Today 24h`, `Last 7 Days`, `Last 30 Days`, `All Time`) and Min Priority Score slider.
2. **Center Column (38%): Catalyst Snippet Stream**
   - High-density disclosure stream with auditable `[94] PRIORITY` score badges, ticker pills, and standardized `"N reports from M sources"` cluster deduplication.
   - Sentence-level deal excerpts with keyword highlights.
3. **Right Column (42%): Persistent Document Reader & Score Ledger**
   - Side-by-side statutory disclosure viewer (`RFxxxx.txt`) with yellow-marker keyword highlights on transaction figures.
   - Auditable 4-factor scoring ledger table: `Recency (30) + Impact (35) + Corroboration (20) + Watchlist (15)`.
   - Analyst Thesis Scratchpad with auto-save to `localStorage` and quick insert templates.

- Used consistently across:
  1. **Date Horizon Presets:**
     - `Today (24h)`: records within 24h of as-of date (11 Oct – 12 Oct 2026).
     - `Last 7 Days`: records within 168h of as-of date.
     - `Last 30 Days`: records within 720h of as-of date.
     - `All Time`: all 250 records.
  2. **Relative Age Labels:** Displayed alongside absolute dates (e.g. `8 Apr 2026 · 187d before latest`).
  3. **Recency Scoring:** Exponential decay calculated relative to the as-of date.
  4. **Executive Briefing Export:** Explicitly dated `AS OF 12 OCT 2026`.

---

## ⚖️ Transparent "Worth Attention" Scoring Engine

Every score (0–100) is deterministically computed from four auditable factors:
$$\text{Total Score} = \text{Recency (30)} + \text{Impact Catalysts (35)} + \text{Corroboration (20)} + \text{Watchlist (15)}$$

### 1. Event Type & Direction Matrix (Max 35 pts)
| Event / Catalyst | Base Points | Signal Direction | Context / Trigger |
| :--- | :---: | :---: | :--- |
| **Credit Downgrade / Default / Insolvency** | 35 | Risk | Material balance sheet deterioration |
| **Subpoena / Antitrust / Fraud / Penalty** | 30–32 | Risk | Regulatory enforcement or legal probe |
| **Guidance Cut / Profit Warning / Slashes** | 30 | Risk | Downward operational earnings revision |
| **Leadership Ouster / Auditor Resignation** | 28–32 | Risk | Governance distress |
| **M&A Acquisition / Merger / Takeover** | 28 | Opportunity | Strategic capital deployment |
| **Phase 3 Trial / Regulatory Approval / FDA** | 26 | Opportunity | Clinical / operational milestones |
| **Promoter Entity Share Purchases** | 25 | Opportunity | Significant insider buying conviction |
| **Credit Upgrade / Rating Lift** | 22 | Opportunity | Balance sheet de-leveraging |
| **Capex Approval / Capacity Expansion** | 20–22 | Opportunity | Growth capital expenditure |
| **Order Win / Major Contract Award** | 18–20 | Opportunity | Top-line revenue pipeline expansion |
| **Project Timeline Revision / Site Rollout** | 6–8 | Neutral | Execution sequencing updates |
| **Routine Investor Meeting / Admin Filing** | 2–4 | Neutral | Scheduled procedural interactions |

### 2. Title vs. Body Weighting
- **Headline Matches (1.0x Weight):** Catalyst keywords in the headline reflect the primary theme of the disclosure and receive full base points.
- **Passing Body Mentions (0.35x Weight):** Secondary mentions appearing only in the body text (e.g., *"noting acquisition-related integration as a monitorable"*) receive heavily discounted points (max 8–10 pts).

### 3. Negative Modifier Dampening
Disclosures with routine modifier phrases are explicitly dampened to prevent false positives:
- Phrases like `"reaffirmed with stable outlook"`, `"commercial terms remain unchanged"`, or `"no material impact"` deduct 10–18 points from the impact score and log a visible explanation.

### 4. Independent Corroboration (Max 20 pts)
Sources are categorized into **Company-Issued** (*Exchange Disclosure Feed, Corporate Communications, Company IR Desk*) and **Independent** (*Rating Agency, Newswire, Trade Journal, Sector Monitor*):
- 3+ independent sources: **20 pts**
- 2 independent sources: **14 pts**
- 1 independent source: **8 pts**
- 0 independent sources (company PR only): **2–4 pts**

### 5. Watchlist Alignment & Entity Mismatch Guard (Max 15 pts)
- **Watchlist Ticker Match:** +10 pts (+5 pts for focus keywords).
- **Entity Mismatch Guard:** If an article's headline mentions a company that conflicts with the record's assigned ticker, a visible `⚠️ Entity Mismatch` warning badge is displayed, and the watchlist point boost is **strictly withheld (0 pts)**.

---

## 🗂️ Near-Duplicate Story Clustering ("Media Echo Chamber Reducer")
- Groups related reports into a single **Master Event Card** with an expandable multi-source timeline.
- **Strict Entity Guard:** Clustering **never** groups disclosures from different companies together, preventing cross-company contamination.
- Standardized wording: `"N reports from M sources"`.

---

## ⌨️ Terminal Keyboard Shortcuts

| Shortcut | Action |
| :---: | :--- |
| `/` | Focus search input box |
| `j` or `↓` | Navigate to next intelligence card |
| `k` or `↑` | Navigate to previous intelligence card |
| `Enter` | Open detail context drawer for selected item |
| `s` | Bookmark / save selected story to local storage |
| `Esc` | Close context drawer or modal |
| `?` | Toggle keyboard shortcuts cheatsheet |

---

## 🧪 Test Suite

All scoring heuristics, clustering algorithms, and date anchoring are verified in `tests/pipeline.test.ts`:
```bash
pnpm test
```
- ✅ **Time Anchoring:** Single as-of date consistency across recency decay and relative age labels.
- ✅ **Entity Correctness:** Cluster guard prevents grouping different companies; entity mismatch blocks watchlist points.
- ✅ **Direction & Dampening:** Reaffirmed rating with stable outlook scores lower than a downgrade; title catalysts score higher than passing body mentions.
- ✅ **Source Counts:** Standardized "N reports from M sources" and independent source corroboration weighting.
- ✅ **Aequitas Benchmark Integration:** Verifies RF0104 is correctly assigned to Helixora and dataset as-of date matches latest record.
