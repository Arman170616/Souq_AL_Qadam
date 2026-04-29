'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowRight, Store } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/lib/api';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [role, setRole]       = useState<'customer'|'vendor'>('customer');
  const [form, setForm]       = useState({ firstName:'', lastName:'', email:'', phone:'', password:'', confirm:'', shopName:'' });
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({...form,[k]:e.target.value});

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (form.password !== form.confirm) { setError('Passwords do not match'); return; }
    setError(''); setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        email: form.email,
        username: form.email.split('@')[0],
        first_name: form.firstName,
        last_name: form.lastName,
        phone: form.phone,
        role,
        password: form.password,
        password2: form.confirm,
      };
      const { data } = await authApi.register(payload);
      login(data.user, data.access, data.refresh);
      toast.success('Account created! Welcome to Souq Al Qadam.');
      if (role === 'vendor') router.push('/vendor');
      else router.push('/');
    } catch (err: unknown) {
      const errData = (err as { response?: { data?: Record<string, string[]> } })?.response?.data;
      const msg = errData ? Object.values(errData).flat().join(' ') : 'Registration failed.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16">
      <motion.div initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="bg-white rounded-2xl px-4 py-2 shadow-lg">
              <img src="/logo/logo.png" alt="Souq Al Qadam" className="h-16 w-auto"/>
            </div>
          </Link>
          <h1 className="text-2xl font-black text-white">Create Account</h1>
          <p className="text-white/50 mt-1">{"Oman's"} premier multi-vendor shoe marketplace</p>
        </div>

        {/* Role selector */}
        <div className="flex glass-dark rounded-xl p-1 mb-6">
          <button type="button" onClick={()=>setRole('customer')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${role==='customer'?'bg-indigo-500 text-white':'text-white/60 hover:text-white'}`}>
            <User size={15}/> Customer
          </button>
          <button type="button" onClick={()=>setRole('vendor')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${role==='vendor'?'bg-indigo-500 text-white':'text-white/60 hover:text-white'}`}>
            <Store size={15}/> Vendor / Seller
          </button>
        </div>

        <div className="glass-card p-8">
          {error && <motion.div initial={{opacity:0}} animate={{opacity:1}} className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</motion.div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-white/50 font-semibold uppercase tracking-wider block mb-1.5">First Name</label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"/>
                  <input value={form.firstName} onChange={set('firstName')} required className="glass-input pl-9" placeholder="John"/>
                </div>
              </div>
              <div>
                <label className="text-xs text-white/50 font-semibold uppercase tracking-wider block mb-1.5">Last Name</label>
                <input value={form.lastName} onChange={set('lastName')} className="glass-input" placeholder="Doe"/>
              </div>
            </div>

            {role === 'vendor' && (
              <div>
                <label className="text-xs text-white/50 font-semibold uppercase tracking-wider block mb-1.5">Shop Name</label>
                <div className="relative">
                  <Store size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"/>
                  <input value={form.shopName} onChange={set('shopName')} required={role==='vendor'} className="glass-input pl-9" placeholder="Your shop name"/>
                </div>
              </div>
            )}

            <div>
              <label className="text-xs text-white/50 font-semibold uppercase tracking-wider block mb-1.5">Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"/>
                <input type="email" value={form.email} onChange={set('email')} required className="glass-input pl-9" placeholder="your@email.com"/>
              </div>
            </div>

            <div>
              <label className="text-xs text-white/50 font-semibold uppercase tracking-wider block mb-1.5">Phone</label>
              <div className="relative">
                <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"/>
                <input value={form.phone} onChange={set('phone')} className="glass-input pl-9" placeholder="+880 1xxx-xxxxxx"/>
              </div>
            </div>

            <div>
              <label className="text-xs text-white/50 font-semibold uppercase tracking-wider block mb-1.5">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"/>
                <input type={showPw?'text':'password'} value={form.password} onChange={set('password')} required minLength={8} className="glass-input pl-9 pr-10" placeholder="Min 8 characters"/>
                <button type="button" onClick={()=>setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white">
                  {showPw?<EyeOff size={15}/>:<Eye size={15}/>}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs text-white/50 font-semibold uppercase tracking-wider block mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"/>
                <input type="password" value={form.confirm} onChange={set('confirm')} required className="glass-input pl-9" placeholder="Re-enter password"/>
              </div>
            </div>

            <p className="text-xs text-white/40">By creating an account you agree to our <Link href="/terms" className="text-indigo-400 hover:text-indigo-300">Terms of Service</Link> and <Link href="/privacy" className="text-indigo-400 hover:text-indigo-300">Privacy Policy</Link>.</p>

            <motion.button type="submit" disabled={loading} whileTap={{scale:0.98}} className="btn-primary w-full py-3.5 rounded-xl flex items-center justify-center gap-2">
              {loading ? <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin"/> : <><span>Create Account</span><ArrowRight size={16}/></>}
            </motion.button>
          </form>

          <p className="text-center text-sm text-white/50 mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">Sign In</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
