import React, { useState } from 'react';
import { 
  X, 
  FileText, 
  Copy, 
  Check, 
  Download, 
  Share2 
} from 'lucide-react';

interface ExecutiveBriefingModalProps {
  isOpen: boolean;
  onClose: () => void;
  markdownContent: string;
}

export const ExecutiveBriefingModal: React.FC<ExecutiveBriefingModalProps> = ({
  isOpen,
  onClose,
  markdownContent
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(markdownContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `morning_briefing_${new Date().toISOString().slice(0, 10)}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0d1322] border border-slate-800 rounded-xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white font-mono">
                Executive Morning Briefing Export
              </h2>
              <p className="text-[11px] text-slate-400">
                Formatted markdown summary of top catalysts ready for Slack or email
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              title="Download as .md file"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .md</span>
            </button>

            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Markdown'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Markdown Content View */}
        <div className="p-5 flex-1 overflow-y-auto bg-slate-950/70 font-mono text-xs text-slate-300 select-text leading-relaxed">
          <pre className="whitespace-pre-wrap">{markdownContent}</pre>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-[#090d16] flex justify-between items-center text-[11px] text-slate-400 font-mono">
          <span>Formatted with GitHub-flavor Markdown and source citations.</span>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white font-sans text-xs px-3 py-1 rounded bg-slate-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
