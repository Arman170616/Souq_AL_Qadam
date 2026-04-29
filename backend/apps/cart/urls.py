from django.urls import path
from .views import CartView, CartItemAddView, CartItemUpdateView

urlpatterns = [
    path('', CartView.as_view(), name='cart'),
    path('add/', CartItemAddView.as_view(), name='cart-add'),
    path('items/<int:item_id>/', CartItemUpdateView.as_view(), name='cart-item-update'),
]
