# SUBMISSION NOTE: RESEARCH RADAR

**Candidate Assessment:** Research Intelligence Tool  
**Platform:** Research Radar (Institutional Intelligence Terminal)  
**Date:** October 16, 2026  

---

## 1. What I Built and Why

### The Problem
Equity research analysts do not suffer from an information shortage—they face an **information triage, noise filtering, and workflow continuity bottleneck**. On any given morning, an analyst must parse dozens of exchange filings, company press releases, credit rating notices, and trade journal reports. Much of this volume consists of repetitive wires, minor procedural filings, or media echo chambers where multiple outlets regurgitate the same press release with varied headlines.

### The Solution
I built **Research Radar**: a fast, dense, keyboard-accessible **Research Intelligence Terminal** built with React 19, TypeScript, Vite, and Tailwind CSS. Anchored to a single canonical reference date (`12 Oct 2026`), the platform delivers:
1. **The 10-Second Priority Horizon:** A collapsible top catalyst ribbon spotlighting the top three high-conviction market events (large acquisitions, capex authorizations, promoter share purchases) the moment an analyst sits at their desk.
2. **Near-Duplicate Story Clustering:** Groups wire echoes into a single master card with an expandable multi-source timeline, preventing repetitive noise from polluting the feed while enforcing strict same-company guards.
3. **Auditable "Worth Attention" Engine:** An explainable 0–100 scoring model distinguishing event severity, signal direction (Risk vs. Opportunity), headline vs. body mention weight (3x difference), and negative dampening modifiers (e.g. "reaffirmed with stable outlook").
4. **Context-Preserving Split-Pane Workbench:** A persistent 3-column layout (Sources & Watchlist with `[ONLY]` toggles • Catalyst Snippet Stream • Side-by-Side Raw Document Reader with 4-Factor Score Ledger) allowing analysts to inspect full statutory text (`raw_documents/RFxxxx.txt`) and record private investment notes without ever losing context.
5. **1-Click Executive Morning Briefing Exporter:** Compiles prioritized catalysts and analyst notes into a structured markdown document ready for Slack or email.
6. **Multi-Dataset Flexibility:** Instant toggle between the official 250-record Aequitas Benchmark, a built-in 46-record offline demo feed, and custom CSV/JSON upload with auto-column mapping.

---

## 2. One Key Decision and Trade-Offs Considered

### Decision: Explainable Rule-Based Scoring Over a Black-Box Cloud LLM

When tasked with "identifying information worth paying attention to," the common temptation is to pipe every headline into a cloud-hosted LLM (e.g. OpenAI or Claude) with a prompt like *"Rate the importance of this news from 1 to 10"*.

I deliberately chose a **deterministic, rule-based scoring engine paired with title-shingle clustering**, executed entirely client-side.

### The Trade-Offs:
- **Auditability vs. Semantic Nuance:** In institutional equity research, an opaque score like "88/100" is unusable—and dangerous—if an analyst cannot justify it to a Portfolio Manager. If a rule-based engine makes a mistake, the factor breakdown makes the failure immediately visible and debuggable (e.g. seeing *"+12 pts: acquisition detected"* on a credit reaffirmation makes the issue transparent). With a black-box LLM, mistakes are hidden behind hallucinated rationales.
- **Rules Can Be Rigid, But They Are Correctable:** A keyword dictionary can misread context if uncalibrated. To address this, I introduced: (1) title vs. body field weighting (passing body mentions receive 0.35x weight), and (2) negative dampening modifiers (*"reaffirmed"*, *"stable outlook"*, *"no material impact"*) that actively discount procedural updates.
- **Zero Latency, Zero Cost, 100% Offline:** Calling an LLM API across 250 records introduces seconds of latency, API rate limits, network failure points, and token costs. Our engine processes and clusters 250 records in **under 25 milliseconds**, operates 100% offline, and costs $0.00.
- **Compliance & Embargo Safety:** Real research desks operate under strict compliance rules. Unreleased or embargoed corporate research cannot be piped through third-party public cloud APIs.

---

## 3. What I Would Improve With More Time

1. **Lightweight On-Device Event Direction ML:**
   - Train a small, quantized local classification model (e.g. MobileBERT / ONNX runtime in browser) to classify disclosure sentiment and financial direction (positive, negative, routine neutral) without external API dependencies.
2. **Fuzzy Entity Resolution & Named Entity Recognition (NER):**
   - Implement probabilistic string alignment and token-distance NER to automatically detect non-standard company mentions and subsidiary relationships while avoiding substring false positives.
3. **Analyst Feedback Loop for Weight Tuning:**
   - Add a lightweight feedback mechanism (e.g. thumbs up / thumbs down on score drivers) allowing the research team to customize catalyst weights over time based on their sector focus.
