'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, Tag } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { formatPrice } from '@/lib/utils';
import { useState } from 'react';

export default function CartPage() {
  const { items, removeItem, updateQty, clearCart, total } = useCartStore();
  const [coupon, setCoupon] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const discount = couponApplied ? Math.round(total() * 0.1) : 0;
  const shipping = total() >= 2000 ? 0 : 60;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}>
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-black text-white">Shopping Cart</h1>
          {items.length > 0 && (
            <button onClick={clearCart} className="text-sm text-red-400 hover:text-red-300 transition-colors">Clear all</button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-24 h-24 glass-card rounded-3xl flex items-center justify-center mx-auto mb-6">
              <ShoppingBag size={40} className="text-white/30"/>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Your cart is empty</h2>
            <p className="text-white/50 mb-8">Add some shoes to get started</p>
            <Link href="/products" className="btn-primary px-8 py-3 rounded-xl inline-flex items-center gap-2">
              Browse Products <ArrowRight size={16}/>
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <motion.div key={`${item.productId}-${item.size}`} layout exit={{opacity:0,height:0}} className="glass-card p-4 flex gap-4">
                  <div className="w-24 h-24 glass rounded-xl flex items-center justify-center text-4xl flex-shrink-0">
                    {['👟','👠','🥿','⚽','🎈','👔'][item.productId % 6]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between gap-2">
                      <div>
                        <Link href={`/products/${item.slug}`} className="font-semibold text-white hover:text-indigo-300 transition-colors line-clamp-1">{item.name}</Link>
                        <p className="text-sm text-white/50 mt-0.5">{item.vendorName}</p>
                        <div className="flex gap-2 mt-1">
                          <span className="badge badge-purple">EU {item.size}</span>
                          {item.color && <div className="w-5 h-5 rounded-full border border-white/20 flex-shrink-0" style={{background:item.color}}/>}
                        </div>
                      </div>
                      <button onClick={() => removeItem(item.productId, item.size)} className="text-red-400/50 hover:text-red-400 transition-colors flex-shrink-0 p-1">
                        <Trash2 size={16}/>
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center glass rounded-xl overflow-hidden">
                        <button onClick={() => updateQty(item.productId, item.size, item.quantity-1)} className="px-3 py-2 hover:bg-white/10 text-white/60 hover:text-white transition-colors"><Minus size={14}/></button>
                        <span className="w-8 text-center text-sm font-bold text-white">{item.quantity}</span>
                        <button onClick={() => updateQty(item.productId, item.size, item.quantity+1)} className="px-3 py-2 hover:bg-white/10 text-white/60 hover:text-white transition-colors"><Plus size={14}/></button>
                      </div>
                      <span className="font-black gradient-text-blue">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Order Summary */}
            <div>
              <div className="glass-card p-6 sticky top-24 space-y-5">
                <h3 className="font-bold text-white text-lg">Order Summary</h3>

                {/* Coupon */}
                <div>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"/>
                      <input value={coupon} onChange={e=>setCoupon(e.target.value)} placeholder="Coupon code" className="glass-input pl-9 text-sm" />
                    </div>
                    <button onClick={() => coupon.toUpperCase() === 'BDSHOE10' && setCouponApplied(true)} className="btn-glass text-sm px-4 rounded-xl">Apply</button>
                  </div>
                  {couponApplied && <p className="text-xs text-green-400 mt-1">✓ 10% discount applied!</p>}
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-white/60"><span>Subtotal ({items.reduce((s,i)=>s+i.quantity,0)} items)</span><span className="text-white">{formatPrice(total())}</span></div>
                  {discount > 0 && <div className="flex justify-between text-green-400"><span>Coupon (BDSHOE10)</span><span>-{formatPrice(discount)}</span></div>}
                  <div className="flex justify-between text-white/60"><span>Shipping</span><span className={shipping === 0 ? 'text-green-400' : 'text-white'}>{shipping === 0 ? 'FREE' : formatPrice(shipping)}</span></div>
                  {total() < 2000 && <p className="text-xs text-amber-400">Add {formatPrice(2000-total())} more for free shipping</p>}
                  <div className="flex justify-between font-bold text-white text-base border-t border-white/10 pt-3">
                    <span>Total</span>
                    <span className="gradient-text text-lg">{formatPrice(total() - discount + shipping)}</span>
                  </div>
                </div>

                <Link href="/checkout" className="btn-primary w-full py-3.5 rounded-xl flex items-center justify-center gap-2">
                  Proceed to Checkout <ArrowRight size={16}/>
                </Link>
                <Link href="/products" className="btn-glass w-full py-2.5 text-sm text-center rounded-xl block">
                  Continue Shopping
                </Link>

                <div className="flex justify-center gap-3 pt-2">
                  {['bKash','Nagad','Visa','COD'].map(p=><span key={p} className="text-xs text-white/30 glass px-2 py-1 rounded">{p}</span>)}
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
