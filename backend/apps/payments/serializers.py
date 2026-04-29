from rest_framework import serializers
from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    order_number = serializers.CharField(source='order.order_number', read_only=True)

    class Meta:
        model = Payment
        fields = [
            'id', 'order_number', 'method', 'status', 'amount',
            'transaction_id', 'created_at',
        ]
        read_only_fields = ['id', 'order_number', 'status', 'amount', 'transaction_id', 'created_at']


class PaymentCreateSerializer(serializers.Serializer):
    order_number = serializers.CharField()
    method = serializers.ChoiceField(choices=Payment.METHOD_CHOICES)
    # For mobile money
    phone_number = serializers.CharField(required=False, allow_blank=True)
    # For card
    card_token = serializers.CharField(required=False, allow_blank=True)
