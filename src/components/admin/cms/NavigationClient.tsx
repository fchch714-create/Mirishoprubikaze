"use client";

import React, { useState, useEffect } from 'react';
import { Menu, Plus, GripVertical, Trash2, Edit3, HelpCircle, Layout, Check, X, MoveUp, MoveDown } from 'lucide-react';
import { 
  getNavigationItems, createNavigationItem, updateNavigationItem, deleteNavigationItem,
  getFAQs, createFAQ, updateFAQ, deleteFAQ 
} from '@/lib/actions/admin';

interface NavigationItem {
  id: string;
  label_az: string;
  label_en: string;
  label_ru: string;
  link_url: string;
  location: 'header' | 'footer_col1' | 'footer_col2' | 'footer_col3';
  sort_order: number;
  is_active: boolean;
}

interface FAQ {
  id: string;
  question_az: string;
  question_en: string;
  question_ru: string;
  answer_az: string;
  answer_en: string;
  answer_ru: string;
  sort_order: number;
  is_active: boolean;
}

export default function NavigationClient() {
  const [activeTab, setActiveTab] = useState<'menu' | 'faq'>('menu');
  const [navItems, setNavItems] = useState<NavigationItem[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal / Form States
  const [isNavFormOpen, setIsNavFormOpen] = useState(false);
  const [isFaqFormOpen, setIsFaqFormOpen] = useState(false);
  const [editingNav, setEditingNav] = useState<NavigationItem | null>(null);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);

  // Nav Form fields
  const [labelAz, setLabelAz] = useState('');
  const [labelEn, setLabelEn] = useState('');
  const [labelRu, setLabelRu] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [navLocation, setNavLocation] = useState<'header' | 'footer_col1' | 'footer_col2' | 'footer_col3'>('header');
  const [navSortOrder, setNavSortOrder] = useState(0);
  const [navIsActive, setNavIsActive] = useState(true);

  // FAQ Form fields
  const [questionAz, setQuestionAz] = useState('');
  const [questionEn, setQuestionEn] = useState('');
  const [questionRu, setQuestionRu] = useState('');
  const [answerAz, setAnswerAz] = useState('');
  const [answerEn, setAnswerEn] = useState('');
  const [answerRu, setAnswerRu] = useState('');
  const [faqSortOrder, setFaqSortOrder] = useState(0);
  const [faqIsActive, setFaqIsActive] = useState(true);

  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [draggedType, setDraggedType] = useState<'menu' | 'faq' | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number, type: 'menu' | 'faq') => {
    setDraggedIndex(index);
    setDraggedType(type);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number, type: 'menu' | 'faq') => {
    if (draggedType !== type) return;
    e.preventDefault();
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDraggedType(null);
    setDragOverIndex(null);
  };

  const handleDrop = async (e: React.DragEvent, targetIndex: number, type: 'menu' | 'faq') => {
    e.preventDefault();
    if (draggedIndex === null || draggedType !== type) return;
    if (draggedIndex === targetIndex) {
      handleDragEnd();
      return;
    }

    if (type === 'menu') {
      const items = [...navItems];
      const [draggedItem] = items.splice(draggedIndex, 1);
      items.splice(targetIndex, 0, draggedItem);
      
      const updatedItems = items.map((item, idx) => ({
        ...item,
        sort_order: idx
      }));
      setNavItems(updatedItems);
      handleDragEnd();

      try {
        const promises = updatedItems.map((item, idx) => {
          const original = navItems.find(n => n.id === item.id);
          if (!original || original.sort_order !== idx) {
            return updateNavigationItem(item.id, { sort_order: idx });
          }
          return null;
        }).filter(Boolean);
        
        if (promises.length > 0) {
          await Promise.all(promises);
        }
      } catch (err) {
        console.error("Failed to update navigation sort orders in db", err);
      }
    } else {
      const items = [...faqs];
      const [draggedItem] = items.splice(draggedIndex, 1);
      items.splice(targetIndex, 0, draggedItem);

      const updatedFAQs = items.map((faq, idx) => ({
        ...faq,
        sort_order: idx
      }));
      setFaqs(updatedFAQs);
      handleDragEnd();

      try {
        const promises = updatedFAQs.map((faq, idx) => {
          const original = faqs.find(f => f.id === faq.id);
          if (!original || original.sort_order !== idx) {
            return updateFAQ(faq.id, { sort_order: idx });
          }
          return null;
        }).filter(Boolean);
        
        if (promises.length > 0) {
          await Promise.all(promises);
        }
      } catch (err) {
        console.error("Failed to update FAQ sort orders in db", err);
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    if (activeTab === 'menu') {
      const res = await getNavigationItems();
      if (res.success && res.data) {
        setNavItems(res.data as NavigationItem[]);
      }
    } else {
      const res = await getFAQs();
      if (res.success && res.data) {
        setFaqs(res.data as FAQ[]);
      }
    }
    setLoading(false);
  };

  // Nav CRUD Handlers
  const handleOpenNavForm = (item?: NavigationItem) => {
    if (item) {
      setEditingNav(item);
      setLabelAz(item.label_az);
      setLabelEn(item.label_en);
      setLabelRu(item.label_ru);
      setLinkUrl(item.link_url);
      setNavLocation(item.location);
      setNavSortOrder(item.sort_order);
      setNavIsActive(item.is_active);
    } else {
      setEditingNav(null);
      setLabelAz('');
      setLabelEn('');
      setLabelRu('');
      setLinkUrl('');
      setNavLocation('header');
      setNavSortOrder(0);
      setNavIsActive(true);
    }
    setIsNavFormOpen(true);
  };

  const handleSaveNav = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!labelAz || !linkUrl) {
      alert('Ad AZ və Keçid linki mütləq doldurulmalıdır.');
      return;
    }

    const payload = {
      label_az: labelAz,
      label_en: labelEn || labelAz,
      label_ru: labelRu || labelAz,
      link_url: linkUrl,
      location: navLocation,
      sort_order: navSortOrder,
      is_active: navIsActive,
    };

    let res;
    if (editingNav) {
      res = await updateNavigationItem(editingNav.id, payload);
    } else {
      res = await createNavigationItem(payload);
    }

    if (res.success) {
      setIsNavFormOpen(false);
      setEditingNav(null);
      fetchData();
    } else {
      alert('Xəta baş verdi: ' + res.error);
    }
  };

  const handleDeleteNav = async (id: string) => {
    if (confirm('Bu naviqasiya linkini silmək istədiyinizdən əminsiniz?')) {
      const res = await deleteNavigationItem(id);
      if (res.success) {
        fetchData();
      } else {
        alert('Xəta baş verdi: ' + res.error);
      }
    }
  };

  const handleMoveNav = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= navItems.length) return;

    const currentItem = navItems[index];
    const targetItem = navItems[targetIndex];

    const currentOrder = currentItem.sort_order;
    const targetOrder = targetItem.sort_order;

    const res1 = await updateNavigationItem(currentItem.id, { sort_order: targetOrder });
    const res2 = await updateNavigationItem(targetItem.id, { sort_order: currentOrder });

    if (res1.success && res2.success) {
      fetchData();
    }
  };

  // FAQ CRUD Handlers
  const handleOpenFaqForm = (faq?: FAQ) => {
    if (faq) {
      setEditingFaq(faq);
      setQuestionAz(faq.question_az);
      setQuestionEn(faq.question_en);
      setQuestionRu(faq.question_ru);
      setAnswerAz(faq.answer_az);
      setAnswerEn(faq.answer_en);
      setAnswerRu(faq.answer_ru);
      setFaqSortOrder(faq.sort_order);
      setFaqIsActive(faq.is_active);
    } else {
      setEditingFaq(null);
      setQuestionAz('');
      setQuestionEn('');
      setQuestionRu('');
      setAnswerAz('');
      setAnswerEn('');
      setAnswerRu('');
      setFaqSortOrder(0);
      setFaqIsActive(true);
    }
    setIsFaqFormOpen(true);
  };

  const handleSaveFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionAz || !answerAz) {
      alert('Sual AZ və Cavab AZ mütləq doldurulmalıdır.');
      return;
    }

    const payload = {
      question_az: questionAz,
      question_en: questionEn || questionAz,
      question_ru: questionRu || questionAz,
      answer_az: answerAz,
      answer_en: answerEn || answerAz,
      answer_ru: answerRu || answerAz,
      sort_order: faqSortOrder,
      is_active: faqIsActive,
    };

    let res;
    if (editingFaq) {
      res = await updateFAQ(editingFaq.id, payload);
    } else {
      res = await createFAQ(payload);
    }

    if (res.success) {
      setIsFaqFormOpen(false);
      setEditingFaq(null);
      fetchData();
    } else {
      alert('Xəta baş verdi: ' + res.error);
    }
  };

  const handleDeleteFaq = async (id: string) => {
    if (confirm('Bu FAQ sualını silmək istədiyinizdən əminsiniz?')) {
      const res = await deleteFAQ(id);
      if (res.success) {
        fetchData();
      } else {
        alert('Xəta baş verdi: ' + res.error);
      }
    }
  };

  const handleMoveFaq = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= faqs.length) return;

    const currentItem = faqs[index];
    const targetItem = faqs[targetIndex];

    const currentOrder = currentItem.sort_order;
    const targetOrder = targetItem.sort_order;

    const res1 = await updateFAQ(currentItem.id, { sort_order: targetOrder });
    const res2 = await updateFAQ(targetItem.id, { sort_order: currentOrder });

    if (res1.success && res2.success) {
      fetchData();
    }
  };

  return (
    <div id="admin-navigation-faq" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Layout className="w-6 h-6 text-amber-500" /> Naviqasiya & FAQ
          </h2>
          <p className="text-sm text-slate-400 mt-1">Menyuların və Tez-tez Verilən Sualların (FAQ) idarəedilməsi.</p>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2 hide-scrollbar bg-slate-900 p-2 rounded-2xl border border-slate-800">
        <button
          onClick={() => setActiveTab('menu')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === 'menu' 
              ? 'bg-slate-800 text-amber-500 shadow-soft-sm' 
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Menu className="w-4 h-4" /> Baş Menyu / Naviqasiya
        </button>
        <button
          onClick={() => setActiveTab('faq')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === 'faq' 
              ? 'bg-slate-800 text-amber-500 shadow-soft-sm' 
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <HelpCircle className="w-4 h-4" /> FAQ (Suallar)
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-soft-md min-h-[500px]">
        
        {/* MENU LINK TAB */}
        {activeTab === 'menu' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black text-white uppercase tracking-wider">Menyu Linkləri</h3>
              <button 
                onClick={() => handleOpenNavForm()}
                className="flex items-center gap-2 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-xl transition-all"
              >
                <Plus className="w-3 h-3" /> Yeni Link
              </button>
            </div>

            {isNavFormOpen && (
              <form id="nav-form" onSubmit={handleSaveNav} className="bg-slate-950 border border-slate-800 p-6 rounded-2xl space-y-4">
                <h4 className="text-sm font-black text-white uppercase tracking-wider">{editingNav ? 'Link Redaktə Et' : 'Yeni Link Əlavə Et'}</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Ad AZ</label>
                    <input 
                      type="text" 
                      value={labelAz} 
                      onChange={e => setLabelAz(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500" 
                      placeholder="Məs: Kublar" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Ad EN</label>
                    <input 
                      type="text" 
                      value={labelEn} 
                      onChange={e => setLabelEn(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500" 
                      placeholder="Məs: Cubes" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Ad RU</label>
                    <input 
                      type="text" 
                      value={labelRu} 
                      onChange={e => setLabelRu(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500" 
                      placeholder="Məs: Кубы" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Keçid Linki (URL)</label>
                    <input 
                      type="text" 
                      value={linkUrl} 
                      onChange={e => setLinkUrl(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-white rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-amber-500" 
                      placeholder="Məs: /category/rubiks" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Yerləşmə</label>
                    <select 
                      value={navLocation} 
                      onChange={e => setNavLocation(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                    >
                      <option value="header">Baş Menyu (Header)</option>
                      <option value="footer_col1">Footer Sütun 1</option>
                      <option value="footer_col2">Footer Sütun 2</option>
                      <option value="footer_col3">Footer Sütun 3</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Sıra</label>
                    <input 
                      type="number" 
                      value={navSortOrder} 
                      onChange={e => setNavSortOrder(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500" 
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input 
                    id="nav-active" 
                    type="checkbox" 
                    checked={navIsActive} 
                    onChange={e => setNavIsActive(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-800 bg-slate-950 text-amber-500 focus:ring-amber-500"
                  />
                  <label htmlFor="nav-active" className="text-xs font-bold text-slate-400">Aktivdir</label>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button 
                    type="button" 
                    onClick={() => { setIsNavFormOpen(false); setEditingNav(null); }}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold"
                  >
                    Ləğv Et
                  </button>
                  <button 
                    type="submit" 
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-xs font-black flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" /> Saxla
                  </button>
                </div>
              </form>
            )}

            {loading ? (
              <div className="p-8 text-center text-slate-400 font-bold">Yüklənir...</div>
            ) : navItems.length === 0 ? (
              <div className="p-8 text-center text-slate-400 font-bold">Heç bir naviqasiya linki tapılmadı.</div>
            ) : (
              <div className="space-y-3">
                {navItems.map((item, index) => {
                  const isDragged = draggedIndex === index && draggedType === 'menu';
                  const isDragOver = dragOverIndex === index && draggedIndex !== index && draggedType === 'menu';

                  return (
                    <div 
                      key={item.id} 
                      draggable
                      onDragStart={(e) => handleDragStart(e, index, 'menu')}
                      onDragOver={(e) => handleDragOver(e, index, 'menu')}
                      onDragEnd={handleDragEnd}
                      onDrop={(e) => handleDrop(e, index, 'menu')}
                      className={`flex items-center gap-4 bg-slate-950 border p-4 rounded-2xl group transition-all cursor-grab active:cursor-grabbing ${
                        isDragged ? 'opacity-40 border-dashed border-amber-500/50 bg-slate-900/50' : 
                        isDragOver ? 'border-amber-500 bg-amber-500/10 scale-[1.01] shadow-lg shadow-amber-500/5' : 
                        'border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <GripVertical className="w-4 h-4 text-slate-500 group-hover:text-amber-500 transition-colors flex-shrink-0 cursor-grab" />
                      
                      <div className="flex flex-col" onClick={(e) => e.stopPropagation()}>
                        <button 
                          disabled={index === 0} 
                          onClick={() => handleMoveNav(index, 'up')}
                          className="text-slate-500 hover:text-white disabled:opacity-30"
                        >
                          <MoveUp className="w-4 h-4" />
                        </button>
                        <button 
                          disabled={index === navItems.length - 1} 
                          onClick={() => handleMoveNav(index, 'down')}
                          className="text-slate-500 hover:text-white disabled:opacity-30"
                        >
                          <MoveDown className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <span className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Ad AZ</span>
                          <span className="font-bold text-white text-sm">{item.label_az}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Keçid (Link)</span>
                          <span className="font-mono text-slate-400 text-sm">{item.link_url}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Yerləşmə</span>
                          <span className="inline-block px-2 py-0.5 bg-slate-850 text-slate-300 text-[10px] font-black uppercase tracking-wider rounded border border-slate-800">
                            {item.location}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Status</span>
                          {item.is_active ? (
                            <span className="text-xs text-green-400 font-bold bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">Aktiv</span>
                          ) : (
                            <span className="text-xs text-slate-500 font-bold bg-slate-800 px-2 py-0.5 rounded border border-slate-700">Passiv</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button 
                          onClick={() => handleOpenNavForm(item)}
                          className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteNav(item.id)}
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* FAQ TAB */}
        {activeTab === 'faq' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black text-white uppercase tracking-wider">Tez-tez Verilən Suallar</h3>
              <button 
                onClick={() => handleOpenFaqForm()}
                className="flex items-center gap-2 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-xl transition-all"
              >
                <Plus className="w-3 h-3" /> Yeni Sual
              </button>
            </div>

            {isFaqFormOpen && (
              <form id="faq-form" onSubmit={handleSaveFaq} className="bg-slate-950 border border-slate-800 p-6 rounded-2xl space-y-4">
                <h4 className="text-sm font-black text-white uppercase tracking-wider">{editingFaq ? 'Sualı Redaktə Et' : 'Yeni Sual Əlavə Et'}</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Sual AZ</label>
                    <input 
                      type="text" 
                      value={questionAz} 
                      onChange={e => setQuestionAz(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500" 
                      placeholder="Məs: Çatdırılma varmı?" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Sual EN</label>
                    <input 
                      type="text" 
                      value={questionEn} 
                      onChange={e => setQuestionEn(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500" 
                      placeholder="Məs: Do you deliver?" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Sual RU</label>
                    <input 
                      type="text" 
                      value={questionRu} 
                      onChange={e => setQuestionRu(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500" 
                      placeholder="Məs: Есть ли доставка?" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Cavab AZ</label>
                    <textarea 
                      value={answerAz} 
                      onChange={e => setAnswerAz(e.target.value)}
                      rows={3}
                      className="w-full bg-slate-900 border border-slate-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500" 
                      placeholder="Cavab Azərbaycan dilində..." 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Cavab EN</label>
                    <textarea 
                      value={answerEn} 
                      onChange={e => setAnswerEn(e.target.value)}
                      rows={3}
                      className="w-full bg-slate-900 border border-slate-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500" 
                      placeholder="Cavab İngilis dilində..." 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Cavab RU</label>
                    <textarea 
                      value={answerRu} 
                      onChange={e => setAnswerRu(e.target.value)}
                      rows={3}
                      className="w-full bg-slate-900 border border-slate-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500" 
                      placeholder="Cavab Rus dilində..." 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Sıralama</label>
                    <input 
                      type="number" 
                      value={faqSortOrder} 
                      onChange={e => setFaqSortOrder(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500" 
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <input 
                      id="faq-active" 
                      type="checkbox" 
                      checked={faqIsActive} 
                      onChange={e => setFaqIsActive(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-800 bg-slate-950 text-amber-500 focus:ring-amber-500"
                    />
                    <label htmlFor="faq-active" className="text-xs font-bold text-slate-400">Aktivdir</label>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button 
                    type="button" 
                    onClick={() => { setIsFaqFormOpen(false); setEditingFaq(null); }}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold"
                  >
                    Ləğv Et
                  </button>
                  <button 
                    type="submit" 
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-xs font-black flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" /> Saxla
                  </button>
                </div>
              </form>
            )}

            {loading ? (
              <div className="p-8 text-center text-slate-400 font-bold">Yüklənir...</div>
            ) : faqs.length === 0 ? (
              <div className="p-8 text-center text-slate-400 font-bold">Heç bir sual tapılmadı.</div>
            ) : (
              <div className="space-y-3">
                {faqs.map((faq, index) => {
                  const isDragged = draggedIndex === index && draggedType === 'faq';
                  const isDragOver = dragOverIndex === index && draggedIndex !== index && draggedType === 'faq';

                  return (
                    <div 
                      key={faq.id} 
                      draggable
                      onDragStart={(e) => handleDragStart(e, index, 'faq')}
                      onDragOver={(e) => handleDragOver(e, index, 'faq')}
                      onDragEnd={handleDragEnd}
                      onDrop={(e) => handleDrop(e, index, 'faq')}
                      className={`flex gap-4 bg-slate-950 border p-4 rounded-2xl group transition-all items-start cursor-grab active:cursor-grabbing ${
                        isDragged ? 'opacity-40 border-dashed border-amber-500/50 bg-slate-900/50' : 
                        isDragOver ? 'border-amber-500 bg-amber-500/10 scale-[1.01] shadow-lg shadow-amber-500/5' : 
                        'border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <GripVertical className="w-4 h-4 text-slate-500 group-hover:text-amber-500 transition-colors flex-shrink-0 cursor-grab mt-1" />

                      <div className="flex flex-col" onClick={(e) => e.stopPropagation()}>
                        <button 
                          disabled={index === 0} 
                          onClick={() => handleMoveFaq(index, 'up')}
                          className="text-slate-500 hover:text-white disabled:opacity-30"
                        >
                          <MoveUp className="w-4 h-4" />
                        </button>
                        <button 
                          disabled={index === faqs.length - 1} 
                          onClick={() => handleMoveFaq(index, 'down')}
                          className="text-slate-500 hover:text-white disabled:opacity-30"
                        >
                          <MoveDown className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-mono">
                            Sıra: {faq.sort_order}
                          </span>
                          {!faq.is_active && (
                            <span className="text-xs text-slate-500 font-bold bg-slate-800 px-2 py-0.5 rounded border border-slate-700">Passiv</span>
                          )}
                        </div>
                        <div className="font-bold text-white">{faq.question_az}</div>
                        <div className="text-sm text-slate-400 leading-relaxed">{faq.answer_az}</div>
                      </div>

                      <div className="flex items-center gap-2 mt-1" onClick={(e) => e.stopPropagation()}>
                        <button 
                          onClick={() => handleOpenFaqForm(faq)}
                          className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteFaq(faq.id)}
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
