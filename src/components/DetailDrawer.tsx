import React, { useState } from 'react';
import { 
  X, 
  FileText, 
  Bookmark, 
  BookmarkCheck, 
  FileCode,
  ShieldAlert,
  Copy,
  Check,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { StoryCluster, AnalystNote } from '../types/intelligence';
import { formatCardDate, getScoreColor, formatSourceCount } from '../utils/formatters';

interface DetailDrawerProps {
  cluster: StoryCluster | null;
  isSaved: boolean;
  note?: AnalystNote;
  mode?: 'docked' | 'drawer';
  onClose: () => void;
  onToggleSave: () => void;
  onUpdateNote: (content: string) => void;
}

// Highlight financial numbers and deal catalysts in regulatory text
const highlightCatalysts = (text: string) => {
  if (!text) return null;
  const regex = /(\$[\d,.]+(?:\s*(?:billion|million|bn|mn|M|B|K))?|₹\s*[\d,.]+(?:\s*(?:Cr|Crore|Lakh|mn|bn))?|\b\d+(?:\.\d+)?%|\b(?:cash consideration|acquisition|acquired|merger|capex|credit rating|downgraded?|upgraded?|default|lawsuit|investigation|clearance|Phase[- ]3|FDA approval|guidance lift|guidance cut|restructuring|all-cash|EBITDA|FY26|FY27)\b)/gi;
  const parts = text.split(regex);
  return parts.map((part, idx) => {
    if (part.match(regex)) {
      return (
        <mark
          key={idx}
          className="bg-amber-400/20 text-amber-200 border border-amber-500/30 px-1 py-0.5 rounded font-mono font-medium text-[11px]"
        >
          {part}
        </mark>
      );
    }
    return <span key={idx}>{part}</span>;
  });
};

export const DetailDrawer: React.FC<DetailDrawerProps> = ({
  cluster,
  isSaved,
  note,
  mode = 'drawer',
  onClose,
  onToggleSave,
  onUpdateNote
}) => {
  const [noteText, setNoteText] = useState(note?.content || '');
  const [saveStatus, setSaveStatus] = useState<string>('');
  const [copyStatus, setCopyStatus] = useState(false);
  const [showSourceDocModal, setShowSourceDocModal] = useState(false);

  // Sync note on item change
  React.useEffect(() => {
    setNoteText(note?.content || '');
    setSaveStatus('');
  }, [cluster?.primaryItem.id, note]);

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setNoteText(val);
    onUpdateNote(val);
    setSaveStatus('Saved locally');
    setTimeout(() => setSaveStatus(''), 2500);
  };

  const insertTemplate = (snippet: string) => {
    const updated = noteText ? `${noteText}\n${snippet}` : snippet;
    setNoteText(updated);
    onUpdateNote(updated);
    setSaveStatus('Saved locally');
    setTimeout(() => setSaveStatus(''), 2500);
  };

  const copyToClipboard = () => {
    if (!cluster) return;
    const item = cluster.primaryItem;
    const text = `[RESEARCH RADAR BRIEFING]\nTicker: ${item.ticker || 'N/A'}\nTitle: ${item.title}\nSource: ${item.source} (${formatCardDate(item.published_at)})\nScore: ${item.score.total}/100 (${item.score.tier})\n\nExcerpt:\n${item.summary}\n\nNotes:\n${noteText || 'None'}`;
    navigator.clipboard.writeText(text);
    setCopyStatus(true);
    setTimeout(() => setCopyStatus(false), 2000);
  };

  // If no cluster selected:
  if (!cluster) {
    if (mode === 'docked') {
      return (
        <aside className="hidden lg:flex w-[460px] xl:w-[500px] bg-[#0E1117] border-l border-[#232834] flex-col h-full shrink-0 select-text items-center justify-center p-8 text-center text-slate-400 z-20">
          <div className="w-12 h-12 rounded bg-[#181B22] border border-[#2A303C] flex items-center justify-center text-slate-400 mb-3">
            <FileText className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-semibold text-slate-200 font-mono">Select a Disclosure</h4>
          <p className="text-xs text-slate-400 max-w-xs mt-1.5 leading-relaxed">
            Click any story card or press <kbd className="px-1.5 py-0.5 rounded bg-[#181B22] border border-[#2A303C] font-mono text-[10px] text-slate-300">j / k</kbd> to inspect the statutory filing, auditable score ledger, and attach private analyst notes.
          </p>
        </aside>
      );
    }
    return null;
  }

  const item = cluster.primaryItem;
  const scoreStyle = getScoreColor(item.score.total);

  const containerClasses = mode === 'docked'
    ? "hidden lg:flex w-[460px] xl:w-[520px] bg-[#0E1117] border-l border-[#232834] flex-col h-full shrink-0 select-text overflow-hidden z-20"
    : "fixed inset-y-0 right-0 w-full sm:w-[520px] lg:w-[580px] bg-[#0E1117] border-l border-[#232834] shadow-2xl z-40 flex flex-col h-full animate-in slide-in-from-right duration-200 select-text";

  return (
    <>
      <aside className={containerClasses}>
        {/* Pane Header: Identity & Statutory File Marker */}
        <div className="p-3 border-b border-[#232834] bg-[#14171F] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            {item.ticker ? (
              <span className="px-2 py-0.5 rounded text-xs font-bold font-mono bg-[#1E293B] text-blue-300 border border-[#334155]">
                ${item.ticker}
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-xs font-mono bg-[#181B22] text-slate-400 border border-[#2A303C]">
                MACRO
              </span>
            )}
            <span className="text-xs text-slate-300 font-mono truncate max-w-[190px]">
              {item.company || item.sector}
            </span>
            <span className="text-[10px] text-slate-400 font-mono hidden xl:inline">
              | {item.source_path || `RF${item.id}.txt`}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Copy to Briefing Button */}
            <button
              onClick={copyToClipboard}
              title="Copy disclosure summary to clipboard"
              className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-[#1E222B] border border-transparent hover:border-[#2A303C] transition-colors"
            >
              {copyStatus ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            {/* Bookmark Button */}
            <button
              onClick={onToggleSave}
              title={isSaved ? 'Remove bookmark' : 'Bookmark item (s)'}
              className={`p-1.5 rounded border transition-colors ${
                isSaved 
                  ? 'text-amber-400 bg-amber-500/10 border-amber-500/30' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#1E222B] border-transparent hover:border-[#2A303C]'
              }`}
            >
              {isSaved ? <BookmarkCheck className="w-3.5 h-3.5 fill-amber-400/20" /> : <Bookmark className="w-3.5 h-3.5" />}
            </button>

            {/* Close Button (Only shown in drawer overlay mode) */}
            {mode === 'drawer' && (
              <button
                onClick={onClose}
                title="Close drawer (Esc)"
                className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-[#1E222B] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-slate-200">
          {/* Entity Mismatch Warning Banner */}
          {item.has_entity_mismatch && (
            <div className="bg-amber-950/40 border border-amber-700/60 rounded-md p-3 text-amber-300 text-xs flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-xs mb-0.5">Entity Mismatch Detected:</p>
                <p className="text-[11px] text-amber-200/90 leading-relaxed">{item.mismatch_details}</p>
                <p className="text-[10px] text-amber-400/80 mt-1 font-mono">
                  *Watchlist scoring boost is strictly withheld for conflicting records.
                </p>
              </div>
            </div>
          )}

          {/* Title & Metadata Strip */}
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mb-1.5">
              <span className="text-blue-300 font-semibold">{item.source}</span>
              <span className="text-slate-600">•</span>
              <span>{formatCardDate(item.published_at)}</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-300">{item.category}</span>
            </div>

            <h2 className="text-sm font-bold text-white leading-snug mb-3">
              {item.title}
            </h2>

            {/* Action Bar: View Source Document & Original Filing Link */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSourceDocModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold text-slate-200 bg-[#181B22] hover:bg-[#1E222B] border border-[#2A303C] hover:border-slate-600 transition-colors shadow-sm font-mono"
              >
                <FileCode className="w-3.5 h-3.5 text-blue-400" />
                <span>View Raw Statutory Filing</span>
              </button>

              <button
                onClick={copyToClipboard}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-mono text-slate-400 hover:text-slate-200 bg-[#14171F] hover:bg-[#181B22] border border-[#232834] transition-colors"
              >
                {copyStatus ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copyStatus ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* 4-FACTOR SCORECARD LEDGER TABLE (Defensible & Transparent) */}
          <div className="bg-[#121620] border border-[#232834] rounded-md overflow-hidden text-xs font-mono">
            <div className="px-3 py-2 bg-[#161B26] border-b border-[#232834] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-200 tracking-wider uppercase text-[11px]">
                  4-Factor Scorecard Ledger
                </span>
                <span className="text-[10px] text-slate-400 hidden sm:inline">· Auditable Weights</span>
              </div>
              <span className={`px-2 py-0.5 rounded text-xs font-bold border ${scoreStyle.bg} ${scoreStyle.text} ${scoreStyle.border}`}>
                {item.score.total} / 100 PTS
              </span>
            </div>

            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="border-b border-[#232834] text-slate-400 bg-[#0F131C] text-[10px] uppercase tracking-wider">
                  <th className="py-1.5 px-3 font-medium">Factor</th>
                  <th className="py-1.5 px-2 font-medium text-right">Score</th>
                  <th className="py-1.5 px-2 font-medium text-right">Max</th>
                  <th className="py-1.5 px-2 font-medium text-right">Weight</th>
                  <th className="py-1.5 px-3 font-medium">Driver Rationale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1D2330] text-slate-300">
                <tr>
                  <td className="py-2 px-3 text-slate-200 font-medium flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    Recency Decay
                  </td>
                  <td className="py-2 px-2 text-right font-bold text-blue-300">{item.score.recency}</td>
                  <td className="py-2 px-2 text-right text-slate-400">30</td>
                  <td className="py-2 px-2 text-right text-slate-400">30%</td>
                  <td className="py-2 px-3 text-slate-300 text-[10px] truncate max-w-[160px]" title="Decay relative to dataset anchor date">
                    Anchor Decay
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-slate-200 font-medium flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Impact Severity
                  </td>
                  <td className="py-2 px-2 text-right font-bold text-emerald-300">{item.score.impact}</td>
                  <td className="py-2 px-2 text-right text-slate-400">35</td>
                  <td className="py-2 px-2 text-right text-slate-400">35%</td>
                  <td className="py-2 px-3 text-slate-300 text-[10px] truncate max-w-[160px]" title={item.category}>
                    {item.category} ({item.score.direction || 'neutral'})
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-slate-200 font-medium flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    Corroboration
                  </td>
                  <td className="py-2 px-2 text-right font-bold text-purple-300">{item.score.corroboration}</td>
                  <td className="py-2 px-2 text-right text-slate-400">20</td>
                  <td className="py-2 px-2 text-right text-slate-400">20%</td>
                  <td className="py-2 px-3 text-slate-300 text-[10px] truncate max-w-[160px]" title={formatSourceCount(cluster.totalReportsCount, cluster.totalSourcesCount)}>
                    {formatSourceCount(cluster.totalReportsCount, cluster.totalSourcesCount)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-slate-200 font-medium flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    Watchlist Boost
                  </td>
                  <td className="py-2 px-2 text-right font-bold text-amber-300">{item.score.watchlist}</td>
                  <td className="py-2 px-2 text-right text-slate-400">15</td>
                  <td className="py-2 px-2 text-right text-slate-400">15%</td>
                  <td className="py-2 px-3 text-slate-300 text-[10px] truncate max-w-[160px]">
                    {item.score.watchlist > 0 ? 'Active Coverage Match' : 'Universe Neutral'}
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="border-t border-[#232834] bg-[#161B26] font-semibold text-slate-200">
                  <td className="py-2 px-3 font-bold text-[11px] text-white">TOTAL AUDIT SCORE</td>
                  <td className="py-2 px-2 text-right font-bold text-emerald-400">{item.score.total}</td>
                  <td className="py-2 px-2 text-right text-slate-400">100</td>
                  <td className="py-2 px-2 text-right text-slate-400">100%</td>
                  <td className="py-2 px-3 text-[10px] uppercase tracking-wider text-slate-300">
                    Tier: <span className="text-white font-bold">{item.score.tier}</span>
                  </td>
                </tr>
              </tfoot>
            </table>

            {item.score.reasons.length > 0 && (
              <div className="p-2.5 bg-[#0D1017] border-t border-[#232834] text-[10px] text-slate-400 space-y-1">
                <div className="font-semibold text-slate-400 uppercase tracking-wider text-[9px]">Decision Drivers:</div>
                <ul className="space-y-0.5 list-disc pl-3.5">
                  {item.score.reasons.map((r, i) => (
                    <li key={i} className="text-slate-300 leading-normal">{r}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Statutory Disclosure Excerpt with Financial Term Scanning */}
          <div className="bg-[#121620] rounded-md p-3.5 border border-[#232834]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-slate-300 font-mono uppercase tracking-wider">
                Statutory Excerpt & Catalyst Hits
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">
                Source Document: {item.source_path || `RF${item.id}.txt`}
              </span>
            </div>
            <div className="text-xs text-slate-200 leading-relaxed font-sans select-text">
              {highlightCatalysts(item.summary || item.content)}
            </div>
          </div>

          {/* Clustered Coverage Section */}
          {cluster.relatedItems.length > 0 && (
            <div className="bg-[#121620] rounded-md p-3.5 border border-[#232834]">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-slate-300 font-mono uppercase tracking-wider">
                  Corroborating Disclosures
                </h3>
                <span className="text-[10px] text-emerald-400 font-mono">
                  {formatSourceCount(cluster.totalReportsCount, cluster.totalSourcesCount)}
                </span>
              </div>
              <div className="space-y-2 text-xs">
                {cluster.relatedItems.map(rel => (
                  <div key={rel.id} className="p-2.5 rounded bg-[#0A0D13] border border-[#232834]/80">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mb-1">
                      <span className="text-blue-300 font-semibold">{rel.source}</span>
                      <span>{formatCardDate(rel.published_at)}</span>
                    </div>
                    <p className="text-xs text-slate-200 leading-snug">{rel.title}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Analyst Investment Thesis Notes Dock */}
          <div className="bg-[#121620] rounded-md p-3.5 border border-[#232834]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-slate-300 font-mono uppercase tracking-wider">
                Analyst Thesis & Private Notes
              </h3>
              {saveStatus && (
                <span className="text-[10px] text-emerald-400 font-mono">{saveStatus}</span>
              )}
            </div>

            {/* Quick Templates */}
            <div className="flex items-center gap-1.5 mb-2 overflow-x-auto pb-1 text-[11px] font-mono">
              <span className="text-slate-400 text-[10px]">Insert:</span>
              <button
                onClick={() => insertTemplate('[Thesis Impact]: ')}
                className="px-2 py-0.5 rounded bg-[#181B22] hover:bg-[#1E222B] text-slate-300 border border-[#2A303C] transition-colors"
              >
                Thesis
              </button>
              <button
                onClick={() => insertTemplate('[Key Risks]: ')}
                className="px-2 py-0.5 rounded bg-[#181B22] hover:bg-[#1E222B] text-slate-300 border border-[#2A303C] transition-colors"
              >
                Risks
              </button>
              <button
                onClick={() => insertTemplate('[Monitorables]: ')}
                className="px-2 py-0.5 rounded bg-[#181B22] hover:bg-[#1E222B] text-slate-300 border border-[#2A303C] transition-colors"
              >
                Monitorables
              </button>
            </div>

            <textarea
              value={noteText}
              onChange={handleNoteChange}
              placeholder="Attach private investment thesis notes or monitorables (persists locally)..."
              className="w-full h-24 bg-[#0A0D13] border border-[#2A303C] rounded p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-500 font-sans resize-none"
            />
          </div>
        </div>
      </aside>

      {/* Raw Statutory Document Viewer Modal */}
      {showSourceDocModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0E1117] border border-[#2A303C] rounded-lg max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-[#232834] flex items-center justify-between bg-[#14171F]">
              <div>
                <h3 className="font-semibold text-white text-sm font-mono flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-blue-400" />
                  <span>Statutory Source Filing: {item.source_path || `RF${item.id}.txt`}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">
                  Source: {item.source} • Document ID: {item.id}
                </p>
              </div>
              <button
                onClick={() => setShowSourceDocModal(false)}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-[#1E222B] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto font-mono text-xs text-slate-300 space-y-4">
              <div className="grid grid-cols-2 gap-3 p-3 bg-[#121620] rounded border border-[#232834] text-[11px]">
                <div><span className="text-slate-400">Published:</span> <strong className="text-white">{formatCardDate(item.published_at)}</strong></div>
                <div><span className="text-slate-400">Category:</span> <strong className="text-white">{item.category}</strong></div>
                <div><span className="text-slate-400">Company:</span> <strong className="text-white">{item.company || 'Macro'}</strong></div>
                <div><span className="text-slate-400">Ticker:</span> <strong className="text-white">{item.ticker || 'N/A'}</strong></div>
              </div>

              <div>
                <h4 className="text-slate-400 uppercase tracking-wider text-[11px] mb-2 font-semibold">
                  Original Statutory Document Content:
                </h4>
                <div className="bg-[#0A0D13] p-4 rounded border border-[#232834] whitespace-pre-wrap leading-relaxed text-slate-200 select-text font-mono text-xs">
                  {highlightCatalysts(item.raw_document || item.content)}
                </div>
              </div>
            </div>

            <div className="p-3 border-t border-[#232834] bg-[#14171F] flex justify-end">
              <button
                onClick={() => setShowSourceDocModal(false)}
                className="px-4 py-1.5 rounded bg-[#181B22] hover:bg-[#1E222B] border border-[#2A303C] text-xs font-semibold text-slate-200 transition-colors"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
