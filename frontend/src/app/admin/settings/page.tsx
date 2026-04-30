'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Lock, Store, Save, CheckCircle2, Share2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useT } from '@/lib/i18n';
import toast from 'react-hot-toast';

export default function AdminSettingsPage() {
  const t = useT();
  const { user, updateUser } = useAuthStore();

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
    onSuccess: (res) => { updateUser(res.data); toast.success(t('adm.settings.profileUpdated')); },
    onError: () => toast.error(t('adm.settings.profileFailed')),
  });

  const [pwd, setPwd] = useState({ old_password: '', new_password: '', confirm: '' });
  const pwdMutation = useMutation({
    mutationFn: () => {
      if (pwd.new_password !== pwd.confirm) throw new Error('mismatch');
      return authApi.changePassword({ old_password: pwd.old_password, new_password: pwd.new_password });
    },
    onSuccess: () => {
      toast.success(t('adm.settings.pwdChanged'));
      setPwd({ old_password: '', new_password: '', confirm: '' });
    },
    onError: (e: unknown) => {
      toast.error((e as Error).message === 'mismatch' ? t('adm.settings.pwdMismatch') : t('adm.settings.pwdIncorrect'));
    },
  });

  const [platform, setPlatform] = useState({
    site_name: 'Souq Al Qadam',
    support_email: 'support@souqalqadam.com',
    support_phone: '+968 2412 3456',
    free_shipping_threshold: '10',
    maintenance_mode: false,
    social_facebook:  '',
    social_instagram: '',
    social_twitter:   '',
    social_youtube:   '',
  });

  const savePlatform = () => {
    localStorage.setItem('saq-admin-settings', JSON.stringify(platform));
    toast.success(t('adm.settings.platformSaved'));
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

      <Section icon={Store} title={t('adm.settings.platformSettings')}>
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-white/50 mb-1 block">{t('adm.settings.siteName')}</label>
              <input value={platform.site_name}
                onChange={e => setPlatform(p => ({ ...p, site_name: e.target.value }))}
                className="glass-input" placeholder="Souq Al Qadam"/>
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">{t('adm.settings.supportEmail')}</label>
              <input type="email" value={platform.support_email}
                onChange={e => setPlatform(p => ({ ...p, support_email: e.target.value }))}
                className="glass-input" placeholder="support@souqalqadam.com"/>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-white/50 mb-1 block">{t('adm.settings.supportPhone')}</label>
              <input value={platform.support_phone}
                onChange={e => setPlatform(p => ({ ...p, support_phone: e.target.value }))}
                className="glass-input" placeholder="+968 xxxx xxxx"/>
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">{t('adm.settings.freeShipping')}</label>
              <input type="number" value={platform.free_shipping_threshold}
                onChange={e => setPlatform(p => ({ ...p, free_shipping_threshold: e.target.value }))}
                className="glass-input" placeholder="10"/>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <input type="checkbox" id="maintenance" checked={platform.maintenance_mode}
              onChange={e => setPlatform(p => ({ ...p, maintenance_mode: e.target.checked }))}
              className="w-4 h-4 rounded accent-amber-500"/>
            <div>
              <label htmlFor="maintenance" className="text-sm font-semibold text-amber-300 cursor-pointer">
                {t('adm.settings.maintenanceMode')}
              </label>
              <p className="text-xs text-white/40 mt-0.5">{t('adm.settings.maintenanceDesc')}</p>
            </div>
          </div>
          <button onClick={savePlatform} className="btn-primary px-5 py-2.5 rounded-xl text-sm flex items-center gap-2">
            <Save size={15}/> {t('adm.settings.savePlatform')}
          </button>
        </div>
      </Section>

      <Section icon={User} title={t('adm.settings.adminProfile')}>
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-white/50 mb-1 block">{t('adm.settings.firstName')}</label>
              <input value={profile.first_name}
                onChange={e => setProfile(p => ({ ...p, first_name: e.target.value }))}
                className="glass-input"/>
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">{t('adm.settings.lastName')}</label>
              <input value={profile.last_name}
                onChange={e => setProfile(p => ({ ...p, last_name: e.target.value }))}
                className="glass-input"/>
            </div>
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1 block">{t('adm.settings.email')}</label>
            <input type="email" value={profile.email}
              onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
              className="glass-input"/>
          </div>
          <button onClick={() => profileMutation.mutate()} disabled={profileMutation.isPending}
            className="btn-primary px-5 py-2.5 rounded-xl text-sm flex items-center gap-2 disabled:opacity-50">
            <Save size={15}/>
            {profileMutation.isPending ? t('adm.settings.saving') : t('adm.settings.saveProfile')}
          </button>
        </div>
      </Section>

      <Section icon={Lock} title={t('adm.settings.changePassword')}>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-white/50 mb-1 block">{t('adm.settings.currentPwd')}</label>
            <input type="password" value={pwd.old_password}
              onChange={e => setPwd(p => ({ ...p, old_password: e.target.value }))}
              className="glass-input" placeholder="••••••••"/>
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1 block">{t('adm.settings.newPwd')}</label>
            <input type="password" value={pwd.new_password}
              onChange={e => setPwd(p => ({ ...p, new_password: e.target.value }))}
              className="glass-input" placeholder="••••••••"/>
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1 block">{t('adm.settings.confirmPwd')}</label>
            <input type="password" value={pwd.confirm}
              onChange={e => setPwd(p => ({ ...p, confirm: e.target.value }))}
              className="glass-input" placeholder="••••••••"/>
          </div>
          <button onClick={() => pwdMutation.mutate()}
            disabled={pwdMutation.isPending || !pwd.old_password || !pwd.new_password || !pwd.confirm}
            className="btn-primary px-5 py-2.5 rounded-xl text-sm flex items-center gap-2 disabled:opacity-50">
            <CheckCircle2 size={15}/>
            {pwdMutation.isPending ? t('adm.settings.changing') : t('adm.settings.changeBtn')}
          </button>
        </div>
      </Section>

      <Section icon={Share2} title={t('adm.settings.socialMedia')}>
        <div className="space-y-4">
          <p className="text-xs text-white/40">{t('adm.settings.socialDesc')}</p>
          {[
            { key: 'social_facebook',  label: t('adm.settings.facebook'),  placeholder: 'https://facebook.com/souqalqadam' },
            { key: 'social_instagram', label: t('adm.settings.instagram'), placeholder: 'https://instagram.com/souqalqadam' },
            { key: 'social_twitter',   label: t('adm.settings.twitter'),   placeholder: 'https://x.com/souqalqadam' },
            { key: 'social_youtube',   label: t('adm.settings.youtube'),   placeholder: 'https://youtube.com/@souqalqadam' },
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
            <Save size={15}/> {t('adm.settings.saveSocial')}
          </button>
        </div>
      </Section>

    </motion.div>
  );
}
