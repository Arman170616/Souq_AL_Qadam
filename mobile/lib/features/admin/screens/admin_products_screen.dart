import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/models/product.dart';
import '../../../shared/widgets/glass_card.dart';

final allProductsAdminProvider = FutureProvider<List<Product>>((ref) async {
  final res = await ApiClient().dio.get('/products/', queryParameters: {'page_size': 50});
  final list = res.data['results'] as List? ?? [];
  return list.map((e) => Product.fromJson(e)).toList();
});

class AdminProductsScreen extends ConsumerWidget {
  const AdminProductsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final products = ref.watch(allProductsAdminProvider);

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: AppColors.bg,
        elevation: 0,
        title: const Text('All Products', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
      ),
      body: products.when(
        loading: () => const Center(child: CircularProgressIndicator(color: AppColors.indigo)),
        error: (e, _) => Center(child: Text('$e', style: const TextStyle(color: AppColors.red))),
        data: (list) => ListView.separated(
          padding: const EdgeInsets.all(16),
          itemCount: list.length,
          separatorBuilder: (_, _) => const SizedBox(height: 8),
          itemBuilder: (ctx, i) {
            final p = list[i];
            return GlassCard(
              padding: const EdgeInsets.all(12),
              child: Row(children: [
                Container(
                  width: 50, height: 50,
                  decoration: BoxDecoration(color: AppColors.bgSurface, borderRadius: BorderRadius.circular(10)),
                  child: const Center(child: Text('👟', style: TextStyle(fontSize: 24))),
                ),
                const SizedBox(width: 12),
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(p.name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
                      maxLines: 1, overflow: TextOverflow.ellipsis),
                  Text(p.vendorName, style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
                  Text('৳${p.effectivePriceDouble.toStringAsFixed(0)}',
                      style: const TextStyle(color: AppColors.indigo, fontWeight: FontWeight.w700, fontSize: 13)),
                ])),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: p.isActive ? AppColors.green.withValues(alpha: 0.15) : AppColors.red.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(p.isActive ? 'Active' : 'Off',
                      style: TextStyle(color: p.isActive ? AppColors.green : AppColors.red, fontSize: 10, fontWeight: FontWeight.w700)),
                ),
              ]),
            );
          },
        ),
      ),
    );
  }
}
