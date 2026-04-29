'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useCartStore } from '@/store/cartStore';
import { formatPrice } from '@/lib/utils';

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQty, total, itemCount } = useCartStore();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-70"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md z-80 flex flex-col glass-dark"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <div className="flex items-center gap-2">
                <ShoppingBag size={20} className="text-indigo-400" />
                <h2 className="font-bold text-lg text-white">Cart</h2>
                <span className="badge badge-purple">{itemCount()}</span>
              </div>
              <button onClick={closeCart} className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-all">
                <X size={20} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                  <div className="w-20 h-20 rounded-2xl glass flex items-center justify-center">
                    <ShoppingBag size={32} className="text-white/30" />
                  </div>
                  <p className="text-white/50">Your cart is empty</p>
                  <button onClick={closeCart} className="btn-primary text-sm px-6 py-2.5">
                    Continue Shopping
                  </button>
                </div>
              ) : (
                items.map((item) => (
                  <motion.div
                    key={`${item.productId}-${item.size}`}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="glass-card p-3 flex gap-3"
                  >
                    <div className="w-18 h-18 rounded-xl overflow-hidden bg-white/10 shrink-0 flex items-center justify-center">
                      {item.image
                        ? <img src={item.image} alt={item.name} className="w-full h-full object-cover"/>
                        : <span className="text-3xl">👟</span>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/products/${item.slug}`} onClick={closeCart} className="text-sm font-semibold text-white hover:text-indigo-300 transition-colors line-clamp-1">
                        {item.name}
                      </Link>
                      <p className="text-xs text-white/50 mt-0.5">{item.vendorName} · Size {item.size}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm font-bold gradient-text-blue">{formatPrice(item.price * item.quantity)}</span>
                        <div className="flex items-center gap-1">
                          <button onClick={() => updateQty(item.productId, item.size, item.quantity - 1)} className="w-7 h-7 rounded-lg glass flex items-center justify-center hover:bg-white/15 transition-colors text-white/80">
                            <Minus size={12} />
                          </button>
                          <span className="w-7 text-center text-sm font-semibold text-white">{item.quantity}</span>
                          <button onClick={() => updateQty(item.productId, item.size, item.quantity + 1)} className="w-7 h-7 rounded-lg glass flex items-center justify-center hover:bg-white/15 transition-colors text-white/80">
                            <Plus size={12} />
                          </button>
                          <button onClick={() => removeItem(item.productId, item.size)} className="w-7 h-7 rounded-lg ml-1 flex items-center justify-center hover:bg-red-500/20 transition-colors text-red-400/60 hover:text-red-400">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="p-5 border-t border-white/10 space-y-3">
                <div className="flex justify-between text-sm text-white/60">
                  <span>Subtotal</span>
                  <span className="text-white font-semibold">{formatPrice(total())}</span>
                </div>
                <div className="flex justify-between text-sm text-white/60">
                  <span>Shipping</span>
                  <span className="text-green-400 font-medium">Calculated at checkout</span>
                </div>
                <div className="flex justify-between font-bold text-white border-t border-white/10 pt-3">
                  <span>Total</span>
                  <span className="gradient-text text-lg">{formatPrice(total())}</span>
                </div>
                <Link
                  href="/checkout"
                  onClick={closeCart}
                  className="btn-primary w-full py-3 rounded-xl flex items-center justify-center gap-2 mt-1"
                >
                  Proceed to Checkout <ArrowRight size={16} />
                </Link>
                <Link href="/cart" onClick={closeCart} className="btn-glass w-full py-2.5 text-sm text-center rounded-xl block">
                  View Full Cart
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
