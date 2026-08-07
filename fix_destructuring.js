const fs = require('fs');
let cc = fs.readFileSync('src/components/layout/CartClientContent.tsx', 'utf8');

cc = cc.replace(
  "    appliedCoupon,",
  "    appliedCoupon,\n    discountType,\n    discountValue,"
);

fs.writeFileSync('src/components/layout/CartClientContent.tsx', cc);
