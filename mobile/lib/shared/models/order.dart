class OrderItem {
  final int    id;
  final String productName;
  final int    quantity;
  final String unitPrice;
  final String totalPrice;
  final String? productImage;

  const OrderItem({
    required this.id,
    required this.productName,
    required this.quantity,
    required this.unitPrice,
    required this.totalPrice,
    this.productImage,
  });

  factory OrderItem.fromJson(Map<String, dynamic> j) => OrderItem(
    id:           j['id'],
    productName:  j['product_name'],
    quantity:     j['quantity'],
    unitPrice:    j['unit_price'].toString(),
    totalPrice:   j['total_price'].toString(),
    productImage: j['product_image'],
  );
}

class Order {
  final int          id;
  final String       orderNumber;
  final String       status;
  final String       total;
  final List<OrderItem> items;
  final DateTime     createdAt;

  const Order({
    required this.id,
    required this.orderNumber,
    required this.status,
    required this.total,
    required this.items,
    required this.createdAt,
  });

  double get totalDouble => double.tryParse(total) ?? 0;

  factory Order.fromJson(Map<String, dynamic> j) => Order(
    id:          j['id'],
    orderNumber: j['order_number'],
    status:      j['status'],
    total:       j['total'].toString(),
    items:       (j['items'] as List? ?? [])
        .map((i) => OrderItem.fromJson(i))
        .toList(),
    createdAt:   DateTime.tryParse(j['created_at'] ?? '') ?? DateTime.now(),
  );
}
