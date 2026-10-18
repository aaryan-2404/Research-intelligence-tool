import React, { useState } from 'react';
import { 
  Filter, 
  RotateCcw, 
  Bookmark, 
  Calendar, 
  Building2, 
  Tag, 
  Radio, 
  Sliders, 
  ChevronDown, 
  ChevronUp 
} from 'lucide-react';
import { FilterState } from '../types/intelligence';

interface FacetSidebarProps {
  filters: FilterState;
  facets: {
    sectors: Record<string, number>;
    categories: Record<string, number>;
    sources: Record<string, number>;
    tickers: Record<string, number>;
  };
  savedCount: number;
  onUpdateFilters: (updater: (prev: FilterState) => FilterState) => void;
  onResetFilters: () => void;
}

export const FacetSidebar: React.FC<FacetSidebarProps> = ({
  filters,
  facets,
  savedCount,
  onUpdateFilters,
  onResetFilters
}) => {
  const isAnyFilterActive = 
    filters.sectors.length > 0 ||
    filters.categories.length > 0 ||
    filters.sources.length > 0 ||
    filters.tickers.length > 0 ||
    filters.datePreset !== 'all' ||
    filters.onlySaved ||
    filters.minScore > 0;

  // Collapsible section states
  const [openSections, setOpenSections] = useState({
    date: true,
    score: true,
    sectors: true,
    categories: true,
    sources: true
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleSector = (sector: string) => {
    onUpdateFilters(prev => ({
      ...prev,
      sectors: prev.sectors.includes(sector)
        ? prev.sectors.filter(s => s !== sector)
        : [...prev.sectors, sector]
    }));
  };

  const toggleCategory = (category: string) => {
    onUpdateFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  const toggleSource = (source: string) => {
    onUpdateFilters(prev => ({
      ...prev,
      sources: prev.sources.includes(source)
        ? prev.sources.filter(s => s !== source)
        : [...prev.sources, source]
    }));
  };

  const isolateSector = (sector: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateFilters(prev => ({ ...prev, sectors: [sector] }));
  };

  const isolateCategory = (category: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateFilters(prev => ({ ...prev, categories: [category] }));
  };

  const isolateSource = (source: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateFilters(prev => ({ ...prev, sources: [source] }));
  };

  return (
    <aside className="w-64 border-r border-[#232834] bg-[#10131A] flex flex-col h-full select-none shrink-0 overflow-y-auto">
      {/* Sidebar Header */}
      <div className="p-3 border-b border-[#232834] flex items-center justify-between shrink-0 bg-[#12151D]">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 font-mono uppercase tracking-wider">
          <Filter className="w-3.5 h-3.5 text-blue-400" />
          <span>Filters & Facets</span>
        </div>
        {isAnyFilterActive && (
          <button
            onClick={onResetFilters}
            className="text-xs font-mono text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Unified Single Scroll Container */}
      <div className="p-3 space-y-4 text-xs">
        {/* Quick Views */}
        <div>
          <button
            onClick={() => onUpdateFilters(prev => ({ ...prev, onlySaved: !prev.onlySaved }))}
            className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs transition-colors border ${
              filters.onlySaved
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 font-medium'
                : 'text-slate-300 hover:bg-[#181B22] border-[#232834]'
            }`}
          >
            <div className="flex items-center gap-2">
              <Bookmark className={`w-3.5 h-3.5 ${filters.onlySaved ? 'text-amber-400' : 'text-slate-400'}`} />
              <span>Saved Items & Notes</span>
            </div>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#181B22] text-slate-300 border border-[#2A303C]">
              {savedCount}
            </span>
          </button>
        </div>

        {/* Date Horizon Section */}
        <div className="border-t border-[#232834] pt-3">
          <button
            onClick={() => toggleSection('date')}
            className="w-full flex items-center justify-between text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold mb-2"
          >
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Date Horizon
            </span>
            {openSections.date ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
          </button>

          {openSections.date && (
            <div className="grid grid-cols-2 gap-1.5 font-mono text-xs">
              {(['all', 'today', '7d', '30d'] as const).map(preset => {
                const labels = {
                  all: 'All Time',
                  today: 'Today (24h)',
                  '7d': 'Last 7 Days',
                  '30d': 'Last 30 Days'
                };
                const active = filters.datePreset === preset;
                return (
                  <button
                    key={preset}
                    onClick={() => onUpdateFilters(prev => ({ ...prev, datePreset: preset }))}
                    className={`px-2 py-1.5 rounded text-center transition-colors border text-[11px] ${
                      active
                        ? 'bg-[#181B22] text-white border-[#2A303C] font-semibold'
                        : 'bg-[#14171F] text-slate-300 border-[#232834] hover:bg-[#181B22] hover:text-white'
                    }`}
                  >
                    {labels[preset]}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Minimum Score Threshold Slider */}
        <div className="border-t border-[#232834] pt-3">
          <button
            onClick={() => toggleSection('score')}
            className="w-full flex items-center justify-between text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold mb-2"
          >
            <span className="flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-slate-400" />
              Priority Score Filter
            </span>
            {openSections.score ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
          </button>

          {openSections.score && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-slate-400 font-mono">Min Threshold:</span>
                <span className="font-mono text-xs text-emerald-400 font-bold">
                  {filters.minScore > 0 ? `≥ ${filters.minScore} pts` : 'All Scores (0+)'}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="75"
                step="15"
                value={filters.minScore}
                onChange={e => onUpdateFilters(prev => ({ ...prev, minScore: Number(e.target.value) }))}
                className="w-full accent-emerald-500 bg-[#181B22] h-1.5 rounded cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                <span>0 All</span>
                <span>30 Med</span>
                <span>50 High</span>
                <span>75 Crit</span>
              </div>
            </div>
          )}
        </div>

        {/* Sector Facets */}
        <div className="border-t border-[#232834] pt-3">
          <button
            onClick={() => toggleSection('sectors')}
            className="w-full flex items-center justify-between text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold mb-2"
          >
            <span className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              Sectors ({Object.keys(facets.sectors).length})
            </span>
            {openSections.sectors ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
          </button>

          {openSections.sectors && (
            <div className="space-y-1">
              {Object.entries(facets.sectors).map(([sector, count]) => {
                const selected = filters.sectors.includes(sector);
                return (
                  <div
                    key={sector}
                    onClick={() => toggleSector(sector)}
                    className={`group w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-colors cursor-pointer border ${
                      selected
                        ? 'bg-[#181B22] text-white font-semibold border-[#2A303C]'
                        : 'text-slate-300 hover:bg-[#14171F] hover:text-white border-transparent'
                    }`}
                  >
                    <span className="truncate max-w-[130px]">{sector}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={(e) => isolateSector(sector, e)}
                        title={`Filter exclusively for ${sector}`}
                        className="text-[9px] font-mono px-1 py-0.2 rounded bg-[#181B22] hover:bg-slate-700 text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity border border-[#2A303C]"
                      >
                        ONLY
                      </button>
                      <span className="font-mono text-[11px] text-slate-400 bg-[#181B22] px-1.5 py-0.2 rounded border border-[#232834]">{count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Category Facets */}
        <div className="border-t border-[#232834] pt-3">
          <button
            onClick={() => toggleSection('categories')}
            className="w-full flex items-center justify-between text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold mb-2"
          >
            <span className="flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              Categories ({Object.keys(facets.categories).length})
            </span>
            {openSections.categories ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
          </button>

          {openSections.categories && (
            <div className="space-y-1">
              {Object.entries(facets.categories).map(([category, count]) => {
                const selected = filters.categories.includes(category);
                return (
                  <div
                    key={category}
                    onClick={() => toggleCategory(category)}
                    className={`group w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-colors cursor-pointer border ${
                      selected
                        ? 'bg-[#181B22] text-white font-semibold border-[#2A303C]'
                        : 'text-slate-300 hover:bg-[#14171F] hover:text-white border-transparent'
                    }`}
                  >
                    <span className="truncate max-w-[130px]">{category}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={(e) => isolateCategory(category, e)}
                        title={`Filter exclusively for ${category}`}
                        className="text-[9px] font-mono px-1 py-0.2 rounded bg-[#181B22] hover:bg-slate-700 text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity border border-[#2A303C]"
                      >
                        ONLY
                      </button>
                      <span className="font-mono text-[11px] text-slate-400 bg-[#181B22] px-1.5 py-0.2 rounded border border-[#232834]">{count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Source Facets */}
        <div className="border-t border-[#232834] pt-3">
          <button
            onClick={() => toggleSection('sources')}
            className="w-full flex items-center justify-between text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold mb-2"
          >
            <span className="flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-slate-400" />
              Sources ({Object.keys(facets.sources).length})
            </span>
            {openSections.sources ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
          </button>

          {openSections.sources && (
            <div className="space-y-1">
              {Object.entries(facets.sources).slice(0, 10).map(([source, count]) => {
                const selected = filters.sources.includes(source);
                return (
                  <div
                    key={source}
                    onClick={() => toggleSource(source)}
                    className={`group w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-colors cursor-pointer border ${
                      selected
                        ? 'bg-[#181B22] text-white font-semibold border-[#2A303C]'
                        : 'text-slate-300 hover:bg-[#14171F] hover:text-white border-transparent'
                    }`}
                  >
                    <span className="truncate max-w-[130px]">{source}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={(e) => isolateSource(source, e)}
                        title={`Filter exclusively for ${source}`}
                        className="text-[9px] font-mono px-1 py-0.2 rounded bg-[#181B22] hover:bg-slate-700 text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity border border-[#2A303C]"
                      >
                        ONLY
                      </button>
                      <span className="font-mono text-[11px] text-slate-400 bg-[#181B22] px-1.5 py-0.2 rounded border border-[#232834]">{count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
