'use client';
import { motion } from 'framer-motion';
import { RefreshCw, CheckCircle, XCircle, Clock, Package, Phone } from 'lucide-react';
import Link from 'next/link';

const STEPS = [
  { icon: Package,      title: 'Initiate Return',      desc: 'Go to My Account → Orders, select the item you want to return and click "Request Return" within 7 days of delivery.' },
  { icon: CheckCircle,  title: 'Vendor Review',         desc: 'The vendor reviews your request within 48 hours and approves or asks for photos if needed.' },
  { icon: RefreshCw,    title: 'Ship the Item',         desc: 'Once approved, pack the item securely and ship it to the address provided. Keep your courier receipt.' },
  { icon: Clock,        title: 'Refund Processed',      desc: 'After the vendor confirms receipt, your refund is processed within 3–5 business days to your original payment method.' },
];

const ELIGIBLE = [
  'Item received damaged or defective',
  'Wrong item or size delivered',
  'Item significantly different from description',
  'Item not received within 14 days of expected delivery',
];

const NOT_ELIGIBLE = [
  'Items returned after 7 days of delivery',
  'Used, washed, or altered items',
  'Items without original tags and packaging',
  'Custom or personalised orders',
  'Sale items marked as final sale',
];

export default function ReturnsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>

        {/* Header */}
        <div className="mb-8">
          <p className="text-xs text-indigo-400 font-semibold uppercase tracking-widest mb-2">Customer Support</p>
          <div className="flex items-center gap-3 mb-2">
            <RefreshCw size={28} className="text-indigo-400" />
            <h1 className="text-3xl font-black text-white">Returns & Refunds</h1>
          </div>
          <p className="text-white/40 text-sm">7-day return policy · Free return shipping on eligible orders</p>
        </div>

        {/* Intro */}
        <div className="glass-card p-5 mb-8 border border-indigo-500/20">
          <p className="text-white/70 text-sm leading-relaxed">
            We want you to love every purchase from <span className="text-white font-semibold">Souq Al Qadam</span>.
            If something isn't right, our simple returns process ensures a hassle-free experience.
            Please read our policy below before initiating a return.
          </p>
        </div>

        {/* Steps */}
        <div className="glass-card p-6 mb-6">
          <h2 className="font-bold text-white mb-5">How to Return an Item</h2>
          <div className="space-y-5">
            {STEPS.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="flex items-start gap-4">
                <div className="flex-shrink-0 w-9 h-9 rounded-full bg-indigo-500/20 flex items-center justify-center">
                  <s.icon size={16} className="text-indigo-400" />
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">{i + 1}. {s.title}</p>
                  <p className="text-white/50 text-sm mt-0.5">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Eligible / Not eligible */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle size={16} className="text-green-400" />
              <h2 className="font-bold text-white text-sm">Eligible for Return</h2>
            </div>
            <ul className="space-y-2">
              {ELIGIBLE.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-white/60 text-sm">
                  <span className="text-green-400 mt-0.5">✓</span> {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <XCircle size={16} className="text-red-400" />
              <h2 className="font-bold text-white text-sm">Not Eligible</h2>
            </div>
            <ul className="space-y-2">
              {NOT_ELIGIBLE.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-white/60 text-sm">
                  <span className="text-red-400 mt-0.5">✗</span> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Refund info */}
        <div className="glass-card p-6 mb-6">
          <h2 className="font-bold text-white mb-3">Refund Methods</h2>
          <div className="space-y-2 text-white/60 text-sm">
            <p>• <span className="text-white/80">bKash / Nagad:</span> Refunded within 3 business days.</p>
            <p>• <span className="text-white/80">Credit / Debit Card:</span> Refunded within 5–7 business days depending on your bank.</p>
            <p>• <span className="text-white/80">Cash on Delivery:</span> Refunded via bKash to the number provided at checkout.</p>
            <p>• <span className="text-white/80">Store Credit:</span> Available as an alternative — instant and valid for 12 months.</p>
          </div>
        </div>

        {/* CTA */}
        <div className="glass-card p-5 flex flex-col sm:flex-row items-center justify-between gap-4 border border-indigo-500/20">
          <div className="flex items-center gap-3">
            <Phone size={18} className="text-indigo-400" />
            <div>
              <p className="text-white font-semibold text-sm">Need help with a return?</p>
              <p className="text-white/50 text-xs">support@souqalqadam.com · +880 1636-333333</p>
            </div>
          </div>
          <Link href="/contact" className="btn-primary text-sm px-5 py-2 whitespace-nowrap">Contact Support</Link>
        </div>

        <div className="mt-8 text-center">
          <p className="text-white/30 text-xs">© 2026 Souq Al Qadam. All rights reserved.</p>
        </div>
      </motion.div>
    </div>
  );
}
