'use client';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';

const SECTIONS = [
  {
    title: '1. Information We Collect',
    items: [
      { label: 'Account Data', text: 'Name, email address, phone number, and password (hashed) when you register.' },
      { label: 'Order Data', text: 'Shipping addresses, order history, and payment method types (we never store card numbers).' },
      { label: 'Vendor Data', text: 'Shop name, business address, bank/mobile payment details for payouts.' },
      { label: 'Usage Data', text: 'Pages visited, search queries, browser type, and device information via server logs and analytics.' },
      { label: 'Cookies', text: 'Session cookies for cart and authentication. Preference cookies for theme and language settings.' },
    ],
  },
  {
    title: '2. How We Use Your Information',
    items: [
      { label: 'Order Processing', text: 'To process purchases, send order confirmations, and coordinate with vendors for delivery.' },
      { label: 'Account Management', text: 'To manage your account, send password reset links, and respond to support queries.' },
      { label: 'Personalization', text: 'To recommend products based on browsing and purchase history.' },
      { label: 'Vendor Payouts', text: 'To calculate commissions and process payments to vendor accounts.' },
      { label: 'Platform Improvement', text: 'To analyze usage patterns and improve our services, fix bugs, and develop new features.' },
    ],
  },
  {
    title: '3. Information Sharing',
    body: `We do not sell your personal data. We share information only as follows:\n\n• With vendors: shipping name, address, and phone number to fulfill your orders.\n• With payment providers: transaction details to process payments (bKash, Nagad, card processors).\n• With service providers: email, analytics, and hosting providers who are contractually bound to protect your data.\n• With authorities: when required by law or to protect the safety of users.\n\nAll third-party providers are required to maintain the confidentiality of your information.`,
  },
  {
    title: '4. Data Security',
    body: `We implement industry-standard security measures including:\n• All passwords are hashed using bcrypt — we never store plain text passwords.\n• HTTPS encryption for all data in transit.\n• JWT tokens with short expiry for session management.\n• Regular security audits and vulnerability assessments.\n\nNo system is 100% secure. Please use a strong, unique password and enable two-factor authentication when available.`,
  },
  {
    title: '5. Your Rights',
    body: `You have the right to:\n• Access the personal data we hold about you.\n• Correct inaccurate information via your Account Settings.\n• Request deletion of your account and associated data (subject to legal retention requirements).\n• Opt out of marketing communications at any time.\n• Data portability — request a copy of your data in machine-readable format.\n\nTo exercise these rights, email privacy@souqalqadam.com with subject "Data Request".`,
  },
  {
    title: '6. Cookies & Tracking',
    body: `We use:\n• Essential cookies: required for cart, login sessions, and checkout.\n• Preference cookies: remembers your theme (dark/light) and language.\n• Analytics cookies: aggregated, anonymous usage data (Google Analytics / self-hosted Plausible).\n\nYou can disable non-essential cookies via your browser settings. Essential cookies cannot be disabled as the site will not function without them.`,
  },
  {
    title: '7. Data Retention',
    body: `• Account data: retained until you delete your account.\n• Order history: retained for 7 years for tax and legal compliance.\n• Server logs: retained for 90 days.\n• Marketing preferences: retained until you opt out.\n\nAfter account deletion, we anonymize remaining data used for analytics within 30 days.`,
  },
  {
    title: '8. Children\'s Privacy',
    body: `Souq Al Qadam is not intended for users under 18. We do not knowingly collect personal information from minors. If you believe a minor has registered, please contact us at privacy@souqalqadam.com and we will promptly delete the account.`,
  },
  {
    title: '9. Changes to This Policy',
    body: `We may update this Privacy Policy periodically. Significant changes will be communicated via email to registered users 14 days before taking effect. Continued use after the effective date constitutes acceptance.`,
  },
  {
    title: '10. Contact Us',
    body: `For privacy-related queries:\n\nEmail: privacy@souqalqadam.com\nPhone: +880 1636-333333 (9am–6pm, Sun–Thu)\nAddress: Souq Al Qadam, Dhaka, Bangladesh`,
  },
];

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs text-indigo-400 font-semibold uppercase tracking-widest mb-2">Legal</p>
          <div className="flex items-center gap-3 mb-2">
            <Shield size={28} className="text-indigo-400" />
            <h1 className="text-3xl font-black text-white">Privacy Policy</h1>
          </div>
          <p className="text-white/40 text-sm">Last updated: April 1, 2026 · Effective immediately</p>
        </div>

        {/* Intro */}
        <div className="glass-card p-5 mb-8 border border-indigo-500/20">
          <p className="text-white/70 text-sm leading-relaxed">
            At <span className="text-white font-semibold">Souq Al Qadam</span>, your privacy matters to us.
            This policy explains what data we collect, how we use it, and your rights over your information.
            We are committed to transparency and to protecting your personal data in compliance with applicable laws.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-6">
          {SECTIONS.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: i * 0.04 }}
              className="glass-card p-6">
              <h2 className="font-bold text-white mb-4">{s.title}</h2>
              {'items' in s ? (
                <dl className="space-y-3">
                  {s.items!.map((item, j) => (
                    <div key={j}>
                      <dt className="text-white/80 text-sm font-semibold">{item.label}</dt>
                      <dd className="text-white/50 text-sm mt-0.5">{item.text}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="text-white/60 text-sm leading-relaxed whitespace-pre-line">{s.body}</p>
              )}
            </motion.div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-white/30 text-xs">© 2026 Souq Al Qadam. All rights reserved.</p>
        </div>
      </motion.div>
    </div>
  );
}
