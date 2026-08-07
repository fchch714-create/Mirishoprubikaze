const fs = require('fs');
let content = fs.readFileSync('src/components/ui/Button.tsx', 'utf8');

content = content.replace("export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {", "import { HTMLMotionProps } from 'motion/react';\nexport interface ButtonProps extends Omit<HTMLMotionProps<\"button\">, \"ref\"> {");

fs.writeFileSync('src/components/ui/Button.tsx', content);
