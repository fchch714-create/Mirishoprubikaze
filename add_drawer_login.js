const fs = require('fs');
let code = fs.readFileSync('src/components/CartDrawer.tsx', 'utf8');

if (!code.includes('useAuthModalStore')) {
  code = code.replace(
    "import { useCartStore } from '@/store/useCartStore';",
    "import { useCartStore } from '@/store/useCartStore';\nimport { useAuthModalStore } from '@/store/useAuthModalStore';\nimport { createClientComponentClient } from '@supabase/auth-helpers-nextjs';"
  );
  
  code = code.replace(
    "export function CartDrawer({ isOpen, onClose, dict, locale }: CartDrawerProps) {",
    "export function CartDrawer({ isOpen, onClose, dict, locale }: CartDrawerProps) {\n  const [user, setUser] = React.useState<any>(null);\n  const { openModal } = useAuthModalStore();\n  const supabase = createClientComponentClient();"
  );
  
  code = code.replace(
    "React.useEffect(() => {\n    setIsMounted(true);\n  }, []);",
    "React.useEffect(() => {\n    setIsMounted(true);\n    const checkUser = async () => {\n      const { data: { user } } = await supabase.auth.getUser();\n      setUser(user);\n    };\n    checkUser();\n    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {\n      setUser(session?.user || null);\n    });\n    return () => subscription.unsubscribe();\n  }, [supabase.auth]);"
  );
  
  const targetRegex = /<Link\n\s*href=\{\`\/\$\{locale\}\/checkout\`\}/;
  const match = code.match(targetRegex);
  if (match) {
    const authBanner = `{!user && (
                        <button
                          onClick={() => {
                            onClose();
                            openModal('login');
                          }}
                          className="w-full mb-3 py-2 text-sm font-bold text-rubik-brand bg-rubik-brand/10 hover:bg-rubik-brand/20 rounded-xl transition-colors cursor-pointer"
                        >
                          Daxil ol və rəsmiləşdir
                        </button>
                      )}
                      <Link\n                        href={\`/\${locale}/checkout\`}`;
    code = code.replace(targetRegex, authBanner);
    fs.writeFileSync('src/components/CartDrawer.tsx', code);
  }
}
