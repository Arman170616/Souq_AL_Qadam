'use client';
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  User, Package, MapPin, Heart, Shield, Bell, Camera,
  ShoppingBag, Trash2, Plus, Pencil, Star, X, Check,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useCartStore } from '@/store/cartStore';
import { authApi, addressesApi } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useT } from '@/lib/i18n';

const LABEL_COLORS: Record<string, string> = {
  home:  'bg-blue-500/20 text-blue-300',
  work:  'bg-purple-500/20 text-purple-300',
  other: 'bg-gray-500/20 text-gray-300',
};

const BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8000';

interface Address {
  id: number; label: string; full_name: string; phone: string;
  address_line: string; city: string; district: string;
  postal_code: string; is_default: boolean;
}

const EMPTY_ADDR = { label: 'home', full_name: '', phone: '', address_line: '', city: '', district: '', postal_code: '', is_default: false };

function AddressModal({ initial, onSave, onClose, saving }: {
  initial: Partial<Address>;
  onSave: (data: Record<string, unknown>) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const t = useT();
  const [form, setForm] = useState({ ...EMPTY_ADDR, ...initial });
  const set = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}/>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="relative glass-card w-full max-w-md p-6 space-y-4 z-10">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-white text-lg">{initial.id ? t('acct.addr.editTitle') : t('acct.addr.newTitle')}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors">
            <X size={16}/>
          </button>
        </div>

        {/* Label */}
        <div className="flex gap-2">
          {['home', 'work', 'other'].map(l => (
            <button key={l} onClick={() => set('label', l)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all border ${form.label === l ? 'bg-indigo-500/30 border-indigo-500/60 text-indigo-300' : 'border-white/10 text-white/40 hover:border-white/20 hover:text-white/70'}`}>
              {l}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-xs text-white/50 font-semibold uppercase tracking-wider block mb-1">{t('acct.addr.fullName')} *</label>
            <input value={form.full_name} onChange={e => set('full_name', e.target.value)} className="glass-input text-sm" placeholder="..."/>
          </div>
          <div className="col-span-2">
            <label className="text-xs text-white/50 font-semibold uppercase tracking-wider block mb-1">{t('acct.addr.phone')} *</label>
            <input value={form.phone} onChange={e => set('phone', e.target.value)} className="glass-input text-sm" placeholder="+968 9XXX XXXX"/>
          </div>
          <div className="col-span-2">
            <label className="text-xs text-white/50 font-semibold uppercase tracking-wider block mb-1">{t('acct.addr.addressLine')} *</label>
            <input value={form.address_line} onChange={e => set('address_line', e.target.value)} className="glass-input text-sm" placeholder="..."/>
          </div>
          <div>
            <label className="text-xs text-white/50 font-semibold uppercase tracking-wider block mb-1">{t('acct.addr.city')} *</label>
            <input value={form.city} onChange={e => set('city', e.target.value)} className="glass-input text-sm" placeholder="Muscat"/>
          </div>
          <div>
            <label className="text-xs text-white/50 font-semibold uppercase tracking-wider block mb-1">{t('acct.addr.district')}</label>
            <input value={form.district} onChange={e => set('district', e.target.value)} className="glass-input text-sm" placeholder={t('acct.addr.optional')}/>
          </div>
          <div>
            <label className="text-xs text-white/50 font-semibold uppercase tracking-wider block mb-1">{t('acct.addr.postalCode')}</label>
            <input value={form.postal_code} onChange={e => set('postal_code', e.target.value)} className="glass-input text-sm" placeholder="100"/>
          </div>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_default} onChange={e => set('is_default', e.target.checked)}
                className="w-4 h-4 rounded accent-indigo-500"/>
              <span className="text-sm text-white/70">{t('acct.addr.setDefault')}</span>
            </label>
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/60 hover:bg-white/5 text-sm font-semibold transition-all">
            {t('acct.addr.cancel')}
          </button>
          <button onClick={() => onSave(form)} disabled={saving || !form.full_name || !form.address_line || !form.city || !form.phone}
            className="flex-1 btn-primary py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50">
            {saving ? t('acct.addr.saving') : t('acct.addr.save')}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function AccountPage() {
  const t = useT();
  const { user, updateUser } = useAuthStore();
  const { items: wishlistItems, remove: removeWish } = useWishlistStore();
  const { addItem } = useCartStore();
  const qc = useQueryClient();

  const TABS = [
    { id: 'profile',  label: t('acct.tab.profile'),  icon: User },
    { id: 'orders',   label: t('acct.tab.orders'),   icon: Package },
    { id: 'address',  label: t('acct.tab.address'),  icon: MapPin },
    { id: 'wishlist', label: t('acct.tab.wishlist'), icon: Heart },
    { id: 'security', label: t('acct.tab.security'), icon: Shield },
    { id: 'notifs',   label: t('acct.tab.notifs'),   icon: Bell },
  ];

  const PW_FIELDS = [
    { k: 'old_password' as const, label: t('acct.sec.currentPw'), placeholder: '••••••••' },
    { k: 'new_password' as const, label: t('acct.sec.newPw'),     placeholder: t('acct.sec.minChars') },
    { k: 'new_password2' as const,label: t('acct.sec.confirmPw'), placeholder: t('acct.sec.reEnter') },
  ];

  const [activeTab, setTab] = useState('profile');
  const [form, setForm] = useState({
    firstName: user?.first_name || '', lastName: user?.last_name || '',
    email: user?.email || '', phone: user?.phone || '',
  });
  const [pwForm, setPwForm] = useState({ old_password: '', new_password: '', new_password2: '' });
  const [addrModal, setAddrModal] = useState<{ open: boolean; editing?: Partial<Address> }>({ open: false });

  const fileRef = useRef<HTMLInputElement>(null);

  const { data: addresses = [] } = useQuery<Address[]>({
    queryKey: ['addresses'],
    queryFn: () => addressesApi.list().then(r => r.data?.results ?? r.data ?? []),
    enabled: !!user,
  });

  const profileMutation = useMutation({
    mutationFn: () => authApi.updateMe({ first_name: form.firstName, last_name: form.lastName, phone: form.phone }),
    onSuccess: ({ data }) => { updateUser(data); toast.success('Profile updated!'); },
    onError: () => toast.error('Failed to save changes'),
  });

  const avatarMutation = useMutation({
    mutationFn: (file: File) => authApi.uploadAvatar(file),
    onSuccess: ({ data }) => { updateUser(data); toast.success('Photo updated!'); },
    onError: () => toast.error('Upload failed'),
  });

  const passwordMutation = useMutation({
    mutationFn: () => authApi.changePassword(pwForm),
    onSuccess: () => { toast.success('Password updated!'); setPwForm({ old_password: '', new_password: '', new_password2: '' }); },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: Record<string, string[]> } })?.response?.data;
      toast.error(msg ? Object.values(msg).flat().join(' ') : 'Failed to update password');
    },
  });

  const createAddrMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => addressesApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['addresses'] }); setAddrModal({ open: false }); toast.success('Address added!'); },
    onError: () => toast.error('Failed to add address'),
  });

  const updateAddrMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) => addressesApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['addresses'] }); setAddrModal({ open: false }); toast.success('Address updated!'); },
    onError: () => toast.error('Failed to update address'),
  });

  const deleteAddrMutation = useMutation({
    mutationFn: (id: number) => addressesApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['addresses'] }); toast.success('Address removed'); },
    onError: () => toast.error('Failed to remove address'),
  });

  const defaultAddrMutation = useMutation({
    mutationFn: (id: number) => addressesApi.setDefault(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['addresses'] }),
    onError: () => toast.error('Failed to set default'),
  });

  const handleSaveAddr = (data: Record<string, unknown>) => {
    if (addrModal.editing?.id) {
      updateAddrMutation.mutate({ id: addrModal.editing.id, data });
    } else {
      createAddrMutation.mutate(data);
    }
  };

  const avatarSrc = user?.avatar
    ? (user.avatar.startsWith('http') ? user.avatar : `${BASE}${user.avatar}`)
    : null;

  if (!user) return (
    <div className="max-w-lg mx-auto px-4 py-24 text-center">
      <p className="text-5xl mb-4">🔐</p>
      <h2 className="text-2xl font-bold text-white mb-2">{t('acct.signIn')}</h2>
      <Link href="/login" className="btn-primary px-8 py-3 rounded-xl inline-block mt-4">{t('nav.signIn')}</Link>
    </div>
  );

  const isSaving = createAddrMutation.isPending || updateAddrMutation.isPending;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>

        {/* Header */}
        <div className="glass-card p-6 flex flex-col sm:flex-row items-center gap-5 mb-8">
          <div className="relative group">
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-3xl font-black text-white shadow-lg">
              {avatarSrc
                ? <img src={avatarSrc} alt="avatar" className="w-full h-full object-cover"/>
                : <span>{(user.first_name?.[0] || user.email[0]).toUpperCase()}</span>
              }
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={avatarMutation.isPending}
              className="absolute -bottom-1 -inset-e-1 w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center text-white hover:bg-indigo-400 transition-colors shadow disabled:opacity-60"
              title="Upload photo">
              <Camera size={12}/>
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) avatarMutation.mutate(f); e.target.value = ''; }}/>
          </div>
          <div className="text-center sm:text-start">
            <h1 className="text-xl font-black text-white">
              {user.first_name ? `${user.first_name} ${user.last_name}`.trim() : user.username}
            </h1>
            <p className="text-white/50 text-sm">{user.email}</p>
            <span className={`badge mt-2 inline-block ${user.role === 'vendor' ? 'badge-amber' : user.role === 'admin' ? 'badge-red' : user.role === 'superadmin' ? 'badge-purple' : 'badge-green'}`}>
              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            </span>
          </div>
          <div className="sm:ms-auto flex gap-3">
            {user.role === 'vendor'     && <Link href="/vendor"     className="btn-glass text-sm px-4 py-2 rounded-xl">{t('nav.vendorDashboard')}</Link>}
            {user.role === 'admin'      && <Link href="/admin"      className="btn-primary text-sm px-4 py-2 rounded-xl">{t('nav.adminPanel')}</Link>}
            {user.role === 'superadmin' && <Link href="/superadmin" className="btn-primary text-sm px-4 py-2 rounded-xl">Super Admin</Link>}
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="glass-dark rounded-2xl p-3 h-fit">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setTab(tab.id)}
                className={`flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-1 ${activeTab === tab.id ? 'bg-indigo-500/20 text-indigo-300' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}>
                <tab.icon size={15}/> {tab.label}
                {tab.id === 'address' && addresses.length > 0 && (
                  <span className="ms-auto text-xs bg-white/10 text-white/40 px-1.5 py-0.5 rounded-full">{addresses.length}</span>
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">

              {/* ── Profile ── */}
              {activeTab === 'profile' && (
                <div className="space-y-4">
                  <h2 className="font-bold text-white text-lg mb-4">{t('acct.profile.title')}</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-white/50 font-semibold uppercase tracking-wider block mb-1.5">{t('acct.profile.firstName')}</label>
                      <input value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} className="glass-input"/>
                    </div>
                    <div>
                      <label className="text-xs text-white/50 font-semibold uppercase tracking-wider block mb-1.5">{t('acct.profile.lastName')}</label>
                      <input value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} className="glass-input"/>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-white/50 font-semibold uppercase tracking-wider block mb-1.5">{t('acct.profile.email')}</label>
                    <input value={form.email} className="glass-input opacity-60 cursor-not-allowed" readOnly/>
                  </div>
                  <div>
                    <label className="text-xs text-white/50 font-semibold uppercase tracking-wider block mb-1.5">{t('acct.profile.phone')}</label>
                    <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="glass-input" placeholder={t('acct.profile.phPlh')}/>
                  </div>
                  <button onClick={() => profileMutation.mutate()} disabled={profileMutation.isPending}
                    className="btn-primary px-6 py-2.5 rounded-xl text-sm disabled:opacity-60">
                    {profileMutation.isPending ? t('acct.profile.saving') : t('acct.profile.save')}
                  </button>
                </div>
              )}

              {/* ── Orders ── */}
              {activeTab === 'orders' && (
                <div>
                  <h2 className="font-bold text-white text-lg mb-4">{t('acct.orders.title')}</h2>
                  <Link href="/account/orders" className="btn-primary text-sm px-5 py-2.5 rounded-xl inline-flex items-center gap-2">
                    {t('acct.orders.viewAll')} →
                  </Link>
                </div>
              )}

              {/* ── Addresses ── */}
              {activeTab === 'address' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-bold text-white text-lg">{t('acct.addr.title')}</h2>
                    <button onClick={() => setAddrModal({ open: true, editing: undefined })}
                      className="flex items-center gap-1.5 btn-primary text-sm px-4 py-2 rounded-xl">
                      <Plus size={14}/> {t('acct.addr.addNew')}
                    </button>
                  </div>

                  {addresses.length === 0 ? (
                    <div className="text-center py-10">
                      <MapPin size={40} className="text-white/10 mx-auto mb-3"/>
                      <p className="text-white/50 text-sm mb-4">{t('acct.addr.empty')}</p>
                      <button onClick={() => setAddrModal({ open: true })}
                        className="btn-primary text-sm px-6 py-2.5 rounded-xl inline-flex items-center gap-2">
                        <Plus size={14}/> {t('acct.addr.addFirst')}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {addresses.map(addr => (
                        <div key={addr.id}
                          className={`rounded-xl p-4 border transition-all ${addr.is_default ? 'border-indigo-500/40 bg-indigo-500/5' : 'border-white/10 bg-white/3 hover:border-white/20'}`}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${LABEL_COLORS[addr.label] || LABEL_COLORS.other}`}>
                                {addr.label}
                              </span>
                              {addr.is_default && (
                                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300">
                                  <Star size={9} className="fill-current"/> {t('acct.addr.default')}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {!addr.is_default && (
                                <button onClick={() => defaultAddrMutation.mutate(addr.id)}
                                  title={t('acct.addr.setDefault')}
                                  className="p-1.5 rounded-lg text-white/30 hover:text-indigo-300 hover:bg-indigo-500/10 transition-all text-xs">
                                  <Check size={13}/>
                                </button>
                              )}
                              <button onClick={() => setAddrModal({ open: true, editing: addr })}
                                className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/10 transition-all">
                                <Pencil size={13}/>
                              </button>
                              <button onClick={() => deleteAddrMutation.mutate(addr.id)}
                                disabled={deleteAddrMutation.isPending}
                                className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-40">
                                <Trash2 size={13}/>
                              </button>
                            </div>
                          </div>
                          <div className="mt-2">
                            <p className="text-white font-semibold text-sm">{addr.full_name}</p>
                            <p className="text-white/50 text-xs mt-0.5">{addr.phone}</p>
                            <p className="text-white/60 text-sm mt-1">{addr.address_line}</p>
                            <p className="text-white/40 text-xs">
                              {[addr.city, addr.district, addr.postal_code].filter(Boolean).join(', ')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── Security ── */}
              {activeTab === 'security' && (
                <div className="space-y-4">
                  <h2 className="font-bold text-white text-lg mb-4">{t('acct.sec.title')}</h2>
                  {PW_FIELDS.map(({ k, label, placeholder }) => (
                    <div key={k}>
                      <label className="text-xs text-white/50 font-semibold uppercase tracking-wider block mb-1.5">{label}</label>
                      <input type="password" value={pwForm[k]}
                        onChange={e => setPwForm({ ...pwForm, [k]: e.target.value })}
                        className="glass-input" placeholder={placeholder}/>
                    </div>
                  ))}
                  <button onClick={() => passwordMutation.mutate()} disabled={passwordMutation.isPending}
                    className="btn-primary px-6 py-2.5 rounded-xl text-sm disabled:opacity-60">
                    {passwordMutation.isPending ? t('acct.sec.updating') : t('acct.sec.update')}
                  </button>
                </div>
              )}

              {/* ── Wishlist ── */}
              {activeTab === 'wishlist' && (
                <div>
                  <h2 className="font-bold text-white text-lg mb-4">
                    {t('acct.wish.title')} <span className="text-white/40 font-normal text-sm">({wishlistItems.length})</span>
                  </h2>
                  {wishlistItems.length === 0 ? (
                    <div className="text-center py-10">
                      <Heart size={40} className="text-white/10 mx-auto mb-3"/>
                      <p className="text-white/60 mb-4">{t('acct.wish.empty')}</p>
                      <Link href="/products" className="btn-primary text-sm px-6 py-2.5 rounded-xl inline-block">{t('acct.wish.browse')}</Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {wishlistItems.map(item => (
                        <div key={item.productId} className="flex items-center gap-4 glass rounded-xl p-3">
                          <Link href={`/products/${item.slug}`} className="shrink-0">
                            <div className="w-16 h-16 rounded-lg bg-white/5 overflow-hidden">
                              {item.image
                                ? <img src={item.image} alt={item.name} className="w-full h-full object-cover"/>
                                : <div className="w-full h-full flex items-center justify-center text-2xl">👟</div>}
                            </div>
                          </Link>
                          <div className="flex-1 min-w-0">
                            <Link href={`/products/${item.slug}`}>
                              <p className="font-semibold text-white text-sm line-clamp-1 hover:text-indigo-300 transition-colors">{item.name}</p>
                            </Link>
                            <p className="text-white/40 text-xs">{item.vendorName}</p>
                            <p className="text-white font-bold text-sm mt-0.5">{formatPrice(item.price)}</p>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <button onClick={() => { addItem({ id: item.productId, productId: item.productId, name: item.name, price: item.price, image: item.image, size: 'One Size', color: '', vendorName: item.vendorName, slug: item.slug }); toast.success(t('home.prod.addedToCart')); }}
                              className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 transition-all" title={t('home.prod.addToCart')}>
                              <ShoppingBag size={15}/>
                            </button>
                            <button onClick={() => removeWish(item.productId)}
                              className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all">
                              <Trash2 size={15}/>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── Notifications ── */}
              {activeTab === 'notifs' && (
                <div className="text-center py-10">
                  <Bell size={40} className="text-white/10 mx-auto mb-3"/>
                  <p className="text-white/60">{t('acct.notifs.empty')}</p>
                </div>
              )}

            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Address modal */}
      <AnimatePresence>
        {addrModal.open && (
          <AddressModal
            initial={addrModal.editing || {}}
            onSave={handleSaveAddr}
            onClose={() => setAddrModal({ open: false })}
            saving={isSaving}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
