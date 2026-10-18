import React, { useState } from 'react';
import { 
  Radar, 
  FileText, 
  Keyboard, 
  TrendingUp, 
  CalendarDays,
  UploadCloud,
  Database,
  ChevronDown,
  RotateCcw,
  Check
} from 'lucide-react';
import { DatasetSource } from '../hooks/useIntelligence';

interface NavbarProps {
  datasetName: string;
  asOfDateFormatted: string;
  totalRecords: number;
  watchlistCount: number;
  datasetSource: DatasetSource;
  isSampleData: boolean;
  onSwitchDataset: (source: DatasetSource) => void;
  onOpenImport: () => void;
  onResetData: () => void;
  onOpenWatchlist: () => void;
  onOpenBriefing: () => void;
  onOpenShortcuts: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  datasetName,
  asOfDateFormatted,
  totalRecords,
  watchlistCount,
  datasetSource,
  isSampleData,
  onSwitchDataset,
  onOpenImport,
  onResetData,
  onOpenWatchlist,
  onOpenBriefing,
  onOpenShortcuts
}) => {
  const [isDatasetMenuOpen, setIsDatasetMenuOpen] = useState(false);

  return (
    <header className="h-13 bg-[#10131A] border-b border-[#232834] px-4 flex items-center justify-between shrink-0 select-none z-30">
      {/* Brand & Provenance Identifier */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center w-7 h-7 rounded bg-[#181B22] border border-[#2A303C] text-emerald-400">
            <Radar className="w-4 h-4 animate-pulse" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs tracking-wider uppercase text-white font-mono">
                RESEARCH RADAR
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#181B22] text-slate-300 border border-[#2A303C]">
                ALPHA WORKBENCH
              </span>
            </div>
          </div>
        </div>

        {/* Dataset Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsDatasetMenuOpen(prev => !prev)}
            className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded bg-[#14171F] hover:bg-[#181B22] border border-[#232834] text-xs text-slate-200 transition-colors"
          >
            <Database className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-mono text-slate-200 font-medium truncate max-w-[170px]">
              {datasetName}
            </span>
            <span className="text-[10px] bg-[#1E222B] px-1.5 py-0.2 rounded text-slate-300 font-mono">
              {totalRecords}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {isDatasetMenuOpen && (
            <div 
              onMouseLeave={() => setIsDatasetMenuOpen(false)}
              className="absolute left-0 top-8 w-64 bg-[#0E1117] border border-[#2A303C] rounded shadow-2xl p-1.5 z-50 text-xs font-mono"
            >
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 border-b border-[#232834] mb-1">
                Select Active Dataset
              </div>

              <button
                onClick={() => {
                  onSwitchDataset('aequitas');
                  setIsDatasetMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2 py-1.5 rounded transition-colors text-left ${
                  datasetSource === 'aequitas' ? 'bg-[#181B22] text-white border border-[#2A303C] font-bold' : 'text-slate-300 hover:bg-[#14171F]'
                }`}
              >
                <div>
                  <div className="font-semibold text-slate-100">Aequitas Benchmark</div>
                  <div className="text-[10px] text-slate-400 font-normal">Official 250 records + filings</div>
                </div>
                {datasetSource === 'aequitas' && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
              </button>

              <button
                onClick={() => {
                  onSwitchDataset('sample');
                  setIsDatasetMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2 py-1.5 rounded transition-colors text-left mt-1 ${
                  datasetSource === 'sample' ? 'bg-[#181B22] text-white border border-[#2A303C] font-bold' : 'text-slate-300 hover:bg-[#14171F]'
                }`}
              >
                <div>
                  <div className="font-semibold text-slate-100">Sample Demo Feed</div>
                  <div className="text-[10px] text-slate-400 font-normal">Offline 46-record test pack</div>
                </div>
                {datasetSource === 'sample' && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
              </button>

              <div className="border-t border-[#232834] mt-1.5 pt-1.5 flex gap-1">
                <button
                  onClick={() => {
                    setIsDatasetMenuOpen(false);
                    onOpenImport();
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1 rounded bg-[#181B22] hover:bg-[#1E222B] border border-[#2A303C] text-slate-200 text-xs transition-colors"
                >
                  <UploadCloud className="w-3 h-3 text-blue-400" />
                  <span>Import CSV</span>
                </button>
                <button
                  onClick={() => {
                    setIsDatasetMenuOpen(false);
                    onResetData();
                  }}
                  title="Reset to official benchmark"
                  className="px-2 py-1 rounded bg-[#181B22] hover:bg-[#1E222B] border border-[#2A303C] text-slate-400 hover:text-white text-xs transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Date Anchor Indicator */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#14171F] border border-[#232834] text-xs">
          <CalendarDays className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-mono text-slate-300 text-[11px]">
            Data as of <strong className="text-white">{asOfDateFormatted}</strong>
          </span>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-2">
        {/* CSV Import Button */}
        <button
          onClick={onOpenImport}
          title="Import custom CSV or JSON dataset"
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-mono text-slate-300 bg-[#14171F] hover:bg-[#181B22] border border-[#232834] hover:border-[#2A303C] transition-colors"
        >
          <UploadCloud className="w-3.5 h-3.5 text-slate-400" />
          <span>Import CSV</span>
        </button>

        {/* Watchlist Manager */}
        <button
          onClick={onOpenWatchlist}
          title="Manage coverage universe and focus tickers"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium text-slate-200 bg-[#14171F] hover:bg-[#181B22] border border-[#232834] hover:border-[#2A303C] transition-colors"
        >
          <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
          <span>Watchlist</span>
          <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
            watchlistCount > 0 ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-[#181B22] text-slate-400'
          }`}>
            {watchlistCount}
          </span>
        </button>

        {/* Executive Morning Briefing Generator */}
        <button
          onClick={onOpenBriefing}
          title="Generate executive markdown briefing note"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold text-slate-100 bg-[#181B22] hover:bg-[#1E222B] border border-[#2A303C] hover:border-slate-600 transition-colors"
        >
          <FileText className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">Executive Briefing</span>
          <span className="sm:hidden">Briefing</span>
        </button>

        {/* Keyboard Shortcuts Guide */}
        <button
          onClick={onOpenShortcuts}
          title="Keyboard shortcuts guide (?)"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs text-slate-300 hover:text-white bg-[#14171F] hover:bg-[#181B22] border border-[#232834] transition-colors"
        >
          <Keyboard className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-mono text-[11px] hidden md:inline">? Shortcuts</span>
        </button>
      </div>
    </header>
  );
};
