const fs = require('fs');
let content = fs.readFileSync('src/components/CheckoutForm.tsx', 'utf8');

content = content.replace("'use client';\n\nimport * as React from 'react';", "'use client';\n\nimport * as React from 'react';\nimport { signIn } from '@/lib/actions/auth';");

fs.writeFileSync('src/components/CheckoutForm.tsx', content);
