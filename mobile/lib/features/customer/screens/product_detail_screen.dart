import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/models/product.dart';
import '../../../shared/widgets/gradient_button.dart';

final productDetailProvider = FutureProvider.family<Product, String>((ref, slug) async {
  final res = await ApiClient().dio.get('/products/$slug/');
  return Product.fromJson(res.data);
});

class ProductDetailScreen extends ConsumerStatefulWidget {
  final String slug;
  const ProductDetailScreen({super.key, required this.slug});

  @override
  ConsumerState<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends ConsumerState<ProductDetailScreen> {
  int _qty = 1;
  bool _addingToCart = false;

  Future<void> _addToCart(Product product) async {
    setState(() => _addingToCart = true);
    try {
      await ApiClient().dio.post('/cart/add/', data: {
        'product_id': product.id,
        'quantity': _qty,
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Added to cart!'),
            backgroundColor: AppColors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _addingToCart = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final product = ref.watch(productDetailProvider(widget.slug));

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: product.when(
        loading: () => const Center(child: CircularProgressIndicator(color: AppColors.indigo)),
        error: (e, _) => Center(child: Text('$e', style: const TextStyle(color: AppColors.red))),
        data: (p) => CustomScrollView(
          slivers: [
            SliverAppBar(
              expandedHeight: 360,
              pinned: true,
              backgroundColor: AppColors.bg,
              flexibleSpace: FlexibleSpaceBar(
                background: p.primaryImage != null
                    ? CachedNetworkImage(
                        imageUrl: p.primaryImage!,
                        fit: BoxFit.cover,
                        errorWidget: (_, _, _) => Container(
                          color: AppColors.bgCard,
                          child: const Center(child: Text('👟', style: TextStyle(fontSize: 80))),
                        ),
                      )
                    : Container(
                        color: AppColors.bgCard,
                        child: const Center(child: Text('👟', style: TextStyle(fontSize: 80))),
                      ),
              ),
              leading: GestureDetector(
                onTap: () => Navigator.pop(context),
                child: Container(
                  margin: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppColors.bgCard.withValues(alpha: 0.8),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.arrow_back, color: Colors.white),
                ),
              ),
              actions: [
                if (p.hasDiscount)
                  Container(
                    margin: const EdgeInsets.only(right: 12, top: 8, bottom: 8),
                    padding: const EdgeInsets.symmetric(horizontal: 10),
                    decoration: BoxDecoration(
                      color: AppColors.red,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    alignment: Alignment.center,
                    child: const Text('SALE', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w800)),
                  ),
              ],
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(p.vendorName, style: const TextStyle(color: AppColors.indigo, fontSize: 12)),
                    const SizedBox(height: 6),
                    Text(p.name, style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w800)),
                    const SizedBox(height: 10),
                    Row(children: [
                      const Icon(Icons.star_rounded, size: 16, color: AppColors.amber),
                      const SizedBox(width: 4),
                      Text('${p.rating.toStringAsFixed(1)} (${p.reviewCount} reviews)',
                          style: const TextStyle(color: AppColors.textMuted, fontSize: 13)),
                      const Spacer(),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: p.stock > 0 ? AppColors.green.withValues(alpha: 0.15) : AppColors.red.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          p.stock > 0 ? 'In Stock (${p.stock})' : 'Out of Stock',
                          style: TextStyle(
                            color: p.stock > 0 ? AppColors.green : AppColors.red,
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ]),
                    const SizedBox(height: 20),
                    Row(children: [
                      Text('৳${p.effectivePriceDouble.toStringAsFixed(0)}',
                          style: const TextStyle(color: AppColors.indigo, fontSize: 28, fontWeight: FontWeight.w900)),
                      if (p.hasDiscount) ...[
                        const SizedBox(width: 10),
                        Text('৳${p.priceDouble.toStringAsFixed(0)}',
                            style: const TextStyle(
                              color: AppColors.textDisabled,
                              fontSize: 16,
                              decoration: TextDecoration.lineThrough,
                            )),
                      ],
                    ]),
                    if (p.description != null && p.description!.isNotEmpty) ...[
                      const SizedBox(height: 24),
                      const Text('Description', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w700)),
                      const SizedBox(height: 8),
                      Text(p.description!, style: const TextStyle(color: AppColors.textSecondary, fontSize: 14, height: 1.6)),
                    ],
                    const SizedBox(height: 28),
                    // Quantity
                    Row(children: [
                      const Text('Quantity', style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w600)),
                      const Spacer(),
                      Container(
                        decoration: BoxDecoration(
                          color: AppColors.bgCard,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppColors.glassBorder),
                        ),
                        child: Row(children: [
                          IconButton(
                            icon: const Icon(Icons.remove, color: Colors.white, size: 18),
                            onPressed: _qty > 1 ? () => setState(() => _qty--) : null,
                          ),
                          Text('$_qty', style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w700)),
                          IconButton(
                            icon: const Icon(Icons.add, color: Colors.white, size: 18),
                            onPressed: _qty < p.stock ? () => setState(() => _qty++) : null,
                          ),
                        ]),
                      ),
                    ]),
                    const SizedBox(height: 28),
                    GradientButton(
                      label: 'Add to Cart',
                      loading: _addingToCart,
                      onPressed: p.stock > 0 ? () => _addToCart(p) : null,
                    ),
                    const SizedBox(height: 40),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
