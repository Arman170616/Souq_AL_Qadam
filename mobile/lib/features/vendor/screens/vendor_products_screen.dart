import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/models/product.dart';
import '../../../shared/widgets/glass_card.dart';

final vendorProductsProvider = FutureProvider<List<Product>>((ref) async {
  final res = await ApiClient().dio.get('/products/manage/');
  final list = res.data['results'] as List? ?? res.data as List? ?? [];
  return list.map((e) => Product.fromJson(e)).toList();
});

class VendorProductsScreen extends ConsumerWidget {
  const VendorProductsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final products = ref.watch(vendorProductsProvider);

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: AppColors.bg,
        elevation: 0,
        title: const Text('My Products', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
      ),
      body: products.when(
        loading: () => const Center(child: CircularProgressIndicator(color: AppColors.indigo)),
        error: (e, _) => Center(child: Text('$e', style: const TextStyle(color: AppColors.red))),
        data: (list) {
          if (list.isEmpty) {
            return const Center(
              child: Text('No products yet', style: TextStyle(color: AppColors.textMuted, fontSize: 16)),
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: list.length,
            separatorBuilder: (_, _) => const SizedBox(height: 10),
            itemBuilder: (ctx, i) => _ProductTile(product: list[i]),
          );
        },
      ),
    );
  }
}

class _ProductTile extends StatelessWidget {
  final Product product;
  const _ProductTile({required this.product});

  @override
  Widget build(BuildContext context) => GlassCard(
    child: Row(children: [
      Container(
        width: 56, height: 56,
        decoration: BoxDecoration(
          color: AppColors.bgSurface,
          borderRadius: BorderRadius.circular(10),
        ),
        child: const Center(child: Text('👟', style: TextStyle(fontSize: 28))),
      ),
      const SizedBox(width: 12),
      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(product.name,
            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
            maxLines: 2, overflow: TextOverflow.ellipsis),
        const SizedBox(height: 4),
        Row(children: [
          Text('৳${product.effectivePriceDouble.toStringAsFixed(0)}',
              style: const TextStyle(color: AppColors.indigo, fontWeight: FontWeight.w700)),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
            decoration: BoxDecoration(
              color: product.isActive ? AppColors.green.withValues(alpha: 0.15) : AppColors.red.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(
              product.isActive ? 'Active' : 'Inactive',
              style: TextStyle(
                color: product.isActive ? AppColors.green : AppColors.red,
                fontSize: 10, fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ]),
        const SizedBox(height: 2),
        Text('Stock: ${product.stock}',
            style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
      ])),
    ]),
  );
}
