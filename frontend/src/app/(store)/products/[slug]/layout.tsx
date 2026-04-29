import type { Metadata } from 'next';

const BASE_API = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
const SITE_URL = 'https://souqalqadam.com';

interface ProductMeta {
  name: string;
  description: string;
  price: string;
  effective_price: string;
  discount_price: string | null;
  sku: string;
  slug: string;
  primary_image: string | null;
  vendor: { shop_name: string };
  category: { name: string };
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;

  let product: ProductMeta | null = null;
  try {
    const res = await fetch(`${BASE_API}/products/${slug}/`, { next: { revalidate: 3600 } });
    if (res.ok) product = await res.json();
  } catch {}

  if (!product) {
    return { title: 'Product Not Found' };
  }

  const title       = `${product.name} — Buy Online | Souq Al Qadam`;
  const description = product.description
    ? product.description.slice(0, 155)
    : `Buy ${product.name} from ${product.vendor.shop_name} on Souq Al Qadam. Best price in Bangladesh.`;
  const price       = parseFloat(product.effective_price).toFixed(2);
  const image       = product.primary_image ?? `${SITE_URL}/og-image.jpg`;
  const url         = `${SITE_URL}/products/${slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      url,
      title,
      description,
      siteName: 'Souq Al Qadam',
      images: [{ url: image, width: 800, height: 800, alt: product.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
    other: {
      'product:price:amount':   price,
      'product:price:currency': 'BDT',
    },
  };
}

export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
