import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';

class AdminShell extends StatelessWidget {
  final StatefulNavigationShell navigationShell;
  const AdminShell({super.key, required this.navigationShell});

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
          selectedItemColor: AppColors.red,
          unselectedItemColor: AppColors.textMuted,
          type: BottomNavigationBarType.fixed,
          items: const [
            BottomNavigationBarItem(icon: Icon(Icons.dashboard_outlined),     activeIcon: Icon(Icons.dashboard_rounded),      label: 'Dashboard'),
            BottomNavigationBarItem(icon: Icon(Icons.store_outlined),          activeIcon: Icon(Icons.store_rounded),          label: 'Vendors'),
            BottomNavigationBarItem(icon: Icon(Icons.receipt_long_outlined),   activeIcon: Icon(Icons.receipt_long_rounded),   label: 'Orders'),
            BottomNavigationBarItem(icon: Icon(Icons.people_outline),          activeIcon: Icon(Icons.people_rounded),         label: 'Customers'),
            BottomNavigationBarItem(icon: Icon(Icons.person_outline),          activeIcon: Icon(Icons.person_rounded),         label: 'Profile'),
          ],
        ),
      ),
    );
  }
}
