import React from 'react';
import { FaDownload, FaShareAlt, FaRedo, FaTimes } from 'react-icons/fa';

export default function CapturePreviewModal({ open, src, onClose, onDownload, onShare, onRetake }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 p-6">
      <div className="bg-[var(--bg-card)] border border-[var(--gold-dim)] rounded-lg max-w-3xl w-full overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-[var(--gold-dim)]">
          <div className="text-sm text-[var(--gold-primary)] font-serif uppercase">Capture Preview</div>
          <div className="flex items-center gap-2">
            <button onClick={onRetake} className="lux-btn-outline text-xs flex items-center gap-2"><FaRedo /> Retake</button>
            <button onClick={onClose} className="lux-btn-outline text-xs"><FaTimes /></button>
          </div>
        </div>

        <div className="p-4 flex flex-col gap-4 items-center">
          <img src={src} alt="AR Capture" className="max-h-[70vh] w-auto rounded-md shadow-lg" />
          <div className="flex gap-3 w-full justify-center">
            <button onClick={() => onDownload(src)} className="lux-btn-primary flex items-center gap-2"><FaDownload /> Download</button>
            <button onClick={() => onShare(src)} className="lux-btn-outline flex items-center gap-2"><FaShareAlt /> Share</button>
          </div>
        </div>
      </div>
    </div>
  );
}
