import React, { useState } from 'react';
import { 
  X, 
  TrendingUp, 
  Plus, 
  Trash2, 
  RotateCcw, 
  Star, 
  Download,
  Info 
} from 'lucide-react';
import { WatchlistConfig } from '../types/intelligence';

interface WatchlistModalProps {
  isOpen: boolean;
  watchlist: WatchlistConfig;
  onClose: () => void;
  onSaveWatchlist: (watchlist: WatchlistConfig) => void;
  onLoadExampleWatchlist: () => void;
}

export const WatchlistModal: React.FC<WatchlistModalProps> = ({
  isOpen,
  watchlist,
  onClose,
  onSaveWatchlist,
  onLoadExampleWatchlist
}) => {
  const [tickers, setTickers] = useState<string[]>(watchlist.tickers);
  const [keywords, setKeywords] = useState<string[]>(watchlist.keywords);
  const [newTicker, setNewTicker] = useState<string>('');
  const [newKeyword, setNewKeyword] = useState<string>('');

  React.useEffect(() => {
    setTickers(watchlist.tickers);
    setKeywords(watchlist.keywords);
  }, [watchlist]);

  if (!isOpen) return null;

  const handleAddTicker = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newTicker.trim().toUpperCase();
    if (!clean || tickers.includes(clean)) return;
    const updated = [...tickers, clean];
    setTickers(updated);
    setNewTicker('');
    onSaveWatchlist({ tickers: updated, keywords });
  };

  const handleRemoveTicker = (tickerToRemove: string) => {
    const updated = tickers.filter(t => t !== tickerToRemove);
    setTickers(updated);
    onSaveWatchlist({ tickers: updated, keywords });
  };

  const handleAddKeyword = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newKeyword.trim().toLowerCase();
    if (!clean || keywords.includes(clean)) return;
    const updated = [...keywords, clean];
    setKeywords(updated);
    setNewKeyword('');
    onSaveWatchlist({ tickers, keywords: updated });
  };

  const handleRemoveKeyword = (keywordToRemove: string) => {
    const updated = keywords.filter(k => k !== keywordToRemove);
    setKeywords(updated);
    onSaveWatchlist({ tickers, keywords: updated });
  };

  const handleClearAll = () => {
    setTickers([]);
    setKeywords([]);
    onSaveWatchlist({ tickers: [], keywords: [] });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0d1322] border border-slate-800 rounded-xl w-full max-w-lg flex flex-col shadow-2xl animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white font-mono">
                Coverage Universe Watchlist
              </h2>
              <p className="text-xs text-slate-400">
                Watched tickers receive a transparent +10 to +15 pt priority boost
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5 text-xs">
          {/* Tickers Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-xs text-slate-200 uppercase tracking-wider font-semibold">
                Tracked Tickers ({tickers.length})
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={onLoadExampleWatchlist}
                  className="text-xs font-mono text-blue-400 hover:text-blue-300 flex items-center gap-1 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20"
                >
                  <Download className="w-3 h-3" /> Load Example Watchlist (8 Equities)
                </button>

                {tickers.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="text-xs font-mono text-slate-400 hover:text-red-400"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Empty State Onboarding Hint */}
            {tickers.length === 0 ? (
              <div className="p-4 rounded-lg bg-slate-900/50 border border-dashed border-slate-700 text-center mb-3">
                <Info className="w-5 h-5 text-blue-400 mx-auto mb-1.5" />
                <p className="text-xs font-medium text-slate-200">No companies tracked yet.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Add companies or tickers you cover (e.g. <code>SYNAPTIX</code>, <code>ARANYABANK</code>) to prioritize their disclosures, or load the example watchlist above.
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5 mb-3 p-2.5 bg-slate-950 rounded-lg border border-slate-800 min-h-[44px]">
                {tickers.map(ticker => (
                  <span
                    key={ticker}
                    className="px-2 py-1 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30 font-mono text-xs flex items-center gap-1.5 font-semibold"
                  >
                    <Star className="w-3 h-3 fill-blue-400 text-blue-400" />
                    <span>{ticker}</span>
                    <button
                      onClick={() => handleRemoveTicker(ticker)}
                      className="hover:text-red-400 ml-1 text-sm leading-none"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Add Ticker Input */}
            <form onSubmit={handleAddTicker} className="flex gap-2">
              <input
                type="text"
                placeholder="Add ticker symbol (e.g. SYNAPTIX, VARDHAN)"
                value={newTicker}
                onChange={e => setNewTicker(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono uppercase"
              />
              <button
                type="submit"
                className="flex items-center gap-1 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Ticker
              </button>
            </form>
          </div>

          {/* Focus Catalyst Themes */}
          <div className="border-t border-slate-800 pt-4">
            <span className="font-mono text-xs text-slate-200 uppercase tracking-wider font-semibold block mb-2">
              Focus Catalyst Themes ({keywords.length})
            </span>

            {keywords.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3 p-2 bg-slate-950 rounded border border-slate-800">
                {keywords.map(kw => (
                  <span
                    key={kw}
                    className="px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30 font-mono text-[11px] flex items-center gap-1"
                  >
                    <span>{kw}</span>
                    <button
                      onClick={() => handleRemoveKeyword(kw)}
                      className="hover:text-red-400 ml-1 text-sm leading-none"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            <form onSubmit={handleAddKeyword} className="flex gap-2">
              <input
                type="text"
                placeholder="Add focus keyword (e.g. capex, margin, tender)"
                value={newKeyword}
                onChange={e => setNewKeyword(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono lowercase"
              />
              <button
                type="submit"
                className="flex items-center gap-1 px-3 py-1.5 rounded bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Keyword
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex justify-end shrink-0 bg-[#090d16]">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
