const fs = require('fs');
let content = fs.readFileSync('src/components/CheckoutForm.tsx', 'utf8');

// remove lines 45, 46 from destructuring
content = content.replace("    discountType,\n    discountValue,\n", "");

fs.writeFileSync('src/components/CheckoutForm.tsx', content);

let cc = fs.readFileSync('src/components/layout/CartClientContent.tsx', 'utf8');

cc = cc.replace("    discountType,\n    discountValue,\n", "");

// fix usage in message (if any remaining) or similar
cc = cc.replace(/discountPercent/g, "discountValue");

// Let's also fix handleApplyCoupon in CartClientContent.tsx if it's broken
const hac2 = /const handleApplyCoupon = async \(\) => \{[\s\S]*?\};\s*const handleRemoveCoupon =/;
if (hac2.test(cc)) {
    cc = cc.replace(hac2, `const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    if (couponCode.toUpperCase() === 'RUBIK20') {
      applyCoupon(couponCode.toUpperCase(), 'percentage', 20);
      setCouponError('');
      setCouponCode('');
    } else {
      setCouponError('Kupon tapılmadı və ya etibarsızdır');
    }
  };
  const handleRemoveCoupon =`);
} else {
    // try to just find and replace applyCoupon
    cc = cc.replace(/applyCoupon\(couponCode\.toUpperCase\(\)\)/g, "applyCoupon(couponCode.toUpperCase(), 'percentage', 20)");
}

fs.writeFileSync('src/components/layout/CartClientContent.tsx', cc);

