const fs = require('fs');
let code = fs.readFileSync('src/components/layout/MobileBottomNav.tsx', 'utf8');

if (!code.includes('useAuthModalStore')) {
  code = code.replace(
    "import { useCartStore } from '@/store/useCartStore';",
    "import { useCartStore } from '@/store/useCartStore';\nimport { useAuthModalStore } from '@/store/useAuthModalStore';\nimport { createClientComponentClient } from '@supabase/auth-helpers-nextjs';"
  );

  code = code.replace(
    "const isAdmin = false; // MOCK AUTH",
    "const [user, setUser] = useState<any>(null);\n  const { openModal } = useAuthModalStore();\n  const supabase = createClientComponentClient();"
  );

  code = code.replace(
    "useEffect(() => {\n    setMounted(true);\n  }, []);",
    "useEffect(() => {\n    setMounted(true);\n    const checkUser = async () => {\n      const { data: { user } } = await supabase.auth.getUser();\n      setUser(user);\n    };\n    checkUser();\n    \n    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {\n      setUser(session?.user || null);\n    });\n    return () => subscription.unsubscribe();\n  }, [supabase.auth]);"
  );

  // Link needs to become dynamic or conditionally handled
  code = code.replace(
    "return (\n            <Link\n              key={item.name}\n              href={item.href}\n              className={`relative flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${",
    "return (\n            <button\n              key={item.name}\n              onClick={() => {\n                if (item.href.includes('/account') && !user) {\n                  openModal('login');\n                } else {\n                  window.location.href = item.href;\n                }\n              }}\n              className={`relative flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors cursor-pointer ${"
  );
  
  code = code.replace(
    "  </span>\n            </Link>",
    "  </span>\n            </button>"
  );
  
  fs.writeFileSync('src/components/layout/MobileBottomNav.tsx', code);
}
