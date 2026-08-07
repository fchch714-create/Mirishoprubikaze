const fs = require('fs');
let cc = fs.readFileSync('src/components/layout/CartClientContent.tsx', 'utf8');

// Insert discountType and discountValue from useCartStore
cc = cc.replace(
  "    clearCart",
  "    clearCart,\n    discountType,\n    discountValue"
);

// We need to fix the display text for coupon. If discountType is fixed, we shouldn't show `%`.
cc = cc.replace(
  "<span>Kupon ({appliedCoupon} -{discountValue}%)</span>",
  "<span>Kupon ({appliedCoupon} -{discountValue}{discountType === 'percentage' ? '%' : ' AZN'})</span>"
);

fs.writeFileSync('src/components/layout/CartClientContent.tsx', cc);
