'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Lock, Store, Save, CheckCircle2, Share2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

export default function AdminSettingsPage() {
  const { user, updateUser } = useAuthStore();

  /* ── Personal Info ── */
  const [profile, setProfile] = useState({ first_name: '', last_name: '', email: '' });
  useEffect(() => {
    if (user) setProfile({
      first_name: user.first_name ?? '',
      last_name:  user.last_name  ?? '',
      email:      user.email      ?? '',
    });
  }, [user]);

  const profileMutation = useMutation({
    mutationFn: () => authApi.updateMe(profile),
    onSuccess: (res) => { updateUser(res.data); toast.success('Profile updated!'); },
    onError: () => toast.error('Failed to update profile.'),
  });

  /* ── Change Password ── */
  const [pwd, setPwd] = useState({ old_password: '', new_password: '', confirm: '' });
  const pwdMutation = useMutation({
    mutationFn: () => {
      if (pwd.new_password !== pwd.confirm) throw new Error('mismatch');
      return authApi.changePassword({ old_password: pwd.old_password, new_password: pwd.new_password });
    },
    onSuccess: () => {
      toast.success('Password changed!');
      setPwd({ old_password: '', new_password: '', confirm: '' });
    },
    onError: (e: unknown) => {
      toast.error((e as Error).message === 'mismatch' ? 'New passwords do not match.' : 'Incorrect current password.');
    },
  });

  /* ── Platform Settings (local/persisted) ── */
  const [platform, setPlatform] = useState({
    site_name: 'Souq Al Qadam',
    support_email: 'support@souqalqadam.com',
    support_phone: '+880 1636-333333',
    free_shipping_threshold: '2000',
    maintenance_mode: false,
    social_facebook:  '',
    social_instagram: '',
    social_twitter:   '',
    social_youtube:   '',
  });

  const savePlatform = () => {
    localStorage.setItem('saq-admin-settings', JSON.stringify(platform));
    toast.success('Platform settings saved!');
  };

  useEffect(() => {
    const saved = localStorage.getItem('saq-admin-settings');
    if (saved) { try { setPlatform(p => ({ ...p, ...JSON.parse(saved) })); } catch {} }
  }, []);

  const Section = ({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) => (
    <div className="glass-card p-6">
      <div className="flex items-center gap-2 mb-5">
        <Icon size={18} className="text-red-400"/>
        <h2 className="font-bold text-white">{title}</h2>
      </div>
      {children}
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl space-y-6">

      {/* Platform Settings */}
      <Section icon={Store} title="Platform Settings">
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-white/50 mb-1 block">Site Name</label>
              <input value={platform.site_name}
                onChange={e => setPlatform(p => ({ ...p, site_name: e.target.value }))}
                className="glass-input" placeholder="Souq Al Qadam"/>
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">Support Email</label>
              <input type="email" value={platform.support_email}
                onChange={e => setPlatform(p => ({ ...p, support_email: e.target.value }))}
                className="glass-input" placeholder="support@souqalqadam.com"/>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-white/50 mb-1 block">Support Phone</label>
              <input value={platform.support_phone}
                onChange={e => setPlatform(p => ({ ...p, support_phone: e.target.value }))}
                className="glass-input" placeholder="+880 1xxx-xxxxxx"/>
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">Free Shipping Threshold (৳)</label>
              <input type="number" value={platform.free_shipping_threshold}
                onChange={e => setPlatform(p => ({ ...p, free_shipping_threshold: e.target.value }))}
                className="glass-input" placeholder="2000"/>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <input type="checkbox" id="maintenance" checked={platform.maintenance_mode}
              onChange={e => setPlatform(p => ({ ...p, maintenance_mode: e.target.checked }))}
              className="w-4 h-4 rounded accent-amber-500"/>
            <div>
              <label htmlFor="maintenance" className="text-sm font-semibold text-amber-300 cursor-pointer">Maintenance Mode</label>
              <p className="text-xs text-white/40 mt-0.5">Temporarily disable the storefront for customers</p>
            </div>
          </div>
          <button onClick={savePlatform} className="btn-primary px-5 py-2.5 rounded-xl text-sm flex items-center gap-2">
            <Save size={15}/> Save Platform Settings
          </button>
        </div>
      </Section>

      {/* Personal Info */}
      <Section icon={User} title="Admin Profile">
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-white/50 mb-1 block">First Name</label>
              <input value={profile.first_name}
                onChange={e => setProfile(p => ({ ...p, first_name: e.target.value }))}
                className="glass-input"/>
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">Last Name</label>
              <input value={profile.last_name}
                onChange={e => setProfile(p => ({ ...p, last_name: e.target.value }))}
                className="glass-input"/>
            </div>
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1 block">Email</label>
            <input type="email" value={profile.email}
              onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
              className="glass-input"/>
          </div>
          <button onClick={() => profileMutation.mutate()} disabled={profileMutation.isPending}
            className="btn-primary px-5 py-2.5 rounded-xl text-sm flex items-center gap-2 disabled:opacity-50">
            <Save size={15}/>{profileMutation.isPending ? 'Saving…' : 'Save Profile'}
          </button>
        </div>
      </Section>

      {/* Change Password */}
      <Section icon={Lock} title="Change Password">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-white/50 mb-1 block">Current Password</label>
            <input type="password" value={pwd.old_password}
              onChange={e => setPwd(p => ({ ...p, old_password: e.target.value }))}
              className="glass-input" placeholder="••••••••"/>
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1 block">New Password</label>
            <input type="password" value={pwd.new_password}
              onChange={e => setPwd(p => ({ ...p, new_password: e.target.value }))}
              className="glass-input" placeholder="••••••••"/>
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1 block">Confirm New Password</label>
            <input type="password" value={pwd.confirm}
              onChange={e => setPwd(p => ({ ...p, confirm: e.target.value }))}
              className="glass-input" placeholder="••••••••"/>
          </div>
          <button onClick={() => pwdMutation.mutate()}
            disabled={pwdMutation.isPending || !pwd.old_password || !pwd.new_password || !pwd.confirm}
            className="btn-primary px-5 py-2.5 rounded-xl text-sm flex items-center gap-2 disabled:opacity-50">
            <CheckCircle2 size={15}/>{pwdMutation.isPending ? 'Changing…' : 'Change Password'}
          </button>
        </div>
      </Section>

      {/* Social Media */}
      <Section icon={Share2} title="Social Media Links">
        <div className="space-y-4">
          <p className="text-xs text-white/40">These URLs appear as clickable icons in the store footer. Leave blank to hide.</p>
          {[
            { key: 'social_facebook',  label: 'Facebook URL',  placeholder: 'https://facebook.com/souqalqadam' },
            { key: 'social_instagram', label: 'Instagram URL', placeholder: 'https://instagram.com/souqalqadam' },
            { key: 'social_twitter',   label: 'X (Twitter) URL', placeholder: 'https://x.com/souqalqadam' },
            { key: 'social_youtube',   label: 'YouTube URL',   placeholder: 'https://youtube.com/@souqalqadam' },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="text-xs text-white/50 mb-1 block">{label}</label>
              <input
                value={(platform as unknown as Record<string, string>)[key] ?? ''}
                onChange={e => setPlatform(p => ({ ...p, [key]: e.target.value }))}
                className="glass-input"
                placeholder={placeholder}
              />
            </div>
          ))}
          <button onClick={savePlatform} className="btn-primary px-5 py-2.5 rounded-xl text-sm flex items-center gap-2">
            <Save size={15}/> Save Social Links
          </button>
        </div>
      </Section>

      {/* Notifications (static UI) */}
      {/* <Section icon={Share2} title="Notification Preferences">
        <div className="space-y-3">
          {[
            { label: 'New vendor registration',    desc: 'Get notified when a new vendor applies', key: 'vendor_register' },
            { label: 'New order placed',           desc: 'Email alert on every new order',         key: 'new_order' },
            { label: 'Low stock alert',            desc: 'When any product drops below 5 units',  key: 'low_stock' },
            { label: 'Customer complaint',         desc: 'Direct alerts on support requests',      key: 'complaint' },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
              <div>
                <p className="text-sm font-semibold text-white">{item.label}</p>
                <p className="text-xs text-white/40 mt-0.5">{item.desc}</p>
              </div>
              <input type="checkbox" defaultChecked className="w-4 h-4 rounded accent-red-500"/>
            </div>
          ))}
        </div>
      </Section> */}

    </motion.div>
  );
}
