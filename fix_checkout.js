const fs = require('fs');
let content = fs.readFileSync('src/components/CheckoutForm.tsx', 'utf8');

if (!content.includes("import { signIn }")) {
  content = content.replace(
    "import { Check, ShieldCheck, CreditCard, Wallet, Truck, Plus, ChevronRight, Lock, Gift, MapPin, Search } from 'lucide-react';",
    "import { Check, ShieldCheck, CreditCard, Wallet, Truck, Plus, ChevronRight, Lock, Gift, MapPin, Search, Loader2 } from 'lucide-react';\nimport { signIn } from '@/lib/actions/auth';"
  );
}

// Add state for auth error and loading
content = content.replace(
  "  const [loginPassword, setLoginPassword] = React.useState('');",
  "  const [loginPassword, setLoginPassword] = React.useState('');\n  const [authError, setAuthError] = React.useState('');\n  const [isAuthLoading, setIsAuthLoading] = React.useState(false);"
);

const oldLogin = `  // Handle Login Simulation
  const handleSimulateLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginEmail && loginPassword) {
      setIsLoggedIn(true);
      setName('Mirsəlim Şahbazov');
      setPhone('+994 50 668 49 25');
      setInstagram('mirselim.sh');
      setAddress('Xətai rayonu, Nobel prospekti 15');
    }
  };`;

const newLogin = `  // Real Supabase Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsAuthLoading(true);

    const formData = new FormData();
    formData.append('email', loginEmail);
    formData.append('password', loginPassword);

    const res = await signIn(formData);
    setIsAuthLoading(false);

    if (res.error) {
      setAuthError(res.error);
    } else {
      // Reload page so session is active server-side
      window.location.reload();
    }
  };`;

content = content.replace(oldLogin, newLogin);
content = content.replace("onSubmit={handleSimulateLogin}", "onSubmit={handleLogin}");
content = content.replace(
  `                    <div className="flex items-end">
                      <button
                        type="submit"
                        className="w-full bg-rubik-brand text-white font-bold rounded-xl px-4 py-2.5 hover:bg-rubik-brand-dark transition-colors h-[46px]"
                      >
                        Giriş
                      </button>`,
  `                    <div className="flex items-end flex-col justify-end">
                      <button
                        type="submit"
                        disabled={isAuthLoading}
                        className="w-full bg-rubik-brand text-white font-bold rounded-xl px-4 py-2.5 hover:bg-rubik-brand-dark transition-colors h-[46px] flex items-center justify-center gap-2"
                      >
                        {isAuthLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                        Giriş
                      </button>
                      {authError && <span className="text-xs text-red-500 mt-2 block w-full">{authError}</span>}`
);

fs.writeFileSync('src/components/CheckoutForm.tsx', content);
console.log("Success CheckoutForm");
