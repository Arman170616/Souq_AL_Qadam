'use client';
import { createContext, useContext } from 'react';
import { useLanguageStore } from '@/store/languageStore';

// ─────────────────────────────────────────────────────────────────────────────
// English strings
// ─────────────────────────────────────────────────────────────────────────────
const en = {
  // Navbar
  'nav.home':              'Home',
  'nav.shop':              'Shop',
  'nav.products':          'Products',
  'nav.signIn':            'Sign In',
  'nav.register':          'Register',
  'nav.myAccount':         'My Account',
  'nav.myOrders':          'My Orders',
  'nav.vendorDashboard':   'Vendor Dashboard',
  'nav.adminPanel':        'Admin Panel',
  'nav.signOut':           'Sign Out',
  'nav.loadingVendors':    'Loading vendors…',
  'nav.allVendors':        'All Vendors →',
  'nav.searchPlaceholder': 'Search for products, brands…',
  'nav.searchHint':        'Press Enter to search · Esc to close',

  // Footer
  'footer.description':        "Oman's premier multi-vendor marketplace. Quality products from verified vendors delivered to your door.",
  'footer.location':           'Muscat, Oman',
  'footer.copyright':          '© 2026 Souq Al Qadam. All rights reserved.',
  'footer.col.shop':           'Shop',
  'footer.col.account':        'Account',
  'footer.col.vendors':        'Vendors',
  'footer.col.support':        'Support',
  'footer.link.allProducts':   'All Products',
  'footer.link.myAccount':     'My Account',
  'footer.link.orders':        'Orders',
  'footer.link.wishlist':      'Wishlist',
  'footer.link.returns':       'Returns',
  'footer.link.becomeVendor':  'Become a Vendor',
  'footer.link.vendorLogin':   'Vendor Login',
  'footer.link.vendorGuide':   'Vendor Guide',
  'footer.link.helpCenter':    'Help Center',
  'footer.link.contactUs':     'Contact Us',
  'footer.link.privacyPolicy': 'Privacy Policy',
  'footer.link.terms':         'Terms',

  // Home — Hero
  'home.badge':             "Oman's #1 Multi-Vendor Store",
  'home.hero.title1':       'Step Into',
  'home.hero.title2':       'Your Style',
  'home.hero.desc':         'Discover thousands of products from verified vendors across Oman. Every size, every style, delivered to your door.',
  'home.hero.shopNow':      'Shop Now',
  'home.hero.becomeVendor': 'Become a Vendor',

  // Home — Stats
  'home.stats.customers': 'Happy Customers',
  'home.stats.vendors':   'Verified Vendors',
  'home.stats.products':  'Products',
  'home.stats.orders':    'Orders Placed',

  // Home — Features
  'home.feat.delivery.title': 'Free Delivery',
  'home.feat.delivery.desc':  'On qualifying orders',
  'home.feat.returns.title':  'Easy Returns',
  'home.feat.returns.desc':   '7-day hassle-free returns',
  'home.feat.payment.title':  'Secure Payment',
  'home.feat.payment.desc':   'Card, Bank Transfer & COD',
  'home.feat.support.title':  '24/7 Support',
  'home.feat.support.desc':   'Always here to help you',

  // Home — Categories
  'home.cat.label': 'Browse by',
  'home.cat.title': 'Categories',
  'home.cat.all':   'All',
  'home.cat.items': 'items',

  // Home — Vendors
  'home.ven.label':       'Trusted Sellers',
  'home.ven.title':       'Featured Vendors',
  'home.ven.all':         'All Vendors',
  'home.ven.visitShop':   'Visit Shop',
  'home.ven.sales':       'sales',
  'home.ven.defaultDesc': 'Quality products from a verified vendor.',
  'home.ven.premium':     'Premium',

  // Home — Products
  'home.prod.label':      'Handpicked for you',
  'home.prod.title':      'Latest Products',
  'home.prod.viewAll':    'View all',
  'home.prod.emptyTitle': 'No products yet',
  'home.prod.emptyDesc':  'Check back soon — vendors are adding products.',
  'home.prod.emptyCta':   'Browse Products',
  'home.prod.addToCart':     'Add to Cart',
  'home.prod.addedToCart':   'Added to cart!',

  // Home — HScrollSection titles
  'home.scroll.comfort.title': 'Everyday Comfort',
  'home.scroll.comfort.sub':   'Top Rated Picks',
  'home.scroll.sale.title':    'On Sale',
  'home.scroll.sale.sub':      'Best Deals',
  'home.scroll.best.title':    'Best Sellers',
  'home.scroll.best.sub':      'Most Popular',

  // Home — CTA banner
  'home.cta.label':  'Limited Time Offer',
  'home.cta.title':  'Get 10% OFF Your First Order',
  'home.cta.desc':   'Register now and use code',
  'home.cta.at':     'at checkout',
  'home.cta.button': 'Claim Offer',

  // Home — Vendor CTA
  'home.sell.title':  'Sell Your Products',
  'home.sell.desc':   'Join {n} verified vendors and grow your business online',
  'home.sell.button': 'Start Selling',

  // Auth — Login
  'auth.login.title':    'Welcome Back',
  'auth.login.subtitle': 'Sign in to your account',
  'auth.login.email':    'Email',
  'auth.login.password': 'Password',
  'auth.login.submit':   'Sign In',
  'auth.login.noAcct':   "Don't have an account?",
  'auth.login.signUp':   'Sign Up',

  // Auth — Register
  'auth.reg.title':     'Create Account',
  'auth.reg.subtitle':  'Join thousands of happy customers',
  'auth.reg.firstName': 'First Name',
  'auth.reg.lastName':  'Last Name',
  'auth.reg.email':     'Email',
  'auth.reg.password':  'Password',
  'auth.reg.submit':    'Create Account',
  'auth.reg.hasAcct':   'Already have an account?',
  'auth.reg.signIn':    'Sign In',

  // Products page
  'prod.pageTitle':     'All Products',
  'prod.loading':       'Loading…',
  'prod.countOf':       '{n} of {total} products',
  'prod.searchPlh':     'Search products…',
  'prod.filters':       'Filters',
  'prod.sizeLabel':     'Size (EU)',
  'prod.catLabel':      'Category',
  'prod.priceLabel':    'Price Range (OMR)',
  'prod.inStock':       'In Stock Only',
  'prod.clearFilters':  'Clear Filters',
  'prod.notFound':      'No products found',
  'prod.adjustFilters': 'Try adjusting your filters',
  'prod.loadingMore':   'Loading more products…',
  'prod.allLoaded':     'All {n} products loaded',
  'prod.saleBadge':     'Sale',
  'prod.sort.newest':   'Newest',
  'prod.sort.priceLow': 'Price: Low → High',
  'prod.sort.priceHigh':'Price: High → Low',
  'prod.sort.topRated': 'Top Rated',
  'prod.sort.popular':  'Most Popular',

  // Vendors page
  'vendors.badge':       'Marketplace',
  'vendors.title':       'Our Vendors',
  'vendors.subtitle':    'Discover {n} verified vendors across Oman',
  'vendors.searchPlh':   'Search vendors by name…',
  'vendors.notFound':    'No vendors found',
  'vendors.trySearch':   'Try a different search term.',
  'vendors.visit':       'Visit',
  'vendors.sort.rated':  'Top Rated',
  'vendors.sort.sales':  'Most Sales',
  'vendors.sort.newest': 'Newest',
  'vendors.sort.az':     'A → Z',

  // Account page — tabs
  'acct.signIn':           'Please sign in',
  'acct.tab.profile':      'Profile',
  'acct.tab.orders':       'Orders',
  'acct.tab.address':      'Addresses',
  'acct.tab.wishlist':     'Wishlist',
  'acct.tab.security':     'Security',
  'acct.tab.notifs':       'Notifications',

  // Account — profile tab
  'acct.profile.title':    'Personal Information',
  'acct.profile.firstName':'First Name',
  'acct.profile.lastName': 'Last Name',
  'acct.profile.email':    'Email',
  'acct.profile.phone':    'Phone',
  'acct.profile.phPlh':    '+968 9XXX XXXX',
  'acct.profile.save':     'Save Changes',
  'acct.profile.saving':   'Saving…',

  // Account — orders tab
  'acct.orders.title':     'Recent Orders',
  'acct.orders.viewAll':   'View All Orders',

  // Account — addresses tab
  'acct.addr.title':       'Saved Addresses',
  'acct.addr.addNew':      'Add New',
  'acct.addr.empty':       'No saved addresses yet',
  'acct.addr.addFirst':    'Add Your First Address',
  'acct.addr.default':     'Default',
  'acct.addr.editTitle':   'Edit Address',
  'acct.addr.newTitle':    'New Address',
  'acct.addr.fullName':    'Full Name',
  'acct.addr.phone':       'Phone',
  'acct.addr.addressLine': 'Address',
  'acct.addr.city':        'City',
  'acct.addr.district':    'District',
  'acct.addr.postalCode':  'Postal Code',
  'acct.addr.optional':    'Optional',
  'acct.addr.setDefault':  'Set as default',
  'acct.addr.cancel':      'Cancel',
  'acct.addr.save':        'Save Address',
  'acct.addr.saving':      'Saving…',

  // Account — security tab
  'acct.sec.title':        'Change Password',
  'acct.sec.currentPw':    'Current Password',
  'acct.sec.newPw':        'New Password',
  'acct.sec.confirmPw':    'Confirm New Password',
  'acct.sec.minChars':     'Min 8 characters',
  'acct.sec.reEnter':      'Re-enter new password',
  'acct.sec.update':       'Update Password',
  'acct.sec.updating':     'Updating…',

  // Account — wishlist tab
  'acct.wish.title':       'My Wishlist',
  'acct.wish.empty':       'No saved items yet',
  'acct.wish.browse':      'Browse Products',

  // Account — notifications tab
  'acct.notifs.empty':     'No notifications',

  // Account — Orders page
  'orders.account':        'Account',
  'orders.title':          'My Orders',
  'orders.searchPlh':      'Search order ID…',
  'orders.noOrders':       'No orders yet',
  'orders.startShopping':  'Start Shopping',
  'orders.selectOrder':    'Select an order to view details',
  'orders.step.placed':    'Placed',
  'orders.step.processing':'Processing',
  'orders.step.shipped':   'Shipped',
  'orders.step.delivered': 'Delivered',
  'orders.qty':            'Qty:',
  'orders.subtotal':       'Subtotal',
  'orders.shipping':       'Shipping',
  'orders.discount':       'Discount',
  'orders.total':          'Total',
  'orders.shippingTo':     'Shipping to',
  'orders.viewInvoice':    'View Invoice',
  'orders.signIn':         'Please sign in',

  // Super Admin — shared
  'sa.superAdmin':         'Super Admin',
  'sa.fullAccess':         'Full Access',
  'sa.viewStore':          'View Store',
  'sa.signOut':            'Sign Out',

  // Super Admin — nav
  'sa.nav.dashboard':      'Dashboard',
  'sa.nav.users':          'All Users',
  'sa.nav.admins':         'Admin Accounts',
  'sa.nav.vendors':        'Vendor Approvals',
  'sa.nav.reports':        'Monthly Reports',
  'sa.nav.delivery':       'Delivery',
  'sa.nav.activity':       'Activity Logs',

  // Super Admin — dashboard
  'sa.dash.title':         'Super Admin Dashboard',
  'sa.dash.subtitle':      'Full platform overview & control',
  'sa.dash.pendingAlert':  '{n} Vendor(s) Awaiting Approval',
  'sa.dash.approvalNote':  'Only Super Admin can approve or reject vendor applications',
  'sa.dash.reviewNow':     'Review Now',
  'sa.dash.totalUsers':    'Total Users',
  'sa.dash.customers':     'Customers',
  'sa.dash.vendors':       'Vendors',
  'sa.dash.admins':        'Admins',
  'sa.dash.superAdmins':   'Super Admins',
  'sa.dash.totalOrders':   'Total Orders',
  'sa.dash.totalProducts': 'Total Products',
  'sa.dash.pendingVendors':'Pending Vendors',
  'sa.dash.roleDist':      'Role Distribution',
  'sa.dash.recentUsers':   'Recent Users',
  'sa.dash.viewAll':       'View all',
  'sa.dash.noUsers':       'No users found.',
  'sa.role.superadmins':   'Super Admins',
  'sa.role.admins':        'Admins',
  'sa.role.vendors':       'Vendors',
  'sa.role.customers':     'Customers',

  // Super Admin — users page
  'sa.users.title':        'All Users',
  'sa.users.total':        'total',
  'sa.users.searchPlh':    'Search by name or email...',
  'sa.users.notFound':     'No users found.',
  'sa.users.col.user':     'User',
  'sa.users.col.role':     'Role',
  'sa.users.col.status':   'Status',
  'sa.users.col.joined':   'Joined',
  'sa.users.col.actions':  'Actions',
  'sa.users.active':       'Active',
  'sa.users.inactive':     'Inactive',

  // Super Admin — vendors page
  'sa.vendors.title':      'Vendor Approvals',
  'sa.vendors.subtitle':   'Only Super Admin can approve, reject, suspend, or mark shops as Premium',
  'sa.vendors.pending':    'Pending Approval',
  'sa.vendors.active':     'Active Shops',
  'sa.vendors.suspended':  'Suspended',
  'sa.vendors.premium':    'Premium Shops',
  'sa.vendors.searchPlh':  'Search shop or email…',
  'sa.vendors.loading':    'Loading vendors…',
  'sa.vendors.noPending':  'No pending vendor requests',
  'sa.vendors.notFound':   'No vendors found',
  'sa.vendors.col.shop':   'Shop',
  'sa.vendors.col.owner':  'Owner',
  'sa.vendors.col.status': 'Status',
  'sa.vendors.col.rating': 'Rating',
  'sa.vendors.col.sales':  'Sales',
  'sa.vendors.col.joined': 'Joined',
  'sa.vendors.col.actions':'Actions',
  'sa.vendors.approve':    'Approve',
  'sa.vendors.reject':     'Reject',
  'sa.vendors.suspend':    'Suspend',
  'sa.vendors.reinstate':  'Reinstate',

  // Super Admin — admins page
  'sa.admins.title':       'Admin Accounts',
  'sa.admins.newAdmin':    'New Admin',
  'sa.admins.noAdmins':    'No admin accounts yet. Create one above.',
  'sa.admins.permInfo':    'Admin accounts can manage products, orders, vendors, and customers.',
  'sa.admins.joined':      'Joined',
  'sa.admins.createTitle': 'Create Admin Account',
  'sa.admins.createBtn':   'Create Admin',
  'sa.admins.cancel':      'Cancel',
  'sa.admins.active':      'Active',
  'sa.admins.inactive':    'Inactive',
  'sa.admins.admins':      'admins',
  'sa.admins.firstName':   'First Name',
  'sa.admins.lastName':    'Last Name',
  'sa.admins.email':       'Email',
  'sa.admins.username':    'Username',
  'sa.admins.password':    'Password',
  'sa.admins.confirmPw':   'Confirm Password',
  'sa.admins.minChars':    'Min 8 characters',
  'sa.admins.reEnterPw':   'Re-enter password',

  // Super Admin — reports page
  'sa.reports.title':      'Monthly Sales Reports',
  'sa.reports.subtitle':   'Platform-wide revenue & order breakdown',
  'sa.reports.totalRev':   'Total Revenue',
  'sa.reports.delivRev':   'Delivered Revenue',
  'sa.reports.totalOrders':'Total Orders',
  'sa.reports.activeVend': 'Active Vendors',
  'sa.reports.tabOverview':'Overview',
  'sa.reports.tabByShop':  'By Shop',
  'sa.reports.monthlyRev': 'Monthly Revenue',
  'sa.reports.noMonthly':  'No monthly data yet',
  'sa.reports.month':      'Month',
  'sa.reports.revenue':    'Revenue',
  'sa.reports.commission': 'Commission',
  'sa.reports.orders':     'Orders',
  'sa.reports.topVendors': 'Top Vendors by Revenue',
  'sa.reports.catBreak':   'Category Breakdown',
  'sa.reports.noData':     'No data yet',
  'sa.reports.shopBreak':  'Monthly Revenue — Shop Breakdown',
  'sa.reports.noOrders':   'No order data yet',
  'sa.reports.total':      'Total',

  // Super Admin — activity page
  'sa.activity.title':     'Shop Activity Logs',
  'sa.activity.subtitle':  'Recent platform activity across all shops',
  'sa.activity.tabAll':    'All Activity',
  'sa.activity.tabByShop': 'By Shop',
  'sa.activity.vendors':   'Vendors',
  'sa.activity.orders':    'Orders',
  'sa.activity.products':  'Products',
  'sa.activity.noActivity':'No recent activity',
  'sa.activity.allShops':  'All Shops',
  'sa.activity.selectShop':'Select a shop to view its activity',
  'sa.activity.totalSales':'Total Sales',
  'sa.activity.rating':    'Rating',
  'sa.activity.recentProd':'Recent Products',
  'sa.activity.noProducts':'No products in recent data',

  // Super Admin — delivery page
  'sa.delivery.title':     'Delivery Reports',
  'sa.delivery.subtitle':  'Track shipped and delivered orders',
  'sa.delivery.shipped':   'Shipped',
  'sa.delivery.delivered': 'Delivered',
  'sa.delivery.orders':    'orders',
  'sa.delivery.noOrders':  'No {tab} orders found',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Arabic strings (must cover every key in `en`)
// ─────────────────────────────────────────────────────────────────────────────
const ar: Record<keyof typeof en, string> = {
  // Navbar
  'nav.home':              'الرئيسية',
  'nav.shop':              'المتجر',
  'nav.products':          'المنتجات',
  'nav.signIn':            'تسجيل الدخول',
  'nav.register':          'إنشاء حساب',
  'nav.myAccount':         'حسابي',
  'nav.myOrders':          'طلباتي',
  'nav.vendorDashboard':   'لوحة البائع',
  'nav.adminPanel':        'لوحة الإدارة',
  'nav.signOut':           'تسجيل الخروج',
  'nav.loadingVendors':    'جارٍ التحميل…',
  'nav.allVendors':        'جميع البائعين →',
  'nav.searchPlaceholder': 'ابحث عن منتجات، ماركات…',
  'nav.searchHint':        'اضغط Enter للبحث · Esc للإغلاق',

  // Footer
  'footer.description':        'متجركم الأول في عُمان للتسوق من بائعين موثوقين. جودة عالية وتوصيل سريع إلى بابك.',
  'footer.location':           'مسقط، عُمان',
  'footer.copyright':          '© 2026 Souq Al Qadam. جميع الحقوق محفوظة.',
  'footer.col.shop':           'المتجر',
  'footer.col.account':        'الحساب',
  'footer.col.vendors':        'البائعون',
  'footer.col.support':        'الدعم',
  'footer.link.allProducts':   'جميع المنتجات',
  'footer.link.myAccount':     'حسابي',
  'footer.link.orders':        'الطلبات',
  'footer.link.wishlist':      'المفضلة',
  'footer.link.returns':       'المرتجعات',
  'footer.link.becomeVendor':  'كن بائعاً',
  'footer.link.vendorLogin':   'دخول البائع',
  'footer.link.vendorGuide':   'دليل البائع',
  'footer.link.helpCenter':    'مركز المساعدة',
  'footer.link.contactUs':     'اتصل بنا',
  'footer.link.privacyPolicy': 'سياسة الخصوصية',
  'footer.link.terms':         'الشروط والأحكام',

  // Home — Hero
  'home.badge':             'متجرك الأول في عُمان',
  'home.hero.title1':       'اكتشف',
  'home.hero.title2':       'أسلوبك',
  'home.hero.desc':         'اكتشف آلاف المنتجات من بائعين موثوقين في عُمان. كل الأحجام، كل الأنماط، توصيل إلى بابك.',
  'home.hero.shopNow':      'تسوق الآن',
  'home.hero.becomeVendor': 'كن بائعاً',

  // Home — Stats
  'home.stats.customers': 'عملاء سعداء',
  'home.stats.vendors':   'بائعون موثوقون',
  'home.stats.products':  'منتجات',
  'home.stats.orders':    'طلبات مكتملة',

  // Home — Features
  'home.feat.delivery.title': 'توصيل مجاني',
  'home.feat.delivery.desc':  'على الطلبات المؤهلة',
  'home.feat.returns.title':  'إرجاع سهل',
  'home.feat.returns.desc':   'إرجاع مجاني خلال ٧ أيام',
  'home.feat.payment.title':  'دفع آمن',
  'home.feat.payment.desc':   'بطاقة، تحويل بنكي ودفع عند الاستلام',
  'home.feat.support.title':  'دعم ٢٤/٧',
  'home.feat.support.desc':   'دائماً هنا لمساعدتك',

  // Home — Categories
  'home.cat.label': 'تصفح حسب',
  'home.cat.title': 'الفئات',
  'home.cat.all':   'الكل',
  'home.cat.items': 'منتج',

  // Home — Vendors
  'home.ven.label':       'بائعون موثوقون',
  'home.ven.title':       'بائعون مميزون',
  'home.ven.all':         'جميع البائعين',
  'home.ven.visitShop':   'زيارة المتجر',
  'home.ven.sales':       'مبيعات',
  'home.ven.defaultDesc': 'منتجات عالية الجودة من بائع موثوق.',
  'home.ven.premium':     'مميز',

  // Home — Products
  'home.prod.label':      'مختار لك',
  'home.prod.title':      'أحدث المنتجات',
  'home.prod.viewAll':    'عرض الكل',
  'home.prod.emptyTitle': 'لا توجد منتجات بعد',
  'home.prod.emptyDesc':  'تفقد لاحقاً — البائعون يضيفون منتجات.',
  'home.prod.emptyCta':   'تصفح المنتجات',
  'home.prod.addToCart':     'أضف إلى السلة',
  'home.prod.addedToCart':   'أُضيف إلى السلة!',

  // Home — HScrollSection titles
  'home.scroll.comfort.title': 'راحة يومية',
  'home.scroll.comfort.sub':   'الأعلى تقييماً',
  'home.scroll.sale.title':    'عروض خاصة',
  'home.scroll.sale.sub':      'أفضل الصفقات',
  'home.scroll.best.title':    'الأكثر مبيعاً',
  'home.scroll.best.sub':      'الأكثر شعبية',

  // Home — CTA banner
  'home.cta.label':  'عرض محدود الوقت',
  'home.cta.title':  'احصل على خصم ١٠٪ على طلبك الأول',
  'home.cta.desc':   'سجل الآن واستخدم كود',
  'home.cta.at':     'عند الدفع',
  'home.cta.button': 'احصل على العرض',

  // Home — Vendor CTA
  'home.sell.title':  'بع منتجاتك معنا',
  'home.sell.desc':   'انضم إلى {n} بائعاً موثوقاً وطور أعمالك التجارية',
  'home.sell.button': 'ابدأ البيع',

  // Auth — Login
  'auth.login.title':    'مرحباً بعودتك',
  'auth.login.subtitle': 'تسجيل الدخول إلى حسابك',
  'auth.login.email':    'البريد الإلكتروني',
  'auth.login.password': 'كلمة المرور',
  'auth.login.submit':   'تسجيل الدخول',
  'auth.login.noAcct':   'ليس لديك حساب؟',
  'auth.login.signUp':   'إنشاء حساب',

  // Auth — Register
  'auth.reg.title':     'إنشاء حساب جديد',
  'auth.reg.subtitle':  'انضم إلى آلاف العملاء السعداء',
  'auth.reg.firstName': 'الاسم الأول',
  'auth.reg.lastName':  'الاسم الأخير',
  'auth.reg.email':     'البريد الإلكتروني',
  'auth.reg.password':  'كلمة المرور',
  'auth.reg.submit':    'إنشاء الحساب',
  'auth.reg.hasAcct':   'لديك حساب بالفعل؟',
  'auth.reg.signIn':    'تسجيل الدخول',

  // Products page
  'prod.pageTitle':     'جميع المنتجات',
  'prod.loading':       'جارٍ التحميل…',
  'prod.countOf':       '{n} من أصل {total} منتج',
  'prod.searchPlh':     'ابحث عن المنتجات…',
  'prod.filters':       'تصفية',
  'prod.sizeLabel':     'المقاس (EU)',
  'prod.catLabel':      'الفئة',
  'prod.priceLabel':    'نطاق السعر (ر.ع)',
  'prod.inStock':       'المتوفر فقط',
  'prod.clearFilters':  'مسح الفلاتر',
  'prod.notFound':      'لا توجد منتجات',
  'prod.adjustFilters': 'حاول تعديل الفلاتر',
  'prod.loadingMore':   'جارٍ تحميل المزيد…',
  'prod.allLoaded':     'تم تحميل جميع {n} منتجات',
  'prod.saleBadge':     'تخفيض',
  'prod.sort.newest':   'الأحدث',
  'prod.sort.priceLow': 'السعر: من الأقل للأعلى',
  'prod.sort.priceHigh':'السعر: من الأعلى للأقل',
  'prod.sort.topRated': 'الأعلى تقييماً',
  'prod.sort.popular':  'الأكثر شعبية',

  // Vendors page
  'vendors.badge':       'السوق الإلكتروني',
  'vendors.title':       'بائعونا',
  'vendors.subtitle':    'اكتشف {n} متجراً موثوقاً في عُمان',
  'vendors.searchPlh':   'ابحث عن بائع…',
  'vendors.notFound':    'لا يوجد بائعون',
  'vendors.trySearch':   'جرب مصطلح بحث مختلف.',
  'vendors.visit':       'زيارة',
  'vendors.sort.rated':  'الأعلى تقييماً',
  'vendors.sort.sales':  'الأكثر مبيعاً',
  'vendors.sort.newest': 'الأحدث',
  'vendors.sort.az':     'أ → ي',

  // Account page — tabs
  'acct.signIn':           'يرجى تسجيل الدخول',
  'acct.tab.profile':      'الملف الشخصي',
  'acct.tab.orders':       'الطلبات',
  'acct.tab.address':      'العناوين',
  'acct.tab.wishlist':     'المفضلة',
  'acct.tab.security':     'الأمان',
  'acct.tab.notifs':       'الإشعارات',

  // Account — profile tab
  'acct.profile.title':    'المعلومات الشخصية',
  'acct.profile.firstName':'الاسم الأول',
  'acct.profile.lastName': 'الاسم الأخير',
  'acct.profile.email':    'البريد الإلكتروني',
  'acct.profile.phone':    'الهاتف',
  'acct.profile.phPlh':    '+968 9XXX XXXX',
  'acct.profile.save':     'حفظ التغييرات',
  'acct.profile.saving':   'جارٍ الحفظ…',

  // Account — orders tab
  'acct.orders.title':     'الطلبات الأخيرة',
  'acct.orders.viewAll':   'عرض جميع الطلبات',

  // Account — addresses tab
  'acct.addr.title':       'العناوين المحفوظة',
  'acct.addr.addNew':      'إضافة جديد',
  'acct.addr.empty':       'لا توجد عناوين محفوظة',
  'acct.addr.addFirst':    'أضف عنوانك الأول',
  'acct.addr.default':     'افتراضي',
  'acct.addr.editTitle':   'تعديل العنوان',
  'acct.addr.newTitle':    'عنوان جديد',
  'acct.addr.fullName':    'الاسم الكامل',
  'acct.addr.phone':       'الهاتف',
  'acct.addr.addressLine': 'العنوان',
  'acct.addr.city':        'المدينة',
  'acct.addr.district':    'المحافظة',
  'acct.addr.postalCode':  'الرمز البريدي',
  'acct.addr.optional':    'اختياري',
  'acct.addr.setDefault':  'تعيين كافتراضي',
  'acct.addr.cancel':      'إلغاء',
  'acct.addr.save':        'حفظ العنوان',
  'acct.addr.saving':      'جارٍ الحفظ…',

  // Account — security tab
  'acct.sec.title':        'تغيير كلمة المرور',
  'acct.sec.currentPw':    'كلمة المرور الحالية',
  'acct.sec.newPw':        'كلمة المرور الجديدة',
  'acct.sec.confirmPw':    'تأكيد كلمة المرور الجديدة',
  'acct.sec.minChars':     'الحد الأدنى ٨ أحرف',
  'acct.sec.reEnter':      'أعد إدخال كلمة المرور الجديدة',
  'acct.sec.update':       'تحديث كلمة المرور',
  'acct.sec.updating':     'جارٍ التحديث…',

  // Account — wishlist tab
  'acct.wish.title':       'قائمة رغباتي',
  'acct.wish.empty':       'لا توجد عناصر محفوظة',
  'acct.wish.browse':      'تصفح المنتجات',

  // Account — notifications tab
  'acct.notifs.empty':     'لا توجد إشعارات',

  // Account — Orders page
  'orders.account':        'الحساب',
  'orders.title':          'طلباتي',
  'orders.searchPlh':      'ابحث برقم الطلب…',
  'orders.noOrders':       'لا توجد طلبات بعد',
  'orders.startShopping':  'ابدأ التسوق',
  'orders.selectOrder':    'اختر طلباً لعرض التفاصيل',
  'orders.step.placed':    'تم الطلب',
  'orders.step.processing':'قيد المعالجة',
  'orders.step.shipped':   'تم الشحن',
  'orders.step.delivered': 'تم التوصيل',
  'orders.qty':            'الكمية:',
  'orders.subtotal':       'المجموع الجزئي',
  'orders.shipping':       'الشحن',
  'orders.discount':       'الخصم',
  'orders.total':          'الإجمالي',
  'orders.shippingTo':     'الشحن إلى',
  'orders.viewInvoice':    'عرض الفاتورة',
  'orders.signIn':         'يرجى تسجيل الدخول',

  // Super Admin — shared
  'sa.superAdmin':         'المدير العام',
  'sa.fullAccess':         'صلاحية كاملة',
  'sa.viewStore':          'عرض المتجر',
  'sa.signOut':            'تسجيل الخروج',

  // Super Admin — nav
  'sa.nav.dashboard':      'لوحة التحكم',
  'sa.nav.users':          'جميع المستخدمين',
  'sa.nav.admins':         'حسابات المشرفين',
  'sa.nav.vendors':        'اعتماد البائعين',
  'sa.nav.reports':        'التقارير الشهرية',
  'sa.nav.delivery':       'التوصيل',
  'sa.nav.activity':       'سجل النشاط',

  // Super Admin — dashboard
  'sa.dash.title':         'لوحة المدير العام',
  'sa.dash.subtitle':      'نظرة شاملة على المنصة',
  'sa.dash.pendingAlert':  '{n} بائع بانتظار الموافقة',
  'sa.dash.approvalNote':  'فقط المدير العام يمكنه قبول أو رفض طلبات البائعين',
  'sa.dash.reviewNow':     'مراجعة الآن',
  'sa.dash.totalUsers':    'إجمالي المستخدمين',
  'sa.dash.customers':     'العملاء',
  'sa.dash.vendors':       'البائعون',
  'sa.dash.admins':        'المشرفون',
  'sa.dash.superAdmins':   'المدراء العامون',
  'sa.dash.totalOrders':   'إجمالي الطلبات',
  'sa.dash.totalProducts': 'إجمالي المنتجات',
  'sa.dash.pendingVendors':'بائعون معلقون',
  'sa.dash.roleDist':      'توزيع الأدوار',
  'sa.dash.recentUsers':   'المستخدمون الجدد',
  'sa.dash.viewAll':       'عرض الكل',
  'sa.dash.noUsers':       'لا يوجد مستخدمون.',
  'sa.role.superadmins':   'المدراء العامون',
  'sa.role.admins':        'المشرفون',
  'sa.role.vendors':       'البائعون',
  'sa.role.customers':     'العملاء',

  // Super Admin — users page
  'sa.users.title':        'جميع المستخدمين',
  'sa.users.total':        'الإجمالي',
  'sa.users.searchPlh':    'ابحث بالاسم أو البريد...',
  'sa.users.notFound':     'لا يوجد مستخدمون.',
  'sa.users.col.user':     'المستخدم',
  'sa.users.col.role':     'الدور',
  'sa.users.col.status':   'الحالة',
  'sa.users.col.joined':   'انضم',
  'sa.users.col.actions':  'الإجراءات',
  'sa.users.active':       'نشط',
  'sa.users.inactive':     'غير نشط',

  // Super Admin — vendors page
  'sa.vendors.title':      'اعتماد البائعين',
  'sa.vendors.subtitle':   'فقط المدير العام يمكنه قبول أو رفض أو تعليق المتاجر',
  'sa.vendors.pending':    'بانتظار الموافقة',
  'sa.vendors.active':     'المتاجر النشطة',
  'sa.vendors.suspended':  'معلق',
  'sa.vendors.premium':    'المتاجر المميزة',
  'sa.vendors.searchPlh':  'ابحث عن متجر أو بريد…',
  'sa.vendors.loading':    'جارٍ التحميل…',
  'sa.vendors.noPending':  'لا يوجد طلبات بائعين معلقة',
  'sa.vendors.notFound':   'لا يوجد بائعون',
  'sa.vendors.col.shop':   'المتجر',
  'sa.vendors.col.owner':  'المالك',
  'sa.vendors.col.status': 'الحالة',
  'sa.vendors.col.rating': 'التقييم',
  'sa.vendors.col.sales':  'المبيعات',
  'sa.vendors.col.joined': 'انضم',
  'sa.vendors.col.actions':'الإجراءات',
  'sa.vendors.approve':    'قبول',
  'sa.vendors.reject':     'رفض',
  'sa.vendors.suspend':    'تعليق',
  'sa.vendors.reinstate':  'استعادة',

  // Super Admin — admins page
  'sa.admins.title':       'حسابات المشرفين',
  'sa.admins.newAdmin':    'مشرف جديد',
  'sa.admins.noAdmins':    'لا يوجد حسابات مشرفين بعد.',
  'sa.admins.permInfo':    'يمكن للمشرفين إدارة المنتجات والطلبات والبائعين والعملاء.',
  'sa.admins.joined':      'انضم',
  'sa.admins.createTitle': 'إنشاء حساب مشرف',
  'sa.admins.createBtn':   'إنشاء مشرف',
  'sa.admins.cancel':      'إلغاء',
  'sa.admins.active':      'نشط',
  'sa.admins.inactive':    'غير نشط',
  'sa.admins.admins':      'مشرف',
  'sa.admins.firstName':   'الاسم الأول',
  'sa.admins.lastName':    'الاسم الأخير',
  'sa.admins.email':       'البريد الإلكتروني',
  'sa.admins.username':    'اسم المستخدم',
  'sa.admins.password':    'كلمة المرور',
  'sa.admins.confirmPw':   'تأكيد كلمة المرور',
  'sa.admins.minChars':    'الحد الأدنى ٨ أحرف',
  'sa.admins.reEnterPw':   'أعد إدخال كلمة المرور',

  // Super Admin — reports page
  'sa.reports.title':      'تقارير المبيعات الشهرية',
  'sa.reports.subtitle':   'الإيرادات والطلبات على مستوى المنصة',
  'sa.reports.totalRev':   'إجمالي الإيرادات',
  'sa.reports.delivRev':   'إيرادات المُسلَّمة',
  'sa.reports.totalOrders':'إجمالي الطلبات',
  'sa.reports.activeVend': 'البائعون النشطون',
  'sa.reports.tabOverview':'نظرة عامة',
  'sa.reports.tabByShop':  'حسب المتجر',
  'sa.reports.monthlyRev': 'الإيرادات الشهرية',
  'sa.reports.noMonthly':  'لا توجد بيانات شهرية بعد',
  'sa.reports.month':      'الشهر',
  'sa.reports.revenue':    'الإيرادات',
  'sa.reports.commission': 'العمولة',
  'sa.reports.orders':     'الطلبات',
  'sa.reports.topVendors': 'أفضل البائعين حسب الإيرادات',
  'sa.reports.catBreak':   'توزيع الفئات',
  'sa.reports.noData':     'لا توجد بيانات بعد',
  'sa.reports.shopBreak':  'الإيرادات الشهرية — حسب المتجر',
  'sa.reports.noOrders':   'لا توجد بيانات طلبات بعد',
  'sa.reports.total':      'الإجمالي',

  // Super Admin — activity page
  'sa.activity.title':     'سجل نشاط المتاجر',
  'sa.activity.subtitle':  'النشاط الأخير على جميع المتاجر',
  'sa.activity.tabAll':    'كل النشاط',
  'sa.activity.tabByShop': 'حسب المتجر',
  'sa.activity.vendors':   'البائعون',
  'sa.activity.orders':    'الطلبات',
  'sa.activity.products':  'المنتجات',
  'sa.activity.noActivity':'لا يوجد نشاط مؤخراً',
  'sa.activity.allShops':  'جميع المتاجر',
  'sa.activity.selectShop':'اختر متجراً لعرض نشاطه',
  'sa.activity.totalSales':'إجمالي المبيعات',
  'sa.activity.rating':    'التقييم',
  'sa.activity.recentProd':'المنتجات الأخيرة',
  'sa.activity.noProducts':'لا توجد منتجات في البيانات الأخيرة',

  // Super Admin — delivery page
  'sa.delivery.title':     'تقارير التوصيل',
  'sa.delivery.subtitle':  'تتبع الطلبات المشحونة والمُسلَّمة',
  'sa.delivery.shipped':   'تم الشحن',
  'sa.delivery.delivered': 'تم التوصيل',
  'sa.delivery.orders':    'طلبات',
  'sa.delivery.noOrders':  'لا توجد طلبات {tab}',
};

// ─────────────────────────────────────────────────────────────────────────────
// Context  (provided by I18nProvider in the root layout)
// ─────────────────────────────────────────────────────────────────────────────
export const messages = { en, ar } as const;

export type TranslationKey = keyof typeof en;

type TFn = (key: TranslationKey) => string;

// Default t just returns the key — replaced immediately by I18nProvider
export const TranslationsContext = createContext<TFn>((key) => key as string);

// Hook used by every component that needs a translated string.
// It reads from the Context (not the store directly), so React's context
// propagation guarantees all consumers re-render when the locale changes.
export function useT(): TFn {
  return useContext(TranslationsContext);
}

// Convenience re-export so components can read locale directly
export { useLanguageStore };
