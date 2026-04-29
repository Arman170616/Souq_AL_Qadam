'use client';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { XCircle, ShoppingCart, ArrowLeft } from 'lucide-react';

function CancelContent() {
  const params      = useSearchParams();
  const orderNumber = params.get('order') || '';

  return (
    <div className="max-w-xl mx-auto px-4 py-20 text-center">
      <motion.div initial={{scale:0}} animate={{scale:1}} transition={{type:'spring',stiffness:200}}>
        <XCircle size={80} className="text-red-400 mx-auto mb-6"/>
      </motion.div>
      <h1 className="text-3xl font-black text-white mb-3">Payment Cancelled</h1>
      <p className="text-white/50 mb-2">Your payment was cancelled or not completed.</p>
      {orderNumber && (
        <p className="text-white/40 text-sm mb-8">
          Order <span className="text-white font-mono">{orderNumber}</span> is still pending. You can retry payment from your orders page.
        </p>
      )}
      <div className="flex gap-3 justify-center flex-wrap">
        {orderNumber && (
          <Link href="/account/orders" className="btn-primary px-6 py-3 rounded-xl flex items-center gap-2">
            <ArrowLeft size={15}/> Retry Payment
          </Link>
        )}
        <Link href="/cart" className="btn-glass px-6 py-3 rounded-xl flex items-center gap-2">
          <ShoppingCart size={15}/> Back to Cart
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutCancelPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-white/40">Loading…</div>}>
      <CancelContent />
    </Suspense>
  );
}
