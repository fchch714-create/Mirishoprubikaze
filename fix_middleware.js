const fs = require('fs');
let content = fs.readFileSync('src/middleware.ts', 'utf8');

// replace 'import { createServerClient } from '@supabase/ssr';' with 'import { createServerClient, type CookieOptions } from '@supabase/ssr';'
content = content.replace(
  "import { createServerClient } from '@supabase/ssr';",
  "import { createServerClient, type CookieOptions } from '@supabase/ssr';"
);

// fix setAll
content = content.replace(
  "setAll(cookiesToSet) {",
  "setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {"
);

fs.writeFileSync('src/middleware.ts', content);
