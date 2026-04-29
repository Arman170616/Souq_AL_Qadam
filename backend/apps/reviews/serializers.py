from rest_framework import serializers
from .models import Review
from apps.users.serializers import UserSerializer


class ReviewSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Review
        fields = ['id', 'user', 'rating', 'title', 'body', 'is_verified_purchase', 'created_at']
        read_only_fields = ['id', 'user', 'is_verified_purchase', 'created_at']


class ReviewWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ['rating', 'title', 'body']

    def validate(self, data):
        request = self.context['request']
        product = self.context['product']
        if not self.instance and Review.objects.filter(product=product, user=request.user).exists():
            raise serializers.ValidationError('You have already reviewed this product.')
        return data
