'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Package, ChevronRight, Search, FileText } from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { ordersApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useT } from '@/lib/i18n';

const STATUS_BADGE: Record<string,string> = { pending:'badge-amber', confirmed:'badge-purple', processing:'badge-purple', shipped:'badge-amber', delivered:'badge-green', cancelled:'badge-red' };
const STATUS_STEP: Record<string,number>  = { pending:0, confirmed:1, processing:1, shipped:2, delivered:3, cancelled:-1 };

interface OrderItem { id: number; product_name: string; quantity: number; unit_price: string; }
interface Order {
  id: number; order_number: string; status: string; total: string;
  subtotal: string; shipping_cost: string; discount: string;
  created_at: string; item_count: number; items?: OrderItem[];
  shipping_address: Record<string, string>;
}

export default function OrdersPage() {
  const t = useT();
  const { isAuthenticated } = useAuthStore();
  const [search, setSearch]   = useState('');
  const [selected, setSelected] = useState<string|null>(null);

  const STEPS = [
    t('orders.step.placed'),
    t('orders.step.processing'),
    t('orders.step.shipped'),
    t('orders.step.delivered'),
  ];

  const { data, isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => ordersApi.list().then(r => r.data),
    enabled: isAuthenticated,
  });

  const { data: detailData } = useQuery({
    queryKey: ['order-detail', selected],
    queryFn: () => ordersApi.detail(selected!).then(r => r.data),
    enabled: !!selected,
  });

  const orders: Order[] = data?.results || [];
  const filtered = orders.filter(o =>
    o.order_number.toLowerCase().includes(search.toLowerCase())
  );
  const orderDetail: Order | null = detailData || null;

  if (!isAuthenticated) return (
    <div className="max-w-lg mx-auto px-4 py-24 text-center">
      <p className="text-5xl mb-4">🔐</p>
      <h2 className="text-2xl font-bold text-white mb-2">{t('orders.signIn')}</h2>
      <Link href="/login" className="btn-primary px-8 py-3 rounded-xl inline-block mt-4">{t('orders.signIn')}</Link>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}>
        <div className="flex items-center gap-3 mb-8">
          <Link href="/account" className="text-white/50 hover:text-white transition-colors text-sm">{t('orders.account')}</Link>
          <ChevronRight size={14} className="text-white/30"/>
          <span className="text-white font-semibold">{t('orders.title')}</span>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-black text-white">{t('orders.title')}</h1>
          <div className="relative w-56">
            <Search size={14} className="absolute inset-s-3 top-1/2 -translate-y-1/2 text-white/40"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={t('orders.searchPlh')} className="glass-input ps-8 text-sm py-2"/>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">{Array.from({length:3}).map((_,i)=><div key={i} className="glass-card h-20 shimmer"/>)}</div>
        ) : filtered.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Package size={48} className="mx-auto mb-4 text-white/20"/>
            <p className="text-white/50 text-lg font-semibold">{t('orders.noOrders')}</p>
            <Link href="/products" className="btn-primary text-sm px-6 py-2.5 rounded-xl inline-block mt-4">{t('orders.startShopping')}</Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-5 gap-6">
            {/* Order List */}
            <div className="lg:col-span-2 space-y-3">
              {filtered.map(o => (
                <button key={o.order_number} onClick={()=>setSelected(o.order_number)}
                  className={`w-full glass-card p-4 text-start transition-all hover:border-indigo-400/30 ${selected===o.order_number?'border-indigo-400/50 bg-indigo-500/10':''}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-sm font-bold text-white">{o.order_number}</span>
                    <span className={`badge ${STATUS_BADGE[o.status]||'badge-purple'}`}>{o.status}</span>
                  </div>
                  <p className="text-xs text-white/40">{formatDate(o.created_at)} · {o.item_count}</p>
                  <p className="text-sm font-semibold text-white mt-1">{formatPrice(parseFloat(o.total))}</p>
                </button>
              ))}
            </div>

            {/* Order Detail */}
            <div className="lg:col-span-3">
              {!selected ? (
                <div className="glass-card p-10 text-center text-white/30">
                  <Package size={36} className="mx-auto mb-3"/>
                  <p>{t('orders.selectOrder')}</p>
                </div>
              ) : !orderDetail ? (
                <div className="glass-card h-64 shimmer"/>
              ) : (
                <motion.div key={orderDetail.order_number} initial={{opacity:0,x:16}} animate={{opacity:1,x:0}} className="glass-card p-6 space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-white font-mono">{orderDetail.order_number}</h3>
                    <span className={`badge ${STATUS_BADGE[orderDetail.status]||'badge-purple'}`}>{orderDetail.status}</span>
                  </div>

                  {/* Progress */}
                  {orderDetail.status !== 'cancelled' && (
                    <div className="flex items-center gap-0">
                      {STEPS.map((step, i) => {
                        const cur = STATUS_STEP[orderDetail.status] ?? 0;
                        const done = i <= cur;
                        return (
                          <div key={step} className="flex items-center flex-1 last:flex-none">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${done?'bg-indigo-500 text-white':'glass text-white/30'}`}>{i+1}</div>
                            <div className="flex-1 h-0.5 last:hidden" style={{background: i < cur ? '#6366f1' : 'rgba(255,255,255,0.1)'}}/>
                            <span className="absolute translate-y-6 text-xs text-white/40 hidden sm:block" style={{marginInlineStart:'-1rem'}}>{step}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Items */}
                  <div className="space-y-2 pt-2">
                    {(orderDetail.items || []).map(item => (
                      <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                        <div>
                          <p className="text-sm font-semibold text-white">{item.product_name}</p>
                          <p className="text-xs text-white/40">{t('orders.qty')} {item.quantity}</p>
                        </div>
                        <span className="text-sm font-semibold text-white">{formatPrice(parseFloat(item.unit_price) * item.quantity)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Totals */}
                  <div className="border-t border-white/10 pt-4 space-y-1.5 text-sm">
                    <div className="flex justify-between text-white/60"><span>{t('orders.subtotal')}</span><span>{formatPrice(parseFloat(orderDetail.subtotal))}</span></div>
                    <div className="flex justify-between text-white/60"><span>{t('orders.shipping')}</span><span>{formatPrice(parseFloat(orderDetail.shipping_cost))}</span></div>
                    {parseFloat(orderDetail.discount) > 0 && (
                      <div className="flex justify-between text-green-400"><span>{t('orders.discount')}</span><span>-{formatPrice(parseFloat(orderDetail.discount))}</span></div>
                    )}
                    <div className="flex justify-between font-bold text-white text-base pt-1 border-t border-white/10"><span>{t('orders.total')}</span><span>{formatPrice(parseFloat(orderDetail.total))}</span></div>
                  </div>

                  {/* Shipping address */}
                  {orderDetail.shipping_address && (
                    <div className="bg-white/5 rounded-xl p-4 text-sm text-white/60">
                      <p className="font-semibold text-white mb-1">{t('orders.shippingTo')}</p>
                      <p>{orderDetail.shipping_address.full_name}</p>
                      <p>{orderDetail.shipping_address.address}, {orderDetail.shipping_address.city}</p>
                      <p>{orderDetail.shipping_address.phone}</p>
                    </div>
                  )}

                  {/* Invoice link */}
                  <Link href={`/checkout/success?order=${orderDetail.order_number}`}
                    className="btn-glass w-full py-2.5 rounded-xl text-sm flex items-center justify-center gap-2">
                    <FileText size={14}/> {t('orders.viewInvoice')}
                  </Link>
                </motion.div>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
