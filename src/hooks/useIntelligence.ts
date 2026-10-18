import { useState, useEffect, useMemo, useCallback } from 'react';
import Fuse from 'fuse.js';
import { ResearchItem, StoryCluster, FilterState, WatchlistConfig, AnalystNote } from '../types/intelligence';
import { clusterAndScoreItems } from '../services/clusteringEngine';
import aequitasDataRaw from '../data/aequitasData.json';
import sampleDataRaw from '../data/sampleData.json';
import defaultWatchlistRaw from '../data/defaultWatchlist.json';
import datasetMeta from '../data/datasetMeta.json';

export const BENCHMARK_AS_OF_DATE = datasetMeta.asOfDate;
export const BENCHMARK_AS_OF_DATE_FORMATTED = datasetMeta.asOfDateFormatted;

const INITIAL_FILTERS: FilterState = {
  searchQuery: '',
  sectors: [],
  categories: [],
  sources: [],
  tickers: [],
  datePreset: 'all',
  sortBy: 'score',
  onlySaved: false,
  minScore: 0
};

export type DatasetSource = 'aequitas' | 'sample' | 'custom';

export function useIntelligence() {
  // Dataset Source State
  const [datasetSource, setDatasetSource] = useState<DatasetSource>(() => {
    try {
      const saved = localStorage.getItem('radar_dataset_source');
      if (saved === 'sample' || saved === 'custom') return saved;
    } catch {}
    return 'aequitas';
  });

  const [customItems, setCustomItems] = useState<ResearchItem[]>(() => {
    try {
      const saved = localStorage.getItem('radar_custom_items');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [customDatasetName, setCustomDatasetName] = useState<string>(() => {
    try {
      return localStorage.getItem('radar_custom_name') || 'Imported Custom Feed';
    } catch {}
    return 'Imported Custom Feed';
  });

  // Current Active Raw Items
  const items: ResearchItem[] = useMemo(() => {
    if (datasetSource === 'sample') {
      return sampleDataRaw as ResearchItem[];
    }
    if (datasetSource === 'custom' && customItems.length > 0) {
      return customItems;
    }
    return aequitasDataRaw as ResearchItem[];
  }, [datasetSource, customItems]);

  // Current Dataset Display Metadata & As-Of Date
  const { datasetName, asOfDate, asOfDateFormatted, isSampleData } = useMemo(() => {
    if (datasetSource === 'sample') {
      const timestamps = (sampleDataRaw as ResearchItem[])
        .map(r => new Date(r.published_at).getTime())
        .filter(t => !isNaN(t));
      const maxTime = timestamps.length > 0 ? Math.max(...timestamps) : Date.now();
      const dateObj = new Date(maxTime);
      return {
        datasetName: 'Sample Demo Feed (46 Records)',
        asOfDate: dateObj.toISOString(),
        asOfDateFormatted: dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        isSampleData: true
      };
    }

    if (datasetSource === 'custom' && customItems.length > 0) {
      const timestamps = customItems
        .map(r => new Date(r.published_at).getTime())
        .filter(t => !isNaN(t));
      const maxTime = timestamps.length > 0 ? Math.max(...timestamps) : Date.now();
      const dateObj = new Date(maxTime);
      return {
        datasetName: customDatasetName,
        asOfDate: dateObj.toISOString(),
        asOfDateFormatted: dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        isSampleData: false
      };
    }

    return {
      datasetName: 'Aequitas Research Benchmark',
      asOfDate: BENCHMARK_AS_OF_DATE,
      asOfDateFormatted: BENCHMARK_AS_OF_DATE_FORMATTED,
      isSampleData: false
    };
  }, [datasetSource, customItems, customDatasetName]);

  // Dataset switching handlers
  const switchDataset = useCallback((source: DatasetSource) => {
    setDatasetSource(source);
    try {
      localStorage.setItem('radar_dataset_source', source);
    } catch {}
  }, []);

  const importCustomDataset = useCallback((importedItems: ResearchItem[], name: string = 'Imported Custom Feed') => {
    setCustomItems(importedItems);
    setCustomDatasetName(name);
    setDatasetSource('custom');
    try {
      localStorage.setItem('radar_custom_items', JSON.stringify(importedItems));
      localStorage.setItem('radar_custom_name', name);
      localStorage.setItem('radar_dataset_source', 'custom');
    } catch {}
  }, []);

  const resetToBenchmark = useCallback(() => {
    setDatasetSource('aequitas');
    try {
      localStorage.setItem('radar_dataset_source', 'aequitas');
    } catch {}
  }, []);

  const resetToSample = useCallback(() => {
    setDatasetSource('sample');
    try {
      localStorage.setItem('radar_dataset_source', 'sample');
    } catch {}
  }, []);

  // Watchlist State (Defaults to EMPTY as requested by Item 8)
  const [watchlist, setWatchlist] = useState<WatchlistConfig>(() => {
    try {
      const saved = localStorage.getItem('radar_watchlist');
      if (saved) return JSON.parse(saved);
    } catch {}
    return { tickers: [], keywords: [] };
  });

  const saveWatchlist = useCallback((newWatchlist: WatchlistConfig) => {
    setWatchlist(newWatchlist);
    try {
      localStorage.setItem('radar_watchlist', JSON.stringify(newWatchlist));
    } catch {}
  }, []);

  const loadExampleWatchlist = useCallback(() => {
    const example = defaultWatchlistRaw as WatchlistConfig;
    saveWatchlist(example);
  }, [saveWatchlist]);

  // Saved Items / Bookmarks (Local Storage)
  const [savedIds, setSavedIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('radar_bookmarks');
      if (saved) return new Set(JSON.parse(saved));
    } catch {}
    return new Set<string>();
  });

  const toggleSave = useCallback((id: string) => {
    setSavedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      try {
        localStorage.setItem('radar_bookmarks', JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  }, []);

  // Persistent Analyst Notes (Local Storage)
  const [notes, setNotes] = useState<Record<string, AnalystNote>>(() => {
    try {
      const saved = localStorage.getItem('radar_notes');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });

  const updateNote = useCallback((itemId: string, content: string) => {
    setNotes(prev => {
      const updated = {
        ...prev,
        [itemId]: {
          itemId,
          content,
          updatedAt: new Date().toISOString()
        }
      };
      try {
        localStorage.setItem('radar_notes', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  // Compute Clusters & Scores anchored to asOfDate
  const allClusters = useMemo(() => {
    return clusterAndScoreItems(items, watchlist, asOfDate);
  }, [items, watchlist, asOfDate]);

  // Filters State
  const [filters, setFilters] = useState<FilterState>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const q = params.get('q') || '';
      const sector = params.get('sector');
      const ticker = params.get('ticker');
      const sort = (params.get('sort') as FilterState['sortBy']) || 'score';
      return {
        ...INITIAL_FILTERS,
        searchQuery: q,
        sectors: sector ? [sector] : [],
        tickers: ticker ? [ticker] : [],
        sortBy: sort
      };
    }
    return INITIAL_FILTERS;
  });

  // Sync filters to URL query string
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.searchQuery) params.set('q', filters.searchQuery);
    if (filters.sectors.length === 1) params.set('sector', filters.sectors[0]);
    if (filters.tickers.length === 1) params.set('ticker', filters.tickers[0]);
    if (filters.sortBy !== 'score') params.set('sort', filters.sortBy);

    const newUrl = params.toString() ? `${window.location.pathname}?${params.toString()}` : window.location.pathname;
    window.history.replaceState({}, '', newUrl);
  }, [filters]);

  // Fuse.js Search Setup
  const fuse = useMemo(() => {
    return new Fuse(allClusters, {
      keys: [
        { name: 'primaryItem.title', weight: 0.45 },
        { name: 'primaryItem.ticker', weight: 0.25 },
        { name: 'primaryItem.company', weight: 0.20 },
        { name: 'primaryItem.summary', weight: 0.15 },
        { name: 'primaryItem.content', weight: 0.10 },
        { name: 'relatedItems.title', weight: 0.20 }
      ],
      threshold: 0.35,
      ignoreLocation: true
    });
  }, [allClusters]);

  // Filtered and Sorted Clusters
  const filteredClusters = useMemo(() => {
    let result = allClusters;

    // Search query filter
    if (filters.searchQuery.trim()) {
      const query = filters.searchQuery.trim();
      if (query.startsWith('"') && query.endsWith('"')) {
        const exact = query.slice(1, -1).toLowerCase();
        result = result.filter(c =>
          c.primaryItem.title.toLowerCase().includes(exact) ||
          c.primaryItem.content.toLowerCase().includes(exact)
        );
      } else {
        const searchResults = fuse.search(query);
        result = searchResults.map(r => r.item);
      }
    }

    // Sector filter
    if (filters.sectors.length > 0) {
      result = result.filter(c => filters.sectors.includes(c.primaryItem.sector));
    }

    // Category filter
    if (filters.categories.length > 0) {
      result = result.filter(c => filters.categories.includes(c.primaryItem.category));
    }

    // Source filter
    if (filters.sources.length > 0) {
      result = result.filter(c => c.sourceNames.some(s => filters.sources.includes(s)));
    }

    // Ticker filter
    if (filters.tickers.length > 0) {
      result = result.filter(c => c.primaryItem.ticker && filters.tickers.includes(c.primaryItem.ticker));
    }

    // Only saved filter
    if (filters.onlySaved) {
      result = result.filter(c =>
        savedIds.has(c.primaryItem.id) || c.relatedItems.some(r => savedIds.has(r.id))
      );
    }

    // Min score threshold
    if (filters.minScore > 0) {
      result = result.filter(c => c.primaryItem.score.total >= filters.minScore);
    }

    // Date preset filter (Anchored to asOfDate)
    if (filters.datePreset !== 'all') {
      const asOfTime = new Date(asOfDate).getTime();
      const cutoffHours = filters.datePreset === 'today' ? 24 : filters.datePreset === '7d' ? 168 : 720;
      result = result.filter(c => {
        const itemTime = new Date(c.primaryItem.published_at).getTime();
        if (isNaN(itemTime)) return false;
        const diffHours = (asOfTime - itemTime) / (1000 * 60 * 60);
        return diffHours >= 0 && diffHours <= cutoffHours;
      });
    }

    // Sorting
    const sorted = [...result];
    if (filters.sortBy === 'score') {
      sorted.sort((a, b) => b.primaryItem.score.total - a.primaryItem.score.total);
    } else if (filters.sortBy === 'newest') {
      sorted.sort((a, b) => new Date(b.primaryItem.published_at).getTime() - new Date(a.primaryItem.published_at).getTime());
    } else if (filters.sortBy === 'corroboration') {
      sorted.sort((a, b) => b.totalSourcesCount - a.totalSourcesCount);
    }

    return sorted;
  }, [allClusters, filters, fuse, savedIds, asOfDate]);

  // Top 3 Priority Horizon
  const topPriorityClusters = useMemo(() => {
    return allClusters.slice(0, 3);
  }, [allClusters]);

  // Selected Cluster State
  const [activeCluster, setActiveCluster] = useState<StoryCluster | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  // Dynamic Facet Counts
  const facets = useMemo(() => {
    const sectorCounts: Record<string, number> = {};
    const categoryCounts: Record<string, number> = {};
    const sourceCounts: Record<string, number> = {};
    const tickerCounts: Record<string, number> = {};

    allClusters.forEach(cluster => {
      const p = cluster.primaryItem;
      if (p.sector) sectorCounts[p.sector] = (sectorCounts[p.sector] || 0) + 1;
      if (p.category) categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
      cluster.sourceNames.forEach(s => {
        sourceCounts[s] = (sourceCounts[s] || 0) + 1;
      });
      if (p.ticker) tickerCounts[p.ticker] = (tickerCounts[p.ticker] || 0) + 1;
    });

    return {
      sectors: sectorCounts,
      categories: categoryCounts,
      sources: sourceCounts,
      tickers: tickerCounts
    };
  }, [allClusters]);

  const resetFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
  }, []);

  // Executive Briefing Markdown Generator
  const generateBriefingMarkdown = useCallback(() => {
    const targetClusters = filteredClusters.slice(0, 6);

    let md = `# EXECUTIVE RESEARCH BRIEFING — AS OF ${asOfDateFormatted.toUpperCase()}\n\n`;
    md += `*Compiled by Research Radar Intelligence Terminal | Coverage: ${datasetName} (${items.length} records)*\n\n`;
    md += `---\n\n`;
    md += `## ⚡ TOP CATALYSTS & MARKET-MOVING SIGNALS\n\n`;

    targetClusters.forEach((cluster, idx) => {
      const item = cluster.primaryItem;
      const tickerTag = item.ticker ? `[${item.ticker}]` : `[MACRO]`;
      const scoreBadge = `Priority Score: ${item.score.total}/100 (${item.score.tier})`;
      const sourceSplit = `${cluster.totalReportsCount} reports from ${cluster.totalSourcesCount} sources (${cluster.independentSourcesCount} independent, ${cluster.companySourcesCount} company-issued)`;

      md += `### ${idx + 1}. ${tickerTag} ${item.title}\n`;
      md += `**Score:** ${scoreBadge} | **Sector:** ${item.sector} | **Category:** ${item.category}\n`;
      md += `**Coverage Breadth:** ${sourceSplit}\n\n`;
      md += `> **Excerpt:** ${item.summary}\n\n`;

      if (item.score.reasons.length > 0) {
        md += `**Priority Drivers:**\n`;
        item.score.reasons.forEach(r => {
          md += `- ${r}\n`;
        });
        md += `\n`;
      }

      if (notes[item.id]?.content) {
        md += `**Analyst Private Notes:**\n*${notes[item.id].content}*\n\n`;
      }

      md += `**Source Document:** \`${item.source_path || 'Direct archive'}\` (${item.source})\n\n`;
      md += `---\n\n`;
    });

    md += `\n*End of briefing. Generated deterministically via Research Radar. All data as of ${asOfDateFormatted}.*`;
    return md;
  }, [filteredClusters, datasetName, items.length, notes, asOfDateFormatted]);

  return {
    items,
    allClusters,
    filteredClusters,
    topPriorityClusters,
    activeCluster,
    setActiveCluster,
    selectedIndex,
    setSelectedIndex,
    facets,
    filters,
    setFilters,
    resetFilters,
    datasetSource,
    datasetName,
    asOfDate,
    asOfDateFormatted,
    isSampleData,
    switchDataset,
    importCustomDataset,
    resetToBenchmark,
    resetToSample,
    watchlist,
    saveWatchlist,
    loadExampleWatchlist,
    savedIds,
    toggleSave,
    notes,
    updateNote,
    generateBriefingMarkdown
  };
}
