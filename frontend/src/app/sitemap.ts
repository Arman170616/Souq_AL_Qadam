import type { MetadataRoute } from 'next';

// Never statically pre-render at build time — always generated on first request
export const dynamic = 'force-dynamic';

// Use internal Docker network URL for server-side fetches (avoids HTTPS requirement)
const BASE_API = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
const SITE_URL = 'https://souqalqadam.com';

async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${BASE_API}${path}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return await res.json() as T;
  } catch {
    return null;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL,                         lastModified: new Date(), changeFrequency: 'daily',   priority: 1 },
    { url: `${SITE_URL}/products`,           lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
    { url: `${SITE_URL}/categories`,         lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${SITE_URL}/vendors`,            lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${SITE_URL}/cart`,               lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  ];

  // Products
  const productData = await fetchJson<{ results: { slug: string; updated_at?: string }[]; next: string | null }>(
    '/products/?page_size=500'
  );
  const productPages: MetadataRoute.Sitemap =
    productData?.results.map(p => ({
      url: `${SITE_URL}/products/${p.slug}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })) ?? [];

  // Categories
  const categoryData = await fetchJson<{ id: number; slug: string }[]>('/products/categories/');
  const categoryPages: MetadataRoute.Sitemap =
    (Array.isArray(categoryData) ? categoryData : []).map(c => ({
      url: `${SITE_URL}/categories/${c.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

  return [...staticPages, ...productPages, ...categoryPages];
}
