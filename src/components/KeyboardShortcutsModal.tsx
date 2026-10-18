import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: '/', description: 'Focus quick search input' },
    { key: 'j or ↓', description: 'Select next intelligence card' },
    { key: 'k or ↑', description: 'Select previous intelligence card' },
    { key: 'Enter', description: 'Open detail context drawer for selected item' },
    { key: 's', description: 'Bookmark / save selected story' },
    { key: 'Esc', description: 'Close detail drawer or active modal' },
    { key: '?', description: 'Toggle this keyboard shortcut guide' }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0d1322] border border-slate-800 rounded-xl w-full max-w-md flex flex-col shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
              <Keyboard className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-white font-mono">
              Terminal Keyboard Navigation
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-2 text-xs">
          {shortcuts.map((sc, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-1.5 px-2.5 rounded bg-slate-900/60 border border-slate-800/80"
            >
              <span className="text-slate-300">{sc.description}</span>
              <kbd className="px-2 py-0.5 rounded bg-slate-800 text-blue-300 font-mono text-[11px] border border-slate-700 shadow-sm">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="p-3 border-t border-slate-800 bg-[#090d16] flex justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-slate-800 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
