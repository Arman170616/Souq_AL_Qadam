'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { useT } from '@/lib/i18n';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [email, setEmail]     = useState('');
  const [password, setPass]   = useState('');
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const t = useT();

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await authApi.login(email, password);
      login(data.user, data.access, data.refresh);
      toast.success(`Welcome back, ${data.user.first_name || data.user.username}!`);
      const role = data.user.role;
      if (role === 'superadmin') router.push('/superadmin');
      else if (role === 'admin') router.push('/admin');
      else if (role === 'vendor') router.push('/vendor');
      else router.push('/');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Invalid email or password.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <motion.div initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="bg-white rounded-2xl px-4 py-2 shadow-lg">
              <img src="/logo/logo.png" alt="Souq Al Qadam" className="h-16 w-auto"/>
            </div>
          </Link>
          <h1 className="text-2xl font-black text-white">{t('auth.login.title')}</h1>
          <p className="text-white/50 mt-1">{t('auth.login.subtitle')}</p>
        </div>

        <div className="glass-card p-8">
          {error && (
            <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-white/50 font-semibold uppercase tracking-wider block mb-1.5">{t('auth.login.email')}</label>
              <div className="relative">
                <Mail size={15} className="absolute inset-s-3 top-1/2 -translate-y-1/2 text-white/40"/>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required className="glass-input ps-9" placeholder="your@email.com"/>
              </div>
            </div>

            <div>
              <label className="text-xs text-white/50 font-semibold uppercase tracking-wider block mb-1.5">{t('auth.login.password')}</label>
              <div className="relative">
                <Lock size={15} className="absolute inset-s-3 top-1/2 -translate-y-1/2 text-white/40"/>
                <input type={showPw?'text':'password'} value={password} onChange={e=>setPass(e.target.value)} required className="glass-input ps-9 pe-10" placeholder="••••••••"/>
                <button type="button" onClick={()=>setShowPw(!showPw)} className="absolute inset-e-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors">
                  {showPw ? <EyeOff size={15}/> : <Eye size={15}/>}
                </button>
              </div>
            </div>

            <motion.button type="submit" disabled={loading} whileTap={{scale:0.98}} className="btn-primary w-full py-3.5 rounded-xl flex items-center justify-center gap-2 mt-2">
              {loading
                ? <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin"/>
                : <><span>{t('auth.login.submit')}</span><ArrowRight size={16}/></>
              }
            </motion.button>
          </form>

          <p className="text-center text-sm text-white/50 mt-6">
            {t('auth.login.noAcct')}{' '}
            <Link href="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">{t('auth.login.signUp')}</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
