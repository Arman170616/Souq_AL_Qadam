import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';

class VendorShell extends StatelessWidget {
  final StatefulNavigationShell navigationShell;
  const VendorShell({super.key, required this.navigationShell});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: navigationShell,
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          color: AppColors.bgCard,
          border: Border(top: BorderSide(color: AppColors.glassBorder)),
        ),
        child: BottomNavigationBar(
          currentIndex: navigationShell.currentIndex,
          onTap: (i) => navigationShell.goBranch(i, initialLocation: i == navigationShell.currentIndex),
          backgroundColor: Colors.transparent,
          elevation: 0,
          selectedItemColor: AppColors.amber,
          unselectedItemColor: AppColors.textMuted,
          type: BottomNavigationBarType.fixed,
          items: const [
            BottomNavigationBarItem(icon: Icon(Icons.dashboard_outlined),    activeIcon: Icon(Icons.dashboard_rounded),    label: 'Dashboard'),
            BottomNavigationBarItem(icon: Icon(Icons.inventory_2_outlined),  activeIcon: Icon(Icons.inventory_2_rounded),  label: 'Products'),
            BottomNavigationBarItem(icon: Icon(Icons.shopping_bag_outlined), activeIcon: Icon(Icons.shopping_bag_rounded), label: 'Orders'),
            BottomNavigationBarItem(icon: Icon(Icons.bar_chart_outlined),    activeIcon: Icon(Icons.bar_chart_rounded),    label: 'Reports'),
            BottomNavigationBarItem(icon: Icon(Icons.person_outline),        activeIcon: Icon(Icons.person_rounded),       label: 'Profile'),
          ],
        ),
      ),
    );
  }
}
