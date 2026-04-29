'use client';
import { motion } from 'framer-motion';
import { HelpCircle, ShoppingBag, Truck, CreditCard, User, Store, RefreshCw, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

const CATEGORIES = [
  {
    icon: ShoppingBag,
    label: 'Orders',
    color: 'text-indigo-400',
    faqs: [
      { q: 'How do I track my order?', a: 'Go to My Account → Orders. Each order shows its current status: Pending, Processing, Shipped, or Delivered. You will also receive email updates at each stage.' },
      { q: 'Can I cancel or modify my order?', a: 'You can cancel an order within 1 hour of placing it from My Account → Orders → Cancel. After that, please contact the vendor directly or reach our support team.' },
      { q: 'Why is my order still "Pending"?', a: 'Pending means the vendor has not yet confirmed. Most vendors confirm within 2 hours. If it stays pending for more than 24 hours, please contact support.' },
    ],
  },
  {
    icon: Truck,
    label: 'Shipping',
    color: 'text-blue-400',
    faqs: [
      { q: 'How long does delivery take?', a: 'Dhaka city: 1–2 business days. Outside Dhaka: 3–5 business days. Remote areas may take up to 7 days.' },
      { q: 'How much does shipping cost?', a: 'Shipping fee is set by each vendor. Most charge ৳50–৳100 within Dhaka and ৳120–৳150 outside. You can see the shipping fee on the product page before checkout.' },
      { q: 'What happens if my package is lost?', a: 'Contact us within 14 days of the expected delivery date. We will investigate with the courier and either re-ship or refund your order.' },
    ],
  },
  {
    icon: CreditCard,
    label: 'Payments',
    color: 'text-green-400',
    faqs: [
      { q: 'What payment methods do you accept?', a: 'We accept bKash, Nagad, Visa, Mastercard, and Cash on Delivery (COD). BangoPay is also supported for online transactions.' },
      { q: 'Is it safe to save my card details?', a: 'Souq Al Qadam never stores card numbers. Payments are processed securely by our payment partners. Your card data is encrypted end-to-end.' },
      { q: 'When will I be charged?', a: 'For online payments, your card or mobile wallet is charged immediately at checkout. For COD, you pay the delivery agent upon receipt.' },
    ],
  },
  {
    icon: RefreshCw,
    label: 'Returns',
    color: 'text-yellow-400',
    faqs: [
      { q: 'How do I return an item?', a: 'Go to My Account → Orders → Request Return within 7 days of delivery. Select the reason and submit. The vendor will review and approve within 48 hours.' },
      { q: 'How long does a refund take?', a: 'Once the vendor receives the returned item: bKash/Nagad refunds take 3 days, card refunds take 5–7 business days.' },
      { q: 'What if I received a damaged item?', a: 'Take photos immediately and contact us at support@souqalqadam.com. We prioritise damage claims and aim to resolve them within 24 hours.' },
    ],
  },
  {
    icon: User,
    label: 'Account',
    color: 'text-purple-400',
    faqs: [
      { q: 'How do I reset my password?', a: 'Click "Forgot Password" on the login page and enter your email. You will receive a reset link within a few minutes. Check your spam folder if you don\'t see it.' },
      { q: 'Can I change my email address?', a: 'Yes. Go to My Account → Settings and update your email. A verification link will be sent to the new address.' },
      { q: 'How do I delete my account?', a: 'Go to My Account → Settings → Delete Account. This is permanent. Your order history will be anonymised and retained for legal compliance.' },
    ],
  },
  {
    icon: Store,
    label: 'Vendors',
    color: 'text-orange-400',
    faqs: [
      { q: 'How do I become a vendor?', a: 'Click "Vendor / Seller" on the Register page and fill in your shop details. Our team reviews applications within 24–48 hours.' },
      { q: 'How do vendors receive payments?', a: 'Vendor payouts are processed weekly to your registered bKash or bank account after deducting the platform commission (shown in your vendor agreement).' },
      { q: 'What commission does Souq Al Qadam charge?', a: 'Our standard commission is 8% per sale. For premium vendors with high monthly volume, reduced rates are available — contact us to discuss.' },
    ],
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/10 last:border-0">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-3 text-left gap-4">
        <span className="text-white/80 text-sm font-medium">{q}</span>
        <ChevronDown size={15} className={`text-white/40 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
          className="text-white/50 text-sm pb-3 leading-relaxed">{a}</motion.p>
      )}
    </div>
  );
}

export default function HelpPage() {
  const [active, setActive] = useState(0);
  const cat = CATEGORIES[active];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>

        {/* Header */}
        <div className="mb-8 text-center">
          <p className="text-xs text-indigo-400 font-semibold uppercase tracking-widest mb-2">Support</p>
          <div className="flex items-center justify-center gap-3 mb-2">
            <HelpCircle size={28} className="text-indigo-400" />
            <h1 className="text-3xl font-black text-white">Help Center</h1>
          </div>
          <p className="text-white/40 text-sm">Find answers to common questions</p>
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {CATEGORIES.map((c, i) => (
            <button key={i} onClick={() => setActive(i)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all
                ${active === i ? 'bg-indigo-600 text-white' : 'glass-card text-white/60 hover:text-white'}`}>
              <c.icon size={14} className={active === i ? 'text-white' : c.color} />
              {c.label}
            </button>
          ))}
        </div>

        {/* FAQ list */}
        <motion.div key={active} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <cat.icon size={18} className={cat.color} />
            <h2 className="font-bold text-white">{cat.label} FAQs</h2>
          </div>
          <div>
            {cat.faqs.map((faq, i) => <FAQItem key={i} q={faq.q} a={faq.a} />)}
          </div>
        </motion.div>

        {/* Still need help */}
        <div className="glass-card p-6 border border-indigo-500/20 text-center">
          <p className="text-white font-semibold mb-1">Still need help?</p>
          <p className="text-white/50 text-sm mb-4">Our support team is available Sunday–Thursday, 9am–6pm (BST)</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/contact" className="btn-primary text-sm px-6 py-2">Contact Us</Link>
            <a href="mailto:support@souqalqadam.com" className="glass-card text-white/70 hover:text-white text-sm px-6 py-2 rounded-lg transition-colors text-center">
              support@souqalqadam.com
            </a>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-white/30 text-xs">© 2026 Souq Al Qadam. All rights reserved.</p>
        </div>
      </motion.div>
    </div>
  );
}
