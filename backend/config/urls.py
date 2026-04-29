from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.decorators import api_view
from rest_framework.response import Response
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView


@api_view(['GET'])
def api_root(request):
    return Response({
        'auth':     request.build_absolute_uri('/api/v1/auth/'),
        'vendors':  request.build_absolute_uri('/api/v1/vendors/'),
        'products': request.build_absolute_uri('/api/v1/products/'),
        'orders':   request.build_absolute_uri('/api/v1/orders/'),
        'cart':     request.build_absolute_uri('/api/v1/cart/'),
        'payments': request.build_absolute_uri('/api/v1/payments/'),
        'reviews':  request.build_absolute_uri('/api/v1/reviews/'),
        'docs':     request.build_absolute_uri('/api/docs/'),
        'schema':   request.build_absolute_uri('/api/schema/'),
    })


api_v1 = [
    path('', api_root, name='api-root'),
    path('auth/', include('apps.users.urls')),
    path('vendors/', include('apps.vendors.urls')),
    path('products/', include('apps.products.urls')),
    path('orders/', include('apps.orders.urls')),
    path('payments/', include('apps.payments.urls')),
    path('reviews/', include('apps.reviews.urls')),
    path('cart/', include('apps.cart.urls')),
]

urlpatterns = [
    path('django-admin/', admin.site.urls),
    path('api/v1/', include(api_v1)),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
