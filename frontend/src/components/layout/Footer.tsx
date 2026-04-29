'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Mail, Phone, MapPin } from 'lucide-react';
import { useT } from '@/lib/i18n';

const SocialFB  = () => <svg viewBox="0 0 24 24" fill="currentColor" width={15} height={15}><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>;
const SocialIG  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={15} height={15}><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>;
const SocialX   = () => <svg viewBox="0 0 24 24" fill="currentColor" width={15} height={15}><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>;
const SocialYT  = () => <svg viewBox="0 0 24 24" fill="currentColor" width={15} height={15}><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-1.96C18.88 4 12 4 12 4s-6.88 0-8.6.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.94 1.95C5.12 20 12 20 12 20s6.88 0 8.6-.47a2.78 2.78 0 0 0 1.94-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58zM9.75 15.02V8.98L15.5 12z"/></svg>;

const SOCIAL_ITEMS = [
  { key: 'social_facebook',  Icon: SocialFB  },
  { key: 'social_instagram', Icon: SocialIG  },
  { key: 'social_twitter',   Icon: SocialX   },
  { key: 'social_youtube',   Icon: SocialYT  },
];

interface SocialSettings {
  social_facebook:  string;
  social_instagram: string;
  social_twitter:   string;
  social_youtube:   string;
  support_email:    string;
  support_phone:    string;
}

const DEFAULT_SOCIAL: SocialSettings = {
  social_facebook:  '',
  social_instagram: '',
  social_twitter:   '',
  social_youtube:   '',
  support_email:    'support@souqalqadam.com',
  support_phone:    '+968 9000-0000',
};

export default function Footer() {
  const [settings, setSettings] = useState<SocialSettings>(DEFAULT_SOCIAL);
  const t = useT();

  useEffect(() => {
    try {
      const saved = localStorage.getItem('saq-admin-settings');
      if (saved) setSettings(s => ({ ...s, ...JSON.parse(saved) }));
    } catch {}
  }, []);

  const activeSocials = SOCIAL_ITEMS.filter(
    ({ key }) => !!(settings as unknown as Record<string, string>)[key]
  );

  // Link columns built inside render so translations apply on locale change
  const links = {
    [t('footer.col.shop')]:    [{ l: t('footer.link.allProducts'),  href: '/products' }],
    [t('footer.col.account')]: [
      { l: t('footer.link.myAccount'), href: '/account' },
      { l: t('footer.link.orders'),    href: '/account/orders' },
      { l: t('footer.link.wishlist'),  href: '/wishlist' },
      { l: t('footer.link.returns'),   href: '/returns' },
    ],
    [t('footer.col.vendors')]: [
      { l: t('footer.link.becomeVendor'), href: '/register' },
      { l: t('footer.link.vendorLogin'),  href: '/login' },
      { l: t('footer.link.vendorGuide'),  href: '/vendor/guide' },
    ],
    [t('footer.col.support')]: [
      { l: t('footer.link.helpCenter'),    href: '/help' },
      { l: t('footer.link.contactUs'),     href: '/contact' },
      { l: t('footer.link.privacyPolicy'), href: '/privacy' },
      { l: t('footer.link.terms'),         href: '/terms' },
    ],
  };

  return (
    <footer className="relative mt-20 border-t border-white/10">
      <div className="glass-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-10">
            {/* Brand */}
            <div className="col-span-2">
              <Link href="/" className="inline-flex items-center gap-3 mb-4">
                <div className="bg-white rounded-2xl px-3 py-2 shrink-0 shadow-md">
                  <img src="/logo/logo.png" alt="Souq Al Qadam" className="h-16 w-auto"/>
                </div>
              </Link>
              <p className="text-sm text-white/50 leading-relaxed mb-6">
                {t('footer.description')}
              </p>
              <div className="space-y-2 text-sm text-white/50">
                <div className="flex items-center gap-2"><Mail size={14}/><span>{settings.support_email || 'support@souqalqadam.com'}</span></div>
                <div className="flex items-center gap-2"><Phone size={14}/><span>{settings.support_phone || '+968 9000-0000'}</span></div>
                <div className="flex items-center gap-2"><MapPin size={14}/><span>{t('footer.location')}</span></div>
              </div>

              {activeSocials.length > 0 ? (
                <div className="flex gap-3 mt-6">
                  {activeSocials.map(({ key, Icon }) => (
                    <a key={key} href={(settings as unknown as Record<string, string>)[key]}
                      target="_blank" rel="noopener noreferrer"
                      className="w-9 h-9 glass rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/15 transition-all">
                      <Icon />
                    </a>
                  ))}
                </div>
              ) : (
                <div className="flex gap-3 mt-6">
                  {SOCIAL_ITEMS.map(({ key, Icon }) => (
                    <a key={key} href="#"
                      className="w-9 h-9 glass rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/15 transition-all">
                      <Icon />
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Link columns */}
            {Object.entries(links).map(([title, items]) => (
              <div key={title}>
                <h4 className="font-semibold text-white mb-4 text-sm">{title}</h4>
                <ul className="space-y-2.5">
                  {items.map((item) => (
                    <li key={item.l}>
                      <Link href={item.href} className="text-sm text-white/50 hover:text-white transition-colors">
                        {item.l}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-white/40">{t('footer.copyright')}</p>
            <div className="flex items-center gap-2">
              {['Visa', 'Mastercard', 'COD'].map((p) => (
                <span key={p} className="px-2.5 py-1 glass rounded-md text-xs text-white/60 font-medium">{p}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
