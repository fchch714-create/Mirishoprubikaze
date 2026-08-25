export function sanitizeImageUrl(url?: string | null, fallbackSeed = 'default'): string {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return `https://picsum.photos/seed/${fallbackSeed}/600/600`;
  }
  const trimmed = url.trim();

  // Support base64 data URIs
  if (trimmed.startsWith('data:image/')) {
    return trimmed;
  }

  // Preserve any relative path
  if (trimmed.startsWith('/')) {
    return trimmed;
  }

  // Handle http/https URLs
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const parsed = new URL(trimmed);
      const host = parsed.hostname.toLowerCase();
      if (host === 'via.placeholder.com' || host === 'placeholder.com' || host === 'dummyimage.com') {
        const cleanSeed = parsed.pathname.split('/').filter(Boolean).pop()?.replace(/\.[^/.]+$/, '') || fallbackSeed;
        return `https://picsum.photos/seed/${cleanSeed}/600/600`;
      }
      return trimmed;
    } catch {
      return `https://picsum.photos/seed/${fallbackSeed}/600/600`;
    }
  }

  return `https://picsum.photos/seed/${fallbackSeed}/600/600`;
}
