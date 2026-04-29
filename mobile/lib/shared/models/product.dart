class Product {
  final int    id;
  final String name;
  final String slug;
  final String price;
  final String? discountPrice;
  final String effectivePrice;
  final String? primaryImage;
  final String vendorName;
  final String vendorSlug;
  final String categoryName;
  final double rating;
  final int    reviewCount;
  final bool   isActive;
  final bool   isFeatured;
  final int    stock;
  final String? sku;
  final String? description;

  const Product({
    required this.id,
    required this.name,
    required this.slug,
    required this.price,
    this.discountPrice,
    required this.effectivePrice,
    this.primaryImage,
    required this.vendorName,
    required this.vendorSlug,
    required this.categoryName,
    required this.rating,
    required this.reviewCount,
    required this.isActive,
    required this.isFeatured,
    required this.stock,
    this.sku,
    this.description,
  });

  double get effectivePriceDouble => double.tryParse(effectivePrice) ?? 0;
  double get priceDouble          => double.tryParse(price) ?? 0;
  bool   get hasDiscount          => discountPrice != null;

  factory Product.fromJson(Map<String, dynamic> j) => Product(
    id:            j['id'],
    name:          j['name'],
    slug:          j['slug'],
    price:         j['price'].toString(),
    discountPrice: j['discount_price']?.toString(),
    effectivePrice: (j['effective_price'] ?? j['price']).toString(),
    primaryImage:  j['primary_image'],
    vendorName:    j['vendor_name'] ?? '',
    vendorSlug:    j['vendor_slug'] ?? '',
    categoryName:  j['category_name'] ?? '',
    rating:        double.tryParse(j['rating']?.toString() ?? '0') ?? 0,
    reviewCount:   j['review_count'] ?? 0,
    isActive:      j['is_active'] ?? true,
    isFeatured:    j['is_featured'] ?? false,
    stock:         j['stock'] ?? 0,
    sku:           j['sku'],
    description:   j['description'],
  );
}
