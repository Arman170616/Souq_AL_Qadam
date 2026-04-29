import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/models/order.dart';
import '../../../shared/widgets/glass_card.dart';

final allOrdersAdminProvider = FutureProvider<List<Order>>((ref) async {
  final res = await ApiClient().dio.get('/orders/admin/orders/');
  final list = res.data['results'] as List? ?? res.data as List? ?? [];
  return list.map((e) => Order.fromJson(e)).toList();
});

class AdminOrdersScreen extends ConsumerWidget {
  const AdminOrdersScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final orders = ref.watch(allOrdersAdminProvider);

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: AppColors.bg,
        elevation: 0,
        title: const Text('All Orders', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
      ),
      body: orders.when(
        loading: () => const Center(child: CircularProgressIndicator(color: AppColors.indigo)),
        error: (e, _) => Center(child: Text('$e', style: const TextStyle(color: AppColors.red))),
        data: (list) {
          if (list.isEmpty) {
            return const Center(child: Text('No orders', style: TextStyle(color: AppColors.textMuted)));
          }
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: list.length,
            separatorBuilder: (_, _) => const SizedBox(height: 8),
            itemBuilder: (ctx, i) {
              final o = list[i];
              return GlassCard(
                padding: const EdgeInsets.all(12),
                child: Row(children: [
                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text('#${o.orderNumber}', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
                    Text('${o.items.length} items — ${o.createdAt.day}/${o.createdAt.month}/${o.createdAt.year}',
                        style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
                  ])),
                  Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                    Text('৳${o.totalDouble.toStringAsFixed(0)}',
                        style: const TextStyle(color: AppColors.indigo, fontWeight: FontWeight.w800)),
                    const SizedBox(height: 4),
                    Text(o.status.toUpperCase(),
                        style: const TextStyle(color: AppColors.textMuted, fontSize: 10, fontWeight: FontWeight.w600)),
                  ]),
                ]),
              );
            },
          );
        },
      ),
    );
  }
}
