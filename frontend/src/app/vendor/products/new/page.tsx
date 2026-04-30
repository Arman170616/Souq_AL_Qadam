'use client';
import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Upload, Plus, X, Save } from 'lucide-react';
import { productsApi, vendorsApi } from '@/lib/api';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { useT } from '@/lib/i18n';
import toast from 'react-hot-toast';

const SIZES_EU = ['35','36','37','38','39','40','41','42','43','44','45','46'];

const COLOR_PALETTE = [
  { name:'Black',      hex:'#1a1a1a' },
  { name:'White',      hex:'#f0f0f0' },
  { name:'Brown',      hex:'#8B4513' },
  { name:'Tan',        hex:'#D2B48C' },
  { name:'Navy',       hex:'#1a237e' },
  { name:'Red',        hex:'#c62828' },
  { name:'Dark Brown', hex:'#3E1C00' },
  { name:'Camel',      hex:'#C19A6B' },
  { name:'Olive',      hex:'#556B2F' },
  { name:'Burgundy',   hex:'#800020' },
  { name:'Grey',       hex:'#757575' },
  { name:'Beige',      hex:'#F5F5DC' },
  { name:'Khaki',      hex:'#BDB76B' },
  { name:'Blue',       hex:'#1565C0' },
];

export default function NewProductPage() {
  const t = useT();
  const router  = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  const [form, setForm] = useState({
    name:'', description:'', price:'', discount_price:'', sku:'',
    category:'', subCategory:'', vendor_id:'', is_active:true, is_featured:false, stock:'0',
  });
  const [sizeVariants, setSizeVariants]   = useState<Record<string, string>>({});
  const [selectedColors, setSelectedColors] = useState<Set<string>>(new Set());
  const [images, setImages]               = useState<File[]>([]);
  const [previews, setPreviews]           = useState<string[]>([]);

  interface Category { id: number; name: string; parent: number | null; children?: Category[] }

  const { data: catData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => productsApi.categories().then(r => {
      const d = r.data;
      if (!d) return [];
      if (Array.isArray(d)) return d;
      if (Array.isArray(d.results)) return d.results;
      return [];
    }),
  });
  const allCategories: Category[] = Array.isArray(catData) ? catData : [];
  const topLevelCats  = allCategories.filter(c => c.parent === null);
  const selectedParent = topLevelCats.find(c => c.id === Number(form.category));
  const subCategories: Category[] = selectedParent?.children ?? [];

  const { data: vendorData } = useQuery({
    queryKey: ['admin-vendors-list'],
    queryFn: () => vendorsApi.adminList({ status: 'approved' }).then(r => r.data),
    enabled: isAdmin,
  });
  const vendorList: { id: number; shop_name: string }[] = (() => {
    const d = vendorData;
    if (!d) return [];
    if (Array.isArray(d)) return d;
    if (Array.isArray(d.results)) return d.results;
    return [];
  })();

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) =>
      setForm({ ...form, [k]: e.target.value });

  useEffect(() => {
    const total = Object.values(sizeVariants).reduce((sum, v) => sum + (parseInt(v) || 0), 0);
    if (Object.keys(sizeVariants).length > 0) setForm(prev => ({ ...prev, stock: total.toString() }));
  }, [sizeVariants]);

  const toggleSize = (s: string) =>
    setSizeVariants(prev =>
      s in prev ? (({ [s]: _, ...rest }) => rest)(prev) : { ...prev, [s]: '10' }
    );

  const toggleColor = (name: string) =>
    setSelectedColors(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImages(prev => [...prev, ...files]);
    files.forEach(f => {
      const reader = new FileReader();
      reader.onload = ev => setPreviews(prev => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(f);
    });
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        name: form.name, description: form.description,
        price: form.price, sku: form.sku,
        is_active: form.is_active, is_featured: form.is_featured,
        stock: parseInt(form.stock) || 0,
      };
      if (form.discount_price) payload.discount_price = form.discount_price;
      const finalCategory = form.subCategory || form.category;
      if (finalCategory) payload.category = parseInt(finalCategory);
      if (form.vendor_id) payload.vendor_id = parseInt(form.vendor_id);

      const { data: created } = await productsApi.create(payload);
      await Promise.all(
        Object.entries(sizeVariants).map(([size, stock]) =>
          productsApi.addVariant(created.id, { size, color: '', stock: parseInt(stock) || 0 })
        )
      );
      await Promise.all(
        Array.from(selectedColors).map(color =>
          productsApi.addVariant(created.id, { size: '', color, stock: 0 })
        )
      );
      await Promise.all(
        images.map(file => {
          const fd = new FormData();
          fd.append('image', file);
          return productsApi.uploadImage(created.id, fd);
        })
      );
      return created;
    },
    onSuccess: () => { toast.success(t('ven.product.created')); router.push('/vendor/products'); },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: Record<string, string[]> } })?.response?.data;
      toast.error(msg ? Object.values(msg).flat().join(' ') : t('ven.product.failed'));
    },
  });

  return (
    <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} className="max-w-3xl mx-auto space-y-6 p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white">{t('ven.product.title')}</h2>
          <p className="text-white/50 text-sm mt-1">{t('ven.product.subtitle')}</p>
        </div>
        <button onClick={() => createMutation.mutate()}
          disabled={createMutation.isPending || !form.name || !form.price || !form.sku}
          className="btn-primary px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm disabled:opacity-40">
          <Save size={15}/>
          {createMutation.isPending ? t('ven.product.saving') : t('ven.product.save')}
        </button>
      </div>

      {/* Basic Info */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="font-bold text-white mb-4">{t('ven.product.basicInfo')}</h3>
        <div>
          <label className="text-xs text-white/50 uppercase tracking-wider font-semibold block mb-1.5">{t('ven.product.name')}</label>
          <input value={form.name} onChange={set('name')} required className="glass-input"/>
        </div>
        <div>
          <label className="text-xs text-white/50 uppercase tracking-wider font-semibold block mb-1.5">{t('ven.product.description')}</label>
          <textarea value={form.description} onChange={set('description')} rows={4} className="glass-input resize-none"/>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-white/50 uppercase tracking-wider font-semibold block mb-1.5">{t('ven.product.price')}</label>
            <input type="number" value={form.price} onChange={set('price')} required className="glass-input"/>
          </div>
          <div>
            <label className="text-xs text-white/50 uppercase tracking-wider font-semibold block mb-1.5">
              {t('ven.product.discountPrice')} <span className="text-white/30 font-normal normal-case">({t('ven.product.optional')})</span>
            </label>
            <input type="number" value={form.discount_price} onChange={set('discount_price')} className="glass-input"/>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-white/50 uppercase tracking-wider font-semibold block mb-1.5">{t('ven.product.sku')}</label>
            <input value={form.sku} onChange={set('sku')} required className="glass-input"/>
          </div>
          <div>
            <label className="text-xs text-white/50 uppercase tracking-wider font-semibold block mb-1.5">
              {t('ven.product.baseStock')}
              {Object.keys(sizeVariants).length > 0 && (
                <span className="text-indigo-400 font-normal ms-1 normal-case">{t('ven.product.autoFromSizes')}</span>
              )}
            </label>
            <input type="number" value={form.stock} onChange={set('stock')}
              readOnly={Object.keys(sizeVariants).length > 0}
              className={`glass-input ${Object.keys(sizeVariants).length > 0 ? 'opacity-70 cursor-not-allowed' : ''}`}/>
          </div>
        </div>
        {isAdmin && (
          <div>
            <label className="text-xs text-white/50 uppercase tracking-wider font-semibold block mb-1.5">{t('ven.product.assignVendor')}</label>
            <select value={form.vendor_id} onChange={set('vendor_id')} className="glass-input">
              <option value="" className="bg-gray-900">{t('ven.product.selectVendor')}</option>
              {vendorList.map(v => (
                <option key={v.id} value={v.id} className="bg-gray-900">{v.shop_name}</option>
              ))}
            </select>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-white/50 uppercase tracking-wider font-semibold block mb-1.5">{t('ven.product.category')}</label>
            <select value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value, subCategory: '' }))}
              className="glass-input">
              <option value="" className="bg-gray-900">{t('ven.product.selectCategory')}</option>
              {topLevelCats.map(c => (
                <option key={c.id} value={c.id} className="bg-gray-900">{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-white/50 uppercase tracking-wider font-semibold block mb-1.5">
              {t('ven.product.subCategory')}
              {subCategories.length === 0 && form.category && (
                <span className="text-white/30 font-normal ms-1">{t('ven.product.noneAvailable')}</span>
              )}
            </label>
            <select value={form.subCategory}
              onChange={e => setForm(f => ({ ...f, subCategory: e.target.value }))}
              disabled={subCategories.length === 0}
              className="glass-input disabled:opacity-40">
              <option value="" className="bg-gray-900">{t('ven.product.selectSubCat')}</option>
              {subCategories.map(c => (
                <option key={c.id} value={c.id} className="bg-gray-900">{c.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_active} onChange={e => setForm({...form, is_active: e.target.checked})} className="w-4 h-4 rounded accent-indigo-500"/>
            <span className="text-sm text-white/70">{t('ven.product.active')}</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_featured} onChange={e => setForm({...form, is_featured: e.target.checked})} className="w-4 h-4 rounded accent-indigo-500"/>
            <span className="text-sm text-white/70">{t('ven.product.featured')}</span>
          </label>
        </div>
      </div>

      {/* Color Variants */}
      <div className="glass-card p-6">
        <h3 className="font-bold text-white mb-1">{t('ven.product.colorVariants')}</h3>
        <p className="text-xs text-white/40 mb-4">{t('ven.product.colorDesc')}</p>
        <div className="flex flex-wrap gap-2">
          {COLOR_PALETTE.map(c => {
            const sel = selectedColors.has(c.name);
            return (
              <button key={c.name} type="button" onClick={() => toggleColor(c.name)} title={c.name}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                  sel ? 'border-indigo-400 bg-indigo-500/20 text-white' : 'border-white/10 text-white/50 hover:border-white/30 hover:text-white'
                }`}>
                <span className="w-4 h-4 rounded-full border border-white/20 shrink-0" style={{ backgroundColor: c.hex }}/>
                {c.name}
                {sel && <X size={10} className="ms-0.5"/>}
              </button>
            );
          })}
        </div>
        {selectedColors.size > 0 && (
          <p className="text-xs text-indigo-400 mt-3">{selectedColors.size} selected</p>
        )}
      </div>

      {/* Size Variants */}
      <div className="glass-card p-6">
        <h3 className="font-bold text-white mb-1">{t('ven.product.sizesStock')}</h3>
        <p className="text-xs text-white/40 mb-3">{t('ven.product.sizesDesc')}</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {SIZES_EU.map(s => (
            <button key={s} type="button" onClick={() => toggleSize(s)}
              className={`w-12 h-10 rounded-lg text-sm font-semibold transition-all border ${
                s in sizeVariants
                  ? 'bg-indigo-500 border-indigo-400 text-white'
                  : 'glass border-white/10 text-white/50 hover:border-indigo-400 hover:text-white'
              }`}>{s}</button>
          ))}
        </div>
        {Object.keys(sizeVariants).length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-4">
            {Object.entries(sizeVariants).sort().map(([size, stock]) => (
              <div key={size} className="glass rounded-xl p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-indigo-400">EU {size}</span>
                  <button onClick={() => toggleSize(size)} className="text-white/30 hover:text-red-400 transition-colors"><X size={12}/></button>
                </div>
                <input type="number" value={stock} min="0"
                  onChange={e => setSizeVariants(prev => ({ ...prev, [size]: e.target.value }))}
                  className="glass-input py-1.5 text-sm text-center"/>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Images */}
      <div className="glass-card p-6">
        <h3 className="font-bold text-white mb-1">{t('ven.product.images')}</h3>
        <p className="text-xs text-white/40 mb-4">{t('ven.product.imagesDesc')}</p>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelect}/>
        <button type="button" onClick={() => fileRef.current?.click()}
          className="w-full border-2 border-dashed border-white/15 rounded-xl p-8 flex flex-col items-center gap-3 hover:border-indigo-400/50 hover:bg-white/3 transition-all">
          <div className="w-12 h-12 rounded-xl glass flex items-center justify-center">
            <Upload size={20} className="text-indigo-400"/>
          </div>
          <p className="text-sm text-white/50">{t('ven.product.clickUpload')}</p>
          <p className="text-xs text-white/30">{t('ven.product.imageFormats')}</p>
        </button>
        {previews.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-4">
            {previews.map((src, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden glass">
                <img src={src} alt="" className="w-full h-full object-cover"/>
                <button onClick={() => { setImages(p => p.filter((_,j) => j !== i)); setPreviews(p => p.filter((_,j) => j !== i)); }}
                  className="absolute top-1 inset-e-1 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-red-500 transition-colors">
                  <X size={12}/>
                </button>
                {i === 0 && <span className="absolute bottom-1 inset-s-1 badge badge-purple text-xs">{t('ven.product.primary')}</span>}
              </div>
            ))}
            <button type="button" onClick={() => fileRef.current?.click()}
              className="aspect-square rounded-xl border-2 border-dashed border-white/10 flex items-center justify-center hover:border-indigo-400/50 transition-colors">
              <Plus size={20} className="text-white/30"/>
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-3 pb-8">
        <button onClick={() => router.back()} className="btn-glass flex-1 py-3 rounded-xl text-sm">{t('ven.product.cancel')}</button>
        <button onClick={() => createMutation.mutate()}
          disabled={createMutation.isPending || !form.name || !form.price || !form.sku}
          className="btn-primary flex-1 py-3 rounded-xl text-sm disabled:opacity-40 flex items-center justify-center gap-2">
          <Save size={15}/>
          {createMutation.isPending ? t('ven.product.saving') : t('ven.product.save')}
        </button>
      </div>
    </motion.div>
  );
}
