import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/api/api_client.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/glass_card.dart';
import '../../auth/providers/auth_provider.dart';

final vendorSummaryProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  final res = await ApiClient().dio.get('/orders/vendor/analytics/');
  return res.data['summary'] as Map<String, dynamic>;
});

class VendorDashboardScreen extends ConsumerWidget {
  const VendorDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user    = ref.watch(authProvider).user;
    final summary = ref.watch(vendorSummaryProvider);

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child: CustomScrollView(
          slivers: [
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text('Welcome back,', style: const TextStyle(color: AppColors.textMuted, fontSize: 13)),
                  Text(user?.firstName ?? 'Vendor',
                      style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w800)),
                ]),
              ),
            ),
            // Stats grid
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
                child: summary.when(
                  loading: () => const Center(child: CircularProgressIndicator(color: AppColors.indigo)),
                  error: (e, _) => Text('$e', style: const TextStyle(color: AppColors.red)),
                  data: (s) => Column(children: [
                    Row(children: [
                      Expanded(child: _StatCard(
                        icon: Icons.monetization_on_outlined,
                        label: 'Total Revenue',
                        value: '৳${_fmt(s['total_revenue'])}',
                        color: AppColors.green,
                      )),
                      const SizedBox(width: 12),
                      Expanded(child: _StatCard(
                        icon: Icons.receipt_long_outlined,
                        label: 'Total Orders',
                        value: '${s['total_orders'] ?? 0}',
                        color: AppColors.indigo,
                      )),
                    ]),
                    const SizedBox(height: 12),
                    Row(children: [
                      Expanded(child: _StatCard(
                        icon: Icons.calendar_month_outlined,
                        label: 'This Month',
                        value: '৳${_fmt(s['revenue_this_month'])}',
                        color: AppColors.pink,
                      )),
                      const SizedBox(width: 12),
                      Expanded(child: _StatCard(
                        icon: Icons.bar_chart_outlined,
                        label: 'Avg Order',
                        value: '৳${_fmt(s['avg_order_value'])}',
                        color: AppColors.amber,
                      )),
                    ]),
                  ]),
                ),
              ),
            ),
            // Quick actions
            const SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.fromLTRB(20, 28, 20, 12),
                child: Text('Quick Actions', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w700)),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Column(children: [
                  _ActionTile(
                    icon: Icons.inventory_2_outlined,
                    title: 'My Products',
                    subtitle: 'Manage your product listings',
                    color: AppColors.indigo,
                    onTap: () => context.push('/vendor/products'),
                  ),
                  const SizedBox(height: 10),
                  _ActionTile(
                    icon: Icons.shopping_bag_outlined,
                    title: 'Orders',
                    subtitle: 'View and manage customer orders',
                    color: AppColors.green,
                    onTap: () => context.push('/vendor/orders'),
                  ),
                  const SizedBox(height: 10),
                  _ActionTile(
                    icon: Icons.bar_chart_rounded,
                    title: 'Reports',
                    subtitle: 'Analytics and revenue reports',
                    color: AppColors.amber,
                    onTap: () => context.push('/vendor/reports'),
                  ),
                ]),
              ),
            ),
            const SliverToBoxAdapter(child: SizedBox(height: 100)),
          ],
        ),
      ),
    );
  }

  String _fmt(dynamic v) {
    final d = double.tryParse(v?.toString() ?? '0') ?? 0;
    if (d >= 1000) return '${(d / 1000).toStringAsFixed(1)}K';
    return d.toStringAsFixed(0);
  }
}

class _StatCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color color;

  const _StatCard({required this.icon, required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) => GlassCard(
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Container(
        width: 36, height: 36,
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.15),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, color: color, size: 18),
      ),
      const SizedBox(height: 10),
      Text(value, style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w800)),
      const SizedBox(height: 2),
      Text(label, style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
    ]),
  );
}

class _ActionTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final Color color;
  final VoidCallback onTap;

  const _ActionTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) => GlassCard(
    onTap: onTap,
    child: Row(children: [
      Container(
        width: 44, height: 44,
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.15),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Icon(icon, color: color, size: 22),
      ),
      const SizedBox(width: 14),
      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
        Text(subtitle, style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
      ])),
      const Icon(Icons.arrow_forward_ios, color: AppColors.textMuted, size: 14),
    ]),
  );
}
