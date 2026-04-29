from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    RegisterView, LoginView, LogoutView, MeView,
    ChangePasswordView, AdminCustomerListView, AdminVerifyUserView,
    SuperAdminStatsView, SuperAdminUserListView,
    SuperAdminUserDetailView, SuperAdminCreateAdminView,
    AvatarUploadView,
    AddressListCreateView, AddressDetailView, SetDefaultAddressView,
)

urlpatterns = [
    # Auth
    path('register/',        RegisterView.as_view(),       name='register'),
    path('login/',           LoginView.as_view(),           name='login'),
    path('logout/',          LogoutView.as_view(),          name='logout'),
    path('token/refresh/',   TokenRefreshView.as_view(),    name='token-refresh'),
    path('me/',              MeView.as_view(),              name='me'),
    path('me/avatar/',       AvatarUploadView.as_view(),    name='me-avatar'),
    path('change-password/', ChangePasswordView.as_view(),  name='change-password'),

    # Addresses
    path('addresses/',                    AddressListCreateView.as_view(), name='address-list'),
    path('addresses/<int:pk>/',           AddressDetailView.as_view(),     name='address-detail'),
    path('addresses/<int:pk>/default/',   SetDefaultAddressView.as_view(), name='address-set-default'),

    # Admin
    path('admin/customers/',               AdminCustomerListView.as_view(),  name='admin-customer-list'),
    path('admin/users/<int:pk>/verify/',   AdminVerifyUserView.as_view(),    name='admin-verify-user'),

    # Super Admin
    path('superadmin/stats/',              SuperAdminStatsView.as_view(),       name='superadmin-stats'),
    path('superadmin/users/',              SuperAdminUserListView.as_view(),    name='superadmin-user-list'),
    path('superadmin/users/<int:pk>/',     SuperAdminUserDetailView.as_view(),  name='superadmin-user-detail'),
    path('superadmin/create-admin/',       SuperAdminCreateAdminView.as_view(), name='superadmin-create-admin'),
]
