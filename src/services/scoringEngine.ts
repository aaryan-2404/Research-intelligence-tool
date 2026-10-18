import { ResearchItem, ScoreBreakdown, WatchlistConfig } from '../types/intelligence';
import datasetMeta from '../data/datasetMeta.json';

// High-impact risk and opportunity catalysts
interface CatalystDefinition {
  points: number;
  direction: 'risk' | 'opportunity' | 'neutral';
  label: string;
}

const CATALYSTS: Record<string, CatalystDefinition> = {
  // High-severity risks
  'downgrade': { points: 35, direction: 'risk', label: 'Credit downgrade' },
  'rating downgraded': { points: 35, direction: 'risk', label: 'Rating downgrade' },
  'default': { points: 35, direction: 'risk', label: 'Debt default' },
  'insolvency': { points: 35, direction: 'risk', label: 'Insolvency' },
  'fraud': { points: 35, direction: 'risk', label: 'Fraud allegation' },
  'subpoena': { points: 32, direction: 'risk', label: 'Subpoena issued' },
  'antitrust': { points: 32, direction: 'risk', label: 'Antitrust probe' },
  'penalty': { points: 30, direction: 'risk', label: 'Regulatory penalty' },
  'investigation': { points: 30, direction: 'risk', label: 'Regulatory investigation' },
  'guidance cut': { points: 30, direction: 'risk', label: 'Guidance reduction' },
  'profit warning': { points: 30, direction: 'risk', label: 'Profit warning' },
  'slashes': { points: 28, direction: 'risk', label: 'Forecast slash' },
  'resignation': { points: 28, direction: 'risk', label: 'Executive departure' },
  'ousted': { points: 28, direction: 'risk', label: 'Leadership ouster' },
  'auditor resignation': { points: 32, direction: 'risk', label: 'Auditor resignation' },
  'clinical hold': { points: 28, direction: 'risk', label: 'FDA clinical hold' },
  'recall': { points: 26, direction: 'risk', label: 'Product recall' },
  'strike': { points: 26, direction: 'risk', label: 'Labor strike' },

  // High-severity opportunities & strategic actions
  'acquisition': { points: 28, direction: 'opportunity', label: 'M&A Acquisition' },
  'acquires': { points: 28, direction: 'opportunity', label: 'M&A Acquisition' },
  'takeover': { points: 28, direction: 'opportunity', label: 'Takeover offer' },
  'merger': { points: 28, direction: 'opportunity', label: 'Merger agreement' },
  'promoter entity acquires': { points: 25, direction: 'opportunity', label: 'Promoter share purchase' },
  'promoter purchases': { points: 25, direction: 'opportunity', label: 'Promoter buying' },
  'promoter': { points: 20, direction: 'opportunity', label: 'Promoter activity' },
  'phase 3': { points: 26, direction: 'opportunity', label: 'Phase 3 trial result' },
  'regulatory approval': { points: 26, direction: 'opportunity', label: 'Regulatory clearance' },
  'fda': { points: 24, direction: 'opportunity', label: 'FDA milestone' },

  // Medium events
  'upgrade': { points: 22, direction: 'opportunity', label: 'Credit upgrade' },
  'rating upgraded': { points: 22, direction: 'opportunity', label: 'Rating upgrade' },
  'capex': { points: 22, direction: 'opportunity', label: 'Capex approval' },
  'capital expenditure': { points: 22, direction: 'opportunity', label: 'Capex investment' },
  'wins order': { points: 20, direction: 'opportunity', label: 'Major contract win' },
  'order worth': { points: 20, direction: 'opportunity', label: 'Contract award' },
  'tender': { points: 18, direction: 'opportunity', label: 'Tender development' },
  'fundraise': { points: 18, direction: 'opportunity', label: 'Capital raise' },
  'funding': { points: 18, direction: 'opportunity', label: 'Funding round' },
  'expansion': { points: 16, direction: 'opportunity', label: 'Capacity expansion' },
  'earnings beat': { points: 18, direction: 'opportunity', label: 'Earnings beat' },
  'revenue grows': { points: 16, direction: 'opportunity', label: 'Revenue expansion' },

  // Low / Routine events
  'project update': { points: 8, direction: 'neutral', label: 'Project update' },
  'project timeline': { points: 8, direction: 'neutral', label: 'Timeline revision' },
  'timeline': { points: 6, direction: 'neutral', label: 'Timeline update' },
  'adds new sites': { points: 6, direction: 'neutral', label: 'Routine site rollout' },
  'investor meeting': { points: 4, direction: 'neutral', label: 'Investor meeting' },
  'change in registered office': { points: 2, direction: 'neutral', label: 'Administrative filing' }
};

// Negative dampening modifiers (routine / reaffirmed / no impact)
const DAMPENING_MODIFIERS: Record<string, { penalty: number; phrase: string }> = {
  'credit rating reaffirmed': { penalty: 16, phrase: 'rating reaffirmed' },
  'reaffirmed with stable outlook': { penalty: 18, phrase: 'reaffirmed with stable outlook' },
  'reaffirmed': { penalty: 14, phrase: 'reaffirmed' },
  'stable outlook': { penalty: 12, phrase: 'stable outlook' },
  'no material change': { penalty: 15, phrase: 'no material change' },
  'no material impact': { penalty: 15, phrase: 'no material impact' },
  'commercial terms remain unchanged': { penalty: 10, phrase: 'commercial terms unchanged' },
  'did not materially change control': { penalty: 10, phrase: 'control unchanged' },
  'monitorable': { penalty: 8, phrase: 'monitorable factor' },
  'routine': { penalty: 8, phrase: 'routine filing' }
};

// Pre-sorted list of entries for fast single-pass evaluation
const CATALYST_ENTRIES = Object.entries(CATALYSTS);
const DAMPENING_ENTRIES = Object.entries(DAMPENING_MODIFIERS);

// In-memory cache for invariant static factor calculations
interface StaticScoreFactors {
  recency: number;
  impact: number;
  corroboration: number;
  direction: 'risk' | 'opportunity' | 'neutral';
  matchedKeywords: string[];
  staticReasons: string[];
}

const staticScoreCache = new Map<string, StaticScoreFactors>();

function computeStaticFactors(
  item: ResearchItem,
  independentSourcesCount: number,
  companySourcesCount: number,
  referenceDateStr?: string
): StaticScoreFactors {
  const staticReasons: string[] = [];
  const matchedKeywords: string[] = [];

  // Anchor to Dataset As-Of Date
  const asOf = referenceDateStr 
    ? new Date(referenceDateStr).getTime() 
    : new Date(datasetMeta.asOfDate).getTime();

  const pubTime = new Date(item.published_at).getTime();
  const diffHours = isNaN(pubTime) ? 720 : Math.max(0, (asOf - pubTime) / (1000 * 60 * 60));

  // 1. Recency Score (Max 30 pts)
  let recency = 2;
  if (diffHours <= 24) {
    recency = 30;
    staticReasons.push('Breaking: Published within 24h of as-of date (+30 pts)');
  } else if (diffHours <= 72) {
    recency = 24;
    staticReasons.push('Fresh: Published within 3d of as-of date (+24 pts)');
  } else if (diffHours <= 168) {
    recency = 18;
    staticReasons.push('Recent: Published within 7d of as-of date (+18 pts)');
  } else if (diffHours <= 336) {
    recency = 12;
    staticReasons.push('Published within 14d of as-of date (+12 pts)');
  } else if (diffHours <= 720) {
    recency = 6;
    staticReasons.push('Published within 30d of as-of date (+6 pts)');
  } else {
    recency = 2;
    staticReasons.push('Historical record (>30d before as-of date) (+2 pts)');
  }

  // 2. Impact Catalyst & Direction Scoring (Max 35 pts)
  let rawImpact = 0;
  let overallDirection: 'risk' | 'opportunity' | 'neutral' = 'neutral';
  const titleLower = item.title.toLowerCase();
  const bodyLower = `${item.summary} ${item.content}`.toLowerCase();

  let highestTitlePoints = 0;
  let highestBodyPoints = 0;
  let primaryMatchedCatalyst = '';

  for (let i = 0; i < CATALYST_ENTRIES.length; i++) {
    const [kw, def] = CATALYST_ENTRIES[i];
    if (titleLower.includes(kw)) {
      if (def.points > highestTitlePoints) {
        highestTitlePoints = def.points;
        primaryMatchedCatalyst = def.label;
        overallDirection = def.direction;
      }
      matchedKeywords.push(kw);
    } else if (bodyLower.includes(kw)) {
      // Body matches receive heavily discounted weight (0.35x)
      const discountedPoints = Math.round(def.points * 0.35);
      if (discountedPoints > highestBodyPoints) {
        highestBodyPoints = discountedPoints;
      }
      matchedKeywords.push(kw);
    }
  }

  // Combine title catalyst (1.0x) with secondary body mentions
  if (highestTitlePoints > 0) {
    rawImpact = highestTitlePoints;
    staticReasons.push(`Title catalyst [${overallDirection.toUpperCase()}]: "${primaryMatchedCatalyst}" in headline (+${highestTitlePoints} pts)`);
  } else if (highestBodyPoints > 0) {
    rawImpact = highestBodyPoints;
    overallDirection = 'neutral';
    staticReasons.push(`Passing body mention: secondary catalyst in disclosure text (+${highestBodyPoints} pts)`);
  } else {
    rawImpact = 4;
    staticReasons.push('Standard corporate filing baseline (+4 pts)');
  }

  // Check Negative Dampening Modifiers
  let totalDampening = 0;
  const combinedText = `${titleLower} ${bodyLower}`;
  for (let i = 0; i < DAMPENING_ENTRIES.length; i++) {
    const [modifierKw, modDef] = DAMPENING_ENTRIES[i];
    if (combinedText.includes(modifierKw)) {
      totalDampening = Math.max(totalDampening, modDef.penalty);
      staticReasons.push(`Dampened by routine modifier: "${modDef.phrase}" (-${modDef.penalty} pts)`);
      break; // apply highest dampening
    }
  }

  let impact = Math.max(2, rawImpact - totalDampening);
  impact = Math.min(35, impact);

  // 3. Corroboration / Multi-Source Coverage (Max 20 pts)
  let corroboration = 2;
  if (independentSourcesCount >= 3) {
    corroboration = 20;
    staticReasons.push(`High consensus: Corroborated by ${independentSourcesCount} independent outlets (+20 pts)`);
  } else if (independentSourcesCount === 2) {
    corroboration = 14;
    staticReasons.push(`Corroborated by 2 independent outlets (+14 pts)`);
  } else if (independentSourcesCount === 1) {
    corroboration = 8;
    staticReasons.push(`1 independent source report (+8 pts)`);
  } else if (companySourcesCount > 1) {
    corroboration = 4;
    staticReasons.push(`Company filing with ${companySourcesCount} internal disclosures (+4 pts)`);
  } else {
    corroboration = 2;
    staticReasons.push('Single source disclosure (+2 pts)');
  }

  return {
    recency,
    impact,
    corroboration,
    direction: overallDirection,
    matchedKeywords,
    staticReasons
  };
}

export function calculateScore(
  item: ResearchItem,
  independentSourcesCount: number = 0,
  companySourcesCount: number = 1,
  watchlist: WatchlistConfig = { tickers: [], keywords: [] },
  referenceDateStr?: string
): ScoreBreakdown {
  // Check static factor cache
  const cacheKey = `${item.id}_${independentSourcesCount}_${companySourcesCount}_${referenceDateStr || 'default'}`;
  let staticFactors = staticScoreCache.get(cacheKey);

  if (!staticFactors) {
    staticFactors = computeStaticFactors(item, independentSourcesCount, companySourcesCount, referenceDateStr);
    staticScoreCache.set(cacheKey, staticFactors);
  }

  const reasons = [...staticFactors.staticReasons];
  const matchedKeywords = [...staticFactors.matchedKeywords];

  // 4. Watchlist Match (Max 15 pts) & Entity Mismatch Guard
  let watchlistScore = 0;

  if (item.has_entity_mismatch) {
    watchlistScore = 0;
    reasons.push('Watchlist boost withheld: Entity mismatch detected in record');
  } else {
    const tickerMatch = item.ticker && watchlist.tickers.some(t => t.toUpperCase() === item.ticker?.toUpperCase());
    const companyMatch = item.company && watchlist.keywords.some(k => item.company?.toLowerCase().includes(k.toLowerCase()));
    
    // Check keyword search in text
    let keywordMatch = false;
    if (watchlist.keywords.length > 0) {
      const combinedText = `${item.title} ${item.summary} ${item.content}`.toLowerCase();
      keywordMatch = watchlist.keywords.some(k => combinedText.includes(k.toLowerCase()));
    }

    if (tickerMatch) {
      watchlistScore += 10;
      reasons.push(`Watchlist priority: Ticker [${item.ticker}] is in your active coverage (+10 pts)`);
    } else if (companyMatch) {
      watchlistScore += 10;
      reasons.push(`Watchlist priority: Company "${item.company}" is in your tracked universe (+10 pts)`);
    }

    if (keywordMatch && watchlistScore < 15) {
      watchlistScore += 5;
      reasons.push('Matched custom focus theme from your watchlist (+5 pts)');
    }
  }

  watchlistScore = Math.min(15, watchlistScore);

  const total = Math.min(
    100,
    Math.max(0, staticFactors.recency + staticFactors.impact + staticFactors.corroboration + watchlistScore)
  );

  // Determine Calibrated Priority Tier
  let tier: ScoreBreakdown['tier'] = 'Low';
  if (total >= 75) {
    tier = 'Critical';
  } else if (total >= 50) {
    tier = 'High';
  } else if (total >= 30) {
    tier = 'Medium';
  } else {
    tier = 'Low';
  }

  return {
    total,
    recency: staticFactors.recency,
    impact: staticFactors.impact,
    corroboration: staticFactors.corroboration,
    watchlist: watchlistScore,
    tier,
    direction: staticFactors.direction,
    matchedKeywords,
    reasons
  };
}
