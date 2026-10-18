import React, { useState } from 'react';
import { Flame, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import { StoryCluster } from '../types/intelligence';
import { formatExactDate, getScoreColor, formatSourceCount } from '../utils/formatters';

interface TopPriorityHorizonProps {
  topClusters: StoryCluster[];
  onSelectCluster: (cluster: StoryCluster) => void;
}

export const TopPriorityHorizon: React.FC<TopPriorityHorizonProps> = ({
  topClusters,
  onSelectCluster
}) => {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem('radar_priority_collapsed') === 'true';
    } catch {}
    return false;
  });

  const toggleCollapsed = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('radar_priority_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  if (topClusters.length === 0) return null;

  return (
    <div className="bg-[#10131A] border-b border-[#232834] px-4 py-2 shrink-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-5 h-5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Flame className="w-3.5 h-3.5" />
          </div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-200 font-mono flex items-center gap-2">
            <span>Top 3 Focus Signals</span>
            <span className="text-[11px] text-slate-400 font-normal normal-case hidden sm:inline">
              (Market-moving catalysts ranked by 4-factor multi-source conviction)
            </span>
          </h2>
        </div>

        <button
          onClick={toggleCollapsed}
          className="flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-slate-200 px-2 py-0.5 rounded hover:bg-[#181B22] transition-colors"
        >
          <span>{isCollapsed ? 'Expand Strip' : 'Collapse'}</span>
          {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </button>
      </div>

      {!isCollapsed && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 mt-2">
          {topClusters.map(cluster => {
            const item = cluster.primaryItem;
            const scoreStyle = getScoreColor(item.score.total);

            return (
              <div
                key={cluster.id}
                onClick={() => onSelectCluster(cluster)}
                className="group relative cursor-pointer bg-[#14171F] hover:bg-[#1A1E29] rounded p-2.5 border border-[#232834] hover:border-[#384154] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`px-1.5 py-0.5 rounded text-[11px] font-bold font-mono border ${scoreStyle.bg} ${scoreStyle.text} ${scoreStyle.border}`}>
                        [{item.score.total}] {item.score.tier}
                      </span>
                      {item.ticker ? (
                        <span className="px-1.5 py-0.5 rounded text-[11px] font-bold font-mono bg-blue-500/15 text-blue-300 border border-blue-500/30">
                          ${item.ticker}
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#181B22] text-slate-400 border border-[#2A303C]">
                          MACRO
                        </span>
                      )}
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#181B22] text-slate-300 border border-[#2A303C] font-mono">
                        {item.category}
                      </span>
                    </div>

                    <span className="text-[10px] text-slate-400 font-mono shrink-0">
                      {formatExactDate(item.published_at)}
                    </span>
                  </div>

                  <h3 className="text-xs font-semibold text-slate-100 line-clamp-2 group-hover:text-blue-300 transition-colors leading-snug">
                    {item.title}
                  </h3>
                </div>

                <div className="mt-2 pt-1.5 border-t border-[#232834] flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span className="text-[11px] text-slate-400">
                    {formatSourceCount(cluster.totalReportsCount, cluster.totalSourcesCount)}
                  </span>

                  <span className="flex items-center gap-1 text-[11px] text-blue-400 font-medium group-hover:translate-x-0.5 transition-transform font-sans">
                    Inspect <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
