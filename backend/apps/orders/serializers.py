from rest_framework import serializers
from .models import Order, OrderItem
from apps.products.serializers import ProductListSerializer


class OrderItemSerializer(serializers.ModelSerializer):
    product_detail = ProductListSerializer(source='product', read_only=True)
    vendor_name = serializers.CharField(source='vendor.shop_name', read_only=True)

    class Meta:
        model = OrderItem
        fields = [
            'id', 'product', 'product_detail', 'variant', 'product_name',
            'quantity', 'unit_price', 'total_price', 'vendor_name',
        ]
        read_only_fields = ['total_price', 'vendor_name', 'product_detail']


class OrderCreateItemSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    variant_id = serializers.IntegerField(required=False, allow_null=True)
    quantity = serializers.IntegerField(min_value=1)


class OrderCreateSerializer(serializers.Serializer):
    items = OrderCreateItemSerializer(many=True, min_length=1)
    shipping_address = serializers.JSONField()
    notes = serializers.CharField(required=False, allow_blank=True)
    coupon_code = serializers.CharField(required=False, allow_blank=True)

    def validate_shipping_address(self, value):
        required_fields = ['full_name', 'address', 'city', 'phone']
        for f in required_fields:
            if not value.get(f):
                raise serializers.ValidationError(f'shipping_address.{f} is required.')
        return value


class OrderListSerializer(serializers.ModelSerializer):
    item_count = serializers.SerializerMethodField()
    customer_email = serializers.CharField(source='customer.email', read_only=True)
    customer_name = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'status', 'subtotal', 'shipping_cost',
            'discount', 'total', 'item_count', 'created_at',
            'customer_email', 'customer_name', 'shipping_address',
        ]

    def get_item_count(self, obj):
        return obj.items.count()

    def get_customer_name(self, obj):
        u = obj.customer
        name = f'{u.first_name} {u.last_name}'.strip()
        return name or u.username or u.email.split('@')[0]


class OrderDetailSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'status', 'subtotal', 'shipping_cost',
            'discount', 'total', 'shipping_address', 'notes',
            'items', 'created_at', 'updated_at',
        ]


class OrderStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Order.STATUS_CHOICES)
