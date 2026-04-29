import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/models/order.dart';
import '../../../shared/widgets/glass_card.dart';

final ordersProvider = FutureProvider<List<Order>>((ref) async {
  final res = await ApiClient().dio.get('/orders/');
  final list = res.data['results'] as List? ?? res.data as List? ?? [];
  return list.map((e) => Order.fromJson(e)).toList();
});

class OrdersScreen extends ConsumerWidget {
  const OrdersScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final orders = ref.watch(ordersProvider);

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: AppColors.bg,
        elevation: 0,
        title: const Text('My Orders', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
      ),
      body: orders.when(
        loading: () => const Center(child: CircularProgressIndicator(color: AppColors.indigo)),
        error: (e, _) => Center(child: Text('$e', style: const TextStyle(color: AppColors.red))),
        data: (list) {
          if (list.isEmpty) {
            return const Center(
              child: Column(mainAxisSize: MainAxisSize.min, children: [
                Icon(Icons.receipt_long_outlined, color: AppColors.textMuted, size: 80),
                SizedBox(height: 16),
                Text('No orders yet', style: TextStyle(color: AppColors.textSecondary, fontSize: 18)),
              ]),
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: list.length,
            separatorBuilder: (_, _) => const SizedBox(height: 10),
            itemBuilder: (ctx, i) => _OrderCard(order: list[i]),
          );
        },
      ),
    );
  }
}

class _OrderCard extends StatelessWidget {
  final Order order;
  const _OrderCard({required this.order});

  Color _statusColor(String s) {
    switch (s.toLowerCase()) {
      case 'delivered': return AppColors.green;
      case 'cancelled': return AppColors.red;
      case 'processing': return AppColors.amber;
      default:          return AppColors.indigo;
    }
  }

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('#${order.orderNumber}',
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 15)),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: _statusColor(order.status).withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(order.status.toUpperCase(),
                  style: TextStyle(color: _statusColor(order.status), fontSize: 10, fontWeight: FontWeight.w700)),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Text('${order.items.length} item${order.items.length != 1 ? 's' : ''}',
            style: const TextStyle(color: AppColors.textMuted, fontSize: 13)),
        const SizedBox(height: 4),
        Text(
          '${order.createdAt.day}/${order.createdAt.month}/${order.createdAt.year}',
          style: const TextStyle(color: AppColors.textMuted, fontSize: 12),
        ),
        const SizedBox(height: 12),
        const Divider(color: AppColors.glassBorder, height: 1),
        const SizedBox(height: 12),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text('Total', style: TextStyle(color: AppColors.textSecondary)),
            Text('৳${order.totalDouble.toStringAsFixed(0)}',
                style: const TextStyle(color: AppColors.indigo, fontWeight: FontWeight.w800, fontSize: 16)),
          ],
        ),
      ]),
    );
  }
}
