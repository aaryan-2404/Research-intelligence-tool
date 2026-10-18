import React, { useState } from 'react';
import { 
  Bookmark, 
  BookmarkCheck, 
  Layers, 
  ChevronDown, 
  ChevronUp, 
  FileText, 
  Star,
  Info,
  AlertTriangle
} from 'lucide-react';
import { StoryCluster } from '../types/intelligence';
import { formatCardDate, getScoreColor, formatSourceCount } from '../utils/formatters';

interface FeedCardProps {
  cluster: StoryCluster;
  isSelected: boolean;
  isSaved: boolean;
  hasNote: boolean;
  isOnWatchlist: boolean;
  onSelect: () => void;
  onToggleSave: (e: React.MouseEvent) => void;
}

// Highlight financial amounts and catalyst verbs in snippets
const highlightSnippets = (text: string) => {
  if (!text) return null;
  const regex = /(\$[\d,.]+(?:\s*(?:billion|million|bn|mn|M|B|K))?|₹\s*[\d,.]+(?:\s*(?:Cr|Crore|Lakh|mn|bn))?|\b\d+(?:\.\d+)?%|\b(?:cash consideration|acquisition|acquired|merger|capex|credit rating|downgraded?|upgraded?|default|lawsuit|investigation|clearance|Phase[- ]3|FDA approval)\b)/gi;
  const parts = text.split(regex);
  return parts.map((part, idx) => {
    if (part.match(regex)) {
      return (
        <mark
          key={idx}
          className="bg-amber-400/20 text-amber-200 border border-amber-500/30 px-1 py-0.2 rounded font-mono font-medium text-[11px]"
        >
          {part}
        </mark>
      );
    }
    return <span key={idx}>{part}</span>;
  });
};

export const FeedCard: React.FC<FeedCardProps> = ({
  cluster,
  isSelected,
  isSaved,
  hasNote,
  isOnWatchlist,
  onSelect,
  onToggleSave
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const item = cluster.primaryItem;
  const scoreStyle = getScoreColor(item.score.total);

  return (
    <article
      onClick={onSelect}
      className={`group relative rounded p-3 transition-colors cursor-pointer border select-text ${
        isSelected
          ? 'bg-[#171B24] border-l-2 border-l-emerald-500 border-[#2A303C] shadow-sm'
          : 'bg-[#13161C] hover:bg-[#181C26] border-[#232834]'
      }`}
    >
      {/* Primary Line: Priority Score, Ticker, Category Tag, Mismatch Warning, and Date */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Priority Score Badge with Tooltip */}
          <div className="relative">
            <span
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              className={`px-1.5 py-0.5 rounded text-[11px] font-bold font-mono border flex items-center gap-1 ${scoreStyle.bg} ${scoreStyle.text} ${scoreStyle.border}`}
            >
              <span>[{item.score.total}]</span>
              <span className="text-[10px] font-normal uppercase">{item.score.tier}</span>
              <Info className="w-2.5 h-2.5 opacity-50" />
            </span>

            {/* Score Hover Tooltip */}
            {showTooltip && (
              <div className="absolute left-0 top-6 z-50 w-64 bg-[#0E1117] text-slate-200 border border-[#2A303C] p-2.5 rounded shadow-2xl text-xs pointer-events-none">
                <div className="font-semibold text-[11px] text-white mb-1.5 flex justify-between border-b border-[#232834] pb-1">
                  <span>Score Factor Breakdown</span>
                  <span className="font-mono text-emerald-400 font-bold">{item.score.total}/100</span>
                </div>
                <div className="space-y-1 font-mono text-[10px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Recency Decay:</span>
                    <span className="text-slate-200">{item.score.recency}/30 pts</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Impact Event Type:</span>
                    <span className="text-slate-200">{item.score.impact}/35 pts</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Independent Corroboration:</span>
                    <span className="text-slate-200">{item.score.corroboration}/20 pts</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Watchlist Alignment:</span>
                    <span className="text-slate-200">{item.score.watchlist}/15 pts</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Ticker Badge */}
          {item.ticker ? (
            <span
              className={`px-1.5 py-0.5 rounded text-[11px] font-bold font-mono flex items-center gap-1 border ${
                isOnWatchlist
                  ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                  : 'bg-[#181B22] text-slate-300 border-[#2A303C]'
              }`}
            >
              {isOnWatchlist && <Star className="w-2.5 h-2.5 fill-blue-400 text-blue-400" />}
              ${item.ticker}
            </span>
          ) : (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#181B22] text-slate-400 border border-[#2A303C]">
              MACRO
            </span>
          )}

          {/* Primary Category Tag */}
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#181B22] text-slate-300 border border-[#2A303C] font-mono">
            {item.category}
          </span>

          {/* Entity Mismatch Warning Badge */}
          {item.has_entity_mismatch && (
            <span 
              title={item.mismatch_details}
              className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono flex items-center gap-1"
            >
              <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />
              <span>Mismatch</span>
            </span>
          )}
        </div>

        {/* Right side: Absolute Date & Bookmark Action */}
        <div className="flex items-center gap-2">
          {hasNote && (
            <span
              title="Private analyst note attached"
              className="flex items-center gap-1 text-[10px] text-emerald-300 font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20"
            >
              <FileText className="w-2.5 h-2.5" />
              <span>Note</span>
            </span>
          )}

          <span className="text-[11px] font-mono text-slate-400">
            {formatCardDate(item.published_at)}
          </span>

          <button
            onClick={onToggleSave}
            title={isSaved ? 'Remove bookmark' : 'Bookmark story (s)'}
            className={`p-1 rounded transition-colors ${
              isSaved ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {isSaved ? <BookmarkCheck className="w-3.5 h-3.5 fill-amber-400/20" /> : <Bookmark className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Headline */}
      <h3 className="text-xs font-semibold text-slate-100 group-hover:text-blue-300 transition-colors leading-snug mb-1">
        {item.title}
      </h3>

      {/* Excerpt Snippet with Deal Term Highlighting */}
      <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed mb-2 font-sans select-text">
        {highlightSnippets(item.summary || item.content)}
      </p>

      {/* Footer: Source Count & Publisher */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1.5 border-t border-[#232834] font-mono">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-300 font-medium">{item.source}</span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400">{item.sector}</span>
        </div>

        {/* Source Cluster Tag */}
        {cluster.totalReportsCount > 1 ? (
          <button
            onClick={e => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 transition-colors"
          >
            <Layers className="w-3 h-3" />
            <span>{formatSourceCount(cluster.totalReportsCount, cluster.totalSourcesCount)}</span>
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        ) : (
          <span className="text-slate-400 text-[10px]">1 report</span>
        )}
      </div>

      {/* Multi-Source Timeline Accordion */}
      {isExpanded && cluster.relatedItems.length > 0 && (
        <div
          onClick={e => e.stopPropagation()}
          className="mt-2.5 pt-2 border-t border-[#232834] space-y-1.5 bg-[#0D1017] p-2 rounded text-xs"
        >
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
            Corroborating Disclosures ({cluster.relatedItems.length} additional reports):
          </div>
          {cluster.relatedItems.map(rel => (
            <div
              key={rel.id}
              className="flex items-start justify-between gap-2 pb-1 border-b border-[#1E222B] last:border-b-0 last:pb-0"
            >
              <div>
                <span className="text-[11px] font-mono text-blue-300 font-semibold mr-1.5">[{rel.source}]</span>
                <span className="text-slate-300 text-[11px]">{rel.title}</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 shrink-0">
                {formatCardDate(rel.published_at)}
              </span>
            </div>
          ))}
        </div>
      )}
    </article>
  );
};
