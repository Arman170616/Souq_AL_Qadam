from django.urls import path
from .views import (
    PaymentInitiateView, PaymentDetailView,
    BangoPayInitiateView, BangoPayVerifyView,
    InvoiceView,
)

urlpatterns = [
    path('initiate/',               PaymentInitiateView.as_view(),   name='payment-initiate'),
    path('<int:pk>/',               PaymentDetailView.as_view(),     name='payment-detail'),
    path('bangopay/initiate/',      BangoPayInitiateView.as_view(),  name='bangopay-initiate'),
    path('bangopay/verify/',        BangoPayVerifyView.as_view(),    name='bangopay-verify'),
    path('invoice/<str:order_number>/', InvoiceView.as_view(),       name='invoice'),
]
