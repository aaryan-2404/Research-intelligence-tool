import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  X, 
  ArrowUpDown, 
  RotateCcw,
  AlertCircle
} from 'lucide-react';
import { useIntelligence } from './hooks/useIntelligence';
import { Navbar } from './components/Navbar';
import { TopPriorityHorizon } from './components/TopPriorityHorizon';
import { FacetSidebar } from './components/FacetSidebar';
import { FeedCard } from './components/FeedCard';
import { DetailDrawer } from './components/DetailDrawer';
import { WatchlistModal } from './components/WatchlistModal';
import { ExecutiveBriefingModal } from './components/ExecutiveBriefingModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { ImportModal } from './components/ImportModal';

export const App: React.FC = () => {
  const {
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
  } = useIntelligence();

  // Modal visibility states
  const [isWatchlistOpen, setIsWatchlistOpen] = useState(false);
  const [isBriefingOpen, setIsBriefingOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  // Active cluster in workbench defaults to selected item or top priority item
  const currentActiveCluster = activeCluster || filteredClusters[selectedIndex] || filteredClusters[0] || null;

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        if (e.key === 'Escape') {
          (e.target as HTMLElement).blur();
        }
        return;
      }

      if (e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => {
          const next = Math.min(filteredClusters.length - 1, prev + 1);
          if (filteredClusters[next]) {
            setActiveCluster(filteredClusters[next]);
          }
          return next;
        });
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => {
          const next = Math.max(0, prev - 1);
          if (filteredClusters[next]) {
            setActiveCluster(filteredClusters[next]);
          }
          return next;
        });
      } else if (e.key === 'Enter') {
        if (filteredClusters[selectedIndex]) {
          setActiveCluster(filteredClusters[selectedIndex]);
        }
      } else if (e.key === 's') {
        if (filteredClusters[selectedIndex]) {
          toggleSave(filteredClusters[selectedIndex].primaryItem.id);
        }
      } else if (e.key === 'Escape') {
        if (activeCluster) setActiveCluster(null);
        if (isWatchlistOpen) setIsWatchlistOpen(false);
        if (isBriefingOpen) setIsBriefingOpen(false);
        if (isShortcutsOpen) setIsShortcutsOpen(false);
        if (isImportOpen) setIsImportOpen(false);
      } else if (e.key === '?') {
        setIsShortcutsOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredClusters, selectedIndex, activeCluster, isWatchlistOpen, isBriefingOpen, isShortcutsOpen, isImportOpen, setSelectedIndex, setActiveCluster, toggleSave]);

  const isAnyFilterActive = 
    Boolean(filters.searchQuery) ||
    filters.sectors.length > 0 ||
    filters.categories.length > 0 ||
    filters.sources.length > 0 ||
    filters.tickers.length > 0 ||
    filters.datePreset !== 'all' ||
    filters.minScore > 0 ||
    filters.onlySaved;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0D0F12] text-slate-100 font-sans">
      {/* 1. Header Navigation Bar */}
      <Navbar
        datasetName={datasetName}
        asOfDateFormatted={asOfDateFormatted}
        totalRecords={items.length}
        watchlistCount={watchlist.tickers.length}
        datasetSource={datasetSource}
        isSampleData={isSampleData}
        onSwitchDataset={switchDataset}
        onOpenImport={() => setIsImportOpen(true)}
        onResetData={resetToBenchmark}
        onOpenWatchlist={() => setIsWatchlistOpen(true)}
        onOpenBriefing={() => setIsBriefingOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
      />

      {/* 2. Top-Priority Horizon Ribbon (10-Second Priority Signal) */}
      <TopPriorityHorizon
        topClusters={topPriorityClusters}
        onSelectCluster={cluster => setActiveCluster(cluster)}
      />

      {/* 3. Main Split-Pane Research Workbench (Design 1) */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Pane (20%): Multi-Facet & Sources Rail */}
        <FacetSidebar
          filters={filters}
          facets={facets}
          savedCount={savedIds.size}
          onUpdateFilters={updater => setFilters(updater)}
          onResetFilters={resetFilters}
        />

        {/* Center Pane (38% - 40%): Search & Catalyst Snippet Stream */}
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#0D0F12] min-w-0">
          {/* Quick Search & Sort Control Bar */}
          <div className="p-2.5 bg-[#10131A] border-b border-[#232834] flex items-center justify-between gap-3 shrink-0">
            {/* Search Input Box with Keyboard Focus Hint */}
            <div className="relative flex-1 max-w-xl">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search headlines, tickers, catalysts, or content... (Press '/' to focus)"
                value={filters.searchQuery}
                onChange={e => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                className="w-full bg-[#0A0D13] border border-[#2A303C] focus:border-slate-500 rounded pl-8 pr-12 py-1 text-xs text-slate-100 placeholder-slate-500 focus:outline-none font-sans"
              />
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {filters.searchQuery && (
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, searchQuery: '' }))}
                    className="text-slate-400 hover:text-white p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <kbd className="hidden sm:inline px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-[10px] border border-slate-700">
                  /
                </kbd>
              </div>
            </div>

            {/* Always Visible "Showing X of N" & Reset Filters */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-300 whitespace-nowrap">
                  Showing <strong className="text-white font-bold">{filteredClusters.length}</strong> of {items.length}
                </span>

                {isAnyFilterActive && (
                  <button
                    onClick={resetFilters}
                    className="text-xs font-mono text-slate-300 hover:text-white flex items-center gap-1 bg-[#14171F] px-2 py-0.5 rounded border border-[#232834] transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                )}
              </div>

              {/* Sort Control */}
              <div className="flex items-center gap-1.5 bg-[#14171F] border border-[#232834] rounded px-2.5 py-1">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={filters.sortBy}
                  onChange={e => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
                  className="bg-transparent text-xs text-slate-200 font-mono focus:outline-none cursor-pointer"
                >
                  <option value="score" className="bg-[#10131A] text-slate-200">Sort: Priority Score</option>
                  <option value="newest" className="bg-[#10131A] text-slate-200">Sort: Newest First</option>
                  <option value="corroboration" className="bg-[#10131A] text-slate-200">Sort: Most Corroborated</option>
                </select>
              </div>
            </div>
          </div>

          {/* Active Filter Chips Bar (if filters active) */}
          {isAnyFilterActive && (
            <div className="px-3 py-1.5 bg-[#0E1117] border-b border-[#232834] flex items-center gap-1.5 overflow-x-auto text-xs shrink-0 font-mono">
              <span className="text-slate-400 font-semibold shrink-0">Active:</span>

              {filters.searchQuery && (
                <span className="px-2 py-0.5 rounded bg-[#181B22] text-slate-200 border border-[#2A303C] flex items-center gap-1 shrink-0">
                  <span>Query: "{filters.searchQuery}"</span>
                  <button onClick={() => setFilters(prev => ({ ...prev, searchQuery: '' }))}>×</button>
                </span>
              )}

              {filters.sectors.map(s => (
                <span key={s} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1 shrink-0">
                  <span>Sector: {s}</span>
                  <button onClick={() => setFilters(prev => ({ ...prev, sectors: prev.sectors.filter(sec => sec !== s) }))}>×</button>
                </span>
              ))}

              {filters.categories.map(c => (
                <span key={c} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1 shrink-0">
                  <span>Category: {c}</span>
                  <button onClick={() => setFilters(prev => ({ ...prev, categories: prev.categories.filter(cat => cat !== c) }))}>×</button>
                </span>
              ))}

              {filters.sources.map(src => (
                <span key={src} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1 shrink-0">
                  <span>Source: {src}</span>
                  <button onClick={() => setFilters(prev => ({ ...prev, sources: prev.sources.filter(so => so !== src) }))}>×</button>
                </span>
              ))}

              {filters.datePreset !== 'all' && (
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1 shrink-0">
                  <span>Horizon: {filters.datePreset}</span>
                  <button onClick={() => setFilters(prev => ({ ...prev, datePreset: 'all' }))}>×</button>
                </span>
              )}

              {filters.minScore > 0 && (
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1 shrink-0">
                  <span>Score: ≥ {filters.minScore}</span>
                  <button onClick={() => setFilters(prev => ({ ...prev, minScore: 0 }))}>×</button>
                </span>
              )}

              {filters.onlySaved && (
                <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1 shrink-0">
                  <span>Only Saved</span>
                  <button onClick={() => setFilters(prev => ({ ...prev, onlySaved: false }))}>×</button>
                </span>
              )}

              <button
                onClick={resetFilters}
                className="text-blue-400 hover:text-blue-300 underline ml-auto text-xs shrink-0 font-sans"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Scrollable Story Cards Stream */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5">
            {filteredClusters.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-slate-800 rounded-lg bg-slate-900/40">
                <AlertCircle className="w-8 h-8 text-slate-400 mb-2" />
                <h3 className="font-semibold text-slate-200 text-sm">No matching research stories found</h3>
                <p className="text-xs text-slate-400 max-w-sm mt-1">
                  Try clearing active filters, adjusting the minimum score slider, or searching for broader terms like "capex" or "acquisition".
                </p>
                <button
                  onClick={resetFilters}
                  className="mt-4 px-3.5 py-1.5 rounded text-xs bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              filteredClusters.map((cluster, index) => {
                const item = cluster.primaryItem;
                const isSaved = savedIds.has(item.id);
                const hasNote = Boolean(notes[item.id]?.content);
                const isOnWatchlist = item.ticker ? watchlist.tickers.includes(item.ticker) : false;
                const isSelected = (currentActiveCluster?.id === cluster.id);

                return (
                  <FeedCard
                    key={cluster.id}
                    cluster={cluster}
                    isSelected={isSelected}
                    isSaved={isSaved}
                    hasNote={hasNote}
                    isOnWatchlist={isOnWatchlist}
                    onSelect={() => {
                      setSelectedIndex(index);
                      setActiveCluster(cluster);
                    }}
                    onToggleSave={e => {
                      e.stopPropagation();
                      toggleSave(item.id);
                    }}
                  />
                );
              })
            )}
          </div>
        </main>

        {/* Right Pane (42%): Persistent Split Document Reader (Design 1 Workbench) */}
        <DetailDrawer
          cluster={currentActiveCluster}
          isSaved={currentActiveCluster ? savedIds.has(currentActiveCluster.primaryItem.id) : false}
          note={currentActiveCluster ? notes[currentActiveCluster.primaryItem.id] : undefined}
          mode="docked"
          onClose={() => setActiveCluster(null)}
          onToggleSave={() => {
            if (currentActiveCluster) toggleSave(currentActiveCluster.primaryItem.id);
          }}
          onUpdateNote={content => {
            if (currentActiveCluster) updateNote(currentActiveCluster.primaryItem.id, content);
          }}
        />
      </div>

      {/* 5. Modals */}
      <WatchlistModal
        isOpen={isWatchlistOpen}
        watchlist={watchlist}
        onClose={() => setIsWatchlistOpen(false)}
        onSaveWatchlist={saveWatchlist}
        onLoadExampleWatchlist={loadExampleWatchlist}
      />

      <ExecutiveBriefingModal
        isOpen={isBriefingOpen}
        onClose={() => setIsBriefingOpen(false)}
        markdownContent={generateBriefingMarkdown()}
      />

      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onDataImported={(importedItems, sourceName) => {
          importCustomDataset(importedItems, sourceName);
          setIsImportOpen(false);
        }}
      />
    </div>
  );
};
