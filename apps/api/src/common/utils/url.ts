const LOCALE_FALLBACK = 'ru';

export function getPublicApiOrigin(): string {
  const rawOrigin =
    process.env.API_PUBLIC_URL ||
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '') ||
    `http://localhost:${process.env.PORT || 3101}`;

  return rawOrigin.replace(/\/$/, '');
}

export function toPublicAssetUrl(url?: string | null): string | null | undefined {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;

  const normalizedPath = url.startsWith('/') ? url : `/${url}`;
  return `${getPublicApiOrigin()}${normalizedPath}`;
}

export function normalizeLocale(locale?: string | null): string {
  if (locale === 'ru' || locale === 'en' || locale === 'kk') {
    return locale;
  }

  return LOCALE_FALLBACK;
}
