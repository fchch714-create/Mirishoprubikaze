const fs = require('fs');
let content = fs.readFileSync('src/app/[locale]/product/[slug]/page.tsx', 'utf8');

// Insert import
if (!content.includes('getProductReviews')) {
    content = content.replace("import { supabase } from '@/lib/supabase/client';", "import { supabase } from '@/lib/supabase/client';\nimport { getProductReviews } from '@/lib/actions/reviews';");
}

// Fetch reviews
if (!content.includes('const reviewsRes')) {
    content = content.replace(
        "const { data: dbRelated } = await supabase",
        `const reviewsRes = await getProductReviews(activeProduct?.id || '');\n  const realReviews = reviewsRes.success ? reviewsRes.data : [];\n\n  const { data: dbRelated } = await supabase`
    );
}

// Pass reviews down
if (!content.includes('initialReviews={realReviews}')) {
    content = content.replace(
        "dict={dict}",
        "dict={dict}\n          initialReviews={realReviews}"
    );
}

fs.writeFileSync('src/app/[locale]/product/[slug]/page.tsx', content);
