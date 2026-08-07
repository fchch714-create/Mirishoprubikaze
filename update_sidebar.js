const fs = require('fs');
const path = 'src/components/admin/AdminSidebar.tsx';
let content = fs.readFileSync(path, 'utf8');

const insertionPoint = "            { label: 'Kolleksiyalar', href: `/${locale}/admin/collections`, icon: Sparkles }";
const newLink = "            { label: 'Kolleksiyalar', href: `/${locale}/admin/collections`, icon: Sparkles },\n            { label: 'Nis Xidmətlər (Setup)', href: `/${locale}/admin/services`, icon: FolderOpen }";

if (content.includes(insertionPoint)) {
  content = content.replace(insertionPoint, newLink);
  fs.writeFileSync(path, content, 'utf8');
  console.log('Sidebar updated');
} else {
  console.log('Could not find insertion point');
}
