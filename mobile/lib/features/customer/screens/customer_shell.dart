import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../auth/providers/auth_provider.dart';

class CustomerShell extends ConsumerWidget {
  final StatefulNavigationShell navigationShell;
  const CustomerShell({super.key, required this.navigationShell});

  // Tabs 0 (home) and 1 (products) are public; 2+ require login
  static const _requiresAuth = {2, 3, 4};

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final loggedIn = ref.watch(authProvider).isAuthenticated;

    return Scaffold(
      body: navigationShell,
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          color: AppColors.bgCard,
          border: Border(top: BorderSide(color: AppColors.glassBorder)),
        ),
        child: BottomNavigationBar(
          currentIndex: navigationShell.currentIndex,
          onTap: (i) {
            if (!loggedIn && _requiresAuth.contains(i)) {
              context.push('/login');
              return;
            }
            navigationShell.goBranch(i, initialLocation: i == navigationShell.currentIndex);
          },
          backgroundColor: Colors.transparent,
          elevation: 0,
          selectedItemColor: AppColors.indigo,
          unselectedItemColor: AppColors.textMuted,
          type: BottomNavigationBarType.fixed,
          items: const [
            BottomNavigationBarItem(icon: Icon(Icons.home_outlined),          activeIcon: Icon(Icons.home_rounded),             label: 'Home'),
            BottomNavigationBarItem(icon: Icon(Icons.grid_view_outlined),     activeIcon: Icon(Icons.grid_view_rounded),        label: 'Products'),
            BottomNavigationBarItem(icon: Icon(Icons.shopping_cart_outlined), activeIcon: Icon(Icons.shopping_cart_rounded),    label: 'Cart'),
            BottomNavigationBarItem(icon: Icon(Icons.receipt_long_outlined),  activeIcon: Icon(Icons.receipt_long_rounded),     label: 'Orders'),
            BottomNavigationBarItem(icon: Icon(Icons.person_outline),         activeIcon: Icon(Icons.person_rounded),           label: 'Profile'),
          ],
        ),
      ),
    );
  }
}
