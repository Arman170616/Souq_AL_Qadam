'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Store, User, Lock, Save, CheckCircle2 } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { vendorsApi, authApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useT } from '@/lib/i18n';
import toast from 'react-hot-toast';

const OMAN_CITIES = ['Muscat','Salalah','Sohar','Nizwa','Sur','Ibri','Barka','Rustaq','Khasab','Duqm'];

export default function VendorSettingsPage() {
  const t = useT();
  const { user, updateUser } = useAuthStore();

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
    onSuccess: () => toast.success(t('ven.settings.shopUpdated')),
    onError: () => toast.error(t('ven.settings.failedShop')),
  });

  const [profile, setProfile] = useState({ first_name: '', last_name: '', email: '' });
  useEffect(() => {
    if (user) setProfile({ first_name: user.first_name ?? '', last_name: user.last_name ?? '', email: user.email ?? '' });
  }, [user]);

  const profileMutation = useMutation({
    mutationFn: () => authApi.updateMe(profile),
    onSuccess: (res) => { updateUser(res.data); toast.success(t('ven.settings.personalUpdated')); },
    onError: () => toast.error(t('ven.settings.failedPersonal')),
  });

  const [pwd, setPwd] = useState({ old_password: '', new_password: '', confirm: '' });
  const pwdMutation = useMutation({
    mutationFn: () => {
      if (pwd.new_password !== pwd.confirm) throw new Error('mismatch');
      return authApi.changePassword({ old_password: pwd.old_password, new_password: pwd.new_password });
    },
    onSuccess: () => { toast.success(t('ven.settings.pwdChanged')); setPwd({ old_password: '', new_password: '', confirm: '' }); },
    onError: (e: unknown) => {
      toast.error((e as Error).message === 'mismatch' ? t('ven.settings.pwdMismatch') : t('ven.settings.pwdIncorrect'));
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
      <h2 className="font-bold text-white mb-2">{t('ven.settings.noProfile')}</h2>
      <p className="text-white/55 text-sm">{t('ven.settings.noProfileDesc')}</p>
      <p className="text-white/40 text-xs mt-3">support@souqalqadam.com</p>
    </motion.div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl space-y-6">

      {/* Shop Profile */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Store size={18} className="text-indigo-400"/>
          <h2 className="font-bold text-white">{t('ven.settings.shopProfile')}</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-white/50 mb-1 block">{t('ven.settings.shopName')}</label>
            <input value={shop.shop_name} onChange={e => setShop(s => ({ ...s, shop_name: e.target.value }))} className="glass-input"/>
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1 block">{t('ven.settings.description')}</label>
            <textarea value={shop.description} onChange={e => setShop(s => ({ ...s, description: e.target.value }))} className="glass-input resize-none min-h-20"/>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-white/50 mb-1 block">{t('ven.settings.phone')}</label>
              <input value={shop.phone} onChange={e => setShop(s => ({ ...s, phone: e.target.value }))} className="glass-input" placeholder="+968 9xxx xxxx"/>
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">{t('ven.settings.city')}</label>
              <select value={shop.city} onChange={e => setShop(s => ({ ...s, city: e.target.value }))} className="glass-input">
                {OMAN_CITIES.map(c => <option key={c} className="bg-gray-900">{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1 block">{t('ven.settings.address')}</label>
            <input value={shop.address} onChange={e => setShop(s => ({ ...s, address: e.target.value }))} className="glass-input"/>
          </div>
          <button onClick={() => shopMutation.mutate()} disabled={shopMutation.isPending}
            className="btn-primary px-5 py-2.5 rounded-xl text-sm flex items-center gap-2 disabled:opacity-50">
            <Save size={15}/>
            {shopMutation.isPending ? t('ven.settings.saving') : t('ven.settings.saveShop')}
          </button>
        </div>
      </div>

      {/* Personal Info */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-5">
          <User size={18} className="text-indigo-400"/>
          <h2 className="font-bold text-white">{t('ven.settings.personalInfo')}</h2>
        </div>
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-white/50 mb-1 block">{t('ven.settings.firstName')}</label>
              <input value={profile.first_name} onChange={e => setProfile(p => ({ ...p, first_name: e.target.value }))} className="glass-input"/>
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">{t('ven.settings.lastName')}</label>
              <input value={profile.last_name} onChange={e => setProfile(p => ({ ...p, last_name: e.target.value }))} className="glass-input"/>
            </div>
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1 block">{t('ven.settings.email')}</label>
            <input type="email" value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} className="glass-input"/>
          </div>
          <button onClick={() => profileMutation.mutate()} disabled={profileMutation.isPending}
            className="btn-primary px-5 py-2.5 rounded-xl text-sm flex items-center gap-2 disabled:opacity-50">
            <Save size={15}/>
            {profileMutation.isPending ? t('ven.settings.saving') : t('ven.settings.savePersonal')}
          </button>
        </div>
      </div>

      {/* Change Password */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Lock size={18} className="text-indigo-400"/>
          <h2 className="font-bold text-white">{t('ven.settings.changePassword')}</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-white/50 mb-1 block">{t('ven.settings.currentPwd')}</label>
            <input type="password" value={pwd.old_password} onChange={e => setPwd(p => ({ ...p, old_password: e.target.value }))} className="glass-input" placeholder="••••••••"/>
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1 block">{t('ven.settings.newPwd')}</label>
            <input type="password" value={pwd.new_password} onChange={e => setPwd(p => ({ ...p, new_password: e.target.value }))} className="glass-input" placeholder="••••••••"/>
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1 block">{t('ven.settings.confirmPwd')}</label>
            <input type="password" value={pwd.confirm} onChange={e => setPwd(p => ({ ...p, confirm: e.target.value }))} className="glass-input" placeholder="••••••••"/>
          </div>
          <button onClick={() => pwdMutation.mutate()}
            disabled={pwdMutation.isPending || !pwd.old_password || !pwd.new_password || !pwd.confirm}
            className="btn-primary px-5 py-2.5 rounded-xl text-sm flex items-center gap-2 disabled:opacity-50">
            <CheckCircle2 size={15}/>
            {pwdMutation.isPending ? t('ven.settings.changing') : t('ven.settings.changeBtn')}
          </button>
        </div>
      </div>

    </motion.div>
  );
}
