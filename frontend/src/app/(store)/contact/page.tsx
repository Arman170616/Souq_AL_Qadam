'use client';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Clock, Send, MessageSquare, CheckCircle } from 'lucide-react';
import { useState } from 'react';

const CONTACT_INFO = [
  { icon: Mail,    label: 'Email',    value: 'support@souqalqadam.com',   sub: 'We reply within 24 hours' },
  { icon: Phone,   label: 'Phone',    value: '+880 1636-333333',      sub: 'Sun–Thu, 9am–6pm (BST)' },
  { icon: MapPin,  label: 'Address',  value: 'Dhaka, Bangladesh',    sub: 'Souq Al Qadam' },
  { icon: Clock,   label: 'Hours',    value: 'Sun – Thu',            sub: '9:00 AM – 6:00 PM (BST)' },
];

const SUBJECTS = [
  'Order Issue',
  'Return / Refund',
  'Payment Problem',
  'Vendor Application',
  'Technical Bug',
  'General Inquiry',
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate submission — replace with real API call when backend endpoint exists
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    setSent(true);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>

        {/* Header */}
        <div className="mb-8">
          <p className="text-xs text-indigo-400 font-semibold uppercase tracking-widest mb-2">Get in Touch</p>
          <div className="flex items-center gap-3 mb-2">
            <MessageSquare size={28} className="text-indigo-400" />
            <h1 className="text-3xl font-black text-white">Contact Us</h1>
          </div>
          <p className="text-white/40 text-sm">We're here to help. Send us a message and we'll get back to you.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Contact info cards */}
          <div className="lg:col-span-2 space-y-3">
            {CONTACT_INFO.map((c, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
                className="glass-card p-4 flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                  <c.icon size={16} className="text-indigo-400" />
                </div>
                <div>
                  <p className="text-white/40 text-xs font-semibold uppercase tracking-wider">{c.label}</p>
                  <p className="text-white text-sm font-medium">{c.value}</p>
                  <p className="text-white/40 text-xs">{c.sub}</p>
                </div>
              </motion.div>
            ))}

            {/* Map placeholder */}
            <div className="glass-card p-4 h-36 flex items-center justify-center border border-white/5">
              <div className="text-center">
                <MapPin size={24} className="text-indigo-400 mx-auto mb-2" />
                <p className="text-white/40 text-xs">Dhaka, Bangladesh</p>
              </div>
            </div>
          </div>

          {/* Contact form */}
          <div className="lg:col-span-3">
            <div className="glass-card p-6">
              {sent ? (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-10 text-center">
                  <CheckCircle size={48} className="text-green-400 mb-4" />
                  <h2 className="text-white font-bold text-xl mb-2">Message Sent!</h2>
                  <p className="text-white/50 text-sm max-w-xs">
                    Thanks for reaching out. Our team will get back to you within 24 hours.
                  </p>
                  <button onClick={() => { setSent(false); setForm({ name: '', email: '', subject: '', message: '' }); }}
                    className="mt-6 text-indigo-400 text-sm hover:text-indigo-300 transition-colors">
                    Send another message
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <h2 className="font-bold text-white mb-1">Send a Message</h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-white/50 font-semibold uppercase tracking-wider block mb-1.5">Your Name</label>
                      <input value={form.name} onChange={set('name')} required
                        className="glass-input" placeholder="John Doe" />
                    </div>
                    <div>
                      <label className="text-xs text-white/50 font-semibold uppercase tracking-wider block mb-1.5">Email Address</label>
                      <input type="email" value={form.email} onChange={set('email')} required
                        className="glass-input" placeholder="your@email.com" />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-white/50 font-semibold uppercase tracking-wider block mb-1.5">Subject</label>
                    <select value={form.subject} onChange={set('subject')} required
                      className="glass-input">
                      <option value="">Select a subject...</option>
                      {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-white/50 font-semibold uppercase tracking-wider block mb-1.5">Message</label>
                    <textarea value={form.message} onChange={set('message')} required rows={5}
                      className="glass-input resize-none"
                      placeholder="Describe your issue or question in detail..." />
                  </div>

                  <button type="submit" disabled={loading}
                    className="btn-primary w-full flex items-center justify-center gap-2 py-3 disabled:opacity-60">
                    {loading ? (
                      <span className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                    ) : (
                      <><Send size={15} /> Send Message</>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-white/30 text-xs">© 2026 Souq Al Qadam. All rights reserved.</p>
        </div>
      </motion.div>
    </div>
  );
}
