export type ImpactLevel = 'high' | 'medium' | 'low';

export interface ResearchItem {
  id: string;
  title: string;
  source: string;
  source_type?: string;
  published_at: string;
  url?: string;
  source_path?: string;
  company?: string;
  ticker?: string;
  sector: string;
  industry?: string;
  category: string;
  summary: string;
  content: string;
  impact_level?: ImpactLevel;
  raw_document?: string;
  has_entity_mismatch?: boolean;
  mismatch_details?: string;
  is_on_watchlist?: boolean;
  is_sample?: boolean;
}

export interface ScoreBreakdown {
  total: number;
  recency: number;         // Max 30
  impact: number;          // Max 35
  corroboration: number;   // Max 20
  watchlist: number;       // Max 15
  tier: 'Critical' | 'High' | 'Medium' | 'Low';
  direction?: 'risk' | 'opportunity' | 'neutral';
  matchedKeywords: string[];
  reasons: string[];
}

export interface ScoredItem extends ResearchItem {
  score: ScoreBreakdown;
  clusterId?: string;
}

export interface StoryCluster {
  id: string;
  primaryItem: ScoredItem;
  relatedItems: ScoredItem[];
  totalReportsCount: number;       // Total articles in cluster (1 + relatedItems.length)
  totalSourcesCount: number;       // Total distinct sources
  independentSourcesCount: number; // Count of independent third-party sources
  companySourcesCount: number;     // Count of company-issued disclosure sources
  sourceNames: string[];
  earliestPublishedAt: string;
  latestPublishedAt: string;
}

export interface FilterState {
  searchQuery: string;
  sectors: string[];
  categories: string[];
  sources: string[];
  tickers: string[];
  datePreset: 'all' | 'today' | '7d' | '30d';
  sortBy: 'score' | 'newest' | 'corroboration';
  onlySaved: boolean;
  minScore: number;
}

export interface WatchlistConfig {
  tickers: string[];
  keywords: string[];
}

export interface AnalystNote {
  itemId: string;
  content: string;
  updatedAt: string;
}

export interface ColumnMapping {
  title: string;
  source: string;
  published_at: string;
  url?: string;
  company?: string;
  ticker?: string;
  sector?: string;
  category?: string;
  summary?: string;
  content?: string;
}
