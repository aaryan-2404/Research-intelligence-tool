import { describe, it, expect } from 'vitest';
import { calculateScore } from '../src/services/scoringEngine';
import { clusterAndScoreItems, areRelated } from '../src/services/clusteringEngine';
import { formatRelativeAge, formatSourceCount, formatCardDate, AS_OF_DATE } from '../src/utils/formatters';
import { ResearchItem } from '../src/types/intelligence';
import fs from 'fs';
import path from 'path';

describe('1. Time Anchoring & As-Of Date Consistency', () => {
  const asOf = '2026-10-12T00:00:00.000Z';

  const breakingItem: ResearchItem = {
    id: 't1',
    title: 'Breaking Milestone on As-Of Date',
    source: 'Corporate Communications',
    published_at: '2026-10-12T00:00:00.000Z',
    sector: 'Technology',
    category: 'News',
    summary: 'Summary text',
    content: 'Body text'
  };

  const oldItem: ResearchItem = {
    id: 't2',
    title: 'Older Milestone from April',
    source: 'Corporate Communications',
    published_at: '2026-04-08T00:00:00.000Z',
    sector: 'Healthcare',
    category: 'Credit rating',
    summary: 'Summary text',
    content: 'Body text'
  };

  it('computes 30 recency points for item published on the as-of date', () => {
    const score = calculateScore(breakingItem, 0, 1, { tickers: [], keywords: [] }, asOf);
    expect(score.recency).toBe(30);
  });

  it('penalizes historical item published 6 months prior to as-of date', () => {
    const score = calculateScore(oldItem, 0, 1, { tickers: [], keywords: [] }, asOf);
    expect(score.recency).toBe(2);
  });

  it('formats relative age consistently against the as-of date', () => {
    expect(formatRelativeAge(breakingItem.published_at, asOf)).toBe('On as-of date');
    expect(formatRelativeAge(oldItem.published_at, asOf)).toContain('mo before latest');
  });

  it('formats card date showing absolute date and relative age', () => {
    const cardDate = formatCardDate(oldItem.published_at, asOf);
    expect(cardDate).toContain('8 Apr 2026');
    expect(cardDate).toContain('mo before latest');
  });
});

describe('2. Entity Correctness & Cluster Guard', () => {
  const itemHelixora: ResearchItem = {
    id: 'h1',
    title: 'Helixora Pharmaceuticals Limited: Credit rating reaffirmed with stable outlook',
    source: 'Ratings Update Desk',
    published_at: '2026-04-08T00:00:00.000Z',
    company: 'Helixora Pharmaceuticals Limited',
    ticker: 'HELIXORA',
    sector: 'Healthcare',
    category: 'Credit rating',
    summary: 'Credit rating reaffirmed with stable outlook.',
    content: 'Rating reaffirmed with stable outlook.'
  };

  const itemAranya: ResearchItem = {
    id: 'a1',
    title: 'Aranya Bank Limited: Credit rating reaffirmed with stable outlook',
    source: 'Ratings Update Desk',
    published_at: '2026-04-08T00:00:00.000Z',
    company: 'Aranya Bank Limited',
    ticker: 'ARANYABANK',
    sector: 'Financials',
    category: 'Credit rating',
    summary: 'Credit rating reaffirmed with stable outlook.',
    content: 'Rating reaffirmed with stable outlook.'
  };

  it('clustering NEVER groups items that resolve to different companies', () => {
    // Both share similar titles ("Credit rating reaffirmed with stable outlook")
    // BUT have different tickers and companies.
    expect(areRelated(itemHelixora, itemAranya)).toBe(false);

    const clusters = clusterAndScoreItems([itemHelixora, itemAranya]);
    expect(clusters.length).toBe(2);
    expect(clusters[0].primaryItem.ticker).not.toBe(clusters[1].primaryItem.ticker);
  });

  it('entity mismatch guard blocks watchlist points', () => {
    const mismatchedItem: ResearchItem = {
      ...itemAranya,
      has_entity_mismatch: true,
      mismatch_details: 'Headline mentions Helixora, but record tagged ARANYABANK'
    };

    // User is watching ARANYABANK
    const score = calculateScore(mismatchedItem, 1, 1, { tickers: ['ARANYABANK'], keywords: [] });
    expect(score.watchlist).toBe(0);
    expect(score.reasons.some(r => r.includes('Entity mismatch'))).toBe(true);
  });
});

describe('3. Scoring: Direction, Event Types & Dampening', () => {
  const companyBase = {
    source: 'Ratings Update Desk',
    published_at: '2026-10-12T00:00:00.000Z',
    company: 'Helixora Pharmaceuticals Limited',
    ticker: 'HELIXORA',
    sector: 'Healthcare',
    category: 'Credit rating'
  };

  it('reaffirmed with stable outlook scores significantly LOWER than a downgrade of the same company', () => {
    const reaffirmedItem: ResearchItem = {
      ...companyBase,
      id: 'score-1',
      title: 'Helixora Pharmaceuticals Limited: Credit rating reaffirmed with stable outlook',
      summary: 'Rating agency reaffirmed rating with stable outlook.',
      content: 'Citing liquidity, noting acquisition-related integration as a monitorable.'
    };

    const downgradeItem: ResearchItem = {
      ...companyBase,
      id: 'score-2',
      title: 'Helixora Pharmaceuticals Limited: Credit rating downgraded following debt spike',
      summary: 'Rating agency downgraded company credit rating to speculative.',
      content: 'Severe leverage concerns prompt immediate rating cut.'
    };

    const reaffirmedScore = calculateScore(reaffirmedItem, 1, 0, { tickers: [], keywords: [] }, '2026-10-12T00:00:00.000Z');
    const downgradeScore = calculateScore(downgradeItem, 1, 0, { tickers: [], keywords: [] }, '2026-10-12T00:00:00.000Z');

    expect(reaffirmedScore.total).toBeLessThan(downgradeScore.total);
    expect(downgradeScore.direction).toBe('risk');
    expect(reaffirmedScore.reasons.some(r => r.includes('Dampened by routine modifier'))).toBe(true);
  });

  it('title catalyst mention scores much higher than a passing body mention', () => {
    const titleAcquisitionItem: ResearchItem = {
      ...companyBase,
      id: 'title-acq',
      title: 'Helixora: Acquires specialist oncology developer for ₹1200 crore',
      summary: 'Agreed to acquire specialist developer.',
      content: 'Transaction details disclosed.'
    };

    const passingBodyItem: ResearchItem = {
      ...companyBase,
      id: 'body-acq',
      title: 'Helixora: Routine operations update and quarterly dispatch',
      summary: 'Routine manufacturing update.',
      content: 'Company maintains regular output, noting prior acquisition integration progress.'
    };

    const titleScore = calculateScore(titleAcquisitionItem, 0, 1, { tickers: [], keywords: [] }, '2026-10-12T00:00:00.000Z');
    const bodyScore = calculateScore(passingBodyItem, 0, 1, { tickers: [], keywords: [] }, '2026-10-12T00:00:00.000Z');

    expect(titleScore.impact).toBeGreaterThan(bodyScore.impact);
    expect(titleScore.reasons.some(r => r.includes('Title catalyst'))).toBe(true);
  });
});

describe('4. Source Counts and Corroboration', () => {
  it('formats consistent wording: "N reports from M sources"', () => {
    expect(formatSourceCount(1, 1)).toBe('1 report from 1 source');
    expect(formatSourceCount(3, 2)).toBe('3 reports from 2 sources');
    expect(formatSourceCount(4, 3)).toBe('4 reports from 3 sources');
  });

  it('gives more corroboration points to independent sources than company disclosures', () => {
    const dummyItem: ResearchItem = {
      id: 'd1',
      title: 'Routine Disclosure Event',
      source: 'Exchange Disclosure Feed',
      published_at: '2026-10-12T00:00:00.000Z',
      sector: 'Energy',
      category: 'Announcement',
      summary: 'Text',
      content: 'Text'
    };

    const scoreIndependent = calculateScore(dummyItem, 2, 0, { tickers: [], keywords: [] }, '2026-10-12T00:00:00.000Z');
    const scoreCompanyOnly = calculateScore(dummyItem, 0, 2, { tickers: [], keywords: [] }, '2026-10-12T00:00:00.000Z');

    expect(scoreIndependent.corroboration).toBe(14);
    expect(scoreCompanyOnly.corroboration).toBe(4);
    expect(scoreIndependent.corroboration).toBeGreaterThan(scoreCompanyOnly.corroboration);
  });
});

describe('5. Real Aequitas Dataset Integration Verification', () => {
  it('verifies RF0104 is correctly assigned to Helixora and not Aranya Bank', () => {
    const aequitasData: ResearchItem[] = JSON.parse(
      fs.readFileSync(path.resolve('src/data/aequitasData.json'), 'utf-8')
    );
    const rf0104 = aequitasData.find(d => d.id === 'RF0104');
    expect(rf0104).toBeDefined();
    expect(rf0104?.ticker).toBe('HELIXORA');
    expect(rf0104?.company).toBe('Helixora Pharmaceuticals Limited');
    expect(rf0104?.has_entity_mismatch).toBe(false);
  });

  it('verifies dataset as-of date matches latest record', () => {
    const aequitasData: ResearchItem[] = JSON.parse(
      fs.readFileSync(path.resolve('src/data/aequitasData.json'), 'utf-8')
    );
    const meta = JSON.parse(
      fs.readFileSync(path.resolve('src/data/datasetMeta.json'), 'utf-8')
    );

    const timestamps = aequitasData.map(d => new Date(d.published_at).getTime());
    const maxTime = Math.max(...timestamps);

    expect(new Date(meta.asOfDate).getTime()).toBe(maxTime);
  });
});
