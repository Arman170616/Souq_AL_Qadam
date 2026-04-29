from django.urls import path
from .views import (
    CategoryListView, AdminCategoryListCreateView, AdminCategoryDetailView,
    ProductListView, ProductDetailView,
    VendorProductListCreateView, VendorProductDetailView,
    ProductImageUploadView, ProductImageDeleteView, ProductVariantView, ProductVariantDetailView,
    StoreStatsView, BulkProductUploadView,
)

urlpatterns = [
    # Admin category management (must be before <slug:slug>/ catch-all)
    path('admin/categories/', AdminCategoryListCreateView.as_view(), name='admin-category-list'),
    path('admin/categories/<int:pk>/', AdminCategoryDetailView.as_view(), name='admin-category-detail'),
    # Bulk upload (must be before manage/<int:pk>/ to avoid conflict)
    path('manage/bulk-upload/', BulkProductUploadView.as_view(), name='product-bulk-upload'),
    # Vendor/admin product management (must be before <slug:slug>/ catch-all)
    path('manage/', VendorProductListCreateView.as_view(), name='vendor-product-list'),
    path('manage/<int:pk>/', VendorProductDetailView.as_view(), name='vendor-product-detail'),
    path('manage/<int:product_pk>/images/', ProductImageUploadView.as_view(), name='product-image-upload'),
    path('manage/<int:product_pk>/images/<int:image_pk>/', ProductImageDeleteView.as_view(), name='product-image-delete'),
    path('manage/<int:product_pk>/variants/', ProductVariantView.as_view(), name='product-variant-list'),
    path('manage/<int:product_pk>/variants/<int:pk>/', ProductVariantDetailView.as_view(), name='product-variant-detail'),
    # Public (catch-all slug must be last)
    path('categories/', CategoryListView.as_view(), name='category-list'),
    path('stats/', StoreStatsView.as_view(), name='store-stats'),
    path('', ProductListView.as_view(), name='product-list'),
    path('<slug:slug>/', ProductDetailView.as_view(), name='product-detail'),
]
