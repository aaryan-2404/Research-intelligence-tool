import { ResearchItem, ScoredItem, StoryCluster, WatchlistConfig } from '../types/intelligence';
import { calculateScore } from './scoringEngine';

// Company-issued disclosure sources vs independent sources
const COMPANY_ISSUED_SOURCES = new Set([
  'Exchange Disclosure Feed',
  'Exchange_Disclosure_Feed',
  'Corporate Communications',
  'Company IR Desk',
  'Company Announcement'
]);

// Common stop words and journalistic prefixes to strip
const STRIP_REGEX = /^(ft|reuters|bloomberg|wsj|cnbc|exclusive|breaking|update|report):\s*/i;
const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
  'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
  'to', 'was', 'were', 'will', 'with', 'limited', 'ltd', 'company'
]);

// Tokenization Cache for high-performance clustering
const tokenCache = new WeakMap<ResearchItem, Set<string>>();
const titleTokenCache = new Map<string, Set<string>>();

export function tokenizeTitle(title: string): Set<string> {
  const cached = titleTokenCache.get(title);
  if (cached) return cached;

  const cleaned = title.replace(STRIP_REGEX, '').toLowerCase();
  const words = cleaned
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));
  const set = new Set(words);
  titleTokenCache.set(title, set);
  return set;
}

function getItemTokens(item: ResearchItem): Set<string> {
  let tokens = tokenCache.get(item);
  if (!tokens) {
    tokens = tokenizeTitle(item.title);
    tokenCache.set(item, tokens);
  }
  return tokens;
}

function calculateJaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersectionCount = 0;
  for (const token of setA) {
    if (setB.has(token)) {
      intersectionCount++;
    }
  }
  const unionSize = setA.size + setB.size - intersectionCount;
  return unionSize > 0 ? intersectionCount / unionSize : 0;
}

export function areRelated(itemA: ResearchItem, itemB: ResearchItem): boolean {
  if (itemA.id === itemB.id) return false;

  // STRICT ENTITY GUARD: Never cluster items that resolve to different companies!
  if (itemA.ticker && itemB.ticker && itemA.ticker !== itemB.ticker) {
    return false;
  }
  if (itemA.company && itemB.company && itemA.company.toLowerCase() !== itemB.company.toLowerCase()) {
    return false;
  }

  // If one item has an entity mismatch warning, don't cluster it into an unverified group
  if (itemA.has_entity_mismatch || itemB.has_entity_mismatch) {
    return false;
  }

  // High title token overlap between same company or macro topic
  const tokensA = getItemTokens(itemA);
  const tokensB = getItemTokens(itemB);
  const jaccard = calculateJaccardSimilarity(tokensA, tokensB);

  // If same company, lower jaccard threshold within 72 hours
  if (itemA.ticker && itemB.ticker && itemA.ticker === itemB.ticker) {
    const timeA = new Date(itemA.published_at).getTime();
    const timeB = new Date(itemB.published_at).getTime();
    const hourDiff = Math.abs(timeA - timeB) / (1000 * 60 * 60);

    if (hourDiff <= 72 && jaccard >= 0.35) {
      return true;
    }
  }

  // Macro or high similarity wire reporting
  if (jaccard >= 0.50) {
    return true;
  }

  return false;
}

/**
 * High-Performance Partitioned Clustering Algorithm:
 * Partitions items by entity bucket (ticker/company) before comparing,
 * reducing complexity from O(N^2) to near O(N).
 */
export function clusterAndScoreItems(
  items: ResearchItem[],
  watchlist: WatchlistConfig = { tickers: [], keywords: [] },
  referenceDateStr?: string
): StoryCluster[] {
  // Pre-tokenize all items in a single linear pass
  items.forEach(item => getItemTokens(item));

  // 1. Partition into buckets: Ticker/Company buckets + Macro bucket
  const buckets = new Map<string, ResearchItem[]>();

  for (const item of items) {
    let key = '__MACRO__';
    if (item.ticker) {
      key = `TICKER:${item.ticker.toUpperCase()}`;
    } else if (item.company) {
      key = `COMPANY:${item.company.toLowerCase()}`;
    }
    const bucket = buckets.get(key) || [];
    bucket.push(item);
    buckets.set(key, bucket);
  }

  const rawClusters: ResearchItem[][] = [];

  // 2. Perform clustering within each isolated bucket
  for (const bucketItems of buckets.values()) {
    const visited = new Set<string>();

    for (let i = 0; i < bucketItems.length; i++) {
      const current = bucketItems[i];
      if (visited.has(current.id)) continue;

      const clusterItems: ResearchItem[] = [current];
      visited.add(current.id);

      for (let j = i + 1; j < bucketItems.length; j++) {
        const candidate = bucketItems[j];
        if (visited.has(candidate.id)) continue;

        // Check if candidate relates to any item currently in this cluster
        const isRelated = clusterItems.some(item => areRelated(item, candidate));
        if (isRelated) {
          clusterItems.push(candidate);
          visited.add(candidate.id);
        }
      }

      rawClusters.push(clusterItems);
    }
  }

  // 3. Convert raw clusters into rich StoryCluster with calibrated scores
  const clusters: StoryCluster[] = rawClusters.map((clusterItems, index) => {
    const clusterId = `cluster-${index + 1}`;
    const distinctSources = Array.from(new Set(clusterItems.map(item => item.source)));

    const independentSources = distinctSources.filter(s => !COMPANY_ISSUED_SOURCES.has(s));
    const companySources = distinctSources.filter(s => COMPANY_ISSUED_SOURCES.has(s));

    // Score all items within the cluster context
    const scoredClusterItems: ScoredItem[] = clusterItems.map(item => {
      const score = calculateScore(
        item,
        independentSources.length,
        companySources.length,
        watchlist,
        referenceDateStr
      );
      return {
        ...item,
        score,
        clusterId
      };
    });

    // Primary item is the one with highest score, or longest content if tied
    scoredClusterItems.sort((a, b) => {
      if (b.score.total !== a.score.total) {
        return b.score.total - a.score.total;
      }
      return b.content.length - a.content.length;
    });

    const primaryItem = scoredClusterItems[0];
    const relatedItems = scoredClusterItems.slice(1);

    const dates = clusterItems
      .map(item => new Date(item.published_at).getTime())
      .filter(t => !isNaN(t));

    const earliestPublishedAt = dates.length > 0 ? new Date(Math.min(...dates)).toISOString() : primaryItem.published_at;
    const latestPublishedAt = dates.length > 0 ? new Date(Math.max(...dates)).toISOString() : primaryItem.published_at;

    return {
      id: clusterId,
      primaryItem,
      relatedItems,
      totalReportsCount: clusterItems.length,
      totalSourcesCount: distinctSources.length,
      independentSourcesCount: independentSources.length,
      companySourcesCount: companySources.length,
      sourceNames: distinctSources,
      earliestPublishedAt,
      latestPublishedAt
    };
  });

  // Sort clusters by primary item score descending by default
  clusters.sort((a, b) => b.primaryItem.score.total - a.primaryItem.score.total);

  return clusters;
}
