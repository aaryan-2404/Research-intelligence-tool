import datasetMeta from '../data/datasetMeta.json';

export const AS_OF_DATE = datasetMeta.asOfDate;

export function formatExactDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

export function formatRelativeAge(dateStr: string, asOfDateStr: string = AS_OF_DATE): string {
  const date = new Date(dateStr);
  const asOf = new Date(asOfDateStr);
  if (isNaN(date.getTime()) || isNaN(asOf.getTime())) return 'Undated';

  const diffMs = asOf.getTime() - date.getTime();
  if (diffMs <= 0) return 'On as-of date';

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 24) return 'Latest (today)';
  if (diffDays === 1) return '1d before latest';
  if (diffDays < 7) return `${diffDays}d before latest`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w before latest`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo before latest`;
  return `${Math.floor(diffDays / 365)}y before latest`;
}

export function formatCardDate(dateStr: string, asOfDateStr: string = AS_OF_DATE): string {
  const exact = formatExactDate(dateStr);
  const relative = formatRelativeAge(dateStr, asOfDateStr);
  return `${exact} · ${relative}`;
}

export function getScoreColor(score: number): {
  bg: string;
  text: string;
  border: string;
  ring: string;
  label: 'Critical' | 'High' | 'Medium' | 'Low';
} {
  if (score >= 75) {
    return {
      bg: 'bg-[#064e3b]/90',
      text: 'text-[#34d399]',
      border: 'border-[#047857]',
      ring: 'ring-emerald-500/30',
      label: 'Critical'
    };
  }
  if (score >= 50) {
    return {
      bg: 'bg-[#064e3b]/80',
      text: 'text-[#34d399]',
      border: 'border-[#047857]',
      ring: 'ring-emerald-500/20',
      label: 'High'
    };
  }
  if (score >= 30) {
    return {
      bg: 'bg-[#1e293b]',
      text: 'text-[#60a5fa]',
      border: 'border-[#334155]',
      ring: 'ring-blue-500/20',
      label: 'Medium'
    };
  }
  return {
    bg: 'bg-slate-800/80',
    text: 'text-slate-300',
    border: 'border-slate-700',
    ring: 'ring-slate-500/20',
    label: 'Low'
  };
}

export function formatSourceCount(reports: number, sources: number): string {
  const reportWord = reports === 1 ? '1 report' : `${reports} reports`;
  const sourceWord = sources === 1 ? '1 source' : `${sources} sources`;
  return `${reportWord} from ${sourceWord}`;
}
