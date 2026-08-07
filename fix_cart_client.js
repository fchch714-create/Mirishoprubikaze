const fs = require('fs');
let cc = fs.readFileSync('src/components/layout/CartClientContent.tsx', 'utf8');

if (!cc.includes('import { validateCoupon }')) {
    cc = cc.replace("import { useCartStore } from '@/store/useCartStore';", "import { useCartStore } from '@/store/useCartStore';\nimport { validateCoupon } from '@/lib/actions/coupons';");
}

const hac = /const handleApplyCoupon = \(e: React\.FormEvent\) => \{[\s\S]*?\}\s*else\s*\{\s*setCouponError\([\s\S]*?\);\s*\}\s*\};/;

cc = cc.replace(hac, `const [isCouponLoading, setIsCouponLoading] = React.useState(false);
  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError(null);
    setCouponSuccess(false);

    if (!couponInput.trim()) return;
    setIsCouponLoading(true);

    const res = await validateCoupon(couponInput, subtotal);
    if (res.success && res.coupon) {
      applyCoupon(res.coupon.code, res.coupon.discount_type, res.coupon.discount_value);
      setCouponSuccess(true);
      setCouponInput('');
      setTimeout(() => setCouponSuccess(false), 4000);
    } else {
      setCouponError(res.error || 'Kupon keçərsizdir.');
    }
    setIsCouponLoading(false);
  };`);
  
// Fix discountValue missing
cc = cc.replace("const discountAmount = useCartStore((state) => {", "const discountType = useCartStore((state) => state.discountType);\n  const discountValue = useCartStore((state) => state.discountValue);\n  const discountAmount = useCartStore((state) => {");

// Adjust submit button state to use isCouponLoading
cc = cc.replace(/<button\s+type="submit"\s+disabled=\{!couponInput\.trim\(\)\}/, "<button type=\"submit\" disabled={!couponInput.trim() || isCouponLoading}");

fs.writeFileSync('src/components/layout/CartClientContent.tsx', cc);
