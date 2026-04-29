from django.urls import path
from .views import (
    OrderListCreateView, OrderCreateView, OrderDetailView,
    VendorOrderListView, VendorOrderStatusView,
    AdminOrderListView, AdminAnalyticsView,
    VendorAnalyticsView,
)

urlpatterns = [
    path('', OrderListCreateView.as_view(), name='order-list'),
    path('create/', OrderCreateView.as_view(), name='order-create'),
    path('vendor/orders/', VendorOrderListView.as_view(), name='vendor-order-list'),
    path('vendor/orders/<str:order_number>/status/', VendorOrderStatusView.as_view(), name='vendor-order-status'),
    path('vendor/analytics/', VendorAnalyticsView.as_view(), name='vendor-analytics'),
    path('admin/orders/', AdminOrderListView.as_view(), name='admin-order-list'),
    path('admin/analytics/', AdminAnalyticsView.as_view(), name='admin-analytics'),
    path('<str:order_number>/', OrderDetailView.as_view(), name='order-detail'),
]
