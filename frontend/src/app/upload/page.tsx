'use client';
import { useState, useCallback, useEffect } from 'react';
import Shell from '@/components/Shell';
import { api } from '@/lib/api';
import { Upload as UploadIcon, FileText, CheckCircle, AlertCircle, X } from 'lucide-react';

export default function UploadPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [clientId, setClientId] = useState<string>('');

  const loadHistory = useCallback(async () => {
    try {
      const res = await api.getUploads();
      setHistory(res.documents || []);
      const clRes = await api.getClients();
      setClients(clRes.clients || []);
    } catch (e) {
      console.error("Failed to load upload history", e);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const dropped = Array.from(e.dataTransfer.files);
    setFiles(prev => [...prev, ...dropped]);
  }, []);

  const handleUpload = async () => {
    if (files.length === 0) return;
    if (!clientId) return setError('Please select a client first.');
    
    setUploading(true);
    setError('');
    try {
      const res = await api.uploadFiles(files, clientId);
      setResult(res);
      setFiles([]);
      loadHistory();
    } catch (e: any) {
      setError(e.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Shell>
      <div className="animate-in">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Upload Documents</h1>
          <p className="text-sm text-[var(--text-tertiary)] mt-1">Upload invoices, bank statements, Tally exports</p>
        </div>

        {/* Drop zone */}
        <div className="mb-4">
          <select className="input max-w-xs" value={clientId} onChange={e => setClientId(e.target.value)}>
             <option value="">Select a Client</option>
             {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div
          className={`card border-dashed border-2 text-center py-16 cursor-pointer transition-colors ${
            dragActive ? 'border-[var(--accent)] bg-[var(--bg-tertiary)]' : 'border-[var(--border)]'
          }`}
          onDragOver={e => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <UploadIcon size={40} className="mx-auto text-[var(--text-tertiary)] mb-4" />
          <p className="text-[var(--text-secondary)] font-medium">Drop files here or click to browse</p>
          <p className="text-xs text-[var(--text-tertiary)] mt-2">PDF, Excel, CSV, Images, XML (Tally)</p>
          <input
            id="file-input"
            type="file"
            multiple
            accept=".pdf,.png,.jpg,.jpeg,.tiff,.xlsx,.xls,.csv,.xml"
            className="hidden"
            onChange={e => setFiles(prev => [...prev, ...Array.from(e.target.files || [])])}
          />
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div className="card mt-4">
            <h3 className="text-sm font-semibold mb-3">{files.length} file{files.length !== 1 ? 's' : ''} selected</h3>
            <div className="space-y-2">
              {files.map((f, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-[var(--bg-tertiary)] last:border-0">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-[var(--text-tertiary)]" />
                    <span className="text-sm">{f.name}</span>
                    <span className="text-xs text-[var(--text-tertiary)]">{(f.size / 1024).toFixed(1)} KB</span>
                  </div>
                  <button className="btn-ghost" onClick={() => removeFile(i)}><X size={14} /></button>
                </div>
              ))}
            </div>
            <button className="btn btn-primary mt-4" onClick={handleUpload} disabled={uploading}>
              {uploading ? 'Uploading...' : `Upload ${files.length} file${files.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        )}

        {error && (
          <div className="card mt-4 border-red-200 bg-red-50">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle size={16} />
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {result && (
          <div className="card mt-4 animate-in">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle size={18} className="text-[var(--success)]" />
              <h3 className="text-sm font-semibold">Upload Complete</h3>
            </div>
            <p className="text-sm text-[var(--text-secondary)]">
              {result.files_count} file{result.files_count !== 1 ? 's' : ''} uploaded successfully.
              Start a workflow to process them.
            </p>
            <div className="mt-4 space-y-2">
              {result.documents && result.documents.map((doc: any) => (
                <div key={doc.id} className="flex items-center justify-between p-3 bg-[var(--bg-tertiary)] rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText size={18} className="text-[var(--text-secondary)]" />
                    <div>
                      <p className="text-sm font-medium">{doc.filename}</p>
                      <p className="text-xs text-[var(--text-tertiary)]">id: {doc.id.split('-')[0]}</p>
                    </div>
                  </div>
                  <span className="badge badge-success capitalize">{doc.status || 'Success'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {history.length > 0 && (
          <div className="card mt-8 animate-in delay-100">
            <h3 className="text-sm font-semibold mb-4">Upload History</h3>
            <div className="space-y-2">
              {history.map((doc: any) => (
                <div key={doc.id} className="flex items-center justify-between py-2 border-b border-[var(--bg-tertiary)] last:border-0">
                  <div className="flex items-center gap-3">
                    <FileText size={16} className="text-[var(--text-tertiary)]" />
                    <div>
                      <p className="text-sm font-medium">{doc.filename}</p>
                      <p className="text-xs text-[var(--text-tertiary)]">{new Date(doc.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <span className={`badge ${doc.status === 'failed' ? 'badge-danger' : doc.status === 'extracted' ? 'badge-success' : 'badge-warning'} capitalize`}>
                    {doc.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}
