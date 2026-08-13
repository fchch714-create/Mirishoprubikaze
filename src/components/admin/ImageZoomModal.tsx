"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Maximize2, 
  ExternalLink, 
  Copy, 
  Check, 
  Download,
  Image as ImageIcon
} from 'lucide-react';

interface ImageZoomModalProps {
  imageUrl: string | null;
  title?: string;
  onClose: () => void;
}

export function ImageZoomModal({ imageUrl, title = "Şəkil Baxışı", onClose }: ImageZoomModalProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [copied, setCopied] = useState(false);
  const [imageMeta, setImageMeta] = useState<{ width: number; height: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const pushedHistoryRef = useRef<boolean>(false);

  // Manual close function that cleans up history state if pushed
  const handleManualClose = React.useCallback(() => {
    if (pushedHistoryRef.current) {
      pushedHistoryRef.current = false;
      try {
        window.history.back();
      } catch {
        // ignore history back errors
      }
    }
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!imageUrl) return;

    // Reset state when imageUrl changes
    setZoom(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
    setImageMeta(null);

    // Lock body scroll while modal is active
    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Push dummy history state so phone hardware/gesture back button closes modal instead of exiting page
    try {
      window.history.pushState({ imageZoomModalOpen: true }, '');
      pushedHistoryRef.current = true;
    } catch {
      pushedHistoryRef.current = false;
    }

    const handlePopState = () => {
      // User pressed phone back button/gesture
      pushedHistoryRef.current = false;
      onClose();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleManualClose();
      if (e.key === '+' || e.key === '=') setZoom(z => Math.min(z + 0.25, 4));
      if (e.key === '-') setZoom(z => Math.max(z - 0.25, 0.5));
      if (e.key === '0') {
        setZoom(1);
        setPan({ x: 0, y: 0 });
        setRotation(0);
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalStyle;
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [imageUrl, onClose, handleManualClose]);

  if (!imageUrl) return null;

  const handleZoomIn = () => setZoom(z => Math.min(z + 0.25, 4));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.25, 0.5));
  const handleRotate = () => setRotation(r => (r + 90) % 360);
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
  };

  const handleCopyUrl = () => {
    if (!imageUrl) return;
    navigator.clipboard.writeText(imageUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && e.touches.length === 1) {
      setPan({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y
      });
    }
  };

  const handleTouchEnd = () => setIsDragging(false);

  return (
    <div className="fixed inset-0 z-[99999] flex flex-col bg-slate-950/95 backdrop-blur-xl animate-in fade-in duration-200 select-none">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/80 bg-slate-900/90 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white truncate max-w-[200px] sm:max-w-md">{title}</h3>
            {imageMeta && (
              <p className="text-[11px] text-slate-400 font-mono">
                Ölçü: {imageMeta.width} x {imageMeta.height} px • Miqyas: {Math.round(zoom * 100)}%
              </p>
            )}
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Zoom controls */}
          <div className="flex items-center bg-slate-800/80 border border-slate-700/80 rounded-xl p-1 gap-1">
            <button
              onClick={handleZoomOut}
              disabled={zoom <= 0.5}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700/70 disabled:opacity-30 rounded-lg transition-colors"
              title="Kiçilt (-)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            <button
              onClick={handleReset}
              className="px-2 py-1 text-xs font-mono font-bold text-amber-400 hover:bg-slate-700/70 rounded-lg transition-colors"
              title="Sıfırla (0)"
            >
              {Math.round(zoom * 100)}%
            </button>

            <button
              onClick={handleZoomIn}
              disabled={zoom >= 4}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700/70 disabled:opacity-30 rounded-lg transition-colors"
              title="Böyüt (+)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Rotation */}
          <button
            onClick={handleRotate}
            className="p-2 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-slate-300 hover:text-white rounded-xl transition-colors"
            title="Döndər 90°"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Copy URL */}
          <button
            onClick={handleCopyUrl}
            className="p-2 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-slate-300 hover:text-white rounded-xl transition-colors relative"
            title="Şəkil URL-ni Kopyala"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>

          {/* Open original */}
          <a
            href={imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-slate-300 hover:text-white rounded-xl transition-colors"
            title="Orijinal Ölçüdə Yeni Səhifədə Aç"
          >
            <ExternalLink className="w-4 h-4" />
          </a>

          {/* Close button */}
          <button
            onClick={handleManualClose}
            className="p-2 bg-red-950/80 hover:bg-red-900 border border-red-800/80 text-red-300 rounded-xl transition-colors ml-1"
            title="Bağla (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image Viewer Stage */}
      <div 
        ref={containerRef}
        onClick={(e) => {
          if (e.target === containerRef.current) {
            handleManualClose();
          }
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`flex-1 relative flex items-center justify-center overflow-hidden p-4 sm:p-8 ${
          zoom > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
        }`}
      >
        <div 
          className="transition-transform duration-100 ease-out flex items-center justify-center max-w-full max-h-full"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)`
          }}
        >
          {/* eslint-disable-next-html-element-suppression */}
          <img
            src={imageUrl}
            alt={title}
            onLoad={(e) => {
              const img = e.currentTarget;
              setImageMeta({ width: img.naturalWidth, height: img.naturalHeight });
            }}
            className="max-w-[90vw] max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-slate-800 pointer-events-none select-none"
            crossOrigin="anonymous"
          />
        </div>

        {/* Floating guide hint */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-900/90 border border-slate-800 px-4 py-1.5 rounded-full text-[11px] text-slate-400 font-mono flex items-center gap-2 pointer-events-none shadow-lg">
          <span>💡 Şəkli böyütmək/kiçiltmək üçün düymələrdən istifadə edin • Yerdəyişmə üçün sürükləyin</span>
        </div>
      </div>
    </div>
  );
}
