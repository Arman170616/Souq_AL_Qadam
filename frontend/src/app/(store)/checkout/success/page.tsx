'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { CheckCircle2, Download, Package, MapPin, CreditCard, Printer } from 'lucide-react';
import { paymentsApi } from '@/lib/api';
import { formatPrice } from '@/lib/utils';

interface InvoiceItem { name: string; quantity: number; unit_price: string; total_price: string; vendor: string; }
interface Invoice {
  invoice_number: string; order_number: string; created_at: string; status: string;
  customer: { name: string; email: string };
  shipping_address: { full_name?: string; address?: string; city?: string; phone?: string };
  items: InvoiceItem[];
  subtotal: string; shipping_cost: string; discount: string; total: string;
  payment: { method: string; status: string; transaction_id: string };
}

function SuccessContent() {
  const params      = useSearchParams();
  const orderNumber = params.get('order') || '';
  const txnId       = params.get('transaction_id') || '';

  const [invoice, setInvoice]   = useState<Invoice | null>(null);
  const [loading, setLoading]   = useState(true);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (!orderNumber) { setLoading(false); return; }

    const run = async () => {
      try {
        // If coming from BangoPay with a transaction_id, verify first
        if (txnId) {
          await paymentsApi.bangoPayVerify(txnId, orderNumber);
          setVerified(true);
        }
        // Fetch invoice
        const { data } = await paymentsApi.invoice(orderNumber);
        setInvoice(data);
      } catch {
        // still show what we have
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [orderNumber, txnId]);

  const handlePrint = () => window.print();

  if (loading) return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4"/>
      <p className="text-white/50">{txnId ? 'Verifying payment…' : 'Loading invoice…'}</p>
    </div>
  );

  if (!orderNumber) return (
    <div className="max-w-xl mx-auto px-4 py-20 text-center">
      <p className="text-white/50 text-lg">No order found.</p>
      <Link href="/products" className="btn-primary px-6 py-3 rounded-xl inline-block mt-4">Shop Now</Link>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      {/* Success banner */}
      <motion.div initial={{scale:0.9,opacity:0}} animate={{scale:1,opacity:1}} className="text-center mb-10">
        <CheckCircle2 size={72} className="text-green-400 mx-auto mb-4"/>
        <h1 className="text-3xl font-black text-white mb-2">Payment Successful!</h1>
        {txnId && verified && <p className="text-green-400 text-sm font-medium mb-1">Payment verified by BangoPay</p>}
        <p className="text-white/50">Order <span className="text-indigo-400 font-mono font-bold">{orderNumber}</span> is confirmed.</p>
        <div className="flex gap-3 justify-center mt-6 flex-wrap">
          <button onClick={handlePrint} className="btn-primary px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm print:hidden">
            <Printer size={15}/> Print Invoice
          </button>
          <Link href="/account/orders" className="btn-glass px-5 py-2.5 rounded-xl text-sm print:hidden">My Orders</Link>
          <Link href="/products" className="btn-glass px-5 py-2.5 rounded-xl text-sm print:hidden">Continue Shopping</Link>
        </div>
      </motion.div>

      {/* Invoice */}
      {invoice && (
        <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.2}}
          id="invoice" className="glass-card p-6 sm:p-8 space-y-6 print:bg-white print:text-black print:shadow-none">

          {/* Invoice header */}
          <div className="flex items-start justify-between border-b border-white/10 pb-6 print:border-gray-200">
            <div>
              <div className="bg-white rounded-xl px-2 py-1 mb-2 inline-block print:bg-transparent">
                <img src="/logo/logo.png" alt="Souq Al Qadam" className="h-14 w-auto print:h-12"/>
              </div>
              <p className="text-white/40 text-sm print:text-gray-500">Souq Al Qadam — Omani Multi-Vendor Shoe Store</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-indigo-400 print:text-indigo-600">{invoice.invoice_number}</p>
              <p className="text-xs text-white/40 print:text-gray-500 mt-1">{invoice.created_at}</p>
              <span className={`text-xs font-bold px-2 py-0.5 rounded mt-1 inline-block ${
                invoice.payment?.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'
              }`}>
                {invoice.payment?.status?.toUpperCase() || 'PENDING'}
              </span>
            </div>
          </div>

          {/* Customer + Shipping */}
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wider font-semibold mb-2 flex items-center gap-1"><Package size={11}/> Bill To</p>
              <p className="font-semibold text-white print:text-black">{invoice.customer.name}</p>
              <p className="text-sm text-white/60 print:text-gray-600">{invoice.customer.email}</p>
            </div>
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wider font-semibold mb-2 flex items-center gap-1"><MapPin size={11}/> Ship To</p>
              <p className="font-semibold text-white print:text-black">{invoice.shipping_address.full_name}</p>
              <p className="text-sm text-white/60 print:text-gray-600">{invoice.shipping_address.address}</p>
              <p className="text-sm text-white/60 print:text-gray-600">{invoice.shipping_address.city}</p>
              {invoice.shipping_address.phone && <p className="text-sm text-white/60 print:text-gray-600">{invoice.shipping_address.phone}</p>}
            </div>
          </div>

          {/* Payment info */}
          {invoice.payment?.method && (
            <div className="glass rounded-xl p-3 flex items-center gap-3 print:border print:border-gray-200 print:bg-gray-50">
              <CreditCard size={14} className="text-indigo-400 shrink-0"/>
              <p className="text-sm text-white/70 print:text-gray-700">
                <span className="font-semibold text-white print:text-black">{invoice.payment.method}</span>
                {invoice.payment.transaction_id && <> · <span className="font-mono text-xs">{invoice.payment.transaction_id}</span></>}
              </p>
            </div>
          )}

          {/* Items table */}
          <div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 print:border-gray-200">
                  <th className="text-left py-2 text-white/40 print:text-gray-500 font-semibold text-xs uppercase tracking-wider">Product</th>
                  <th className="text-center py-2 text-white/40 print:text-gray-500 font-semibold text-xs uppercase tracking-wider">Qty</th>
                  <th className="text-right py-2 text-white/40 print:text-gray-500 font-semibold text-xs uppercase tracking-wider">Unit Price</th>
                  <th className="text-right py-2 text-white/40 print:text-gray-500 font-semibold text-xs uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, i) => (
                  <tr key={i} className="border-b border-white/5 print:border-gray-100">
                    <td className="py-3">
                      <p className="font-semibold text-white print:text-black">{item.name}</p>
                      {item.vendor && <p className="text-xs text-white/40 print:text-gray-500">{item.vendor}</p>}
                    </td>
                    <td className="py-3 text-center text-white/70 print:text-gray-700">{item.quantity}</td>
                    <td className="py-3 text-right text-white/70 print:text-gray-700">{formatPrice(parseFloat(item.unit_price))}</td>
                    <td className="py-3 text-right font-semibold text-white print:text-black">{formatPrice(parseFloat(item.total_price))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2 text-sm">
              <div className="flex justify-between text-white/60 print:text-gray-600">
                <span>Subtotal</span><span>{formatPrice(parseFloat(invoice.subtotal))}</span>
              </div>
              <div className="flex justify-between text-white/60 print:text-gray-600">
                <span>Shipping</span>
                <span>{parseFloat(invoice.shipping_cost) === 0 ? <span className="text-green-400">FREE</span> : formatPrice(parseFloat(invoice.shipping_cost))}</span>
              </div>
              {parseFloat(invoice.discount) > 0 && (
                <div className="flex justify-between text-green-400">
                  <span>Discount</span><span>-{formatPrice(parseFloat(invoice.discount))}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-white print:text-black text-base border-t border-white/10 print:border-gray-200 pt-2">
                <span>Total</span><span className="text-indigo-400 print:text-indigo-600">{formatPrice(parseFloat(invoice.total))}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-white/10 print:border-gray-200 pt-4 text-center">
            <p className="text-xs text-white/30 print:text-gray-400">Thank you for shopping at Souq Al Qadam · support@souqalqadam.com</p>
          </div>
        </motion.div>
      )}

      {/* Print-only download hint */}
      <p className="text-center text-white/30 text-xs mt-4 print:hidden flex items-center justify-center gap-1">
        <Download size={11}/> Use Print → Save as PDF to download invoice
      </p>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-white/40">Loading…</div>}>
      <SuccessContent />
    </Suspense>
  );
}
