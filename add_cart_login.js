const fs = require('fs');
let code = fs.readFileSync('src/components/layout/CartClientContent.tsx', 'utf8');

if (!code.includes('useAuthModalStore')) {
  code = code.replace(
    "import { useCartStore } from '@/store/useCartStore';",
    "import { useCartStore } from '@/store/useCartStore';\nimport { useAuthModalStore } from '@/store/useAuthModalStore';\nimport { createClientComponentClient } from '@supabase/auth-helpers-nextjs';"
  );
  
  code = code.replace(
    "export function CartClientContent({ locale, dict }: CartClientContentProps) {",
    "export function CartClientContent({ locale, dict }: CartClientContentProps) {\n  const [user, setUser] = React.useState<any>(null);\n  const { openModal } = useAuthModalStore();\n  const supabase = createClientComponentClient();\n\n  React.useEffect(() => {\n    const checkUser = async () => {\n      const { data: { user } } = await supabase.auth.getUser();\n      setUser(user);\n    };\n    checkUser();\n    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {\n      setUser(session?.user || null);\n    });\n    return () => subscription.unsubscribe();\n  }, [supabase.auth]);"
  );
  
  // Add auth banner right before Order Summary (right column)
  const orderSummaryRegex = /\{\/\* Right Column: Order Summary \*\/\}/;
  const authBanner = `{/* Login Prompt for Guests */}
          {!user && items.length > 0 && (
            <div className="bg-gradient-to-r from-rubik-brand/10 to-rubik-brand-dark/10 border border-rubik-brand/20 rounded-2xl p-6 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white rounded-full text-rubik-brand shadow-sm shrink-0">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold text-foreground">Daha sürətli rəsmiləşdirin</h4>
                  <p className="text-sm text-muted-foreground mt-0.5">Sifarişlərinizi izləmək və endirimlərdən yararlanmaq üçün daxil olun.</p>
                </div>
              </div>
              <button
                onClick={() => openModal('login')}
                className="w-full sm:w-auto px-6 py-2.5 bg-rubik-brand text-white font-bold rounded-xl hover:bg-rubik-brand-dark transition-colors whitespace-nowrap shrink-0"
              >
                Daxil Ol
              </button>
            </div>
          )}
          
          {/* Right Column: Order Summary */}`;
          
  code = code.replace(orderSummaryRegex, authBanner);
  fs.writeFileSync('src/components/layout/CartClientContent.tsx', code);
}
