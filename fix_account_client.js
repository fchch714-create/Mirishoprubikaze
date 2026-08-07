const fs = require('fs');
let content = fs.readFileSync('src/components/layout/AccountDashboardClient.tsx', 'utf8');

if (!content.includes("import { Calendar }")) {
  content = content.replace(
    "import { OrderTracker } from '@/components/account/OrderTracker';",
    "import { OrderTracker } from '@/components/account/OrderTracker';\nimport { Calendar } from 'lucide-react';\nimport Link from 'next/link';"
  );
}

fs.writeFileSync('src/components/layout/AccountDashboardClient.tsx', content);
