const fs = require('fs');

let code = fs.readFileSync('src/components/admin/ProductsManager.tsx', 'utf8');

// Update state
code = code.replace(/price_azn: '', stock_quantity: '', image_url: ''/g, "price_azn: '', compare_at_price_azn: '', stock_quantity: '', image_url: '', category_id: '3x3', mechanics: 'none'");

// Update insert payload
const oldInsert = `price_azn: parseFloat(formData.price_azn), 
      stock_quantity: parseInt(formData.stock_quantity),
      image_url: formData.image_url, 
      is_active: true`;
const newInsert = `price_azn: parseFloat(formData.price_azn), 
      compare_at_price_azn: formData.compare_at_price_azn ? parseFloat(formData.compare_at_price_azn) : null,
      stock_quantity: parseInt(formData.stock_quantity),
      image_url: formData.image_url, 
      category_id: formData.category_id,
      mechanics: formData.mechanics === 'none' ? null : formData.mechanics,
      is_active: true`;
code = code.replace(/price_azn: parseFloat\(formData\.price_azn\),[\s\S]*?is_active: true/g, newInsert);

// Add fields to form
const formOld = `<input required type="number" step="0.01" min="0" placeholder="Qiymət (AZN)" value={formData.price_azn} onChange={e => setFormData({...formData, price_azn: e.target.value})} className="border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-black outline-none" />
          <input required type="number" min="0" placeholder="Stok Sayı" value={formData.stock_quantity} onChange={e => setFormData({...formData, stock_quantity: e.target.value})} className="border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-black outline-none" />
          <input required placeholder="Şəkil URL (Supabase Storage)" value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})} className="border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-black outline-none" />`;

const formNew = `<input required type="number" step="0.01" min="0" placeholder="Qiymət (AZN)" value={formData.price_azn} onChange={e => setFormData({...formData, price_azn: e.target.value})} className="border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-black outline-none" />
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
          
          <input required placeholder="Şəkil URL (Supabase Storage)" value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})} className="border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-black outline-none" />`;

code = code.replace(formOld, formNew);

fs.writeFileSync('src/components/admin/ProductsManager.tsx', code);
