import fs from 'fs';

const data = JSON.parse(fs.readFileSync('src/data/aequitasData.json', 'utf-8'));
console.log('Total Records:', data.length);

const sectors = {};
const sources = {};
const companies = {};
const categories = {};
const tags = {};
let missingTicker = 0;
let missingSector = 0;

data.forEach(d => {
  sectors[d.sector] = (sectors[d.sector] || 0) + 1;
  sources[d.source] = (sources[d.source] || 0) + 1;
  categories[d.category] = (categories[d.category] || 0) + 1;
  if (d.company) companies[d.company] = (companies[d.company] || 0) + 1;
  if (!d.ticker) missingTicker++;
  if (!d.sector) missingSector++;
  if (d.tags) {
    d.tags.forEach(t => tags[t] = (tags[t] || 0) + 1);
  }
});

const dates = data.map(d => new Date(d.published_at).getTime()).filter(t => !isNaN(t));
const minDate = new Date(Math.min(...dates)).toISOString().slice(0, 10);
const maxDate = new Date(Math.max(...dates)).toISOString().slice(0, 10);

console.log('Date Range:', minDate, 'to', maxDate);
console.log('Distinct Companies:', Object.keys(companies).length);
console.log('Missing Ticker (Macro/Sector items):', missingTicker);
console.log('Sector Distribution:', sectors);
console.log('Top Sources:', Object.entries(sources).slice(0, 8));
console.log('Top Categories:', Object.entries(categories).slice(0, 8));
console.log('Top Tags:', Object.entries(tags).slice(0, 8));
