'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Upload, Package, ShoppingBag, BarChart2, DollarSign,
  CheckCircle2, AlertCircle, HelpCircle,
} from 'lucide-react';

const STEPS = [
  {
    step: 1, icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-400/10',
    title: 'Apply & Get Approved',
    desc: 'Submit your vendor application with your shop name and details. Our team reviews within 24 hours.',
    link: '/register', linkLabel: 'Register Now →',
  },
  {
    step: 2, icon: Upload, color: 'text-indigo-400', bg: 'bg-indigo-400/10',
    title: 'Upload Your Products',
    desc: 'Go to Products → Add New. Fill in name, price, category, add size variants and upload photos.',
    link: '/vendor/products/new', linkLabel: 'Add Product →',
  },
  {
    step: 3, icon: ShoppingBag, color: 'text-amber-400', bg: 'bg-amber-400/10',
    title: 'Receive Orders',
    desc: 'When a customer places an order, you\'ll see it in your Orders tab. Update status as you process it.',
    link: '/vendor/orders', linkLabel: 'View Orders →',
  },
  {
    step: 4, icon: DollarSign, color: 'text-pink-400', bg: 'bg-pink-400/10',
    title: 'Get Paid',
    desc: 'Revenue is calculated after platform commission (10%). Payouts are processed weekly via bKash / bank.',
    link: '/vendor/reports', linkLabel: 'View Reports →',
  },
];

const FAQ = [
  { q: 'How long does approval take?', a: 'Typically within 24 hours on business days. You\'ll receive an email once approved.' },
  { q: 'What is the commission rate?', a: '10% platform commission on each sale. You keep 90% of the selling price.' },
  { q: 'How do I upload product images?', a: 'On the Add Product page, drag and drop or click to upload up to 6 images. First image becomes the primary.' },
  { q: 'Can I set my own prices?', a: 'Yes, completely. You set your own base price and optional discount price.' },
  { q: 'How do I update an order status?', a: 'Go to Orders, expand the order row, and click the status update button to mark it as Processing or Shipped.' },
  { q: 'What payment methods do customers use?', a: 'Customers can pay via Cash on Delivery, bKash, Nagad, or Card. All are handled by the platform.' },
  { q: 'Can I pause my store?', a: 'Yes. Go to your product list and toggle any product inactive. Contact support to temporarily suspend your store.' },
  { q: 'How do I contact support?', a: 'Email support@souqalqadam.com or call +880 1636-333333 (9am–6pm, Sun–Thu).' },
];

export default function VendorGuidePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8 mb-10 text-center relative overflow-hidden"
        style={{ background: 'rgba(99,102,241,0.1)' }}>
        <div className="text-5xl mb-3">🛍️</div>
        <h1 className="text-3xl font-black text-white mb-2">Vendor Guide</h1>
        <p className="text-white/55 max-w-lg mx-auto">Everything you need to know to run a successful shop on Souq Al Qadam.</p>
        <div className="absolute -right-6 -bottom-6 text-[8rem] opacity-[0.06] select-none">🛍️</div>
      </motion.div>

      {/* Steps */}
      <h2 className="text-lg font-bold text-white mb-4">Getting Started</h2>
      <div className="grid sm:grid-cols-2 gap-5 mb-10">
        {STEPS.map((s, i) => (
          <motion.div key={s.step} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }} className="glass-card p-5">
            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
              <s.icon size={20} className={s.color} />
            </div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-white/30 uppercase tracking-wider">Step {s.step}</span>
            </div>
            <h3 className="font-bold text-white mb-1">{s.title}</h3>
            <p className="text-white/50 text-sm mb-3">{s.desc}</p>
            <Link href={s.link} className="text-indigo-400 text-sm hover:text-indigo-300 font-medium transition-colors">
              {s.linkLabel}
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Commission table */}
      <div className="glass-card p-6 mb-10">
        <h2 className="font-bold text-white mb-4 flex items-center gap-2">
          <BarChart2 size={18} className="text-indigo-400" /> Commission & Payouts
        </h2>
        <div className="overflow-x-auto">
          <table className="glass-table">
            <thead>
              <tr>
                <th>Monthly Sales</th>
                <th>Platform Commission</th>
                <th>You Keep</th>
                <th>Payout Schedule</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>৳0 – ৳50,000</td><td>10%</td><td>90%</td><td>Weekly (every Sunday)</td></tr>
              <tr><td>৳50,001 – ৳2,00,000</td><td>8%</td><td>92%</td><td>Weekly (every Sunday)</td></tr>
              <tr><td>৳2,00,001+</td><td>6%</td><td>94%</td><td>Bi-weekly</td></tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-white/30 mt-3">Payouts via bKash, Nagad, or bank transfer. Minimum payout: ৳500.</p>
      </div>

      {/* Rules */}
      <div className="glass-card p-6 mb-10">
        <h2 className="font-bold text-white mb-4 flex items-center gap-2">
          <AlertCircle size={18} className="text-amber-400" /> Vendor Rules
        </h2>
        <ul className="space-y-2 text-sm text-white/60">
          {[
            'Only list genuine products — no counterfeits or replicas.',
            'Maintain accurate stock levels. Selling out-of-stock items leads to suspension.',
            'Ship orders within 2 business days of confirmation.',
            'Respond to customer queries within 24 hours.',
            'Product images must be clear, real photos — no misleading edits.',
            'Pricing must include all taxes. No hidden charges on customers.',
            'Violation of rules may result in temporary or permanent suspension.',
          ].map((r, i) => (
            <li key={i} className="flex items-start gap-2">
              <CheckCircle2 size={14} className="text-green-400 mt-0.5 shrink-0" />
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* FAQ */}
      <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <HelpCircle size={18} className="text-indigo-400" /> Frequently Asked Questions
      </h2>
      <div className="space-y-3 mb-10">
        {FAQ.map((f, i) => (
          <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: i * 0.05 }} className="glass-card p-4">
            <p className="font-semibold text-white text-sm mb-1">{f.q}</p>
            <p className="text-white/55 text-sm">{f.a}</p>
          </motion.div>
        ))}
      </div>

      {/* CTA */}
      <div className="glass-card p-8 text-center" style={{ background: 'rgba(99,102,241,0.08)' }}>
        <Package size={40} className="text-indigo-400 mx-auto mb-3" />
        <h3 className="text-xl font-black text-white mb-2">Ready to Start Selling?</h3>
        <p className="text-white/50 text-sm mb-5">Join 200+ vendors already growing their business on Souq Al Qadam.</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link href="/register" className="btn-primary px-6 py-2.5 rounded-xl">Register & Apply</Link>
          <a href="mailto:support@souqalqadam.com" className="btn-glass px-6 py-2.5 rounded-xl">Contact Support</a>
        </div>
      </div>
    </div>
  );
}
