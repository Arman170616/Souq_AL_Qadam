'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Store, User, Lock, Save, CheckCircle2 } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { vendorsApi, authApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

export default function VendorSettingsPage() {
  const { user, updateUser } = useAuthStore();

  /* ── Shop profile ── */
  const { data: vendor, isLoading, isError: noProfile } = useQuery({
    queryKey: ['vendor-me'],
    queryFn: () => vendorsApi.me().then(r => r.data),
    retry: false,
  });

  const [shop, setShop] = useState({ shop_name: '', description: '', phone: '', address: '', city: '' });
  useEffect(() => {
    if (vendor) setShop({
      shop_name:   vendor.shop_name   ?? '',
      description: vendor.description ?? '',
      phone:       vendor.phone       ?? '',
      address:     vendor.address     ?? '',
      city:        vendor.city        ?? '',
    });
  }, [vendor]);

  const shopMutation = useMutation({
    mutationFn: () => vendorsApi.updateMe(shop),
    onSuccess: () => toast.success('Shop profile updated!'),
    onError: () => toast.error('Failed to update shop profile.'),
  });

  /* ── Personal profile ── */
  const [profile, setProfile] = useState({ first_name: '', last_name: '', email: '' });
  useEffect(() => {
    if (user) setProfile({ first_name: user.first_name ?? '', last_name: user.last_name ?? '', email: user.email ?? '' });
  }, [user]);

  const profileMutation = useMutation({
    mutationFn: () => authApi.updateMe(profile),
    onSuccess: (res) => { updateUser(res.data); toast.success('Personal info updated!'); },
    onError: () => toast.error('Failed to update profile.'),
  });

  /* ── Password ── */
  const [pwd, setPwd] = useState({ old_password: '', new_password: '', confirm: '' });
  const pwdMutation = useMutation({
    mutationFn: () => {
      if (pwd.new_password !== pwd.confirm) throw new Error('Passwords do not match');
      return authApi.changePassword({ old_password: pwd.old_password, new_password: pwd.new_password });
    },
    onSuccess: () => { toast.success('Password changed!'); setPwd({ old_password: '', new_password: '', confirm: '' }); },
    onError: (e: unknown) => {
      const msg = (e as Error).message === 'Passwords do not match'
        ? 'New passwords do not match.'
        : 'Incorrect current password.';
      toast.error(msg);
    },
  });

  if (isLoading) return (
    <div className="space-y-5">
      {[1,2,3].map(i => <div key={i} className="glass-card h-48 shimmer rounded-2xl"/>)}
    </div>
  );

  if (noProfile) return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
      className="glass-card p-8 text-center border border-amber-500/30 bg-amber-500/10 max-w-lg">
      <p className="text-4xl mb-3">⏳</p>
      <h2 className="font-bold text-white mb-2">Vendor Profile Not Found</h2>
      <p className="text-white/55 text-sm">Your vendor application may be pending approval. Once approved your shop profile will appear here.</p>
      <p className="text-white/40 text-xs mt-3">Contact: <span className="text-indigo-400">support@souqalqadam.com</span> · +880 1636-333333</p>
    </motion.div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl space-y-6">

      {/* Shop Profile */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Store size={18} className="text-indigo-400"/>
          <h2 className="font-bold text-white">Shop Profile</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-white/50 mb-1 block">Shop Name</label>
            <input value={shop.shop_name} onChange={e => setShop(s => ({ ...s, shop_name: e.target.value }))} className="glass-input" placeholder="Your shop name"/>
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1 block">Description</label>
            <textarea value={shop.description} onChange={e => setShop(s => ({ ...s, description: e.target.value }))} className="glass-input resize-none min-h-20" placeholder="Describe your shop…"/>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-white/50 mb-1 block">Phone</label>
              <input value={shop.phone} onChange={e => setShop(s => ({ ...s, phone: e.target.value }))} className="glass-input" placeholder="+880 1xxx-xxxxxx"/>
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">City</label>
              <select value={shop.city} onChange={e => setShop(s => ({ ...s, city: e.target.value }))} className="glass-input">
                {['Dhaka','Chittagong','Sylhet','Khulna','Rajshahi','Barishal'].map(c =>
                  <option key={c} className="bg-gray-900">{c}</option>
                )}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1 block">Address</label>
            <input value={shop.address} onChange={e => setShop(s => ({ ...s, address: e.target.value }))} className="glass-input" placeholder="Shop / warehouse address"/>
          </div>
          <button onClick={() => shopMutation.mutate()} disabled={shopMutation.isPending}
            className="btn-primary px-5 py-2.5 rounded-xl text-sm flex items-center gap-2 disabled:opacity-50">
            <Save size={15}/>{shopMutation.isPending ? 'Saving…' : 'Save Shop Profile'}
          </button>
        </div>
      </div>

      {/* Personal Info */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-5">
          <User size={18} className="text-indigo-400"/>
          <h2 className="font-bold text-white">Personal Information</h2>
        </div>
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-white/50 mb-1 block">First Name</label>
              <input value={profile.first_name} onChange={e => setProfile(p => ({ ...p, first_name: e.target.value }))} className="glass-input"/>
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">Last Name</label>
              <input value={profile.last_name} onChange={e => setProfile(p => ({ ...p, last_name: e.target.value }))} className="glass-input"/>
            </div>
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1 block">Email</label>
            <input type="email" value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} className="glass-input"/>
          </div>
          <button onClick={() => profileMutation.mutate()} disabled={profileMutation.isPending}
            className="btn-primary px-5 py-2.5 rounded-xl text-sm flex items-center gap-2 disabled:opacity-50">
            <Save size={15}/>{profileMutation.isPending ? 'Saving…' : 'Save Personal Info'}
          </button>
        </div>
      </div>

      {/* Change Password */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Lock size={18} className="text-indigo-400"/>
          <h2 className="font-bold text-white">Change Password</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-white/50 mb-1 block">Current Password</label>
            <input type="password" value={pwd.old_password} onChange={e => setPwd(p => ({ ...p, old_password: e.target.value }))} className="glass-input" placeholder="••••••••"/>
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1 block">New Password</label>
            <input type="password" value={pwd.new_password} onChange={e => setPwd(p => ({ ...p, new_password: e.target.value }))} className="glass-input" placeholder="••••••••"/>
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1 block">Confirm New Password</label>
            <input type="password" value={pwd.confirm} onChange={e => setPwd(p => ({ ...p, confirm: e.target.value }))} className="glass-input" placeholder="••••••••"/>
          </div>
          <button onClick={() => pwdMutation.mutate()}
            disabled={pwdMutation.isPending || !pwd.old_password || !pwd.new_password || !pwd.confirm}
            className="btn-primary px-5 py-2.5 rounded-xl text-sm flex items-center gap-2 disabled:opacity-50">
            <CheckCircle2 size={15}/>{pwdMutation.isPending ? 'Changing…' : 'Change Password'}
          </button>
        </div>
      </div>

    </motion.div>
  );
}
