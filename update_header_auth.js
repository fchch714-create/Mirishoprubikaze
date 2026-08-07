const fs = require('fs');
let code = fs.readFileSync('src/components/layout/Header.tsx', 'utf8');

// Add imports
code = code.replace(
  "import { useCartStore } from '@/store/useCartStore';",
  "import { useCartStore } from '@/store/useCartStore';\nimport { useAuthModalStore } from '@/store/useAuthModalStore';\nimport { createClientComponentClient } from '@supabase/auth-helpers-nextjs';"
);

// Add auth state in Header component
code = code.replace(
  "const [searchQuery, setSearchQuery] = React.useState('');",
  "const [searchQuery, setSearchQuery] = React.useState('');\n  const [user, setUser] = React.useState<any>(null);\n  const { openModal } = useAuthModalStore();\n  const supabase = createClientComponentClient();"
);

// Fetch user on mount
code = code.replace(
  "React.useEffect(() => {\n    setMounted(true);\n  }, []);",
  "React.useEffect(() => {\n    setMounted(true);\n    const checkUser = async () => {\n      const { data: { user } } = await supabase.auth.getUser();\n      setUser(user);\n    };\n    checkUser();\n    \n    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {\n      setUser(session?.user || null);\n    });\n    return () => subscription.unsubscribe();\n  }, [supabase.auth]);"
);

// Replace Account profile link on desktop
const accountDesktopOld = `<Link
                href={\`/\${locale}/account\`}
                className="hidden md:flex p-2.5 text-foreground hover:text-rubik-brand hover:bg-muted rounded-full transition-all duration-200"
                aria-label="Account profile"
              >
                <User className="h-5 w-5" />
              </Link>`;

const accountDesktopNew = `<button
                onClick={(e) => {
                  if (!user) {
                    e.preventDefault();
                    openModal('login');
                  } else {
                    router.push(\`/\${locale}/account\`);
                  }
                }}
                className="hidden md:flex p-2.5 text-foreground hover:text-rubik-brand hover:bg-muted rounded-full transition-all duration-200 cursor-pointer"
                aria-label="Account profile"
              >
                <User className="h-5 w-5" />
              </button>`;

code = code.replace(accountDesktopOld, accountDesktopNew);

// Replace Account link on Mobile menu bottom footer
const accountMobileOld = `<Link
                  href={\`/\${locale}/account\`}
                  className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-foreground text-card text-sm font-semibold rounded-lg hover:bg-foreground/90 transition-colors"
                >
                  Şəxsi Kabinet
                </Link>`;

const accountMobileNew = `<button
                  onClick={(e) => {
                    if (!user) {
                      e.preventDefault();
                      setIsMobileMenuOpen(false);
                      openModal('login');
                    } else {
                      setIsMobileMenuOpen(false);
                      router.push(\`/\${locale}/account\`);
                    }
                  }}
                  className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-foreground text-card text-sm font-semibold rounded-lg hover:bg-foreground/90 transition-colors cursor-pointer"
                >
                  Şəxsi Kabinet
                </button>`;

code = code.replace(accountMobileOld, accountMobileNew);

fs.writeFileSync('src/components/layout/Header.tsx', code);
