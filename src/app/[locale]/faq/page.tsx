"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { HelpCircle, ChevronDown, ChevronUp, Search, Sparkles } from 'lucide-react';

interface FAQ {
  id: string;
  question_az: string;
  question_en: string;
  question_ru: string;
  answer_az: string;
  answer_en: string;
  answer_ru: string;
}

export default function FAQPage({ params }: { params: { locale: string } }) {
  const resolvedParams = params && typeof (params as any).then === 'function' ? React.use(params as any) as any : params;
  const locale = resolvedParams?.locale || 'az';

  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadFAQs() {
      const supabase = createClient();
      const { data } = await supabase
        .from('faqs')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      
      setFaqs((data || []) as FAQ[]);
      setLoading(false);
    }
    loadFAQs();
  }, []);

  const getLocalized = (faq: FAQ, field: 'question' | 'answer') => {
    const key = `${field}_${locale}` as keyof FAQ;
    return faq[key] || faq[`${field}_az` as keyof FAQ] || '';
  };

  const filteredFaqs = faqs.filter(faq => 
    getLocalized(faq, 'question').toLowerCase().includes(searchQuery.toLowerCase()) ||
    getLocalized(faq, 'answer').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-xs font-black text-amber-500 uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" /> Dəstək Mərkəzi
          </div>
          <h1 className="text-4xl font-black uppercase tracking-wider text-white">
            Tez-tez Verilən Suallar
          </h1>
          <p className="text-slate-400 max-w-lg mx-auto text-sm">
            Rubikshop.az-dan alış-veriş, çatdırılma, zəmanət və speedcubing haqqında ən çox verilən suallar və cavabları.
          </p>
        </div>

        <div className="relative max-w-md mx-auto">
          <Search className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
          <input 
            type="text"
            placeholder="Sual axtarın..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 text-white rounded-2xl pl-12 pr-4 py-3.5 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        {loading ? (
          <div className="text-center text-slate-400 py-12 font-bold">Yüklənir...</div>
        ) : filteredFaqs.length === 0 ? (
          <div className="text-center text-slate-400 py-12">Heç bir sual tapılmadı.</div>
        ) : (
          <div className="space-y-4">
            {filteredFaqs.map(faq => {
              const isOpen = openId === faq.id;
              return (
                <div 
                  key={faq.id} 
                  className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden transition-all duration-300"
                >
                  <button
                    onClick={() => setOpenId(isOpen ? null : faq.id)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
                  >
                    <span className="font-bold text-white text-base sm:text-lg flex items-center gap-3">
                      <HelpCircle className="w-5 h-5 text-amber-500 shrink-0" />
                      {getLocalized(faq, 'question')}
                    </span>
                    {isOpen ? (
                      <ChevronUp className="w-5 h-5 text-amber-500 shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-500 shrink-0" />
                    )}
                  </button>
                  
                  {isOpen && (
                    <div className="px-6 pb-6 pt-2 border-t border-slate-800/50 text-slate-300 text-sm leading-relaxed whitespace-pre-line animate-in fade-in slide-in-from-top-2 duration-200">
                      {getLocalized(faq, 'answer')}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
