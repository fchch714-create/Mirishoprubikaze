"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Calendar, ArrowLeft, Sparkles, AlertCircle } from 'lucide-react';

interface BlogPost {
  id: string;
  slug: string;
  title_az: string;
  title_en: string;
  title_ru: string;
  content_az: string;
  content_en: string;
  content_ru: string;
  featured_image: string | null;
  created_at: string;
}

export default function BlogDetailPage({ params }: { params: { locale: string; slug: string } }) {
  const resolvedParams = params && typeof (params as any).then === 'function' ? React.use(params as any) as any : params;
  const locale = resolvedParams?.locale || 'az';
  const slug = resolvedParams?.slug || '';

  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPost() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .single();
      
      if (!error && data) {
        setPost(data as BlogPost);
      }
      setLoading(false);
    }
    loadPost();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center font-bold">
        Yüklənir...
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-16 h-16 text-amber-500 mb-4 animate-bounce" />
        <h1 className="text-2xl font-black uppercase text-white tracking-wider">Məqalə Tapılmadı</h1>
        <p className="text-slate-400 mt-2 max-w-sm text-sm">
          Bu məqalə mövcud deyil və ya yayımdan çıxarılıb.
        </p>
      </div>
    );
  }

  const title = post[`title_${locale}` as keyof BlogPost] || post.title_az;
  const content = post[`content_${locale}` as keyof BlogPost] || post.content_az;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-16 px-4 sm:px-6 lg:px-8">
      <article className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
        
        <div>
          <Link 
            href={`/${locale}/blog`}
            className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider text-slate-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Bloqa Geri Dön
          </Link>
        </div>

        <div className="space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-xs font-black text-amber-500 uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" /> Məqalə
          </div>
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-wider text-white leading-tight">
            {String(title)}
          </h1>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500 pt-2">
            <Calendar className="w-4 h-4" />
            <span>Yayımlanma tarixi: {new Date(post.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        {post.featured_image && (
          <div className="rounded-3xl overflow-hidden border border-slate-800 bg-slate-950 max-h-[400px]">
            <img 
              src={post.featured_image} 
              alt={String(title)}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div 
          className="prose prose-invert prose-amber max-w-none text-slate-300 leading-relaxed text-base whitespace-pre-line pt-6"
          dangerouslySetInnerHTML={{ __html: String(content) }}
        />

      </article>
    </div>
  );
}
