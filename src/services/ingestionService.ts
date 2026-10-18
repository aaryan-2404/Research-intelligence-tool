import Papa from 'papaparse';
import { ResearchItem, ColumnMapping } from '../types/intelligence';

// Alias dictionary for intelligent auto-detection
const COLUMN_ALIASES: Record<keyof ColumnMapping, string[]> = {
  title: ['title', 'headline', 'subject', 'header', 'name', 'article_title'],
  source: ['source', 'publisher', 'outlet', 'news_source', 'media', 'origin', 'author'],
  published_at: ['published_at', 'date', 'pubdate', 'timestamp', 'created_at', 'datetime', 'time', 'publish_date'],
  url: ['url', 'link', 'source_url', 'article_url', 'web_link', 'href'],
  company: ['company', 'entity', 'organization', 'firm', 'target', 'issuer'],
  ticker: ['ticker', 'symbol', 'stock_symbol', 'stock', 'ticker_symbol'],
  sector: ['sector', 'industry', 'market', 'segment'],
  category: ['category', 'topic', 'tag', 'type', 'genre', 'theme'],
  summary: ['summary', 'description', 'snippet', 'abstract', 'brief', 'lead'],
  content: ['content', 'body', 'article', 'text', 'full_text', 'details']
};

export interface IngestionResult {
  items: ResearchItem[];
  detectedMapping: ColumnMapping;
  headers: string[];
  warnings: string[];
  errors: string[];
  duplicatesCount: number;
}

export function autoDetectColumns(headers: string[]): ColumnMapping {
  const normalizedHeaders = headers.map(h => ({
    raw: h,
    clean: h.toLowerCase().trim().replace(/[^a-z0-9_]/g, '_')
  }));

  const mapping: Partial<ColumnMapping> = {};

  for (const [key, aliases] of Object.entries(COLUMN_ALIASES)) {
    const match = normalizedHeaders.find(h =>
      aliases.some(alias => h.clean === alias || h.clean.includes(alias))
    );
    if (match) {
      mapping[key as keyof ColumnMapping] = match.raw;
    }
  }

  return {
    title: mapping.title || headers[0] || 'title',
    source: mapping.source || 'source',
    published_at: mapping.published_at || 'published_at',
    url: mapping.url || 'url',
    company: mapping.company,
    ticker: mapping.ticker,
    sector: mapping.sector,
    category: mapping.category,
    summary: mapping.summary,
    content: mapping.content
  };
}

function sanitizeUrl(rawUrl?: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  const trimmed = rawUrl.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  if (trimmed.startsWith('www.')) {
    return `https://${trimmed}`;
  }
  return '';
}

function parseDateRobust(rawDate?: string): string {
  if (!rawDate) return new Date().toISOString();
  const parsed = new Date(rawDate);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString();
  }
  // Try alternative format DD/MM/YYYY
  const parts = String(rawDate).split(/[\/\-\.]/);
  if (parts.length === 3) {
    const candidate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    if (!isNaN(candidate.getTime())) {
      return candidate.toISOString();
    }
  }
  return new Date().toISOString();
}

export function processRawRecords(
  rows: Record<string, any>[],
  mapping: ColumnMapping
): { items: ResearchItem[]; warnings: string[]; duplicatesCount: number } {
  const items: ResearchItem[] = [];
  const seenTitles = new Set<string>();
  const warnings: string[] = [];
  let duplicatesCount = 0;

  rows.forEach((row, index) => {
    const rawTitle = row[mapping.title];
    if (!rawTitle || typeof rawTitle !== 'string' || !rawTitle.trim()) {
      warnings.push(`Row ${index + 1} skipped: Missing title/headline.`);
      return;
    }

    const title = rawTitle.trim();
    const normalizedTitleKey = title.toLowerCase().replace(/[^a-z0-9]/g, '');

    if (seenTitles.has(normalizedTitleKey)) {
      duplicatesCount++;
      return; // Deduplicate identical records
    }
    seenTitles.add(normalizedTitleKey);

    const source = row[mapping.source]?.toString().trim() || 'Unknown Source';
    const published_at = parseDateRobust(row[mapping.published_at]);
    const url = mapping.url ? sanitizeUrl(row[mapping.url]) : '';
    const company = mapping.company ? row[mapping.company]?.toString().trim() : undefined;
    const ticker = mapping.ticker ? row[mapping.ticker]?.toString().trim().toUpperCase() : undefined;
    const sector = (mapping.sector && row[mapping.sector]?.toString().trim()) || 'General Industry';
    const category = (mapping.category && row[mapping.category]?.toString().trim()) || 'News & Updates';
    const content = (mapping.content && row[mapping.content]?.toString().trim()) || title;

    let summary = mapping.summary ? row[mapping.summary]?.toString().trim() : '';
    if (!summary) {
      // Auto-extract first sentence or 140 chars as fallback snippet
      summary = content.length > 150 ? content.slice(0, 150) + '...' : content;
    }

    const id = row.id ? String(row.id) : `import-${index + 1}-${normalizedTitleKey.slice(0, 10)}`;

    items.push({
      id,
      title,
      source,
      published_at,
      url,
      company,
      ticker,
      sector,
      category,
      summary,
      content,
      is_sample: false
    });
  });

  return { items, warnings, duplicatesCount };
}

export function parseCSVString(csvText: string, customMapping?: ColumnMapping): IngestionResult {
  const parsed = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false
  });

  const headers = parsed.meta.fields || [];
  const mapping = customMapping || autoDetectColumns(headers);
  const { items, warnings, duplicatesCount } = processRawRecords(parsed.data as Record<string, any>[], mapping);

  return {
    items,
    detectedMapping: mapping,
    headers,
    warnings,
    errors: parsed.errors.map(e => `CSV Parse error (Row ${e.row}): ${e.message}`),
    duplicatesCount
  };
}

export function parseJSONString(jsonText: string, customMapping?: ColumnMapping): IngestionResult {
  try {
    const rawData = JSON.parse(jsonText);
    const rows: Record<string, any>[] = Array.isArray(rawData) ? rawData : (rawData.data || rawData.records || [rawData]);

    if (!Array.isArray(rows) || rows.length === 0) {
      return {
        items: [],
        detectedMapping: { title: '', source: '', published_at: '', url: '' },
        headers: [],
        warnings: [],
        errors: ['Invalid JSON: Expected an array of record objects.'],
        duplicatesCount: 0
      };
    }

    const headers = Object.keys(rows[0] || {});
    const mapping = customMapping || autoDetectColumns(headers);
    const { items, warnings, duplicatesCount } = processRawRecords(rows, mapping);

    return {
      items,
      detectedMapping: mapping,
      headers,
      warnings,
      errors: [],
      duplicatesCount
    };
  } catch (err: any) {
    return {
      items: [],
      detectedMapping: { title: '', source: '', published_at: '', url: '' },
      headers: [],
      warnings: [],
      errors: [`JSON Syntax Error: ${err.message}`],
      duplicatesCount: 0
    };
  }
}
