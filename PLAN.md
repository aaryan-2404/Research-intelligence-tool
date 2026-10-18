# PLAN: Research Radar Architecture & Execution Strategy

## 1. User Persona & Desk Context
- **Target User:** Equity Research Analyst & Portfolio Strategist at an institutional asset management firm.
- **Coverage Universe:** 15 primary listed equities across Industrials, Tech, Healthcare, Energy, Financials, and Materials, alongside macro policy announcements.
- **Active Focus:** 8 core coverage companies from the official `watchlist.csv`:
  - `ARANYABANK` (Aranya Bank)
  - `VARDHAN` (Vardhan Engineering)
  - `SURYANET` (Suryanet Renewables)
  - `EAM` (Eastern Alloy & Metals)
  - `HELIXORA` (Helixora Pharmaceuticals)
  - `ASTERMO` (Aster Mobility)
  - `SYNAPTIX` (Synaptix Digital Services)
  - `ORBITTEL` (OrbitTel Communications)

---

## 2. Core Jobs-To-Be-Done (JTBD)

1. **Morning Catalyst Horizon (10-Second Scan):**
   - Identify high-conviction events (M&A deals, capex approvals, promoter share acquisitions, rating changes, regulatory directives) affecting the coverage universe immediately upon login.
2. **Precision Filter & Corroboration Discovery:**
   - Filter by Sector, Company/Ticker, Category, Source, or Date range. Uncover multi-source corroboration without sifting through repetitive noise.
3. **Workflow Continuity & Analyst Synthesis:**
   - Read full document disclosures in a sliding context drawer without losing feed position. Keep persistent private notes, toggle bookmarks, and export a ready-to-send Morning Briefing in structured Markdown.
4. **Data Flexibility:**
   - Pre-loaded with the official 250-record Aequitas dataset, with instant capability to drag-and-drop custom CSV/JSON files and reset back anytime.

---

## 3. Deliberate Technical Decisions & Trade-Offs

| Decision | Chosen Approach | Alternative Considered | Rationale / Trade-Off |
| :--- | :--- | :--- | :--- |
| **Scoring Engine** | Deterministic Formula with Factor Breakdown | Cloud LLM / OpenAI API | Instant execution, 100% offline reliability, mathematically auditable, zero API cost/latency. |
| **Search Engine** | Client-side Fuse.js with Field Weighting | Server-side Elasticsearch | Zero backend setup, sub-millisecond response on 250+ records, full typo-tolerance. |
| **Story Clustering** | Shingle/Jaccard Token Similarity | Manual tagging | Automatically condenses duplicate press releases into one master event card. |
| **Persistence** | Browser `localStorage` | Cloud DB / SQLite | Zero authentication barrier for evaluators; notes & bookmarks persist immediately across sessions. |
| **Source Context** | Inline Raw Document Drawer | Simple URL hyperlink | Evaluator can inspect full disclosure text directly from `raw_documents/` without broken external links. |

---

## 4. UI Layout & Visual Identity

- **Theme:** High-density, dark institutional terminal (`#090d16` canvas, crisp zinc typography, accent blue `#3b82f6` and emerald `#10b981`).
- **3-Pane Terminal Structure:**
  1. **Left Rail:** Quick Watchlist toggle, Sector counts, Category filters, Source list, Date range presets (`All`, `Today`, `7D`, `30D`).
  2. **Center Stream:** Top 3 Catalyst Horizon bar, Search bar with `/` shortcut, Active filter pills, and Clustered Feed Cards.
  3. **Right Context Drawer:** Full disclosure text, original raw document viewer, factor-by-factor score breakdown, persistent note editor, and related coverage timeline.
