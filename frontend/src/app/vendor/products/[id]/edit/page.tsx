'use client';
import { useState, useRef, use, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Upload, X, Save, Trash2 } from 'lucide-react';
import { productsApi } from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

interface Variant { id: number; size: string; color: string; stock: number; }
interface ProductImage { id: number; image: string; is_primary: boolean; }

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const productId = parseInt(id);
  const router = useRouter();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name:'', description:'', price:'', discount_price:'', sku:'',
    category:'', subCategory:'', is_active:true, is_featured:false, stock:'0',
  });
  const [sizeVariants, setSizeVariants] = useState<Record<string, { dbId?: number; stock: string }>>({});
  const [colorVariants, setColorVariants] = useState<Record<string, { dbId?: number }>>({});
  const [existingImages, setExistingImages] = useState<ProductImage[]>([]);
  const [newImages, setNewImages]           = useState<File[]>([]);
  const [newPreviews, setNewPreviews]       = useState<string[]>([]);

  interface Category { id: number; name: string; parent: number | null; children?: Category[] }

  const { data: catData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => productsApi.categories().then(r => {
      const d = r.data;
      if (Array.isArray(d)) return d;
      return d.results ?? [];
    }),
  });
  const allCategories: Category[] = Array.isArray(catData) ? catData : [];
  const topLevelCats = allCategories.filter(c => c.parent === null);
  const selectedParent = topLevelCats.find(c => c.id === Number(form.category));
  const subCategories: Category[] = selectedParent?.children ?? [];

  const { data: product, isLoading } = useQuery({
    queryKey: ['manage-product', productId],
    queryFn: () => productsApi.manageDetail(productId).then(r => r.data),
    enabled: !isNaN(productId),
  });

  useEffect(() => {
    if (!product) return;
    const catId = product.category?.id?.toString() || '';
    const catParent = product.category?.parent;
    setForm({
      name: product.name || '',
      description: product.description || '',
      price: product.price || '',
      discount_price: product.discount_price || '',
      sku: product.sku || '',
      category: catParent ? catParent.toString() : catId,
      subCategory: catParent ? catId : '',
      is_active: product.is_active ?? true,
      is_featured: product.is_featured ?? false,
      stock: product.stock?.toString() || '0',
    });
    setExistingImages(product.images || []);
    // Split variants into size and color buckets
    const sizeMap: Record<string, { dbId: number; stock: string }> = {};
    const colorMap: Record<string, { dbId: number }> = {};
    (product.variants || []).forEach((v: Variant) => {
      if (v.size && !v.color) {
        sizeMap[v.size] = { dbId: v.id, stock: v.stock.toString() };
      } else if (v.color && !v.size) {
        colorMap[v.color] = { dbId: v.id };
      }
    });
    setSizeVariants(sizeMap);
    setColorVariants(colorMap);
  }, [product]);

  // Auto-sum size stocks → Base Stock
  useEffect(() => {
    const total = Object.values(sizeVariants).reduce((sum, v) => sum + (parseInt(v.stock) || 0), 0);
    if (Object.keys(sizeVariants).length > 0) {
      setForm(prev => ({ ...prev, stock: total.toString() }));
    }
  }, [sizeVariants]);

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [k]: e.target.value }));

  const toggleSize = (s: string) => {
    setSizeVariants(prev => {
      if (s in prev) { const { [s]: _, ...rest } = prev; return rest; }
      return { ...prev, [s]: { stock: '10' } };
    });
  };

  const toggleColor = (name: string) => {
    setColorVariants(prev => {
      if (name in prev) { const { [name]: _, ...rest } = prev; return rest; }
      return { ...prev, [name]: {} };
    });
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setNewImages(prev => [...prev, ...files]);
    files.forEach(f => {
      const reader = new FileReader();
      reader.onload = ev => setNewPreviews(prev => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(f);
    });
  };

  const deleteImageMutation = useMutation({
    mutationFn: (imgId: number) => productsApi.deleteImage(productId, imgId),
    onSuccess: (_data, imgId) => {
      setExistingImages(prev => prev.filter(i => i.id !== imgId));
      toast.success('Image removed');
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      // 1. Update base product
      const payload: Record<string, unknown> = {
        name: form.name, description: form.description,
        price: form.price, sku: form.sku,
        is_active: form.is_active, is_featured: form.is_featured,
        stock: parseInt(form.stock) || 0,
      };
      if (form.discount_price) payload.discount_price = form.discount_price;
      else payload.discount_price = null;
      const finalCategory = form.subCategory || form.category;
      if (finalCategory) payload.category = parseInt(finalCategory);
      await productsApi.update(productId, payload);

      // 2. Size variants — create new ones, update existing stock
      await Promise.all(
        Object.entries(sizeVariants).map(([size, entry]) => {
          if (entry.dbId) {
            return productsApi.updateVariant(productId, entry.dbId, { stock: parseInt(entry.stock) || 0 });
          }
          return productsApi.addVariant(productId, { size, color: '', stock: parseInt(entry.stock) || 0 });
        })
      );

      // 3. Color variants — create new ones (existing ones with dbId are kept)
      await Promise.all(
        Object.entries(colorVariants).map(([color, entry]) => {
          if (entry.dbId) return Promise.resolve();
          return productsApi.addVariant(productId, { size: '', color, stock: 0 });
        })
      );

      // 4. Upload new images
      await Promise.all(
        newImages.map(file => {
          const fd = new FormData();
          fd.append('image', file);
          return productsApi.uploadImage(productId, fd);
        })
      );
    },
    onSuccess: () => {
      toast.success('Product updated!');
      qc.invalidateQueries({ queryKey: ['vendor-products'] });
      router.push('/vendor/products');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: Record<string, string[]> } })?.response?.data;
      toast.error(msg ? Object.values(msg).flat().join(' ') : 'Failed to update product');
    },
  });

  if (isLoading) return (
    <div className="max-w-3xl mx-auto p-8 space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="glass-card h-32 animate-pulse"/>
      ))}
    </div>
  );

  if (!product) return (
    <div className="max-w-3xl mx-auto p-8 text-center text-white/50">
      <p className="text-xl font-bold mb-2">Product not found</p>
      <button onClick={() => router.back()} className="btn-glass px-5 py-2 rounded-xl text-sm mt-4">Go Back</button>
    </div>
  );

  return (
    <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} className="max-w-3xl mx-auto space-y-6 p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white">Edit Product</h2>
          <p className="text-white/50 text-sm mt-1">{product.name}</p>
        </div>
        <button onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending || !form.name || !form.price || !form.sku}
          className="btn-primary px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm disabled:opacity-40">
          <Save size={15}/>
          {saveMutation.isPending ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

      {/* Basic Info */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="font-bold text-white mb-4">Basic Information</h3>
        <div>
          <label className="text-xs text-white/50 uppercase tracking-wider font-semibold block mb-1.5">Product Name *</label>
          <input value={form.name} onChange={set('name')} className="glass-input" placeholder="e.g. Air Stride Pro"/>
        </div>
        <div>
          <label className="text-xs text-white/50 uppercase tracking-wider font-semibold block mb-1.5">Description</label>
          <textarea value={form.description} onChange={set('description')} rows={4} className="glass-input resize-none" placeholder="e.g. Genuine leather, comfortable for daily use"/>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-white/50 uppercase tracking-wider font-semibold block mb-1.5">
              Price (৳) *
              {product.price_locked && (
                <span className="text-rose-400 font-normal ml-1 normal-case">(locked — updated once)</span>
              )}
            </label>
            <input type="number" value={form.price} onChange={set('price')}
              readOnly={product.price_locked}
              className={`glass-input ${product.price_locked ? 'opacity-60 cursor-not-allowed' : ''}`}
              placeholder="4800"/>
          </div>
          <div>
            <label className="text-xs text-white/50 uppercase tracking-wider font-semibold block mb-1.5">Discount Price (৳)</label>
            <input type="number" value={form.discount_price} onChange={set('discount_price')} className="glass-input" placeholder="Optional"/>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-white/50 uppercase tracking-wider font-semibold block mb-1.5">
              Product Code (SKU)
              <span className="text-white/30 font-normal ml-1 normal-case">(cannot change)</span>
            </label>
            <input value={form.sku} readOnly
              className="glass-input opacity-60 cursor-not-allowed select-none" placeholder="ASP-001"/>
          </div>
          <div>
            <label className="text-xs text-white/50 uppercase tracking-wider font-semibold block mb-1.5">
              Base Stock
              {Object.keys(sizeVariants).length > 0 && (
                <span className="text-indigo-400 font-normal ml-1 normal-case">(auto from sizes)</span>
              )}
            </label>
            <input
              type="number"
              value={form.stock}
              onChange={set('stock')}
              readOnly={Object.keys(sizeVariants).length > 0}
              className={`glass-input ${Object.keys(sizeVariants).length > 0 ? 'opacity-70 cursor-not-allowed' : ''}`}
              placeholder="0"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-white/50 uppercase tracking-wider font-semibold block mb-1.5">Category</label>
            <select
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value, subCategory: '' }))}
              className="glass-input">
              <option value="" className="bg-gray-900">— Select Category —</option>
              {topLevelCats.map(c => (
                <option key={c.id} value={c.id} className="bg-gray-900">{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-white/50 uppercase tracking-wider font-semibold block mb-1.5">
              Sub-category
              {subCategories.length === 0 && form.category && (
                <span className="text-white/30 font-normal ml-1">(none available)</span>
              )}
            </label>
            <select
              value={form.subCategory}
              onChange={e => setForm(f => ({ ...f, subCategory: e.target.value }))}
              disabled={subCategories.length === 0}
              className="glass-input disabled:opacity-40">
              <option value="" className="bg-gray-900">— Select Sub-category —</option>
              {subCategories.map(c => (
                <option key={c.id} value={c.id} className="bg-gray-900">{c.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))} className="w-4 h-4 rounded accent-indigo-500"/>
            <span className="text-sm text-white/70">Active (visible to customers)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_featured} onChange={e => setForm(p => ({ ...p, is_featured: e.target.checked }))} className="w-4 h-4 rounded accent-indigo-500"/>
            <span className="text-sm text-white/70">Featured on homepage</span>
          </label>
        </div>
      </div>

      {/* Color Variants */}
      <div className="glass-card p-6">
        <h3 className="font-bold text-white mb-1">Color Variants</h3>
        <p className="text-xs text-white/40 mb-4">Select all available colors for this product</p>
        <div className="flex flex-wrap gap-2">
          {COLOR_PALETTE.map(c => {
            const selected = c.name in colorVariants;
            return (
              <button key={c.name} type="button" onClick={() => toggleColor(c.name)}
                title={c.name}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                  selected
                    ? 'border-indigo-400 bg-indigo-500/20 text-white'
                    : 'border-white/10 text-white/50 hover:border-white/30 hover:text-white'
                }`}>
                <span className="w-4 h-4 rounded-full border border-white/20 shrink-0" style={{ backgroundColor: c.hex }}/>
                {c.name}
                {selected && <X size={10} className="ml-0.5"/>}
              </button>
            );
          })}
        </div>
        {Object.keys(colorVariants).length > 0 && (
          <p className="text-xs text-indigo-400 mt-3">{Object.keys(colorVariants).length} color{Object.keys(colorVariants).length > 1 ? 's' : ''} selected</p>
        )}
      </div>

      {/* Sizes & Stock */}
      <div className="glass-card p-6">
        <h3 className="font-bold text-white mb-1">Sizes & Stock</h3>
        <p className="text-xs text-white/40 mb-3">Click an active size to remove it, or a new size to add it</p>
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
            {Object.entries(sizeVariants).sort().map(([size, entry]) => (
              <div key={size} className="glass rounded-xl p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-indigo-400">EU {size}</span>
                  <button onClick={() => toggleSize(size)} className="text-white/30 hover:text-red-400 transition-colors"><X size={12}/></button>
                </div>
                <input type="number" value={entry.stock} min="0"
                  onChange={e => setSizeVariants(prev => ({ ...prev, [size]: { ...prev[size], stock: e.target.value } }))}
                  className="glass-input py-1.5 text-sm text-center" placeholder="Qty"/>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Images */}
      <div className="glass-card p-6">
        <h3 className="font-bold text-white mb-1">Product Images</h3>
        <p className="text-xs text-white/40 mb-4">Upload 3–4 images from different angles</p>

        {existingImages.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-4">
            {existingImages.map(img => (
              <div key={img.id} className="relative aspect-square rounded-xl overflow-hidden glass">
                <img src={img.image} alt="" className="w-full h-full object-cover"/>
                <button onClick={() => deleteImageMutation.mutate(img.id)}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-red-500 transition-colors">
                  <Trash2 size={11}/>
                </button>
                {img.is_primary && <span className="absolute bottom-1 left-1 badge badge-purple text-xs">Primary</span>}
              </div>
            ))}
          </div>
        )}

        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelect}/>
        {newPreviews.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-4">
            {newPreviews.map((src, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden glass">
                <img src={src} alt="" className="w-full h-full object-cover"/>
                <button onClick={() => { setNewImages(p => p.filter((_,j) => j !== i)); setNewPreviews(p => p.filter((_,j) => j !== i)); }}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-red-500 transition-colors">
                  <X size={12}/>
                </button>
                <span className="absolute bottom-1 left-1 badge badge-amber text-xs">New</span>
              </div>
            ))}
          </div>
        )}

        <button type="button" onClick={() => fileRef.current?.click()}
          className="w-full border-2 border-dashed border-white/15 rounded-xl p-6 flex flex-col items-center gap-2 hover:border-indigo-400/50 hover:bg-white/3 transition-all">
          <div className="w-10 h-10 rounded-xl glass flex items-center justify-center">
            <Upload size={18} className="text-indigo-400"/>
          </div>
          <p className="text-sm text-white/50">Click to upload more images</p>
        </button>
      </div>

      <div className="flex gap-3 pb-8">
        <button onClick={() => router.back()} className="btn-glass flex-1 py-3 rounded-xl text-sm">Cancel</button>
        <button onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending || !form.name || !form.price || !form.sku}
          className="btn-primary flex-1 py-3 rounded-xl text-sm disabled:opacity-40 flex items-center justify-center gap-2">
          <Save size={15}/>
          {saveMutation.isPending ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </motion.div>
  );
}
