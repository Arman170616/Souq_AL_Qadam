import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SUBDOMAIN_META: Record<string, { title: string; description: string }> = {
  export: {
    title: 'Export Leather Shoes Bangladesh | Premium Quality Footwear - souqalqadam.com',
    description: 'Export quality leather shoes from Bangladesh. Premium craftsmanship, genuine leather, shipped worldwide. Buy direct from manufacturers.',
  },
  leather: {
    title: 'Leather Shoes Bangladesh | Genuine Leather Footwear Collection - souqalqadam.com',
    description: 'Explore our full collection of genuine leather shoes in Bangladesh. Men\'s and women\'s leather footwear crafted for comfort and style.',
  },
  nonleather: {
    title: 'Non-Leather Shoes Bangladesh | Synthetic & Canvas Footwear - souqalqadam.com',
    description: 'Affordable non-leather shoes in Bangladesh. Synthetic, canvas, and vegan footwear for men, women and kids.',
  },
  ladies: {
    title: 'Ladies Shoes Bangladesh | Women\'s Footwear Collection - souqalqadam.com',
    description: 'Trendy ladies shoes Bangladesh. Women\'s heels, flats, sandals, sneakers and boots. Shop the latest women\'s footwear collection.',
  },
  baby: {
    title: 'Baby Shoes Bangladesh | Kids Footwear Collection - souqalqadam.com',
    description: 'Soft and safe baby shoes Bangladesh. Kids footwear for boys and girls of all ages. Comfortable, durable children\'s shoes.',
  },
  leathergift: {
    title: 'Leather Gift Items Bangladesh | Wallets, Bags & Accessories - souqalqadam.com',
    description: 'Premium leather gift items from Bangladesh. Genuine leather wallets, bags, belts and accessories. Perfect corporate gifts.',
  },
  sharif: {
    title: 'Sharif Shoes Bangladesh | Premium Footwear Collection - souqalqadam.com',
    description: 'Sharif brand premium shoes Bangladesh. Quality footwear crafted with care. Explore the full Sharif collection at Souq Al Qadam.',
  },
  luxury: {
    title: 'Luxury Shoes Bangladesh | Premium Designer Footwear - souqalqadam.com',
    description: 'Luxury designer shoes in Bangladesh. Premium quality footwear for those who demand the best. Exclusive collections available.',
  },
};

export function middleware(request: NextRequest) {
  // X-Original-Host is set by nginx when proxying subdomain requests,
  // so the middleware can detect the subdomain even though Host is souqalqadam.com
  const originalHost = request.headers.get('x-original-host') || '';
  const host = originalHost || request.headers.get('host') || '';
  const subdomain = host.split('.')[0].toLowerCase();

  const response = NextResponse.next();

  if (SUBDOMAIN_META[subdomain]) {
    response.headers.set('x-subdomain', subdomain);
    response.headers.set('x-subdomain-title', SUBDOMAIN_META[subdomain].title);
    response.headers.set('x-subdomain-desc', SUBDOMAIN_META[subdomain].description);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo|og-image).*)'],
};
