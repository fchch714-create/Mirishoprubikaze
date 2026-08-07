'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings, 
  Wrench, 
  Search, 
  Plus, 
  Edit2, 
  Trash2,
  Droplet,
  Zap,
  ShieldCheck,
  ListTodo,
  X,
  Save,
  Loader2,
  RefreshCw
} from 'lucide-react';
import ServiceOrdersClient from './ServiceOrdersClient';
import { getServices, createService, updateService, deleteService, getServiceOrders, ServiceDB } from '@/lib/actions/services';

export default function ServicesClient() {
  const [activeTab, setActiveTab] = React.useState<'management' | 'orders'>('management');
  const [services, setServices] = React.useState<ServiceDB[]>([]);
  const [orderCount, setOrderCount] = React.useState(0);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingService, setEditingService] = React.useState<ServiceDB | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  
  // Form state
  const [formData, setFormData] = React.useState({
    name_az: '',
    description: '',
    price: 0,
    is_active: true,
  });

  React.useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    
    const [srvRes, ordRes] = await Promise.all([
      getServices(),
      getServiceOrders()
    ]);

    if (srvRes.success && srvRes.services) {
      setServices(srvRes.services);
    } else {
      setError(srvRes.error || 'Xidmətləri yükləmək mümkün olmadı.');
    }

    if (ordRes.success && ordRes.orders) {
      // Set the count of pending + in_progress service orders
      const activeOrders = ordRes.orders.filter(o => o.status === 'pending' || o.status === 'in_progress');
      setOrderCount(activeOrders.length);
    }

    setLoading(false);
  };

  const filteredServices = services.filter(s => 
    (s.name_az || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (s.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenModal = (service?: ServiceDB) => {
    if (service) {
      setEditingService(service);
      setFormData({
        name_az: service.name_az,
        description: service.description || '',
        price: Number(service.price),
        is_active: service.is_active,
      });
    } else {
      setEditingService(null);
      setFormData({
        name_az: '',
        description: '',
        price: 0,
        is_active: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingService(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name_az.trim()) return;

    setSubmitting(true);
    if (editingService) {
      const res = await updateService(editingService.id, {
        name_az: formData.name_az.trim(),
        description: formData.description.trim(),
        price: formData.price,
        is_active: formData.is_active
      });
      if (res.success) {
        handleCloseModal();
        fetchData();
      } else {
        alert(res.error || 'Yeniləmə xətası.');
      }
    } else {
      const res = await createService({
        name_az: formData.name_az.trim(),
        description: formData.description.trim(),
        price: formData.price,
        is_active: formData.is_active
      });
      if (res.success) {
        handleCloseModal();
        fetchData();
      } else {
        alert(res.error || 'Xidmət yaradılarkən xəta baş verdi.');
      }
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if(confirm('Silmək istədiyinizə əminsiniz? Bu xidmət növünü tamamilə siləcək.')) {
      const res = await deleteService(id);
      if (res.success) {
        fetchData();
      } else {
        alert(res.error || 'Silinmə xətası.');
      }
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Wrench className="h-6 w-6 text-amber-500" />
            Xidmətlər (Custom Setup & Repair)
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Rubik kublarının yağlanması, gərginlik tənzimlənməsi (tensioning) və premium bərpa xidmətləri.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={fetchData}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl border border-slate-700 transition-colors"
            title="Yenilə"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-slate-900/50 p-1 rounded-xl border border-slate-800 w-fit">
        <button
          onClick={() => setActiveTab('management')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'management'
              ? 'bg-amber-500 text-slate-950 shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Settings className="h-4 w-4" />
          Xidmət Növləri
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'orders'
              ? 'bg-amber-500 text-slate-950 shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <ListTodo className="h-4 w-4" />
          Sifariş Növbəsi
          {orderCount > 0 && (
            <span className="flex items-center justify-center bg-red-500 text-white text-[10px] h-5 w-5 rounded-full font-black animate-pulse">
              {orderCount}
            </span>
          )}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-2xl">
          {error}
        </div>
      )}

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'management' ? (
          <motion.div
            key="management"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <div className="relative max-w-md w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Xidmət axtar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                />
              </div>
              <button 
                onClick={() => handleOpenModal()}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold rounded-xl border border-slate-700 transition-all shrink-0 cursor-pointer"
              >
                <Plus className="h-4 w-4 text-amber-500" />
                Yeni Xidmət
              </button>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                <p className="text-sm">Xidmətlər yüklənir...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredServices.map((service) => (
                  <div key={service.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors group relative overflow-hidden flex flex-col">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
                    
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-amber-500 shrink-0 font-bold">
                        {service.name_az.toLowerCase().includes('yağ') ? (
                          <Droplet className="h-6 w-6 text-blue-400" />
                        ) : (
                          <Settings className="h-6 w-6 text-amber-500" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          service.is_active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}>
                          {service.is_active ? 'Aktiv' : 'Deaktiv'}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-lg font-black text-white mb-2">{service.name_az}</h3>
                    <p className="text-sm text-slate-400 line-clamp-2 mb-4 flex-grow">
                      {service.description || 'Xidmət haqqında ətraflı təsvir qeyd edilməyib.'}
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-800/50 mt-auto">
                      <div className="text-md font-black text-amber-500 font-mono">
                        +{Number(service.price).toFixed(2)} AZN
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleOpenModal(service)}
                          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(service.id)}
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredServices.length === 0 && (
                  <div className="col-span-3 text-center p-12 bg-slate-900 border border-slate-800 rounded-2xl text-slate-500">
                    Sistemdə heç bir xidmət növü tapılmadı.
                  </div>
                )}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="orders"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <ServiceOrdersClient />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950/50 shrink-0">
                <h3 className="text-xl font-bold text-white uppercase tracking-wide">
                  {editingService ? 'Xidmət Məlumatlarını Yenilə' : 'Yeni Xidmət Növü Yarat'}
                </h3>
                <button 
                  onClick={handleCloseModal}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-5 overflow-y-auto text-left">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Xidmət Adı (Azərbaycanca)</label>
                  <input
                    type="text"
                    required
                    value={formData.name_az}
                    onChange={(e) => setFormData({...formData, name_az: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                    placeholder="Məs: Professional 3x3 Yağlanma"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Xidmət Təsviri (Açıqlama)</label>
                  <textarea
                    required
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all resize-none"
                    placeholder="Xidmətin detalları, tətbiq olunan yağlar və nizamlamalar haqqında məlumat..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Xidmət Qiyməti (AZN)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.10"
                    value={formData.price === 0 ? '' : formData.price}
                    onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-mono"
                    placeholder="Məsələn: 5.00"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <input 
                    type="checkbox"
                    id="is_active_chk"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                    className="w-4 h-4 accent-amber-500"
                  />
                  <label htmlFor="is_active_chk" className="text-sm font-semibold text-white select-none">
                    Xidmət aktiv olsun (müştəri seçə bilsin)
                  </label>
                </div>

                <div className="pt-6 flex justify-end gap-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Ləğv et
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-black rounded-xl transition-all cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Yadda Saxla
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
