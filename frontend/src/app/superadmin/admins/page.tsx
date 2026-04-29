'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Plus, Trash2, X, Eye, EyeOff, Check } from 'lucide-react';
import { superAdminApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { useT } from '@/lib/i18n';

type AdminUser = {
  id: number; email: string; first_name: string; last_name: string;
  role: string; is_active: boolean; is_verified: boolean; created_at: string;
};

function CreateAdminModal({ onClose }: { onClose: () => void }) {
  const t = useT();
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', username: '', password: '', password2: '' });
  const [showPw, setShowPw] = useState(false);
  const qc = useQueryClient();

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const mut = useMutation({
    mutationFn: () => superAdminApi.createAdmin({ ...form }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['superadmin-admins'] });
      qc.invalidateQueries({ queryKey: ['superadmin-stats'] });
      toast.success('Admin account created!');
      onClose();
    },
    onError: (e: {response?: {data?: Record<string, string[]>}}) => {
      const d = e.response?.data ?? {};
      const msg = Object.values(d).flat()[0] ?? 'Failed to create admin';
      toast.error(msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); mut.mutate(); };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }}
        onClick={e => e.stopPropagation()}
        className="glass-card p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-purple-400"/>
            <h2 className="font-bold text-white">{t('sa.admins.createTitle')}</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 text-white/50"><X size={16}/></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/50 font-semibold uppercase tracking-wider block mb-1">{t('sa.admins.firstName')}</label>
              <input value={form.first_name} onChange={set('first_name')} required className="glass-input" placeholder="John"/>
            </div>
            <div>
              <label className="text-xs text-white/50 font-semibold uppercase tracking-wider block mb-1">{t('sa.admins.lastName')}</label>
              <input value={form.last_name} onChange={set('last_name')} className="glass-input" placeholder="Doe"/>
            </div>
          </div>
          <div>
            <label className="text-xs text-white/50 font-semibold uppercase tracking-wider block mb-1">{t('sa.admins.email')}</label>
            <input type="email" value={form.email} onChange={set('email')} required className="glass-input" placeholder="admin@example.com"/>
          </div>
          <div>
            <label className="text-xs text-white/50 font-semibold uppercase tracking-wider block mb-1">{t('sa.admins.username')}</label>
            <input value={form.username} onChange={set('username')} required className="glass-input" placeholder="admin_username"/>
          </div>
          <div>
            <label className="text-xs text-white/50 font-semibold uppercase tracking-wider block mb-1">{t('sa.admins.password')}</label>
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} value={form.password} onChange={set('password')}
                required minLength={8} className="glass-input pe-10" placeholder={t('sa.admins.minChars')}/>
              <button type="button" onClick={() => setShowPw(p => !p)}
                className="absolute inset-e-3 top-1/2 -translate-y-1/2 text-white/40">
                {showPw ? <EyeOff size={14}/> : <Eye size={14}/>}
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs text-white/50 font-semibold uppercase tracking-wider block mb-1">{t('sa.admins.confirmPw')}</label>
            <input type="password" value={form.password2} onChange={set('password2')} required className="glass-input" placeholder={t('sa.admins.reEnterPw')}/>
          </div>

          <div className="pt-2 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 glass-card text-white/60 hover:text-white py-2.5 rounded-xl text-sm transition-colors">
              {t('sa.admins.cancel')}
            </button>
            <button type="submit" disabled={mut.isPending}
              className="flex-1 btn-primary py-2.5 flex items-center justify-center gap-2 disabled:opacity-60">
              {mut.isPending
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                : <><ShieldCheck size={14}/> {t('sa.admins.createBtn')}</>}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default function SuperAdminAdminsPage() {
  const t = useT();
  const [showCreate, setShowCreate] = useState(false);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['superadmin-admins'],
    queryFn: () => superAdminApi.users({ role: 'admin' }).then(r => r.data),
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      superAdminApi.updateUser(id, { is_active }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['superadmin-admins'] }); toast.success('Updated'); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => superAdminApi.deleteUser(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['superadmin-admins'] }); qc.invalidateQueries({ queryKey: ['superadmin-stats'] }); toast.success('Admin removed'); },
    onError: (e: {response?: {data?: {detail?: string}}}) =>
      toast.error(e.response?.data?.detail ?? 'Delete failed'),
  });

  const admins: AdminUser[] = data?.results ?? [];

  return (
    <div className="space-y-5">
      <AnimatePresence>
        {showCreate && <CreateAdminModal onClose={() => setShowCreate(false)}/>}
      </AnimatePresence>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck size={22} className="text-purple-400"/>
          <h1 className="text-2xl font-black text-white">{t('sa.admins.title')}</h1>
          <span className="glass-card px-2 py-0.5 text-xs text-white/50">{admins.length} {t('sa.admins.admins')}</span>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="btn-primary text-sm px-4 py-2 flex items-center gap-2">
          <Plus size={14}/> {t('sa.admins.newAdmin')}
        </button>
      </div>

      {/* Permissions info */}
      <div className="glass-card p-4 border border-purple-500/20">
        <p className="text-white/60 text-sm">
          <span className="text-purple-400 font-semibold">Admin</span> {t('sa.admins.permInfo')}
        </p>
      </div>

      {/* Admin list */}
      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-6 h-6 rounded-full border-2 border-purple-500 border-t-transparent animate-spin"/>
        </div>
      ) : admins.length === 0 ? (
        <div className="glass-card text-center py-12 text-white/40">
          {t('sa.admins.noAdmins')}
        </div>
      ) : (
        <div className="grid gap-3">
          {admins.map((admin, i) => (
            <motion.div key={admin.id}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card p-4 flex items-center gap-4">
              {/* Avatar */}
              <div className="w-11 h-11 rounded-full bg-linear-to-br from-red-400 to-pink-600 flex items-center justify-center text-sm font-bold text-white shrink-0">
                {(admin.first_name?.[0] || admin.email[0]).toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold truncate">
                  {admin.first_name || admin.last_name
                    ? `${admin.first_name} ${admin.last_name}`.trim()
                    : admin.email}
                </p>
                <p className="text-white/40 text-xs truncate">{admin.email}</p>
                <p className="text-white/30 text-xs mt-0.5">
                  {t('sa.admins.joined')} {new Date(admin.created_at).toLocaleDateString()}
                </p>
              </div>

              {/* Status */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleMut.mutate({ id: admin.id, is_active: !admin.is_active })}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    admin.is_active
                      ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
                      : 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                  }`}>
                  {admin.is_active
                    ? <><Check size={11}/> {t('sa.admins.active')}</>
                    : <><X size={11}/> {t('sa.admins.inactive')}</>}
                </button>

                <button
                  onClick={() => { if (confirm(`Remove admin ${admin.email}?`)) deleteMut.mutate(admin.id); }}
                  className="p-2 rounded-lg text-red-400/50 hover:text-red-400 hover:bg-red-500/10 transition-all">
                  <Trash2 size={15}/>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
