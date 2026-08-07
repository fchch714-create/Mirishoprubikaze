const fs = require('fs');
let content = fs.readFileSync('src/components/admin/AdminDashboardClient.tsx', 'utf8');

// Replace recentOrders array
content = content.replace(/const recentOrders = \[\s*\{ id: 'ord_91a4b8c2'[\s\S]*?\];/g, '');

// Change the component signature
content = content.replace(
  "export default function AdminDashboardClient() {",
  `interface AdminDashboardProps {
  stats: {
    totalSales: number;
    totalOrders: number;
    totalProducts: number;
    openSupportTickets: number;
  };
  recentOrders: any[];
}

export default function AdminDashboardClient({ stats, recentOrders }: AdminDashboardProps) {`
);

// Calculate AOV
content = content.replace(
  "const [activeChart, setActiveChart] = React.useState<'revenue' | 'orders'>('revenue');",
  `const [activeChart, setActiveChart] = React.useState<'revenue' | 'orders'>('revenue');
  
  const aov = stats.totalOrders > 0 ? (stats.totalSales / stats.totalOrders) : 0;`
);

// Replace Total Sales metric
content = content.replace(
  /<span className="text-2xl md:text-3xl font-black text-white font-mono block tracking-tight">124,580.00 AZN<\/span>/g,
  `<span className="text-2xl md:text-3xl font-black text-white font-mono block tracking-tight">{stats.totalSales.toFixed(2)} AZN</span>`
);

// Replace Orders metric
content = content.replace(
  /<span className="text-2xl md:text-3xl font-black text-white font-mono block tracking-tight">1,842 Sifariş<\/span>/g,
  `<span className="text-2xl md:text-3xl font-black text-white font-mono block tracking-tight">{stats.totalOrders} Sifariş</span>`
);

// Replace AOV metric
// First we need to find it
content = content.replace(
  /<span className="text-2xl md:text-3xl font-black text-white font-mono block tracking-tight">67.50 AZN<\/span>/g,
  `<span className="text-2xl md:text-3xl font-black text-white font-mono block tracking-tight">{aov.toFixed(2)} AZN</span>`
);

// We should also look for recentOrders mapping and update it since the structure changed
content = content.replace(
  /{recentOrders\.map\(\(order\) => \([\s\S]*?<\/tr>\n\s*\)\)}/,
  `{recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-800/20 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="font-bold text-white inline-flex items-center gap-1.5">
                      <ShoppingBag className="w-4 h-4 text-slate-500" /> {order.id.substring(0,8).toUpperCase()}
                    </span>
                    <div className="font-mono text-xs text-slate-500 mt-1">{new Date(order.created_at).toLocaleString('az-AZ')}</div>
                  </td>
                  <td className="px-6 py-4 font-medium text-white">{order.customer_name}</td>
                  <td className="px-6 py-4 text-slate-400">{order.customer_phone}</td>
                  <td className="px-6 py-4 font-mono font-bold text-white">{Number(order.total_amount_azn || order.total || 0).toFixed(2)} AZN</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-slate-800 text-slate-300">
                      {order.status || 'pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition-colors border border-slate-700">
                        Bax <ChevronRight className="w-3 h-3 inline" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}`
);


fs.writeFileSync('src/components/admin/AdminDashboardClient.tsx', content);
