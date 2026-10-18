# DATA_NOTES: Aequitas Research Intelligence Dataset Audit

## 1. Executive Summary
This document provides an audit of the **Aequitas Research Intelligence Data Pack** (`Aequitas_Research_Intelligence_Assignment_Data`). The dataset simulates a realistic flow of corporate disclosures, earnings updates, regulatory alerts, sector developments, and market noise faced daily by an equity research desk.

---

## 2. Dataset Architecture & Inventory

The data pack contains 5 interconnected files:
1. **`research_feed.csv`**: Main repository containing **250 records** spanning from January 4, 2026 to October 12, 2026.
2. **`company_master.csv`**: Master registry of 15 tracked companies containing formal entity names, stock tickers, aliases, sectors, sub-industries, geographies, and business descriptions.
3. **`watchlist.csv`**: The firm's active research coverage universe comprising 8 high-priority focus equities.
4. **`research_repository.xlsx`**: Excel workbook with data dictionary and cross-sheet relationships.
5. **`raw_documents/`**: 250 individual text files (`RF0001.txt` through `RF0250.txt`) providing full disclosure bodies and original context.

---

## 3. Key Data Findings & Corrections

### A. Single Time Anchor (As-Of Date)
- **Dataset Date Range:** 4 January 2026 to 12 October 2026 (00:00:00 local time).
- **As-Of Date:** `12 Oct 2026` (`2026-10-11T18:30:00.000Z`).
- **Correction:** Prior code had scattered reference dates (`2026-10-16` vs system clock `new Date()`). All time calculations (relative ages, horizon filters `Today`, `7d`, `30d`, recency scoring decay, and briefing exports) are now anchored to `12 Oct 2026`.

### B. Entity Resolution Bug & Word-Boundary Correction
- **Finding:** Record `RF0104` (*"Helixora Pharmaceuticals Limited: Credit rating reaffirmed with stable outlook"*) has empty `company` and `ticker` in raw `research_feed.csv`.
- **Root Cause:** A naive `.includes()` substring match matched Aranya Bank's alias `"abl"` inside the word `"stable"` (`st-abl-e`), misattributing Helixora's credit rating to `ARANYABANK`. Similarly, macro items were misattributed due to `"renewable"` containing `"abl"`.
- **Correction:** Ingestion now utilizes strict word-boundary regex (`\bABL\b`) and prioritizes full statutory company names. Furthermore, an **Entity Mismatch Guard** was introduced: if a headline mentions a company conflicting with the record's assigned ticker, an `⚠️ Entity Mismatch` badge is shown, and watchlist boosts are withheld.

### C. Source Document Provenance (Local vs. Web URLs)
- **Finding:** `research_feed.csv` has **no `url` column**. It contains `source_path` pointing to files in `raw_documents/` (e.g. `raw_documents/RF0104.txt`).
- **Correction:** Fictional web hyperlinks were eliminated. The UI features a clean **"View Source Document"** viewer that renders the authentic local text file with complete provenance.

---

## 4. Sector & Source Distribution

### Sector Breakdown (250 Records)
- **Industrials:** 42 items (16.8%)
- **Macro & Policy:** 40 items (16.0%)
- **Healthcare:** 30 items (12.0%)
- **Technology:** 27 items (10.8%)
- **Energy:** 27 items (10.8%)
- **Financials:** 25 items (10.0%)
- **Communication Services:** 17 items (6.8%)
- **Consumer Staples:** 16 items (6.4%)
- **Materials:** 14 items (5.6%)
- **Consumer Discretionary:** 12 items (4.8%)

### Source Classification
- **Company-Issued (Internal PR):** `Exchange Disclosure Feed` (35), `Corporate Communications` (27), `Company IR Desk` (21).
- **Independent Third-Party:** `Exchange Circular Digest` (14), `Credit Review Note` (12), `Policy Monitor` (10), `Sector Monitor` (7), `Trade Journal` (4), `Newswire` / others (120).
