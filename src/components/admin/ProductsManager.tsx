'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { MediaUploadField } from '@/components/admin/MediaUploadField';

export function ProductsManager() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    title_az: '', title_en: '', title_ru: '',
    description_az: '', description_en: '', description_ru: '',
    price_azn: '', compare_at_price_azn: '', stock_quantity: '', image_url: '', category_id: '3x3', mechanics: 'none'
  });

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (!error) setProducts(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('products').insert([{
      title_az: formData.title_az, 
      title_en: formData.title_en, 
      title_ru: formData.title_ru,
      description_az: formData.description_az, 
      description_en: formData.description_en, 
      description_ru: formData.description_ru,
      price_azn: parseFloat(formData.price_azn), 
      compare_at_price_azn: formData.compare_at_price_azn ? parseFloat(formData.compare_at_price_azn) : null,
      stock_quantity: parseInt(formData.stock_quantity),
      image_url: formData.image_url, 
      category_id: formData.category_id,
      mechanics: formData.mechanics === 'none' ? null : formData.mechanics,
      is_active: true
    }]);

    if (error) {
      alert('Xəta baş verdi: ' + error.message);
    } else {
      alert('Məhsul uğurla əlavə edildi!');
      setFormData({ 
        title_az: '', title_en: '', title_ru: '', 
        description_az: '', description_en: '', description_ru: '', 
        price_azn: '', compare_at_price_azn: '', stock_quantity: '', image_url: '', category_id: '3x3', mechanics: 'none' 
      });
      fetchProducts();
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase.from('products').update({ is_active: !currentStatus }).eq('id', id);
    if (error) {
      alert('Status dəyişdirilərkən xəta: ' + error.message);
    } else {
      fetchProducts();
    }
  };

  return (
    <div>
      {/* Yeni Məhsul Formu */}
      <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Yeni Məhsul Əlavə Et</h2>
        <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <input required placeholder="Məhsul Adı (AZ)" value={formData.title_az} onChange={e => setFormData({...formData, title_az: e.target.value})} className="border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-black outline-none" />
          <input required placeholder="Product Name (EN)" value={formData.title_en} onChange={e => setFormData({...formData, title_en: e.target.value})} className="border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-black outline-none" />
          <input required placeholder="Название продукта (RU)" value={formData.title_ru} onChange={e => setFormData({...formData, title_ru: e.target.value})} className="border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-black outline-none" />
          
          <textarea required placeholder="Təsvir (AZ)" rows={2} value={formData.description_az} onChange={e => setFormData({...formData, description_az: e.target.value})} className="border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-black outline-none" />
          <textarea required placeholder="Description (EN)" rows={2} value={formData.description_en} onChange={e => setFormData({...formData, description_en: e.target.value})} className="border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-black outline-none" />
          <textarea required placeholder="Описание (RU)" rows={2} value={formData.description_ru} onChange={e => setFormData({...formData, description_ru: e.target.value})} className="border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-black outline-none" />
          
          <input required type="number" step="0.01" min="0" placeholder="Qiymət (AZN)" value={formData.price_azn} onChange={e => setFormData({...formData, price_azn: e.target.value})} className="border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-black outline-none" />
          <input type="number" step="0.01" min="0" placeholder="Köhnə Qiymət (AZN) - İxtiyari" value={formData.compare_at_price_azn} onChange={e => setFormData({...formData, compare_at_price_azn: e.target.value})} className="border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-black outline-none" />
          <input required type="number" min="0" placeholder="Stok Sayı" value={formData.stock_quantity} onChange={e => setFormData({...formData, stock_quantity: e.target.value})} className="border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-black outline-none" />
          
          <select required value={formData.category_id} onChange={e => setFormData({...formData, category_id: e.target.value})} className="border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-black outline-none">
            <option value="3x3">3x3</option>
            <option value="4x4">4x4</option>
            <option value="2x2">2x2</option>
            <option value="pyraminx">Pyraminx</option>
            <option value="accessories">Accessories</option>
            <option value="lubes">Lubes</option>
          </select>

          <select required value={formData.mechanics} onChange={e => setFormData({...formData, mechanics: e.target.value})} className="border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-black outline-none">
            <option value="none">Standard / None</option>
            <option value="magnetic">Magnetic</option>
            <option value="maglev">MagLev</option>
            <option value="uv">UV Coated</option>
            <option value="ball-core">Ball-Core</option>
          </select>
          
          <div className="md:col-span-3">
            <MediaUploadField
              label="Məhsul Şəkli (Cloudinary)"
              value={formData.image_url}
              onChange={(url) => setFormData({ ...formData, image_url: url })}
              accept="image"
              folder="rubikshop_products"
              placeholder="Şəkil URL-i daxil edin və ya kompyuterdən yükləyin"
            />
          </div>
          
          <div className="md:col-span-3 mt-2">
            <button type="submit" className="bg-rubik-primary text-black px-8 py-3 rounded-xl font-bold hover:bg-yellow-400 transition-colors active:scale-[0.98]">
              Məhsulu Kataloqa Əlavə Et
            </button>
          </div>
        </form>
      </div>

      {/* Məhsullar Siyahısı */}
      {loading ? (
        <div className="p-8 text-center text-gray-500 font-medium">Məhsullar yüklənir...</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="p-4 font-semibold text-sm text-gray-700 w-16">Şəkil</th>
                  <th className="p-4 font-semibold text-sm text-gray-700">Məhsul Adı (AZ)</th>
                  <th className="p-4 font-semibold text-sm text-gray-700">Qiymət</th>
                  <th className="p-4 font-semibold text-sm text-gray-700">Stok</th>
                  <th className="p-4 font-semibold text-sm text-gray-700">Status</th>
                  <th className="p-4 font-semibold text-sm text-gray-700 text-right">Əməliyyat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.image_url} alt={p.title_az} className="w-12 h-12 object-cover rounded-md border border-gray-200" />
                    </td>
                    <td className="p-4 font-medium text-sm text-gray-900">{p.title_az}</td>
                    <td className="p-4 font-bold text-sm text-gray-900">{p.price_azn} AZN</td>
                    <td className="p-4 text-sm text-gray-700">{p.stock_quantity} ədəd</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${p.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {p.is_active ? 'Aktiv' : 'Deaktiv'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => toggleActive(p.id, p.is_active)} 
                        className="px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors"
                      >
                        {p.is_active ? 'Deaktiv Et' : 'Aktivləşdir'}
                      </button>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500 font-medium">
                      Kataloqda heç bir məhsul tapılmadı.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
