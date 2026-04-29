'use client';
import { useState, use } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Star, ShoppingBag, Heart, Share2, MessageCircle, Truck, Shield, RefreshCcw, Minus, Plus, Send, Ruler, X } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi, reviewsApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import JsonLd from '@/components/seo/JsonLd';

interface Variant { id: number; size: string; color: string; stock: number; price_adjustment: string; }
interface ProductImage { id: number; image: string; alt_text: string; is_primary: boolean; }
interface Review { id: number; user: { first_name: string; email: string }; rating: number; title: string; body: string; is_verified_purchase: boolean; created_at: string; }
interface Product {
  id: number; name: string; slug: string; description: string; price: string; discount_price: string | null;
  effective_price: string; stock: number; sku: string; rating: string; review_count: number;
  images: ProductImage[]; variants: Variant[];
  vendor: { shop_name: string; slug: string };
  category: { name: string };
}

export default function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);

  const { data, isLoading } = useQuery<Product>({
    queryKey: ['product', slug],
    queryFn: () => productsApi.detail(slug).then(r => r.data),
  });

  const { data: reviewsData } = useQuery<{ results: Review[] }>({
    queryKey: ['reviews', slug],
    queryFn: () => reviewsApi.list(slug).then(r => r.data),
  });

  const [activeImage, setActiveImage] = useState<ProductImage | null>(null);
  const [selectedSize,  setSize]  = useState('');
  const [selectedColor, setColor] = useState('');
  const [selectedVariant, setVariant] = useState<Variant | null>(null);
  const [qty, setQty]             = useState(1);
  const [activeTab, setTab]       = useState<'desc'|'reviews'|'shipping'>('desc');
  const [addedAnim, setAdded]     = useState(false);
  const [sizeGuide, setSizeGuide] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewHover, setReviewHover]   = useState(0);
  const [reviewTitle, setReviewTitle]   = useState('');
  const [reviewBody, setReviewBody]     = useState('');
  const { addItem } = useCartStore();
  const { toggle: toggleWish, has: isWishlisted } = useWishlistStore();
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  const submitReview = useMutation({
    mutationFn: () => reviewsApi.create(slug, { rating: reviewRating, title: reviewTitle, body: reviewBody }),
    onSuccess: () => {
      toast.success('Review submitted!');
      setReviewRating(5); setReviewTitle(''); setReviewBody('');
      queryClient.invalidateQueries({ queryKey: ['reviews', slug] });
      queryClient.invalidateQueries({ queryKey: ['product', slug] });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { non_field_errors?: string[] } } })?.response?.data?.non_field_errors?.[0];
      toast.error(msg || 'Failed to submit review.');
    },
  });

  const product = data;
  const reviews: Review[] = reviewsData?.results || [];

  const sizes   = [...new Set(product?.variants.map(v => v.size).filter(Boolean))];
  const colors  = [...new Set(product?.variants.map(v => v.color).filter(Boolean))];
  const sizeVariant = product?.variants.find(v => v.size === selectedSize);
  const canAdd  = selectedSize ? (sizeVariant?.stock ?? 0) > 0 : (product?.stock ?? 0) > 0;
  const effectivePrice = product ? parseFloat(product.effective_price) : 0;
  const originalPrice  = product ? parseFloat(product.price) : 0;
  const discount = product?.discount_price ? Math.round((1 - effectivePrice / originalPrice) * 100) : null;
  const primaryImage = product?.images.find(i => i.is_primary) || product?.images[0];
  const displayImage = activeImage ?? primaryImage;

  const handleAdd = () => {
    if (!product) return;
    addItem({
      id: product.id, productId: product.id, name: product.name,
      price: effectivePrice,
      image: primaryImage?.image || '',
      size: selectedSize || 'One Size',
      color: selectedColor || '',
      vendorName: product.vendor.shop_name,
      slug: product.slug,
    });
    setAdded(true);
    toast.success(`${product.name} added to cart!`);
    setTimeout(() => setAdded(false), 2000);
  };

  if (isLoading) return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="grid lg:grid-cols-2 gap-12">
        <div className="glass-card h-96 shimmer"/>
        <div className="space-y-4">{Array.from({length:5}).map((_,i)=><div key={i} className="h-8 shimmer rounded-xl"/>)}</div>
      </div>
    </div>
  );

  if (!product) return (
    <div className="max-w-7xl mx-auto px-4 py-20 text-center text-white/50">
      <p className="text-2xl font-bold mb-2">Product not found</p>
      <Link href="/products" className="text-indigo-400 hover:text-indigo-300">Back to Products</Link>
    </div>
  );

  const SITE_URL = 'https://souqalqadam.com';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Structured data */}
      <JsonLd
        type="Product"
        name={product.name}
        description={product.description}
        image={primaryImage?.image}
        sku={product.sku}
        price={effectivePrice}
        availability={product.stock > 0 ? 'InStock' : 'OutOfStock'}
        brand={product.vendor.shop_name}
        ratingValue={parseFloat(product.rating)}
        reviewCount={product.review_count}
        url={`${SITE_URL}/products/${product.slug}`}
      />
      <JsonLd
        type="BreadcrumbList"
        items={[
          { name: 'Home',     url: SITE_URL },
          { name: 'Products', url: `${SITE_URL}/products` },
          { name: product.name, url: `${SITE_URL}/products/${product.slug}` },
        ]}
      />

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-white/40 mb-8">
        <Link href="/" className="hover:text-white transition-colors">Home</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-white transition-colors">Products</Link>
        <span>/</span>
        <span className="text-white/70">{product.name}</span>
      </div>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Image */}
        <motion.div initial={{opacity:0,x:-32}} animate={{opacity:1,x:0}} transition={{duration:0.5}}>
          <div className="glass-card p-10 flex items-center justify-center h-80 sm:h-96 relative overflow-hidden">
            <div className="absolute inset-0 bg-linear-to-br from-indigo-500/10 to-purple-500/10"/>
            {displayImage
              ? <img src={displayImage.image} alt={product.name} className="h-full object-contain transition-opacity duration-200"/>
              : <motion.span className="text-9xl" animate={{y:[-8,8,-8]}} transition={{duration:3,repeat:Infinity,ease:'easeInOut'}}>👟</motion.span>
            }
            {discount && <span className="absolute top-4 left-4 badge badge-red text-sm">-{discount}%</span>}
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-3 mt-4">
              {product.images.slice(0,4).map(img => (
                <button key={img.id} onClick={() => setActiveImage(img)}
                  className={`w-20 h-20 glass-card flex items-center justify-center cursor-pointer transition-all overflow-hidden border-2 ${displayImage?.id === img.id ? 'border-indigo-400 scale-105' : 'border-transparent hover:border-indigo-400/50'}`}>
                  <img src={img.image} alt={img.alt_text} className="h-full w-full object-contain"/>
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Info */}
        <motion.div initial={{opacity:0,x:32}} animate={{opacity:1,x:0}} transition={{duration:0.5}} className="space-y-6">
          <div>
            <Link href={`/vendors/${product.vendor.slug}`} className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors font-medium">
              {product.vendor.shop_name}
            </Link>
            <h1 className="text-3xl sm:text-4xl font-black text-white mt-1 mb-3">{product.name}</h1>
            <p className="text-xs text-white/40">SKU: {product.sku} · {product.category?.name}</p>
            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_,i)=>(
                  <Star key={i} size={14} className={i < Math.floor(Number(product.rating)) ? 'fill-amber-400 text-amber-400' : 'text-white/20'}/>
                ))}
              </div>
              <span className="text-sm text-white/60">{Number(product.rating).toFixed(1)} ({product.review_count} reviews)</span>
            </div>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-black gradient-text">{formatPrice(effectivePrice)}</span>
            {product.discount_price && <span className="text-xl text-white/30 line-through">{formatPrice(originalPrice)}</span>}
            {discount && <span className="badge badge-green">Save {discount}%</span>}
          </div>

          {/* Colors */}
          {colors.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-white/70 mb-2">Color: <span className="text-white">{selectedColor || 'Select'}</span></p>
              <div className="flex gap-2">
                {colors.map(c=>(
                  <button key={c} onClick={()=>setColor(c)}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${selectedColor===c ? 'bg-indigo-500 border-indigo-400 text-white' : 'glass border-white/10 text-white/60 hover:text-white'}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sizes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-white/70">Size (EU)</p>
              <button onClick={() => setSizeGuide(true)}
                className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                <Ruler size={12}/> Size Guide
              </button>
            </div>

            {sizes.length > 0 ? (
              <>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map(v => (
                    <button key={v.id} onClick={() => { if (v.stock > 0) { setSize(v.size); setVariant(v); } }}
                      className={`w-12 h-12 rounded-xl text-sm font-semibold transition-all relative ${
                        v.stock === 0 ? 'opacity-30 cursor-not-allowed glass text-white/30' :
                        selectedSize === v.size ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 scale-105' :
                        'glass text-white/70 hover:bg-white/15 hover:text-white'
                      }`}>
                      {v.size}
                      {v.stock > 0 && v.stock <= 3 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full"/>}
                    </button>
                  ))}
                </div>
                {selectedVariant && selectedVariant.stock <= 5 && selectedVariant.stock > 0 && (
                  <p className="text-xs text-amber-400 mt-2">⚠ Only {selectedVariant.stock} left in this size!</p>
                )}
                {!selectedSize && <p className="text-xs text-white/30 mt-2">Please select a size</p>}
              </>
            ) : (
              <div className="glass rounded-xl p-4 text-center">
                <p className="text-sm text-white/50">One size fits all · <span className="text-white">{product.stock} units in stock</span></p>
              </div>
            )}
          </div>

          {/* Size Guide Modal */}
          {sizeGuide && (
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={() => setSizeGuide(false)}>
              <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"/>
              <motion.div initial={{scale:0.95,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.95,opacity:0}}
                className="relative glass-dark rounded-2xl p-6 w-full max-w-lg overflow-auto max-h-[80vh]"
                onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-bold text-white text-lg flex items-center gap-2"><Ruler size={18} className="text-indigo-400"/> Size Guide</h3>
                  <button onClick={() => setSizeGuide(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"><X size={16}/></button>
                </div>
                <p className="text-xs text-white/40 mb-4">Measure your foot length in cm and match below.</p>
                <table className="w-full text-sm text-center">
                  <thead>
                    <tr className="border-b border-white/10">
                      {['EU','UK','US (M)','US (W)','cm'].map(h => (
                        <th key={h} className="py-2 text-xs text-white/50 font-semibold uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['35','3','4','5','22.0'],['36','3.5','4.5','5.5','22.5'],['37','4','5','6','23.5'],
                      ['38','5','6','7','24.0'],['39','6','7','8','24.5'],['40','6.5','7.5','8.5','25.5'],
                      ['41','7','8','9','26.0'],['42','8','9','10','26.5'],['43','9','10','11','27.5'],
                      ['44','9.5','10.5','11.5','28.0'],['45','10','11','12','28.5'],['46','11','12','13','29.5'],
                    ].map(row => (
                      <tr key={row[0]} className={`border-b border-white/5 hover:bg-white/5 transition-colors ${selectedSize === row[0] ? 'bg-indigo-500/20 text-indigo-300' : 'text-white/70'}`}>
                        {row.map((cell, i) => (
                          <td key={i} className={`py-2.5 ${i === 0 ? 'font-bold text-white' : ''}`}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-xs text-white/30 mt-4 text-center">* Sizes may vary slightly by brand. When in doubt, size up.</p>
              </motion.div>
            </div>
          )}

          {/* Qty + Add */}
          <div className="flex gap-3">
            <div className="flex items-center glass rounded-xl overflow-hidden">
              <button onClick={()=>setQty(Math.max(1,qty-1))} className="px-4 py-3 hover:bg-white/10 text-white/70 hover:text-white transition-colors"><Minus size={16}/></button>
              <span className="w-10 text-center font-bold text-white">{qty}</span>
              <button onClick={()=>setQty(qty+1)} className="px-4 py-3 hover:bg-white/10 text-white/70 hover:text-white transition-colors"><Plus size={16}/></button>
            </div>
            <motion.button onClick={handleAdd} disabled={!canAdd} whileTap={{scale:0.97}}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl font-semibold text-sm transition-all ${
                addedAnim ? 'bg-green-500 text-white' :
                canAdd ? 'btn-primary' : 'glass opacity-40 cursor-not-allowed text-white'
              }`}>
              <ShoppingBag size={16}/>
              {addedAnim ? '✓ Added!' : sizes.length > 0 && !selectedSize ? 'Select a Size' : !canAdd ? 'Out of Stock' : 'Add to Cart'}
            </motion.button>
            <button
              onClick={() => product && toggleWish({ productId: product.id, name: product.name, price: effectivePrice, image: primaryImage?.image || '', slug: product.slug, vendorName: product.vendor.shop_name })}
              className={`w-12 h-12 rounded-xl glass flex items-center justify-center transition-all ${product && isWishlisted(product.id) ? 'text-red-400 bg-red-500/20' : 'text-white/50 hover:text-red-400'}`}>
              <Heart size={18} className={product && isWishlisted(product.id) ? 'fill-red-400' : ''}/>
            </button>
            <button onClick={()=>{ navigator.clipboard.writeText(window.location.href); toast.success('Link copied!'); }} className="w-12 h-12 rounded-xl glass flex items-center justify-center text-white/50 hover:text-white transition-all">
              <Share2 size={18}/>
            </button>
          </div>

          <a href={`https://wa.me/8801700000000?text=Hi! I want to buy ${product.name} (${formatPrice(effectivePrice)})`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-3 rounded-xl border border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-all text-sm font-medium">
            <MessageCircle size={16}/> Ask on WhatsApp
          </a>

          <div className="grid grid-cols-3 gap-3">
            {[{icon:Truck,text:'Free Delivery',sub:'Over ৳2000'},{icon:Shield,text:'Authentic',sub:'Verified vendor'},{icon:RefreshCcw,text:'7-Day Return',sub:'No questions'}].map(f=>(
              <div key={f.text} className="glass-card p-3 text-center">
                <f.icon size={18} className="text-indigo-400 mx-auto mb-1"/>
                <p className="text-xs font-semibold text-white">{f.text}</p>
                <p className="text-xs text-white/40">{f.sub}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="mt-16">
        <div className="flex gap-1 glass-dark rounded-xl p-1 w-fit mb-6">
          {(['desc','reviews','shipping'] as const).map(t=>(
            <button key={t} onClick={()=>setTab(t)} className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab===t?'bg-indigo-500 text-white shadow':'text-white/60 hover:text-white'}`}>
              {t==='desc'?'Description':t==='reviews'?`Reviews (${product.review_count})`:'Shipping'}
            </button>
          ))}
        </div>

        <motion.div key={activeTab} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{duration:0.25}}>
          {activeTab==='desc' && (
            <div className="glass-card p-6">
              <p className="text-white/70 leading-relaxed whitespace-pre-line">{product.description || 'No description provided.'}</p>
            </div>
          )}
          {activeTab==='reviews' && (
            <div className="space-y-4">
              {/* Write a review */}
              {isAuthenticated ? (
                <div className="glass-card p-6">
                  <h3 className="text-white font-semibold mb-4">Write a Review</h3>
                  {/* Star picker */}
                  <div className="flex items-center gap-1 mb-4">
                    {[1,2,3,4,5].map(n=>(
                      <button key={n}
                        onMouseEnter={()=>setReviewHover(n)}
                        onMouseLeave={()=>setReviewHover(0)}
                        onClick={()=>setReviewRating(n)}
                        className="p-0.5">
                        <Star size={24} className={(reviewHover||reviewRating)>=n?'fill-amber-400 text-amber-400':'text-white/20'}/>
                      </button>
                    ))}
                    <span className="ml-2 text-sm text-white/50">{reviewRating} / 5</span>
                  </div>
                  <input
                    value={reviewTitle}
                    onChange={e=>setReviewTitle(e.target.value)}
                    placeholder="Review title (optional)"
                    className="glass-input w-full px-4 py-2.5 text-sm mb-3 rounded-xl"
                  />
                  <textarea
                    value={reviewBody}
                    onChange={e=>setReviewBody(e.target.value)}
                    placeholder="Share your experience with this product…"
                    rows={4}
                    className="glass-input w-full px-4 py-2.5 text-sm mb-4 rounded-xl resize-none"
                  />
                  <button
                    onClick={()=>submitReview.mutate()}
                    disabled={!reviewBody.trim() || submitReview.isPending}
                    className="btn-primary px-6 py-2.5 rounded-xl text-sm flex items-center gap-2 disabled:opacity-50">
                    <Send size={14}/>
                    {submitReview.isPending ? 'Submitting…' : 'Submit Review'}
                  </button>
                </div>
              ) : (
                <div className="glass-card p-6 text-center">
                  <p className="text-white/50 text-sm mb-3">Sign in to leave a review</p>
                  <Link href="/login" className="btn-primary px-6 py-2 rounded-xl text-sm">Sign In</Link>
                </div>
              )}

              {/* Existing reviews */}
              {reviews.length === 0
                ? <p className="text-white/40 text-center py-6">No reviews yet. Be the first!</p>
                : reviews.map(r=>(
                  <div key={r.id} className="glass-card p-5 flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-linear-to-br from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white shrink-0">
                      {(r.user.first_name || r.user.email)[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-white text-sm">{r.user.first_name || r.user.email}</p>
                          {r.is_verified_purchase && <span className="badge badge-green text-xs">Verified Purchase</span>}
                        </div>
                        <p className="text-xs text-white/40">{new Date(r.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex gap-0.5 mb-2">
                        {[...Array(5)].map((_,j)=><Star key={j} size={11} className={j<r.rating?'fill-amber-400 text-amber-400':'text-white/20'}/>)}
                      </div>
                      {r.title && <p className="text-sm font-semibold text-white mb-1">{r.title}</p>}
                      <p className="text-sm text-white/60">{r.body}</p>
                    </div>
                  </div>
                ))
              }
            </div>
          )}
          {activeTab==='shipping' && (
            <div className="glass-card p-6 space-y-4">
              {[{t:'Standard Delivery',d:'3–5 business days',p:'৳60'},{t:'Express Delivery',d:'1–2 business days',p:'৳120'},{t:'Same Day (Dhaka)',d:'Within 6 hours',p:'৳150'},{t:'Free Delivery',d:'Orders over ৳2000',p:'FREE'}].map(s=>(
                <div key={s.t} className="flex justify-between items-center py-3 border-b border-white/5 last:border-0">
                  <div><p className="text-sm font-semibold text-white">{s.t}</p><p className="text-xs text-white/40">{s.d}</p></div>
                  <span className={`font-semibold text-sm ${s.p==='FREE'?'text-green-400':'text-white'}`}>{s.p}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
