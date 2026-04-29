'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Store, MapPin, Phone, Mail, FileText, ArrowRight } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { vendorsApi } from '@/lib/api';
import toast from 'react-hot-toast';

export default function VendorRegisterPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    shop_name: '', description: '', city: '', address: '', phone: '', email: '',
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.shop_name.trim()) { toast.error('Shop name is required'); return; }
    setLoading(true);
    try {
      await vendorsApi.register(form);
      toast.success('Vendor application submitted! Awaiting admin approval.');
      qc.invalidateQueries({ queryKey: ['vendor-me'] });
      router.push('/vendor');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast.error(msg || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        className="glass-card w-full max-w-lg p-8">

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Store size={20} className="text-white"/>
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Create Vendor Profile</h1>
            <p className="text-xs text-white/40">Complete your profile to start selling</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-white/60 mb-1.5">Shop Name <span className="text-red-400">*</span></label>
            <div className="relative">
              <Store size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"/>
              <input value={form.shop_name} onChange={e => set('shop_name', e.target.value)}
                placeholder="Your shop name" required className="glass-input pl-9 text-sm"/>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/60 mb-1.5">Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)}
              placeholder="Tell customers about your shop…" rows={3}
              className="glass-input text-sm resize-none"/>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-white/60 mb-1.5">City</label>
              <div className="relative">
                <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"/>
                <input value={form.city} onChange={e => set('city', e.target.value)}
                  placeholder="Dhaka" className="glass-input pl-9 text-sm"/>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/60 mb-1.5">Phone</label>
              <div className="relative">
                <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"/>
                <input value={form.phone} onChange={e => set('phone', e.target.value)}
                  placeholder="+880…" className="glass-input pl-9 text-sm"/>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/60 mb-1.5">Business Email</label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"/>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                placeholder="shop@example.com" className="glass-input pl-9 text-sm"/>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/60 mb-1.5">Address</label>
            <div className="relative">
              <FileText size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"/>
              <input value={form.address} onChange={e => set('address', e.target.value)}
                placeholder="Full address" className="glass-input pl-9 text-sm"/>
            </div>
          </div>

          <div className="glass rounded-xl p-3 text-xs text-white/40 mt-2">
            After submitting, your application will be reviewed by an admin. You will be able to add products once approved.
          </div>

          <button type="submit" disabled={loading}
            className="btn-primary w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 mt-2 disabled:opacity-60">
            {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <ArrowRight size={16}/>}
            {loading ? 'Submitting…' : 'Submit Application'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
