"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { BookOpen, Calendar, ArrowRight, Sparkles } from 'lucide-react';

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

export default function BlogListingPage({ params }: { params: { locale: string } }) {
  const resolvedParams = params && typeof (params as any).then === 'function' ? React.use(params as any) as any : params;
  const locale = resolvedParams?.locale || 'az';

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPosts() {
      const supabase = createClient();
      const { data } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });
      
      setPosts((data || []) as BlogPost[]);
      setLoading(false);
    }
    loadPosts();
  }, []);

  const getLocalized = (post: BlogPost, field: 'title' | 'content') => {
    const key = `${field}_${locale}` as keyof BlogPost;
    return post[key] || post[`${field}_az` as keyof BlogPost] || '';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-300">
        
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-xs font-black text-amber-500 uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" /> Bloq & Xəbərlər
          </div>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-wider text-white">
            Kubik Bloq
          </h1>
          <p className="text-slate-400 text-sm">
            Rubik kubu yığma metodları, dünya rekordları, yeni professional kubların icmalları və speedcubing haqqında ən son xəbərlər.
          </p>
        </div>

        {loading ? (
          <div className="text-center text-slate-400 py-12 font-bold">Yüklənir...</div>
        ) : posts.length === 0 ? (
          <div className="text-center bg-slate-900 border border-slate-800 rounded-3xl p-12 space-y-3 max-w-md mx-auto">
            <BookOpen className="w-10 h-10 text-amber-500 mx-auto opacity-80" />
            <h3 className="text-lg font-bold text-white">Hələ ki məqalə yoxdur</h3>
            <p className="text-xs text-slate-400">Yeni məqalələr dərhal burada görünəcək.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map(post => {
              const title = getLocalized(post, 'title');
              const content = getLocalized(post, 'content');
              const snippet = content ? content.replace(/<[^>]*>/g, '').substring(0, 120) + '...' : '';

              return (
                <div 
                  key={post.id} 
                  className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden hover:border-slate-700 transition-all duration-300 flex flex-col group hover:-translate-y-1"
                >
                  <div className="relative h-48 w-full overflow-hidden bg-slate-950">
                    <img 
                      src={post.featured_image || 'https://picsum.photos/seed/blog/800/400'} 
                      alt={String(title)}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  
                  <div className="p-6 flex flex-col flex-1 space-y-4">
                    <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(post.created_at).toLocaleDateString()}</span>
                    </div>

                    <h2 className="text-xl font-bold text-white group-hover:text-amber-500 transition-colors line-clamp-2">
                      {String(title)}
                    </h2>

                    <p className="text-sm text-slate-400 line-clamp-3 leading-relaxed">
                      {snippet}
                    </p>

                    <div className="pt-4 mt-auto">
                      <Link 
                        href={`/${locale}/blog/${post.slug}`}
                        className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider text-amber-500 hover:text-amber-400 transition-colors"
                      >
                        Davamını Oxu <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
