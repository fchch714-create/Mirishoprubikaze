const fs = require('fs');
let content = fs.readFileSync('src/components/CheckoutForm.tsx', 'utf8');

if (!content.includes('import { validateCoupon }')) {
    content = content.replace("import { submitOrderAtomic } from '@/lib/actions/order';", "import { submitOrderAtomic } from '@/lib/actions/order';\nimport { validateCoupon } from '@/lib/actions/coupons';");
}

// Check discount values from store
content = content.replace(
    "const discountAmount = useCartStore((state) => (subtotal * discountPercent) / 100);",
    "const discountType = useCartStore((state) => state.discountType);\n  const discountValue = useCartStore((state) => state.discountValue);\n  const discountAmount = useCartStore((state) => {\n    const subtotal = state.items.reduce((total, item) => total + item.price_azn * item.quantity, 0);\n    if (state.discountType === 'percentage') return (subtotal * state.discountValue) / 100;\n    if (state.discountType === 'fixed') return state.discountValue;\n    return 0;\n  });"
);

// We need to provide handleApplyCoupon logic
const handleApplyCouponStr = `  const [couponError, setCouponError] = React.useState('');
  const [isCouponLoading, setIsCouponLoading] = React.useState(false);
  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponError('');
    setIsCouponLoading(true);
    const res = await validateCoupon(couponInput, subtotal);
    if (res.success && res.coupon) {
      applyCoupon(res.coupon.code, res.coupon.discount_type, res.coupon.discount_value);
      setCouponInput('');
    } else {
      setCouponError(res.error || 'Kupon keçərsizdir.');
    }
    setIsCouponLoading(false);
  };
`;

content = content.replace(
    "const totalAmount = React.useMemo(() => {",
    `${handleApplyCouponStr}\n  const totalAmount = React.useMemo(() => {`
);

// Add Coupon UI right before Financial breakdown
const couponUI = `            {/* Coupon Application */}
            {!appliedCoupon && (
              <div className="pt-4 border-t border-border/80">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-2 block">
                  Promo Kodunuz Var?
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="Məsələn: PROMO10"
                    className="flex-1 bg-background border border-border rounded-xl px-3 py-2.5 text-xs text-foreground focus:outline-none focus:border-rubik-brand transition-colors"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={isCouponLoading || !couponInput.trim()}
                    className="px-4 py-2.5 bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 text-xs font-bold rounded-xl transition-colors"
                  >
                    {isCouponLoading ? 'Yoxlanır...' : 'Tətbiq Et'}
                  </button>
                </div>
                {couponError && <p className="text-red-500 text-[10px] mt-1 font-bold">{couponError}</p>}
              </div>
            )}
            
            {/* Coupon display short */}`;

content = content.replace("{/* Coupon display short */}", couponUI);

// Update WA Message formatting
content = content.replace(
    "message += `\\n🎫 *Kupon:* ${appliedCoupon} (-${discountPercent}%)\\n`;",
    "message += `\\n🎫 *Kupon:* ${appliedCoupon} (-${discountAmount.toFixed(2)} AZN)\\n`;"
);

fs.writeFileSync('src/components/CheckoutForm.tsx', content);
