'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight, MapPin, Truck, CreditCard, CheckCircle2, ArrowLeft, ExternalLink } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { formatPrice } from '@/lib/utils';
import { useMutation } from '@tanstack/react-query';
import { ordersApi, paymentsApi } from '@/lib/api';
import toast from 'react-hot-toast';

const STEPS = ['Address', 'Delivery', 'Payment', 'Review'];

const DELIVERY_OPTIONS = [
  { id:'standard', label:'Standard Delivery', desc:'3–5 business days', price:60 },
  { id:'express',  label:'Express Delivery',  desc:'1–2 business days', price:120 },
  { id:'same_day', label:'Same Day (Dhaka)',   desc:'Within 6 hours',    price:150 },
];

const PAYMENT_METHODS = [
  { id:'bangopay', label:'BangoPay',          icon:'🏦', desc:'Secure online payment gateway' },
  { id:'cod',      label:'Cash on Delivery',  icon:'💵', desc:'Pay when you receive' },
  { id:'bkash',    label:'bKash',             icon:'📱', desc:'Mobile banking payment' },
  { id:'nagad',    label:'Nagad',             icon:'📲', desc:'Mobile banking payment' },
  { id:'card',     label:'Card Payment',      icon:'💳', desc:'Visa / Mastercard' },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { items, total, clearCart } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const [step, setStep]         = useState(0);
  const [ordered, setOrdered]   = useState(false);
  const [orderNumber, setOrderNumber] = useState('');

  const [addr, setAddr] = useState({ name:'', phone:'', email:'', address:'', city:'Dhaka', area:'', zip:'' });
  const [delivery, setDelivery]   = useState('standard');
  const [payment, setPayment]     = useState('bangopay');
  const [mobilePhone, setMobile]  = useState('');

  const deliveryCost = DELIVERY_OPTIONS.find(d => d.id === delivery)?.price ?? 60;
  const grandTotal   = total() + (total() >= 2000 ? 0 : deliveryCost);

  const orderMutation = useMutation({
    mutationFn: async () => {
      if (!isAuthenticated) { router.push('/login?next=/checkout'); throw new Error('Not authenticated'); }

      const { data: order } = await ordersApi.create({
        items: items.map(i => ({ product_id: i.productId, quantity: i.quantity })),
        shipping_address: {
          full_name: addr.name,
          address:   addr.address + (addr.area ? `, ${addr.area}` : ''),
          city:      addr.city,
          phone:     addr.phone,
          zip:       addr.zip,
          email:     addr.email,
        },
      });

      const orderNum: string = order.order_number;

      if (payment === 'bangopay') {
        // Initiate BangoPay — redirect to payment gateway
        const { data: bpData } = await paymentsApi.bangoPayInitiate(orderNum);
        clearCart();
        if (bpData.payment_url) {
          window.location.href = bpData.payment_url;
        } else {
          // Gateway didn't return a URL (demo mode) — go to success directly
          router.push(`/checkout/success?order=${orderNum}`);
        }
        return order;
      }

      // Other methods — existing flow
      const paymentPayload: Record<string, unknown> = { order_number: orderNum, method: payment };
      if ((payment === 'bkash' || payment === 'nagad') && mobilePhone) {
        paymentPayload.phone_number = mobilePhone;
      }
      await paymentsApi.initiate(paymentPayload);
      return order;
    },
    onSuccess: (order) => {
      if (payment !== 'bangopay') {
        clearCart();
        setOrderNumber(order.order_number);
        setOrdered(true);
      }
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: Record<string, string[]> } })?.response?.data;
      toast.error(msg ? Object.values(msg).flat().join(' ') : 'Failed to place order. Please try again.');
    },
  });

  if (items.length === 0 && !ordered) return (
    <div className="max-w-xl mx-auto px-4 py-20 text-center">
      <p className="text-5xl mb-4">🛒</p>
      <h2 className="text-2xl font-bold text-white mb-2">Your cart is empty</h2>
      <Link href="/products" className="btn-primary px-8 py-3 rounded-xl inline-flex items-center gap-2 mt-4">Shop Now</Link>
    </div>
  );

  if (ordered) return (
    <div className="max-w-xl mx-auto px-4 py-20 text-center">
      <motion.div initial={{scale:0}} animate={{scale:1}} transition={{type:'spring',stiffness:200}}>
        <CheckCircle2 size={80} className="text-green-400 mx-auto mb-6"/>
      </motion.div>
      <h2 className="text-3xl font-black text-white mb-3">Order Placed!</h2>
      <p className="text-white/60 mb-2">Your order <span className="text-indigo-400 font-mono font-bold">{orderNumber}</span> has been confirmed.</p>
      <p className="text-white/50 text-sm mb-8">{"We'll send a confirmation to "}<span className="text-white">{addr.email || 'your email'}</span></p>
      <div className="flex gap-3 justify-center flex-wrap">
        <Link href={`/checkout/success?order=${orderNumber}`} className="btn-primary px-6 py-3 rounded-xl flex items-center gap-2">
          View Invoice
        </Link>
        <Link href="/account/orders" className="btn-glass px-6 py-3 rounded-xl">My Orders</Link>
        <Link href="/products" className="btn-glass px-6 py-3 rounded-xl">Continue Shopping</Link>
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <Link href="/cart" className="flex items-center gap-1 text-sm text-white/50 hover:text-white transition-colors mb-4">
          <ArrowLeft size={14}/> Back to Cart
        </Link>
        <h1 className="text-3xl font-black text-white">Checkout</h1>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-10">
        {STEPS.map((s,i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-all ${i <= step ? 'bg-indigo-500 text-white' : 'glass text-white/40'}`}>
              {i < step ? '✓' : i+1}
            </div>
            <span className={`text-sm font-medium hidden sm:block ${i === step ? 'text-white' : 'text-white/40'}`}>{s}</span>
            {i < STEPS.length-1 && <div className={`flex-1 h-0.5 rounded transition-all ${i < step ? 'bg-indigo-500' : 'bg-white/10'}`}/>}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <motion.div key={step} initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} transition={{duration:0.25}} className="glass-card p-6">

            {/* Step 0: Address */}
            {step === 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-6"><MapPin size={18} className="text-indigo-400"/><h2 className="font-bold text-white text-lg">Delivery Address</h2></div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div><label className="text-xs text-white/50 mb-1 block">Full Name *</label><input value={addr.name} onChange={e=>setAddr({...addr,name:e.target.value})} className="glass-input" placeholder="Your name"/></div>
                  <div><label className="text-xs text-white/50 mb-1 block">Phone *</label><input value={addr.phone} onChange={e=>setAddr({...addr,phone:e.target.value})} className="glass-input" placeholder="+880 1xxx-xxxxxx"/></div>
                </div>
                <div><label className="text-xs text-white/50 mb-1 block">Email</label><input value={addr.email} onChange={e=>setAddr({...addr,email:e.target.value})} className="glass-input" placeholder="your@email.com"/></div>
                <div><label className="text-xs text-white/50 mb-1 block">Street Address *</label><textarea value={addr.address} onChange={e=>setAddr({...addr,address:e.target.value})} className="glass-input min-h-20 resize-none" placeholder="House/Flat no., Street, Area"/></div>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-white/50 mb-1 block">City</label>
                    <select value={addr.city} onChange={e=>setAddr({...addr,city:e.target.value})} className="glass-input">
                      {['Dhaka','Chittagong','Sylhet','Khulna','Rajshahi','Barishal'].map(c=><option key={c} className="bg-gray-900">{c}</option>)}
                    </select>
                  </div>
                  <div><label className="text-xs text-white/50 mb-1 block">Area</label><input value={addr.area} onChange={e=>setAddr({...addr,area:e.target.value})} className="glass-input" placeholder="Thana/Upazila"/></div>
                  <div><label className="text-xs text-white/50 mb-1 block">ZIP</label><input value={addr.zip} onChange={e=>setAddr({...addr,zip:e.target.value})} className="glass-input" placeholder="1200"/></div>
                </div>
              </div>
            )}

            {/* Step 1: Delivery */}
            {step === 1 && (
              <div>
                <div className="flex items-center gap-2 mb-6"><Truck size={18} className="text-indigo-400"/><h2 className="font-bold text-white text-lg">Delivery Method</h2></div>
                <div className="space-y-3">
                  {DELIVERY_OPTIONS.map(opt => (
                    <label key={opt.id} className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all border ${delivery===opt.id?'border-indigo-500 bg-indigo-500/10':'border-white/10 glass hover:border-white/25'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 shrink-0 ${delivery===opt.id?'border-indigo-400 bg-indigo-400':'border-white/30'}`}/>
                        <div><p className="font-semibold text-white text-sm">{opt.label}</p><p className="text-xs text-white/50">{opt.desc}</p></div>
                      </div>
                      <p className="font-bold text-white">{total() >= 2000 ? <span className="text-green-400">FREE</span> : formatPrice(opt.price)}</p>
                      <input type="radio" name="delivery" value={opt.id} checked={delivery===opt.id} onChange={()=>setDelivery(opt.id)} className="hidden"/>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Payment */}
            {step === 2 && (
              <div>
                <div className="flex items-center gap-2 mb-6"><CreditCard size={18} className="text-indigo-400"/><h2 className="font-bold text-white text-lg">Payment Method</h2></div>
                <div className="grid sm:grid-cols-2 gap-3">
                  {PAYMENT_METHODS.map(m => (
                    <label key={m.id} className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all border ${payment===m.id?'border-indigo-500 bg-indigo-500/10':'border-white/10 glass hover:border-white/25'}`}>
                      <div className={`w-4 h-4 rounded-full border-2 shrink-0 ${payment===m.id?'border-indigo-400 bg-indigo-400':'border-white/30'}`}/>
                      <span className="text-2xl">{m.icon}</span>
                      <div className="flex-1"><p className="font-semibold text-white text-sm">{m.label}</p><p className="text-xs text-white/50">{m.desc}</p></div>
                      {m.id === 'bangopay' && <span className="text-xs text-green-400 font-semibold border border-green-500/30 rounded px-1.5 py-0.5">Recommended</span>}
                      <input type="radio" name="payment" value={m.id} checked={payment===m.id} onChange={()=>setPayment(m.id)} className="hidden"/>
                    </label>
                  ))}
                </div>
                {payment === 'bangopay' && (
                  <div className="mt-4 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-start gap-3">
                    <ExternalLink size={16} className="text-indigo-400 mt-0.5 shrink-0"/>
                    <div>
                      <p className="text-sm text-indigo-300 font-semibold">Secure Online Payment</p>
                      <p className="text-xs text-white/50 mt-1">You will be redirected to BangoPay to complete your payment securely. Supports bKash, Nagad, card, and more.</p>
                    </div>
                  </div>
                )}
                {(payment==='bkash'||payment==='nagad') && (
                  <div className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-3">
                    <p className="text-sm text-amber-400 font-semibold">Mobile Payment Details</p>
                    <p className="text-xs text-white/60">Send payment to: <span className="font-mono text-white">+880 1636-333333</span> ({payment==='bkash'?'bKash':'Nagad'})</p>
                    <div>
                      <label className="text-xs text-white/50 mb-1 block">Your {payment==='bkash'?'bKash':'Nagad'} Number *</label>
                      <input value={mobilePhone} onChange={e=>setMobile(e.target.value)} className="glass-input" placeholder="01xxxxxxxxx"/>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <div>
                <h2 className="font-bold text-white text-lg mb-6">Review Your Order</h2>
                <div className="space-y-3 mb-6">
                  {items.map(item => (
                    <div key={`${item.productId}-${item.size}`} className="flex justify-between items-center py-2 border-b border-white/5">
                      <div><p className="text-sm font-semibold text-white">{item.name}</p><p className="text-xs text-white/40">Size {item.size} × {item.quantity}</p></div>
                      <span className="text-sm font-bold text-white">{formatPrice(item.price*item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="glass rounded-xl p-4 space-y-2 text-sm mb-4">
                  <div className="flex justify-between text-white/60"><span>Deliver to</span><span className="text-white text-right">{addr.name}, {addr.address}, {addr.city}</span></div>
                  <div className="flex justify-between text-white/60"><span>Delivery</span><span className="text-white">{DELIVERY_OPTIONS.find(d=>d.id===delivery)?.label}</span></div>
                  <div className="flex justify-between text-white/60"><span>Payment</span><span className="text-white">{PAYMENT_METHODS.find(m=>m.id===payment)?.label}</span></div>
                  <div className="flex justify-between font-bold text-white text-base border-t border-white/10 pt-2"><span>Total</span><span className="gradient-text">{formatPrice(grandTotal)}</span></div>
                </div>
                {payment === 'bangopay' && (
                  <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 flex items-center gap-2">
                    <ExternalLink size={13}/> You will be redirected to BangoPay to complete payment.
                  </div>
                )}
              </div>
            )}

            {/* Nav */}
            <div className="flex gap-3 mt-8">
              {step > 0 && <button onClick={()=>setStep(step-1)} className="btn-glass px-6 py-2.5 rounded-xl"><ArrowLeft size={16}/></button>}
              {step < 3 ? (
                <button onClick={()=>setStep(step+1)}
                  disabled={step===0 && (!addr.name || !addr.phone || !addr.address)}
                  className="btn-primary flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-40">
                  Continue <ChevronRight size={16}/>
                </button>
              ) : (
                <button onClick={()=>orderMutation.mutate()} disabled={orderMutation.isPending}
                  className="btn-primary flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60">
                  {orderMutation.isPending
                    ? (payment==='bangopay' ? 'Redirecting to BangoPay…' : 'Placing Order…')
                    : (payment==='bangopay' ? <><ExternalLink size={16}/> Pay with BangoPay</> : <><CheckCircle2 size={16}/> Place Order</>)
                  }
                </button>
              )}
            </div>
          </motion.div>
        </div>

        {/* Summary */}
        <div>
          <div className="glass-card p-5 sticky top-24">
            <h3 className="font-bold text-white mb-4">Order Summary</h3>
            <div className="space-y-2 text-sm mb-4">
              {items.map(item => (
                <div key={`${item.productId}-${item.size}`} className="flex justify-between">
                  <span className="text-white/60 truncate flex-1">{item.name} ×{item.quantity}</span>
                  <span className="text-white ml-2">{formatPrice(item.price*item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-white/10 pt-3 space-y-2 text-sm">
              <div className="flex justify-between text-white/60"><span>Subtotal</span><span>{formatPrice(total())}</span></div>
              <div className="flex justify-between text-white/60"><span>Shipping</span><span className={total()>=2000?'text-green-400':'text-white'}>{total()>=2000?'FREE':formatPrice(deliveryCost)}</span></div>
              <div className="flex justify-between font-bold text-white text-base pt-2 border-t border-white/10">
                <span>Total</span><span className="gradient-text text-lg">{formatPrice(grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
