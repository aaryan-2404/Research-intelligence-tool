import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

const BASE_DIR = path.resolve('Aequitas_Research_Intelligence_Assignment_Data/Aequitas_Research_Intelligence_Assignment_Data');
const FEED_CSV = path.join(BASE_DIR, 'research_feed.csv');
const COMPANY_CSV = path.join(BASE_DIR, 'company_master.csv');
const WATCHLIST_CSV = path.join(BASE_DIR, 'watchlist.csv');
const RAW_DOCS_DIR = path.join(BASE_DIR, 'raw_documents');

console.log('Reading Aequitas assignment files from:', BASE_DIR);

// 1. Read Company Master
const companyCsvText = fs.readFileSync(COMPANY_CSV, 'utf-8');
const companyMasterParsed = Papa.parse(companyCsvText, { header: true, skipEmptyLines: true }).data;
const companyMap = new Map();
const aliasList = [];

companyMasterParsed.forEach(c => {
  if (!c.company) return;
  const compClean = c.company.trim();
  const tickerClean = c.ticker ? c.ticker.trim() : '';
  const obj = {
    company: compClean,
    ticker: tickerClean,
    sector: c.sector?.trim(),
    industry: c.industry?.trim(),
    description: c.description?.trim()
  };

  companyMap.set(compClean, obj);
  if (tickerClean) {
    companyMap.set(tickerClean, obj);
  }

  // Exact company name match
  aliasList.push({
    pattern: new RegExp(`\\b${compClean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i'),
    compObj: obj,
    isFormalName: true
  });

  // Short aliases with strict word boundaries
  if (c.aliases) {
    c.aliases.split(';').forEach(alias => {
      const a = alias.trim();
      if (a) {
        aliasList.push({
          pattern: new RegExp(`\\b${a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i'),
          compObj: obj,
          isFormalName: false
        });
      }
    });
  }
});

// Sort aliases so formal names and longer patterns match first
aliasList.sort((a, b) => b.pattern.source.length - a.pattern.source.length);

// 2. Read Watchlist
const watchlistCsvText = fs.readFileSync(WATCHLIST_CSV, 'utf-8');
const watchlistParsed = Papa.parse(watchlistCsvText, { header: true, skipEmptyLines: true }).data;
const watchlistTickers = new Set(watchlistParsed.map(w => w.ticker?.trim()).filter(Boolean));

console.log(`Loaded ${companyMasterParsed.length} companies and ${watchlistTickers.size} watchlist tickers.`);

// 3. Read Research Feed
const feedCsvText = fs.readFileSync(FEED_CSV, 'utf-8');
const feedParsed = Papa.parse(feedCsvText, { header: true, skipEmptyLines: true }).data;
console.log(`Loaded ${feedParsed.length} raw feed records.`);

// Determine true As-Of Date (maximum published date across dataset)
const validTimestamps = feedParsed
  .map(r => new Date(r.published_at?.trim()).getTime())
  .filter(t => !isNaN(t));

const trueAsOfDate = new Date(Math.max(...validTimestamps)).toISOString();
console.log(`True Dataset As-Of Date: ${trueAsOfDate}`);

// Clean, validate entities, and enrich records
const cleanedRecords = feedParsed.map(row => {
  const record_id = row.record_id?.trim() || '';
  const published_at = row.published_at?.trim() || '';
  let source_name = row.source_name?.trim() || row.source_type?.trim() || 'Research Desk';
  source_name = source_name.replace(/_/g, ' ');

  const headline = row.headline?.trim() || '';
  const content = row.content?.trim() || '';
  let company = row.company?.trim() || '';
  let ticker = row.ticker?.trim() || '';
  let sector = row.sector?.trim() || '';
  let industry = row.industry?.trim() || '';
  const tags = row.tags ? row.tags.split(';').map(t => t.trim()).filter(Boolean) : [];
  const source_path = row.source_path?.trim() || '';

  // Deterministic Entity Extraction & Mismatch Detection
  let detectedFromHeadline = null;
  for (const item of aliasList) {
    if (item.pattern.test(headline)) {
      detectedFromHeadline = item.compObj;
      break;
    }
  }

  let has_entity_mismatch = false;
  let mismatch_details = '';

  if (detectedFromHeadline) {
    if (ticker && ticker !== detectedFromHeadline.ticker) {
      // Conflict: Row has a ticker, but headline mentions a different company!
      has_entity_mismatch = true;
      mismatch_details = `Headline mentions "${detectedFromHeadline.company}" (${detectedFromHeadline.ticker}), but record is tagged "${ticker}" (${company}).`;
      console.warn(`Entity Mismatch flagged for [${record_id}]: ${mismatch_details}`);
    } else if (!ticker) {
      // Row lacked ticker; resolve correctly from headline!
      company = detectedFromHeadline.company;
      ticker = detectedFromHeadline.ticker;
      sector = sector || detectedFromHeadline.sector;
      industry = industry || detectedFromHeadline.industry;
    }
  }

  // If sector is missing but company is known
  if (!sector && company && companyMap.has(company)) {
    const compObj = companyMap.get(company);
    sector = compObj.sector;
    industry = compObj.industry;
  }

  // If still missing sector, categorize as Macro & Policy
  if (!sector) {
    sector = 'Macro & Policy';
    industry = industry || 'Economic Indicators';
  }

  // Category from tags or source_type
  let category = row.source_type?.trim() || 'Industry Update';
  if (tags.length > 0) {
    const primaryTag = tags[0];
    category = primaryTag.charAt(0).toUpperCase() + primaryTag.slice(1);
  }

  // Concise excerpt
  let summary = content;
  if (content.length > 180) {
    const firstPeriod = content.indexOf('. ');
    if (firstPeriod > 50 && firstPeriod < 240) {
      summary = content.slice(0, firstPeriod + 1);
    } else {
      summary = content.slice(0, 180) + '...';
    }
  }

  // Raw document content from local archive
  let rawDocContent = '';
  if (source_path) {
    const fullDocPath = path.join(BASE_DIR, source_path);
    if (fs.existsSync(fullDocPath)) {
      rawDocContent = fs.readFileSync(fullDocPath, 'utf-8');
    }
  }

  return {
    id: record_id,
    title: headline,
    source: source_name,
    source_type: row.source_type?.trim(),
    published_at: published_at ? new Date(published_at).toISOString() : trueAsOfDate,
    source_path: source_path,
    company: company || undefined,
    ticker: ticker || undefined,
    sector: sector || 'General Industry',
    industry: industry || undefined,
    category,
    tags,
    summary,
    content,
    raw_document: rawDocContent || undefined,
    has_entity_mismatch,
    mismatch_details: has_entity_mismatch ? mismatch_details : undefined,
    is_on_watchlist: ticker ? watchlistTickers.has(ticker) : false,
    is_sample: false
  };
});

// Save enriched dataset into src/data/aequitasData.json
const OUT_PATH = path.resolve('src/data/aequitasData.json');
fs.writeFileSync(OUT_PATH, JSON.stringify(cleanedRecords, null, 2), 'utf-8');
console.log(`Successfully generated ${cleanedRecords.length} records in ${OUT_PATH}`);

// Save dataset metadata with as-of date
const META_OUT = path.resolve('src/data/datasetMeta.json');
const datasetMeta = {
  asOfDate: trueAsOfDate,
  asOfDateFormatted: new Date(trueAsOfDate).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }),
  totalRecords: cleanedRecords.length,
  datasetName: 'Aequitas Research Feed'
};
fs.writeFileSync(META_OUT, JSON.stringify(datasetMeta, null, 2), 'utf-8');
console.log(`Saved dataset metadata with As-Of Date: ${datasetMeta.asOfDateFormatted}`);
