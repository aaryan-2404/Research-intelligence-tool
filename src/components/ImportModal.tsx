import React, { useState } from 'react';
import { 
  X, 
  UploadCloud, 
  FileSpreadsheet, 
  AlertTriangle, 
  CheckCircle2, 
  Table, 
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { ColumnMapping, ResearchItem } from '../types/intelligence';
import { autoDetectColumns, parseCSVString, parseJSONString, processRawRecords } from '../services/ingestionService';
import Papa from 'papaparse';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataImported: (items: ResearchItem[], sourceName: string) => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onDataImported
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState<string>('');
  const [fileType, setFileType] = useState<'csv' | 'json'>('csv');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, any>[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({
    title: '',
    source: '',
    published_at: '',
    url: ''
  });
  const [warnings, setWarnings] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [step, setStep] = useState<'upload' | 'map'>('upload');

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    const isJson = selected.name.endsWith('.json');
    setFileType(isJson ? 'json' : 'csv');

    const reader = new FileReader();
    reader.onload = event => {
      const text = event.target?.result as string;
      setRawText(text);

      if (isJson) {
        try {
          const parsed = JSON.parse(text);
          const rows = Array.isArray(parsed) ? parsed : (parsed.data || [parsed]);
          const detectedHeaders = Object.keys(rows[0] || {});
          setHeaders(detectedHeaders);
          setRawRows(rows.slice(0, 5));
          setMapping(autoDetectColumns(detectedHeaders));
          setStep('map');
        } catch (err: any) {
          setErrors([`JSON Parse Error: ${err.message}`]);
        }
      } else {
        const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
        const detectedHeaders = parsed.meta.fields || [];
        setHeaders(detectedHeaders);
        setRawRows((parsed.data as Record<string, any>[]).slice(0, 5));
        setMapping(autoDetectColumns(detectedHeaders));
        setStep('map');
      }
    };
    reader.readAsText(selected);
  };

  const handleConfirmImport = () => {
    if (fileType === 'json') {
      const res = parseJSONString(rawText, mapping);
      if (res.errors.length > 0) {
        setErrors(res.errors);
        return;
      }
      onDataImported(res.items, file?.name || 'Custom JSON Import');
    } else {
      const res = parseCSVString(rawText, mapping);
      if (res.errors.length > 0) {
        setErrors(res.errors);
        return;
      }
      onDataImported(res.items, file?.name || 'Custom CSV Import');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0d1322] border border-slate-800 rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white font-mono">
                Import Research Dataset (CSV / JSON)
              </h2>
              <p className="text-[11px] text-slate-400">
                Auto-detects columns, normalizes sources, and computes priority scores
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

        {/* Modal Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs">
          {step === 'upload' ? (
            <div className="border-2 border-dashed border-slate-700 hover:border-blue-500/50 rounded-lg p-8 flex flex-col items-center justify-center gap-3 transition-colors text-center cursor-pointer relative bg-slate-900/30">
              <input
                type="file"
                accept=".csv,.json"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <FileSpreadsheet className="w-10 h-10 text-slate-400" />
              <div>
                <p className="font-semibold text-slate-200 text-sm">
                  Click or drag your research dataset here
                </p>
                <p className="text-slate-400 text-xs mt-1">
                  Supports .csv or .json files with headlines, dates, companies, and text
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-mono text-slate-300 pb-2 border-b border-slate-800">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  File Loaded: <strong>{file?.name}</strong>
                </span>
                <button
                  onClick={() => setStep('upload')}
                  className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-[11px]"
                >
                  <RefreshCw className="w-3 h-3" /> Choose Different File
                </button>
              </div>

              {/* Column Mapping Selectors */}
              <div>
                <h3 className="font-mono text-xs text-slate-300 uppercase tracking-wider mb-2 font-semibold">
                  Confirm Column Mapping:
                </h3>
                <div className="grid grid-cols-2 gap-3 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                  {(['title', 'source', 'published_at', 'url', 'ticker', 'company', 'sector', 'category'] as (keyof ColumnMapping)[]).map(field => (
                    <div key={field} className="flex flex-col gap-1">
                      <label className="text-[11px] font-mono text-slate-400 capitalize">
                        {field.replace('_', ' ')}:
                      </label>
                      <select
                        value={mapping[field] || ''}
                        onChange={e => setMapping({ ...mapping, [field]: e.target.value })}
                        className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs font-mono focus:border-blue-500 focus:outline-none"
                      >
                        <option value="">-- None / Default --</option>
                        {headers.map(h => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Live Preview Table */}
              {rawRows.length > 0 && (
                <div>
                  <h3 className="font-mono text-xs text-slate-300 uppercase tracking-wider mb-2 font-semibold flex items-center gap-1.5">
                    <Table className="w-3.5 h-3.5 text-blue-400" />
                    Preview (First {rawRows.length} rows):
                  </h3>
                  <div className="overflow-x-auto border border-slate-800 rounded bg-slate-950 max-h-40">
                    <table className="w-full text-[11px] text-left">
                      <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 font-mono">
                        <tr>
                          <th className="p-2">Title</th>
                          <th className="p-2">Source</th>
                          <th className="p-2">Date</th>
                          <th className="p-2">Ticker</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono">
                        {rawRows.map((r, i) => (
                          <tr key={i}>
                            <td className="p-2 truncate max-w-[200px]">{r[mapping.title] || '-'}</td>
                            <td className="p-2 truncate max-w-[100px]">{r[mapping.source] || '-'}</td>
                            <td className="p-2 truncate max-w-[100px]">{r[mapping.published_at] || '-'}</td>
                            <td className="p-2 truncate max-w-[80px]">{mapping.ticker ? r[mapping.ticker] || '-' : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Errors display */}
          {errors.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/30 p-3 rounded text-red-300 text-xs">
              <div className="flex items-center gap-1.5 font-semibold mb-1">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span>Import Errors:</span>
              </div>
              <ul className="list-disc pl-4 space-y-0.5">
                {errors.map((e, idx) => (
                  <li key={idx}>{e}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between shrink-0 bg-[#090d16]">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>

          {step === 'map' && (
            <button
              onClick={handleConfirmImport}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-sm"
            >
              <span>Import & Score Dataset</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
