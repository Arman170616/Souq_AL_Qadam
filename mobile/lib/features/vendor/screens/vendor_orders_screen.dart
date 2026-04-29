import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/models/order.dart';
import '../../../shared/widgets/glass_card.dart';

final vendorOrdersProvider = FutureProvider<List<Order>>((ref) async {
  final res = await ApiClient().dio.get('/orders/vendor/orders/');
  final list = res.data['results'] as List? ?? res.data as List? ?? [];
  return list.map((e) => Order.fromJson(e)).toList();
});

class VendorOrdersScreen extends ConsumerWidget {
  const VendorOrdersScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final orders = ref.watch(vendorOrdersProvider);

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: AppColors.bg,
        elevation: 0,
        title: const Text('Orders', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
      ),
      body: orders.when(
        loading: () => const Center(child: CircularProgressIndicator(color: AppColors.indigo)),
        error: (e, _) => Center(child: Text('$e', style: const TextStyle(color: AppColors.red))),
        data: (list) {
          if (list.isEmpty) {
            return const Center(
              child: Text('No orders yet', style: TextStyle(color: AppColors.textMuted, fontSize: 16)),
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: list.length,
            separatorBuilder: (_, _) => const SizedBox(height: 10),
            itemBuilder: (ctx, i) => _VendorOrderCard(order: list[i]),
          );
        },
      ),
    );
  }
}

class _VendorOrderCard extends StatelessWidget {
  final Order order;
  const _VendorOrderCard({required this.order});

  Color _statusColor(String s) {
    switch (s.toLowerCase()) {
      case 'delivered':  return AppColors.green;
      case 'cancelled':  return AppColors.red;
      case 'processing': return AppColors.amber;
      default:           return AppColors.indigo;
    }
  }

  @override
  Widget build(BuildContext context) => GlassCard(
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        Text('#${order.orderNumber}',
            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 14)),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
          decoration: BoxDecoration(
            color: _statusColor(order.status).withValues(alpha: 0.15),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text(order.status.toUpperCase(),
              style: TextStyle(color: _statusColor(order.status), fontSize: 10, fontWeight: FontWeight.w700)),
        ),
      ]),
      const SizedBox(height: 8),
      ...order.items.map((item) => Padding(
        padding: const EdgeInsets.only(bottom: 4),
        child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Expanded(
            child: Text('${item.productName} ×${item.quantity}',
                style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
                maxLines: 1, overflow: TextOverflow.ellipsis),
          ),
          Text('৳${double.tryParse(item.totalPrice)?.toStringAsFixed(0) ?? item.totalPrice}',
              style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
        ]),
      )),
      const SizedBox(height: 8),
      const Divider(color: AppColors.glassBorder, height: 1),
      const SizedBox(height: 8),
      Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        Text(
          '${order.createdAt.day}/${order.createdAt.month}/${order.createdAt.year}',
          style: const TextStyle(color: AppColors.textMuted, fontSize: 11),
        ),
        Text('৳${order.totalDouble.toStringAsFixed(0)}',
            style: const TextStyle(color: AppColors.indigo, fontWeight: FontWeight.w800, fontSize: 15)),
      ]),
    ]),
  );
}
