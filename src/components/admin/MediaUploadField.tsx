"use client";

import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, Video, Loader2, CheckCircle2, AlertCircle, Trash2, CloudUpload, Link as LinkIcon } from 'lucide-react';
import { uploadMediaClient } from '@/lib/client-upload';

interface MediaUploadFieldProps {
  label?: string;
  value?: string;
  onChange: (url: string) => void;
  accept?: 'image' | 'video' | 'both';
  folder?: string;
  placeholder?: string;
  description?: string;
}

export function MediaUploadField({
  label = 'Media Faylı',
  value = '',
  onChange,
  accept = 'both',
  folder = 'rubikshop_media',
  placeholder = 'https://... şəkil/video URL-i yapışdırın və ya kompyuterdən fayl yükləyin',
  description,
}: MediaUploadFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const safeValue = value || '';

  const acceptTypes =
    accept === 'image'
      ? 'image/*'
      : accept === 'video'
      ? 'video/*'
      : 'image/*,video/*';

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const res = await uploadMediaClient(file, {
        folder,
        resourceType: file.type.startsWith('video/') ? 'video' : 'image',
      });

      onChange(res.url);
      setSuccess('Fayl Cloudinary-yə uğurla yükləndi! 🚀');
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err?.message || 'Fayl yüklənərkən xəta baş verdi.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUrlUploadToCloudinary = async () => {
    if (!safeValue || (!safeValue.startsWith('http://') && !safeValue.startsWith('https://'))) {
      setError('Lütfən əvvəlcə keçərli bir URL (http:// və ya https://) daxil edin.');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const res = await uploadMediaClient(safeValue, {
        folder,
        resourceType: accept === 'video' ? 'video' : 'image',
      });

      onChange(res.url);
      setSuccess('URL şəkli Cloudinary-yə uğurla köçürüldü! 🚀');
    } catch (err: any) {
      console.error('Url upload error:', err);
      setError(err?.message || 'URL Cloudinary-yə yüklənərkən xəta baş verdi.');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const isBase64 = safeValue.startsWith('data:');
  const isHttpUrl = safeValue.startsWith('http://') || safeValue.startsWith('https://');

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-xs font-black text-slate-400 uppercase tracking-wider">
          {label}
        </label>
      )}

      <div className="space-y-3">
        {/* URL Input & Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={isBase64 ? '✨ [Base64 AI Şəkli / Fayl Data]' : safeValue}
              readOnly={isBase64}
              onChange={(e) => {
                onChange(e.target.value);
                setError('');
                setSuccess('');
              }}
              placeholder={placeholder}
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-amber-500 transition-colors text-xs font-mono"
            />
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept={acceptTypes}
            className="hidden"
          />

          <div className="flex items-center gap-2 shrink-0">
            {/* If user typed a http URL and wants to import it to Cloudinary */}
            {isHttpUrl && !safeValue.includes('cloudinary.com') && (
              <button
                type="button"
                disabled={uploading}
                onClick={handleUrlUploadToCloudinary}
                className="flex items-center gap-1.5 px-3 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all shrink-0 cursor-pointer"
                title="Daxil edilən URL şəkilli Cloudinary-yə köçür"
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <LinkIcon className="w-4 h-4" />
                )}
                <span>Cloudinary-yə Köçür</span>
              </button>
            )}

            {/* Computer file upload button */}
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-black text-xs rounded-xl transition-all shadow-md shadow-amber-500/20 shrink-0 cursor-pointer"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Yüklənir...</span>
                </>
              ) : (
                <>
                  <CloudUpload className="w-4 h-4 text-slate-950" />
                  <span>Fayl Yüklə</span>
                </>
              )}
            </button>

            {safeValue && (
              <button
                type="button"
                onClick={() => {
                  onChange('');
                  setError('');
                  setSuccess('');
                }}
                className="p-2.5 bg-slate-800 hover:bg-red-900/50 text-slate-400 hover:text-red-400 rounded-xl transition-colors shrink-0 border border-slate-700"
                title="Təmizlə"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {description && (
          <p className="text-[11px] text-slate-500">{description}</p>
        )}

        {/* Upload status messages */}
        {success && (
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
