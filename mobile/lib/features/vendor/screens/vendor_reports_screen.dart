import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/glass_card.dart';
import 'vendor_dashboard_screen.dart';

class VendorReportsScreen extends ConsumerWidget {
  const VendorReportsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final summary = ref.watch(vendorSummaryProvider);

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: AppColors.bg,
        elevation: 0,
        title: const Text('Reports', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
      ),
      body: summary.when(
        loading: () => const Center(child: CircularProgressIndicator(color: AppColors.indigo)),
        error: (e, _) => Center(child: Text('$e', style: const TextStyle(color: AppColors.red))),
        data: (s) => ListView(
          padding: const EdgeInsets.all(16),
          children: [
            GlassCard(
              child: Column(children: [
                const Text('Revenue Overview',
                    style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w700)),
                const SizedBox(height: 20),
                SizedBox(
                  height: 160,
                  child: BarChart(
                    BarChartData(
                      backgroundColor: Colors.transparent,
                      borderData: FlBorderData(show: false),
                      gridData: const FlGridData(show: false),
                      titlesData: const FlTitlesData(show: false),
                      barGroups: List.generate(6, (i) => BarChartGroupData(
                        x: i,
                        barRods: [BarChartRodData(
                          toY: (i + 1) * 15000,
                          color: AppColors.indigo,
                          width: 18,
                          borderRadius: const BorderRadius.vertical(top: Radius.circular(4)),
                        )],
                      )),
                    ),
                  ),
                ),
              ]),
            ),
            const SizedBox(height: 16),
            Row(children: [
              Expanded(child: _MetricCard(
                label: 'Total Revenue',
                value: '৳${_fmt(s['total_revenue'])}',
                icon: Icons.monetization_on_outlined,
                color: AppColors.green,
              )),
              const SizedBox(width: 12),
              Expanded(child: _MetricCard(
                label: 'This Month',
                value: '৳${_fmt(s['revenue_this_month'])}',
                icon: Icons.calendar_today_outlined,
                color: AppColors.indigo,
              )),
            ]),
            const SizedBox(height: 12),
            Row(children: [
              Expanded(child: _MetricCard(
                label: 'Total Orders',
                value: '${s['total_orders'] ?? 0}',
                icon: Icons.receipt_long_outlined,
                color: AppColors.amber,
              )),
              const SizedBox(width: 12),
              Expanded(child: _MetricCard(
                label: 'Avg Order Value',
                value: '৳${_fmt(s['avg_order_value'])}',
                icon: Icons.bar_chart_outlined,
                color: AppColors.pink,
              )),
            ]),
            const SizedBox(height: 80),
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

class _MetricCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color color;

  const _MetricCard({required this.label, required this.value, required this.icon, required this.color});

  @override
  Widget build(BuildContext context) => GlassCard(
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Container(
        width: 32, height: 32,
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.15),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(icon, color: color, size: 16),
      ),
      const SizedBox(height: 10),
      Text(value, style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w800)),
      const SizedBox(height: 2),
      Text(label, style: const TextStyle(color: AppColors.textMuted, fontSize: 10)),
    ]),
  );
}
