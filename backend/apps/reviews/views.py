from rest_framework import generics, status, permissions
from rest_framework.response import Response

from apps.products.models import Product
from apps.orders.models import OrderItem
from .models import Review
from .serializers import ReviewSerializer, ReviewWriteSerializer


class ProductReviewListCreateView(generics.ListCreateAPIView):
    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ReviewWriteSerializer
        return ReviewSerializer

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['product'] = self._get_product()
        return ctx

    def _get_product(self):
        try:
            return Product.objects.get(slug=self.kwargs['product_slug'], is_active=True)
        except Product.DoesNotExist:
            from rest_framework.exceptions import NotFound
            raise NotFound('Product not found.')

    def get_queryset(self):
        return Review.objects.filter(product__slug=self.kwargs['product_slug']).select_related('user')

    def perform_create(self, serializer):
        product = self._get_product()
        # Check verified purchase
        is_verified = OrderItem.objects.filter(
            order__customer=self.request.user,
            product=product,
            order__status='delivered',
        ).exists()
        serializer.save(user=self.request.user, product=product, is_verified_purchase=is_verified)


class ReviewDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return ReviewWriteSerializer
        return ReviewSerializer

    def get_queryset(self):
        return Review.objects.filter(user=self.request.user)

    def update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return super().update(request, *args, **kwargs)
