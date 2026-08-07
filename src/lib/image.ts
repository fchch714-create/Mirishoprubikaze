export function sanitizeImageUrl(url?: string | null, fallbackSeed = 'default'): string {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return `https://picsum.photos/seed/${fallbackSeed}/600/600`;
  }
  const trimmed = url.trim();

  // Support base64 data URIs
  if (trimmed.startsWith('data:image/')) {
    return trimmed;
  }

  // Preserve any valid http/https URL or relative path
  if (trimmed.startsWith('/') || trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // If it's a dummy placeholder without protocol or path
  if (
    trimmed.includes('via.placeholder.com') ||
    trimmed.includes('placeholder.com') ||
    trimmed.includes('dummyimage.com')
  ) {
    const cleanSeed = trimmed.split('/').pop()?.replace(/\.[^/.]+$/, '') || fallbackSeed;
    return `https://picsum.photos/seed/${cleanSeed}/600/600`;
  }

  return `https://picsum.photos/seed/${fallbackSeed}/600/600`;
}
