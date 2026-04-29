from django.urls import path
from .views import (
    VendorRegisterView, VendorMeView,
    VendorListView, VendorDetailView,
    AdminVendorListView, AdminVendorStatusView,
    VendorCommissionView,
    AdminCommissionReportView, AdminUpdateCommissionRateView, AdminSettleCommissionView,
    AdminSiteSettingsView, AdminTogglePremiumView,
)

urlpatterns = [
    # Vendor
    path('register/', VendorRegisterView.as_view(), name='vendor-register'),
    path('me/', VendorMeView.as_view(), name='vendor-me'),
    path('my-commissions/', VendorCommissionView.as_view(), name='vendor-commissions'),
    # Admin
    path('admin/list/', AdminVendorListView.as_view(), name='admin-vendor-list'),
    path('admin/<int:pk>/status/', AdminVendorStatusView.as_view(), name='admin-vendor-status'),
    path('admin/<int:pk>/commission-rate/', AdminUpdateCommissionRateView.as_view(), name='admin-vendor-commission-rate'),
    path('admin/commissions/', AdminCommissionReportView.as_view(), name='admin-commission-report'),
    path('admin/site-settings/', AdminSiteSettingsView.as_view(), name='admin-site-settings'),
    path('admin/<int:vendor_id>/settle/', AdminSettleCommissionView.as_view(), name='admin-settle-commissions'),
    path('admin/<int:pk>/toggle-premium/', AdminTogglePremiumView.as_view(), name='admin-toggle-premium'),
    # Public (catch-all slug must be last)
    path('', VendorListView.as_view(), name='vendor-list'),
    path('<slug:slug>/', VendorDetailView.as_view(), name='vendor-detail'),
]
