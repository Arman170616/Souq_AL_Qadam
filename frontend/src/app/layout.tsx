import type { Metadata } from 'next';
import Script from 'next/script';
import { Geist, Geist_Mono, Cairo } from 'next/font/google';
import { headers } from 'next/headers';
import './globals.css';
import QueryProvider from '@/components/providers/QueryProvider';
import ThemeProvider from '@/components/providers/ThemeProvider';
import I18nProvider from '@/components/providers/I18nProvider';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });
const cairo = Cairo({
  variable: '--font-cairo',
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
});

const SITE_URL = 'https://souqalqadam.com';

const DEFAULT_TITLE = 'Souq Al Qadam | Omani Multi-Vendor Shoe Marketplace';
const DEFAULT_DESC  = "Souq Al Qadam — Oman's premier multi-vendor shoe marketplace. Shop men's, women's & kids' footwear from top local brands. Fast delivery, genuine products.";

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const subTitle = headersList.get('x-subdomain-title');
  const subDesc  = headersList.get('x-subdomain-desc');

  const title       = subTitle || DEFAULT_TITLE;
  const description = subDesc  || DEFAULT_DESC;

  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: '%s | Souq Al Qadam' },
    description,
    keywords: [
      'export leather shoe Bangladesh', 'leather shoe export Bangladesh', 'multi vendor shoe store Bangladesh',
      'shoes Bangladesh', 'buy shoes online BD', 'footwear online Bangladesh',
      'men shoes', 'women shoes', 'kids shoes', 'sandals', 'sneakers', 'boots',
      'souq al qadam', 'shoe marketplace', 'multi-vendor shoes', 'Omani shoes',
    ],
    authors: [{ name: 'Souq Al Qadam', url: SITE_URL }],
    creator: 'Souq Al Qadam',
    publisher: 'Souq Al Qadam',
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
    },
    alternates: { canonical: SITE_URL },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: SITE_URL,
      siteName: 'Souq Al Qadam',
      title,
      description,
      images: [{ url: `${SITE_URL}/og-image.jpg`, width: 1200, height: 630, type: 'image/jpeg', alt: 'Souq Al Qadam — Shop Shoes Online in Bangladesh' }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${SITE_URL}/og-image.jpg`],
    },
    icons: { icon: '/logo/logo.png', apple: '/logo/logo.png' },
    verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION },
  };
}

const GA_ID         = process.env.NEXT_PUBLIC_GA_ID;
const GOOGLE_ADS    = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
const ADSENSE_ID    = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" className={`${geistSans.variable} ${geistMono.variable} ${cairo.variable} antialiased`} data-theme="dark" suppressHydrationWarning>
      <head suppressHydrationWarning>
        {/* Theme + locale flash prevention — runs before first paint */}
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            var s = localStorage.getItem('saq-theme');
            var t = s ? JSON.parse(s).state?.theme : 'dark';
            document.documentElement.setAttribute('data-theme', t || 'dark');
          } catch(e) {}
          try {
            var l = localStorage.getItem('saq-locale');
            var loc = l ? JSON.parse(l).state?.locale : 'en';
            if (loc === 'ar') {
              document.documentElement.setAttribute('lang', 'ar');
              document.documentElement.setAttribute('dir', 'rtl');
            }
          } catch(e) {}
        `}} />
      </head>
      <body className="gradient-bg min-h-screen">
        {/* Google AdSense */}
        {ADSENSE_ID && (
          <Script
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_ID}`}
            strategy="afterInteractive"
            crossOrigin="anonymous"
          />
        )}

        {/* Google Tag Manager / gtag.js */}
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="gtag-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}', { page_path: window.location.pathname });
                ${GOOGLE_ADS ? `gtag('config', '${GOOGLE_ADS}');` : ''}
              `}
            </Script>
          </>
        )}

        {/* Ambient orbs */}
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        <QueryProvider>
          <ThemeProvider>
            <I18nProvider>
              <div className="relative z-10">{children}</div>
            </I18nProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
