const fs = require('fs');
let content = fs.readFileSync('src/store/useCartStore.ts', 'utf8');

// Update state types
content = content.replace(
  "discountPercent: number;",
  "discountType: 'percentage' | 'fixed' | null;\n  discountValue: number;"
);

content = content.replace(
  "applyCoupon: (code: string) => boolean;",
  "applyCoupon: (code: string, type: 'percentage' | 'fixed', value: number) => void;"
);

// Update initial state
content = content.replace(
  "discountPercent: 0,",
  "discountType: null,\n      discountValue: 0,"
);

// Update clearCart
content = content.replace(
  "discountPercent: 0",
  "discountType: null, discountValue: 0"
);

// Replace applyCoupon implementation
content = content.replace(
  /applyCoupon: \(code: string\) => \{[\s\S]*?removeCoupon: \(\) => \{/,
  `applyCoupon: (code: string, type: 'percentage' | 'fixed', value: number) => {
        set({ appliedCoupon: code, discountType: type, discountValue: value });
      },
      removeCoupon: () => {`
);

// Update removeCoupon implementation
content = content.replace(
  "set({ appliedCoupon: null, discountPercent: 0 });",
  "set({ appliedCoupon: null, discountType: null, discountValue: 0 });"
);

// Update getDiscountAmount implementation
content = content.replace(
  /getDiscountAmount: \(\) => \{[\s\S]*?getFinalPrice: \(\) => \{/,
  `getDiscountAmount: () => {
        const state = get();
        const subtotal = state.getTotalPrice();
        if (!state.appliedCoupon || !state.discountType) return 0;
        if (state.discountType === 'percentage') {
          return (subtotal * state.discountValue) / 100;
        }
        return state.discountValue;
      },
      getFinalPrice: () => {`
);

fs.writeFileSync('src/store/useCartStore.ts', content);
