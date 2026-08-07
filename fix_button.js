const fs = require('fs');
let content = fs.readFileSync('src/components/ui/Button.tsx', 'utf8');

// Replace ButtonProps extending motion to just standard button 
// It looks like it's trying to pass everything to motion.button.
// Let's just remove HTMLMotionProps and use standard React.ButtonHTMLAttributes

content = content.replace(
  "export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {",
  "export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {\n  asChild?: boolean;"
);

content = content.replace(
  "const Comp = asChild ? Slot : motion.button;",
  "const Comp = asChild ? Slot : 'button';"
);

content = content.replace(
  "import { motion, HTMLMotionProps } from 'motion/react';",
  "import { motion } from 'motion/react';"
);

fs.writeFileSync('src/components/ui/Button.tsx', content);
