'use client';
import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Upload, Download, CheckCircle2, XCircle, AlertCircle, ArrowLeft, FileText, X } from 'lucide-react';
import { productsApi } from '@/lib/api';
import toast from 'react-hot-toast';

interface UploadResult {
  row: number;
  name: string;
  sku?: string;
  id?: number;
  status: 'success' | 'error' | 'skipped';
  message?: string;
}

interface UploadResponse {
  created: number;
  failed: number;
  total: number;
  results: UploadResult[];
}

export default function BulkUploadPage() {
  const [file, setFile]           = useState<File | null>(null);
  const [dragging, setDragging]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress]   = useState(0);
  const [response, setResponse]   = useState<UploadResponse | null>(null);
  const [filter, setFilter]       = useState<'all' | 'success' | 'error'>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Drag & drop ───────────────────────────────────────────────────────
  const onDragOver  = (e: React.DragEvent) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);
  const onDrop      = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f?.name.toLowerCase().endsWith('.csv')) { setFile(f); setResponse(null); }
    else toast.error('Please drop a .csv file');
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setFile(f); setResponse(null); }
  };

  // ── Download template ─────────────────────────────────────────────────
  const downloadTemplate = async () => {
    try {
      const res = await productsApi.csvTemplate();
      const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
      const a   = document.createElement('a');
      a.href    = url;
      a.download = 'saq_bulk_template.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download template');
    }
  };

  // ── Upload ────────────────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setProgress(0);
    setResponse(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await productsApi.bulkUpload(formData, (pct) => setProgress(pct));
      setResponse(res.data);
      if (res.data.created > 0) toast.success(`${res.data.created} product${res.data.created > 1 ? 's' : ''} created!`);
      if (res.data.failed  > 0) toast.error(`${res.data.failed} row${res.data.failed > 1 ? 's' : ''} failed`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Upload failed';
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const reset = () => { setFile(null); setResponse(null); setProgress(0); if (inputRef.current) inputRef.current.value = ''; };

  const filtered = response?.results.filter(r => filter === 'all' || r.status === filter) ?? [];

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-4xl">

      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/vendor/products"
          className="p-2 rounded-xl glass hover:bg-white/10 text-white/50 hover:text-white transition-colors">
          <ArrowLeft size={16}/>
        </Link>
        <div>
          <h2 className="text-2xl font-black text-white">Bulk Product Upload</h2>
          <p className="text-sm text-white/50 mt-0.5">Upload up to 200 products at once via CSV</p>
        </div>
      </div>

      {/* Instructions + template download */}
      <div className="glass-card p-5 border border-indigo-500/20 bg-indigo-500/5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-white">CSV Format</p>
            <div className="flex flex-wrap gap-2">
              {['name *', 'price *', 'stock *', 'description', 'discount_price', 'category_id', 'sku'].map(col => (
                <span key={col} className={`text-xs font-mono px-2 py-0.5 rounded-full ${col.endsWith('*') ? 'bg-red-500/20 text-red-300' : 'bg-white/10 text-white/60'}`}>
                  {col}
                </span>
              ))}
            </div>
            <p className="text-xs text-white/40">
              <span className="text-red-300">*</span> required &nbsp;·&nbsp;
              Leave <span className="font-mono text-white/60">sku</span> blank for auto-generation &nbsp;·&nbsp;
              Max 200 rows
            </p>
          </div>
          <button onClick={downloadTemplate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 transition-colors text-sm font-semibold shrink-0">
            <Download size={14}/> Download Template
          </button>
        </div>
      </div>

      {/* Drop zone */}
      {!response && (
        <div
          onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
          onClick={() => !file && inputRef.current?.click()}
          className={`glass-card p-10 border-2 border-dashed transition-all text-center cursor-pointer
            ${dragging ? 'border-emerald-400/60 bg-emerald-500/10' : 'border-white/15 hover:border-white/30'}
            ${file ? 'cursor-default' : ''}`}>

          <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={onFileChange}/>

          <AnimatePresence mode="wait">
            {!file ? (
              <motion.div key="empty" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mx-auto">
                  <Upload size={24} className="text-white/30"/>
                </div>
                <p className="text-white/60 text-sm">Drag & drop your CSV file here, or <span className="text-indigo-400 underline underline-offset-2">click to browse</span></p>
                <p className="text-white/30 text-xs">Only .csv files accepted</p>
              </motion.div>
            ) : (
              <motion.div key="file" initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} exit={{opacity:0}} className="space-y-4">
                <div className="flex items-center justify-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <FileText size={18} className="text-emerald-400"/>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-white">{file.name}</p>
                    <p className="text-xs text-white/40">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); reset(); }}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors ml-2">
                    <X size={14}/>
                  </button>
                </div>

                {/* Progress bar */}
                {uploading && (
                  <div className="space-y-1.5 max-w-xs mx-auto">
                    <div className="flex justify-between text-xs text-white/50">
                      <span>Uploading…</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                        animate={{ width: `${progress}%` }}
                        transition={{ ease: 'linear', duration: 0.2 }}
                      />
                    </div>
                    {progress === 100 && (
                      <p className="text-xs text-white/40 text-center">Processing rows…</p>
                    )}
                  </div>
                )}

                {!uploading && (
                  <button onClick={(e) => { e.stopPropagation(); handleUpload(); }}
                    className="btn-primary px-8 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 mx-auto">
                    <Upload size={15}/> Upload & Create Products
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Results */}
      <AnimatePresence>
        {response && (
          <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} className="space-y-4">

            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="glass-card p-4 bg-gradient-to-br from-emerald-500/15 to-teal-500/15 border border-emerald-500/20">
                <p className="text-xs text-white/50 uppercase tracking-wider mb-1">Created</p>
                <p className="text-3xl font-black text-emerald-400">{response.created}</p>
              </div>
              <div className="glass-card p-4 bg-gradient-to-br from-red-500/15 to-rose-500/15 border border-red-500/20">
                <p className="text-xs text-white/50 uppercase tracking-wider mb-1">Failed</p>
                <p className="text-3xl font-black text-red-400">{response.failed}</p>
              </div>
              <div className="glass-card p-4 bg-gradient-to-br from-white/5 to-white/10">
                <p className="text-xs text-white/50 uppercase tracking-wider mb-1">Total Rows</p>
                <p className="text-3xl font-black text-white">{response.total}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex gap-2">
                {(['all', 'success', 'error'] as const).map(f => (
                  <button key={f} onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors
                      ${filter === f ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white hover:bg-white/10'}`}>
                    {f === 'all' ? `All (${response.total})` : f === 'success' ? `Success (${response.created})` : `Errors (${response.failed})`}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={reset}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-white/10 text-white/60 hover:text-white hover:bg-white/15 transition-colors">
                  Upload Another
                </button>
                <Link href="/vendor/products"
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold btn-primary">
                  View Products →
                </Link>
              </div>
            </div>

            {/* Results table */}
            <div className="glass-card overflow-hidden">
              <table className="glass-table w-full">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left w-12">Row</th>
                    <th className="px-4 py-3 text-left">Product Name</th>
                    <th className="px-4 py-3 text-left">SKU</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.row} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                      <td className="px-4 py-3 text-white/40 text-xs font-mono">{r.row}</td>
                      <td className="px-4 py-3 text-sm text-white font-medium">{r.name || '—'}</td>
                      <td className="px-4 py-3">
                        {r.sku
                          ? <span className="font-mono text-xs text-white/70 bg-white/5 px-2 py-0.5 rounded">{r.sku}</span>
                          : <span className="text-white/20 text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {r.status === 'success'  && <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold"><CheckCircle2 size={13}/> Created</span>}
                        {r.status === 'error'    && <span className="flex items-center gap-1.5 text-red-400 text-xs font-semibold"><XCircle size={13}/> Failed</span>}
                        {r.status === 'skipped'  && <span className="flex items-center gap-1.5 text-amber-400 text-xs font-semibold"><AlertCircle size={13}/> Skipped</span>}
                      </td>
                      <td className="px-4 py-3 text-xs text-white/40">{r.message || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <p className="text-center text-white/30 text-sm py-8">No rows to show</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
