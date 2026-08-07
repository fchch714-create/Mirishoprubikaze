const fs = require('fs');
let content = fs.readFileSync('src/components/layout/AccountDashboardClient.tsx', 'utf8');

// replace interface AccountDashboardClientProps
content = content.replace(
  "interface AccountDashboardClientProps {\n  locale: string;\n  dict: ApplicationDictionary;\n}",
  `interface AccountDashboardClientProps {
  locale: string;
  dict: ApplicationDictionary;
  initialProfile: {
    id: string;
    email: string;
    fullName: string;
    phone: string;
    address: string;
  };
}`
);

// replace export function AccountDashboardClient({ locale, dict }: AccountDashboardClientProps) {
content = content.replace(
  "export function AccountDashboardClient({ locale, dict }: AccountDashboardClientProps) {",
  `import { signOut } from '@/lib/actions/auth';\n\nexport function AccountDashboardClient({ locale, dict, initialProfile }: AccountDashboardClientProps) {`
);

// find const [fullName, setFullName] = React.useState('Mirsəlim Şahbazov');
// and replace it to use initialProfile
content = content.replace(
  "const [fullName, setFullName] = React.useState('Mirsəlim Şahbazov');\n  const [phone, setPhone] = React.useState('+994 50 668 49 25');\n  const [email, setEmail] = React.useState('mirselimsahbazov2@gmail.com');",
  "const [fullName, setFullName] = React.useState(initialProfile.fullName || '');\n  const [phone, setPhone] = React.useState(initialProfile.phone || '');\n  const [email, setEmail] = React.useState(initialProfile.email || '');"
);

// Add logout handler
content = content.replace(
  `                      <span className="font-bold">Çıxış</span>`,
  `                      <span className="font-bold" onClick={async () => { await signOut(); window.location.href = '/' }}>Çıxış</span>`
);

content = content.replace(
  `                  <button className="w-full flex items-center justify-between p-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-all group">`,
  `                  <button onClick={async () => { await signOut(); window.location.href = '/' }} className="w-full flex items-center justify-between p-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-all group">`
);

fs.writeFileSync('src/components/layout/AccountDashboardClient.tsx', content);
