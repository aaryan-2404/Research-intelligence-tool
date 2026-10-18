import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

const BASE_DIR = path.resolve('Aequitas_Research_Intelligence_Assignment_Data/Aequitas_Research_Intelligence_Assignment_Data');
const FEED_CSV = path.join(BASE_DIR, 'research_feed.csv');
const COMPANY_CSV = path.join(BASE_DIR, 'company_master.csv');
const RAW_DOCS_DIR = path.join(BASE_DIR, 'raw_documents');

const rawFeed = Papa.parse(fs.readFileSync(FEED_CSV, 'utf-8'), { header: true, skipEmptyLines: true }).data;
const companyMaster = Papa.parse(fs.readFileSync(COMPANY_CSV, 'utf-8'), { header: true, skipEmptyLines: true }).data;

console.log('=== STEP 0 INVESTIGATION ===\n');

// (a) Date range and Reference Dates in codebase
const timestamps = rawFeed.map(r => new Date(r.published_at).getTime()).filter(t => !isNaN(t));
const maxDate = new Date(Math.max(...timestamps));
const minDate = new Date(Math.min(...timestamps));
console.log('--- (a) DATES AND REFERENCE ANCHOR ---');
console.log('Earliest date in dataset:', minDate.toISOString());
console.log('Latest date in dataset (True As-Of Date):', maxDate.toISOString());

const useIntelContent = fs.readFileSync('src/hooks/useIntelligence.ts', 'utf-8');
const formattersContent = fs.readFileSync('src/utils/formatters.ts', 'utf-8');
const scoringContent = fs.readFileSync('src/services/scoringEngine.ts', 'utf-8');

console.log('useIntelligence.ts REFERENCE_DATE:', useIntelContent.match(/REFERENCE_DATE\s*=\s*['"]([^'"]+)['"]/)?.[1]);
console.log('formatters.ts default date:', formattersContent.match(/referenceDateStr:\s*string\s*=\s*['"]([^'"]+)['"]/)?.[1]);
console.log('scoringEngine.ts default date:', scoringContent.match(/new Date\(['"]([^'"]+)['"]\)/)?.[1]);
console.log('Briefing generator date:', useIntelContent.includes('new Date().toLocaleDateString') ? 'new Date() (System clock / current day)' : 'Other');

// (b) Helixora / Aranya Bank Ticker & Company Mismatch
console.log('\n--- (b) ENTITY & TICKER MISMATCH ROOT CAUSE ---');
const helixoraRows = rawFeed.filter(r => (r.headline && r.headline.includes('Helixora')) || (r.company && r.company.includes('Helixora')));
helixoraRows.forEach(r => {
  console.log(`[${r.record_id}] headline: "${r.headline}" | record.company: "${r.company}" | record.ticker: "${r.ticker}"`);
});

const companyToTicker = {};
companyMaster.forEach(c => {
  if (c.ticker && c.company) {
    companyToTicker[c.company.trim()] = c.ticker.trim();
  }
});

let mismatchCount = 0;
const mismatches = [];

rawFeed.forEach(r => {
  if (!r.headline) return;
  for (const [compName, compTicker] of Object.entries(companyToTicker)) {
    if (r.headline.includes(compName)) {
      if (r.ticker && r.ticker !== compTicker) {
        mismatchCount++;
        mismatches.push({
          id: r.record_id,
          headline: r.headline,
          headlineCompany: compName,
          expectedTicker: compTicker,
          recordCompany: r.company,
          recordTicker: r.ticker
        });
      }
    }
  }
});

console.log(`Total headline-to-record company mismatches in raw feed: ${mismatchCount}`);
mismatches.forEach(m => {
  console.log(` - Record [${m.id}]: Headline mentions "${m.headlineCompany}" (expected ticker ${m.expectedTicker}), BUT row fields have ticker "${m.recordTicker}" and company "${m.recordCompany}"`);
});

// Check if clustering also merged different companies
// Let's inspect scripts/prepare-aequitas-data.js and how aequitasData.json was built
const aequitasData = JSON.parse(fs.readFileSync('src/data/aequitasData.json', 'utf-8'));
// Check near duplicate clustering in current code:
// Let's inspect clustering logic in src/services/clusteringEngine.ts
console.log('\nChecking clustering rules in src/services/clusteringEngine.ts:');
const clusteringCode = fs.readFileSync('src/services/clusteringEngine.ts', 'utf-8');
const hasCompanyGuard = clusteringCode.includes('itemA.ticker !== itemB.ticker') || clusteringCode.includes('itemA.company !== itemB.company');
console.log('Does current clustering enforce same-company guard?:', hasCompanyGuard);

// (c) Source counts and discrepancies
console.log('\n--- (c) SOURCE COUNTS & DISCREPANCIES ---');
console.log('Let us check feed cards vs priority cards vs drawer in current components:');
const feedCardCode = fs.readFileSync('src/components/FeedCard.tsx', 'utf-8');
const priorityCode = fs.readFileSync('src/components/TopPriorityHorizon.tsx', 'utf-8');
const drawerCode = fs.readFileSync('src/components/DetailDrawer.tsx', 'utf-8');

console.log('FeedCard shows:', feedCardCode.match(/\+\{cluster\.relatedItems\.length\} related sources/)?.[0] || 'Check relatedItems');
console.log('TopPriorityHorizon shows:', priorityCode.match(/\{cluster\.totalSourcesCount\}\s*sources/)?.[0] || 'Check totalSourcesCount');
console.log('DetailDrawer shows:', drawerCode.match(/Related Source Disclosures \(\{cluster\.totalSourcesCount\} Total\)/)?.[0] || 'Check totalSourcesCount');
console.log('Reason for disagreement: Feed card was showing "+N related sources" (where N = relatedItems.length, which is count of OTHER reports, not sources!), whereas priority card showed totalSourcesCount (count of unique source names), and drawer showed totalSourcesCount while listing related items!');

// (d) Checking URLs
console.log('\n--- (d) URLS VS LOCAL FILES ---');
const rawCols = Object.keys(rawFeed[0] || {});
console.log('Columns in raw research_feed.csv:', rawCols);
const hasUrlCol = rawCols.includes('url');
console.log('Is there a "url" column in research_feed.csv?:', hasUrlCol);
const samplePaths = rawFeed.slice(0, 5).map(r => r.source_path);
console.log('Sample source_path values:', samplePaths);
const allFilesExist = samplePaths.every(p => fs.existsSync(path.join(BASE_DIR, p)));
console.log('Do source_path local text files exist in raw_documents/?:', allFilesExist);
