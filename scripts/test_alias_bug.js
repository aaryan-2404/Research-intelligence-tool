import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

const BASE_DIR = path.resolve('Aequitas_Research_Intelligence_Assignment_Data/Aequitas_Research_Intelligence_Assignment_Data');
const FEED_CSV = path.join(BASE_DIR, 'research_feed.csv');
const COMPANY_CSV = path.join(BASE_DIR, 'company_master.csv');

const rawFeed = Papa.parse(fs.readFileSync(FEED_CSV, 'utf-8'), { header: true, skipEmptyLines: true }).data;
const companyMaster = Papa.parse(fs.readFileSync(COMPANY_CSV, 'utf-8'), { header: true, skipEmptyLines: true }).data;

const aliasMap = new Map();
companyMaster.forEach(c => {
  if (c.aliases) {
    c.aliases.split(';').forEach(alias => {
      aliasMap.set(alias.trim().toLowerCase(), c);
    });
  }
});

console.log('Testing naive includes:');
rawFeed.forEach(row => {
  let company = row.company?.trim() || '';
  let ticker = row.ticker?.trim() || '';
  const headline = row.headline?.trim() || '';

  if (!company || !ticker) {
    for (const [alias, compObj] of aliasMap.entries()) {
      if (headline.toLowerCase().includes(alias)) {
        console.log(`[${row.record_id}] Matched alias "${alias}" (${compObj.ticker}) in headline: "${headline}"`);
        break;
      }
    }
  }
});
