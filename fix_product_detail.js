const fs = require('fs');
let content = fs.readFileSync('src/components/layout/ProductDetailClientContent.tsx', 'utf8');

content = content.replace(
  "import { useCartStore } from '@/store/useCartStore';",
  "import { useCartStore } from '@/store/useCartStore';\nimport { addProductReview } from '@/lib/actions/reviews';"
);

content = content.replace(
  "dict: ApplicationDictionary;",
  "dict: ApplicationDictionary;\n  initialReviews?: any[];"
);

content = content.replace(
  "dict\n}: ProductDetailClientContentProps) {",
  "dict,\n  initialReviews = []\n}: ProductDetailClientContentProps) {"
);

// We need to find the specific state array to replace it
content = content.replace(
  /const \[reviews, setReviews\] = React\.useState\(\[\s*\{\s*id: 1[\s\S]*?\]\);/,
  "const [reviews, setReviews] = React.useState(initialReviews.length > 0 ? initialReviews : []);"
);

content = content.replace(
  "return (total / reviews.length).toFixed(1);",
  "return reviews.length > 0 ? (total / reviews.length).toFixed(1) : '5.0';"
);

const handleReviewMatch = /const handleAddReview = \(e: React\.FormEvent\) => \{[\s\S]*?setNewReviewComment\(''\);\s*setTimeout\(\(\) => setReviewSubmitted\(false\), 4000\);\s*\};/;

if (handleReviewMatch.test(content)) {
    content = content.replace(handleReviewMatch, `const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewComment.trim()) return;

    // We no longer require the user to type their name if they are logged in, 
    // but we can pass newReviewName as a fallback if desired, though DB profile name is used.
    const res = await addProductReview(product.id, newReviewRating, newReviewComment);
    if (res.success) {
      setReviews([{
        id: Date.now(),
        rating: newReviewRating,
        comment: newReviewComment,
        created_at: new Date().toISOString(),
        profiles: { full_name: newReviewName || 'Mən' }
      }, ...reviews]);
      setReviewSubmitted(true);
      setNewReviewName('');
      setNewReviewComment('');
      setTimeout(() => setReviewSubmitted(false), 4000);
    } else {
      alert(res.error || 'Xəta baş verdi.');
    }
  };`);
}

// Fix rendering of reviewer name and date
content = content.replace(
  /\{rev\.name\}/g,
  "{rev.profiles?.full_name || rev.name || 'Anonim'}"
);

content = content.replace(
  /\{rev\.date\}/g,
  "{rev.date || new Date(rev.created_at).toLocaleDateString('az-AZ')}"
);

fs.writeFileSync('src/components/layout/ProductDetailClientContent.tsx', content);
