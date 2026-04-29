'use client';
import { motion } from 'framer-motion';

const SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    body: `By accessing or using Souq Al Qadam ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services. We reserve the right to update these terms at any time; continued use after changes constitutes acceptance.`,
  },
  {
    title: '2. Eligibility',
    body: `You must be at least 18 years old to use this platform. By registering, you confirm you are legally eligible to enter contracts in Bangladesh. We reserve the right to terminate accounts that violate our policies.`,
  },
  {
    title: '3. Account Responsibilities',
    body: `You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately at support@souqalqadam.com if you suspect unauthorized access. Souq Al Qadam is not liable for losses resulting from unauthorized use of your account.`,
  },
  {
    title: '4. Buyer Terms',
    body: `Buyers agree to provide accurate shipping information and valid payment details. Orders once placed are binding. Returns are accepted within 7 days for manufacturing defects or incorrect items. Souq Al Qadam acts as a marketplace; disputes should first be raised with the vendor.`,
  },
  {
    title: '5. Vendor Terms',
    body: `Vendors must provide accurate product descriptions and genuine items. Counterfeits, replicas, and prohibited goods are strictly banned. Vendors must ship within 2 business days of order confirmation. Souq Al Qadam charges a platform commission (currently 10%) on each completed sale. Commission rates may be revised with 30 days notice.`,
  },
  {
    title: '6. Prohibited Activities',
    body: `Users must not: (a) list counterfeit or illegal products; (b) manipulate reviews or ratings; (c) harass other users; (d) use the platform for money laundering; (e) scrape or copy platform data without permission; (f) attempt to circumvent our security systems.`,
  },
  {
    title: '7. Payments & Refunds',
    body: `Payments are processed via bKash, Nagad, and card payment providers. Souq Al Qadam does not store card details. Refunds for approved returns are processed within 5–7 business days to the original payment method. Cash on Delivery orders are refunded via bKash or bank transfer.`,
  },
  {
    title: '8. Intellectual Property',
    body: `All platform content, logos, and trademarks are the property of Souq Al Qadam. Product images and descriptions uploaded by vendors remain their intellectual property; vendors grant Souq Al Qadam a license to display them on the platform.`,
  },
  {
    title: '9. Limitation of Liability',
    body: `Souq Al Qadam acts as an intermediary marketplace and is not liable for vendor product quality, delivery delays beyond our control, or disputes between buyers and vendors. Our maximum liability is limited to the transaction value of the disputed order.`,
  },
  {
    title: '10. Governing Law',
    body: `These terms are governed by the laws of Bangladesh. Any disputes shall be subject to the exclusive jurisdiction of courts in Dhaka, Bangladesh. We encourage amicable resolution before pursuing legal action.`,
  },
  {
    title: '11. Contact',
    body: `For questions about these terms, contact us at:\nEmail: legal@souqalqadam.com\nPhone: +880 1636-333333\nAddress: Dhaka, Bangladesh`,
  },
];

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs text-indigo-400 font-semibold uppercase tracking-widest mb-2">Legal</p>
          <h1 className="text-3xl font-black text-white mb-2">Terms of Service</h1>
          <p className="text-white/40 text-sm">Last updated: April 1, 2026 · Effective immediately</p>
        </div>

        {/* Intro box */}
        <div className="glass-card p-5 mb-8 border border-indigo-500/20">
          <p className="text-white/70 text-sm leading-relaxed">
            Welcome to <span className="text-white font-semibold">Souq Al Qadam</span> — {"Bangladesh's"} premier multi-vendor shoe marketplace.
            Please read these terms carefully before using our platform. These terms apply to all users including buyers, vendors, and visitors.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-6">
          {SECTIONS.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: i * 0.04 }}
              className="glass-card p-6">
              <h2 className="font-bold text-white mb-3">{s.title}</h2>
              <p className="text-white/60 text-sm leading-relaxed whitespace-pre-line">{s.body}</p>
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
