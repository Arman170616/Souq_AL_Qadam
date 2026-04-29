import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'core/theme/app_theme.dart';
import 'features/auth/providers/auth_provider.dart';
import 'features/auth/screens/login_screen.dart';
import 'features/auth/screens/register_screen.dart';
import 'features/customer/screens/cart_screen.dart';
import 'features/customer/screens/customer_shell.dart';
import 'features/customer/screens/home_screen.dart';
import 'features/customer/screens/orders_screen.dart';
import 'features/customer/screens/product_detail_screen.dart';
import 'features/customer/screens/products_screen.dart';
import 'features/customer/screens/profile_screen.dart';
import 'features/vendor/screens/vendor_dashboard_screen.dart';
import 'features/vendor/screens/vendor_orders_screen.dart';
import 'features/vendor/screens/vendor_products_screen.dart';
import 'features/vendor/screens/vendor_reports_screen.dart';
import 'features/vendor/screens/vendor_shell.dart';
import 'features/admin/screens/admin_dashboard_screen.dart';
import 'features/admin/screens/admin_orders_screen.dart';
import 'features/admin/screens/admin_products_screen.dart';
import 'features/admin/screens/admin_shell.dart';
import 'features/admin/screens/admin_users_screen.dart';
import 'features/admin/screens/admin_vendors_screen.dart';

final _rootKey = GlobalKey<NavigatorState>();

// Routes that require authentication
const _authRequired = ['/cart', '/orders', '/profile', '/vendor', '/admin'];

GoRouter _buildRouter(AuthState auth) {
  final loggedIn = auth.isAuthenticated;
  final role     = auth.user?.role ?? 'customer';

  return GoRouter(
    navigatorKey: _rootKey,
    initialLocation: _startRoute(loggedIn, role),
    redirect: (context, state) {
      final path       = state.matchedLocation;
      final isAuthPage = path == '/login' || path == '/register';

      // If logged in and on auth screen → go to role home
      if (loggedIn && isAuthPage) return _roleHome(role);

      // If not logged in and trying a protected route → go to login
      if (!loggedIn) {
        for (final r in _authRequired) {
          if (path.startsWith(r)) return '/login';
        }
      }

      return null;
    },
    routes: [
      GoRoute(path: '/login',    builder: (_, _) => const LoginScreen()),
      GoRoute(path: '/register', builder: (_, _) => const RegisterScreen()),

      // ── Public product detail (accessible without login) ─────────────────
      GoRoute(
        path: '/product/:slug',
        builder: (_, state) => ProductDetailScreen(slug: state.pathParameters['slug']!),
      ),

      // ── Customer shell (home + products are public, cart/orders/profile need auth) ─
      StatefulShellRoute.indexedStack(
        builder: (_, _, shell) => CustomerShell(navigationShell: shell),
        branches: [
          StatefulShellBranch(routes: [GoRoute(path: '/',         builder: (_, _) => const CustomerHomeScreen())]),
          StatefulShellBranch(routes: [GoRoute(path: '/products', builder: (_, _) => const ProductsScreen())]),
          StatefulShellBranch(routes: [GoRoute(path: '/cart',     builder: (_, _) => const CartScreen())]),
          StatefulShellBranch(routes: [GoRoute(path: '/orders',   builder: (_, _) => const OrdersScreen())]),
          StatefulShellBranch(routes: [GoRoute(path: '/profile',  builder: (_, _) => const ProfileScreen())]),
        ],
      ),

      // ── Vendor ───────────────────────────────────────────────────────────
      StatefulShellRoute.indexedStack(
        builder: (_, _, shell) => VendorShell(navigationShell: shell),
        branches: [
          StatefulShellBranch(routes: [GoRoute(path: '/vendor',          builder: (_, _) => const VendorDashboardScreen())]),
          StatefulShellBranch(routes: [GoRoute(path: '/vendor/products', builder: (_, _) => const VendorProductsScreen())]),
          StatefulShellBranch(routes: [GoRoute(path: '/vendor/orders',   builder: (_, _) => const VendorOrdersScreen())]),
          StatefulShellBranch(routes: [GoRoute(path: '/vendor/reports',  builder: (_, _) => const VendorReportsScreen())]),
          StatefulShellBranch(routes: [GoRoute(path: '/vendor/profile',  builder: (_, _) => const ProfileScreen())]),
        ],
      ),

      // ── Admin ────────────────────────────────────────────────────────────
      StatefulShellRoute.indexedStack(
        builder: (_, _, shell) => AdminShell(navigationShell: shell),
        branches: [
          StatefulShellBranch(routes: [GoRoute(path: '/admin',            builder: (_, _) => const AdminDashboardScreen())]),
          StatefulShellBranch(routes: [GoRoute(path: '/admin/vendors',    builder: (_, _) => const AdminVendorsScreen())]),
          StatefulShellBranch(routes: [GoRoute(path: '/admin/orders',     builder: (_, _) => const AdminOrdersScreen())]),
          StatefulShellBranch(routes: [GoRoute(path: '/admin/customers',  builder: (_, _) => const AdminUsersScreen())]),
          StatefulShellBranch(routes: [GoRoute(path: '/admin/profile',    builder: (_, _) => const ProfileScreen())]),
        ],
      ),
      GoRoute(path: '/admin/products', builder: (_, _) => const AdminProductsScreen()),
    ],
  );
}

String _startRoute(bool loggedIn, String role) {
  if (!loggedIn) return '/';          // guest → home screen
  return _roleHome(role);
}

String _roleHome(String role) {
  switch (role) {
    case 'vendor': return '/vendor';
    case 'admin':  return '/admin';
    default:       return '/';
  }
}

class BDShoeApp extends ConsumerWidget {
  const BDShoeApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);

    // Splash while checking stored token
    if (auth.loading) {
      return MaterialApp(
        debugShowCheckedModeBanner: false,
        theme: AppTheme.dark,
        home: const _SplashScreen(),
      );
    }

    return MaterialApp.router(
      debugShowCheckedModeBanner: false,
      title: 'BDShoe',
      theme: AppTheme.dark,
      routerConfig: _buildRouter(auth),
    );
  }
}

class _SplashScreen extends StatelessWidget {
  const _SplashScreen();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0A1E),
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Image.asset('assets/images/logo.png', width: 120, height: 120, fit: BoxFit.contain),
            const SizedBox(height: 24),
            const SizedBox(
              width: 24, height: 24,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: Color(0xFF6366F1),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
