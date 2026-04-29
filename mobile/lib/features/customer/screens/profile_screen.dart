import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/glass_card.dart';
import '../../../shared/widgets/gradient_button.dart';
import '../../auth/providers/auth_provider.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user!;

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: AppColors.bg,
        elevation: 0,
        title: const Text('Profile', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          // Avatar
          Center(
            child: Container(
              width: 88, height: 88,
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: AppColors.gradientPrimary),
                borderRadius: BorderRadius.circular(24),
              ),
              child: Center(
                child: Text(
                  (user.firstName.isNotEmpty ? user.firstName[0] : user.email[0]).toUpperCase(),
                  style: const TextStyle(color: Colors.white, fontSize: 36, fontWeight: FontWeight.w800),
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),
          Center(
            child: Text('${user.firstName} ${user.lastName}'.trim().isEmpty ? user.email : '${user.firstName} ${user.lastName}',
                style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w700)),
          ),
          Center(
            child: Text(user.email, style: const TextStyle(color: AppColors.textMuted, fontSize: 13)),
          ),
          const SizedBox(height: 8),
          Center(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              decoration: BoxDecoration(
                color: AppColors.indigo.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(user.role.toUpperCase(),
                  style: const TextStyle(color: AppColors.indigo, fontSize: 11, fontWeight: FontWeight.w700)),
            ),
          ),
          const SizedBox(height: 32),
          GlassCard(
            child: Column(children: [
              _tile(Icons.person_outline, 'Full Name', '${user.firstName} ${user.lastName}'),
              const Divider(color: AppColors.glassBorder, height: 24),
              _tile(Icons.email_outlined, 'Email', user.email),
              const Divider(color: AppColors.glassBorder, height: 24),
              _tile(Icons.badge_outlined, 'Role', user.role.capitalize()),
            ]),
          ),
          const SizedBox(height: 32),
          GradientButton(
            label: 'Sign Out',
            colors: [AppColors.red, const Color(0xFFDC2626)],
            onPressed: () => ref.read(authProvider.notifier).logout(),
          ),
          const SizedBox(height: 40),
        ],
      ),
    );
  }

  Widget _tile(IconData icon, String label, String value) => Row(children: [
    Container(
      width: 36, height: 36,
      decoration: BoxDecoration(
        color: AppColors.indigo.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Icon(icon, color: AppColors.indigo, size: 18),
    ),
    const SizedBox(width: 12),
    Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(label, style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
      Text(value, style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600)),
    ])),
  ]);
}

extension _StrExt on String {
  String capitalize() => isEmpty ? this : '${this[0].toUpperCase()}${substring(1)}';
}
