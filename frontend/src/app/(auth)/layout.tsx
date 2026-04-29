import Link from 'next/link';
import CartDrawer from '@/components/store/CartDrawer';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 glass-dark border-b border-white/10">
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-white rounded-xl px-2 py-1 shadow-sm">
            <img src="/logo/logo.png" alt="Souq Al Qadam" className="h-10 w-auto"/>
          </div>
        </Link>
        <Link href="/products" className="text-sm text-white/50 hover:text-white transition-colors">Browse Products</Link>
      </nav>
      <main className="pt-20">{children}</main>
      <CartDrawer />
    </>
  );
}
