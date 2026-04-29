from rest_framework import generics, status, permissions, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend

from django.db.models import Sum, Count
from django.db.models.functions import TruncMonth
from .models import Vendor, VendorCommission, SiteSettings
from .serializers import (
    VendorSerializer, VendorCreateSerializer, VendorPublicSerializer,
    VendorStatusSerializer, VendorCommissionSerializer,
)


class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'


class IsSuperAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'superadmin'


class IsAdminOrSuperAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('admin', 'superadmin')


class VendorRegisterView(generics.CreateAPIView):
    serializer_class = VendorCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        if hasattr(request.user, 'vendor_profile'):
            return Response({'detail': 'You already have a vendor profile.'}, status=status.HTTP_400_BAD_REQUEST)
        return super().create(request, *args, **kwargs)


class VendorMeView(generics.RetrieveUpdateAPIView):
    serializer_class = VendorSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        try:
            return self.request.user.vendor_profile
        except Vendor.DoesNotExist:
            from rest_framework.exceptions import NotFound
            raise NotFound('No vendor profile found.')

    def update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return super().update(request, *args, **kwargs)


class VendorListView(generics.ListAPIView):
    serializer_class = VendorPublicSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['shop_name', 'description']
    ordering_fields = ['rating', 'total_sales', 'created_at']

    def get_queryset(self):
        return Vendor.objects.filter(status='approved')


class VendorDetailView(generics.RetrieveAPIView):
    serializer_class = VendorPublicSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'slug'
    queryset = Vendor.objects.filter(status='approved')


class AdminVendorListView(generics.ListAPIView):
    serializer_class = VendorSerializer
    permission_classes = [IsAdminOrSuperAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status']
    search_fields = ['shop_name', 'user__email']
    ordering_fields = ['created_at', 'rating', 'total_sales']

    def get_queryset(self):
        return Vendor.objects.select_related('user').all()


class AdminVendorStatusView(APIView):
    permission_classes = [IsSuperAdminUser]

    def patch(self, request, pk):
        try:
            vendor = Vendor.objects.get(pk=pk)
        except Vendor.DoesNotExist:
            return Response({'detail': 'Vendor not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = VendorStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        vendor.status = serializer.validated_data['status']
        vendor.save(update_fields=['status'])
        return Response(VendorSerializer(vendor).data)


# ── Vendor: own commission summary ───────────────────────────────────────────

class IsVendorUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('vendor', 'admin')


class VendorCommissionView(APIView):
    permission_classes = [IsVendorUser]

    def get(self, request):
        try:
            vendor = request.user.vendor_profile
        except Vendor.DoesNotExist:
            return Response({'detail': 'No vendor profile.'}, status=status.HTTP_404_NOT_FOUND)

        qs = VendorCommission.objects.filter(vendor=vendor).select_related('order')
        summary = qs.aggregate(
            total_earned=Sum('amount'),
            pending_amount=Sum('amount', filter=__import__('django.db.models', fromlist=['Q']).Q(status='pending')),
            settled_amount=Sum('amount', filter=__import__('django.db.models', fromlist=['Q']).Q(status='settled')),
        )
        from django.db.models import Q
        summary = {
            'total_earned':    float(qs.aggregate(t=Sum('amount'))['t'] or 0),
            'pending_amount':  float(qs.filter(status='pending').aggregate(t=Sum('amount'))['t'] or 0),
            'settled_amount':  float(qs.filter(status='settled').aggregate(t=Sum('amount'))['t'] or 0),
            'commission_rate': float(vendor.commission_rate),
            'total_count':     qs.count(),
        }
        commissions = VendorCommissionSerializer(qs[:50], many=True).data
        return Response({'summary': summary, 'commissions': commissions})


# ── Admin: full commission report ────────────────────────────────────────────

class AdminCommissionReportView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        from django.db.models import Q

        qs = VendorCommission.objects.select_related('vendor', 'order')

        # Overall summary
        summary = {
            'total_earned':   float(qs.aggregate(t=Sum('amount'))['t'] or 0),
            'pending_amount': float(qs.filter(status='pending').aggregate(t=Sum('amount'))['t'] or 0),
            'settled_amount': float(qs.filter(status='settled').aggregate(t=Sum('amount'))['t'] or 0),
            'total_count':    qs.count(),
        }

        # Monthly chart (last 12 months)
        monthly = (
            qs.annotate(month=TruncMonth('created_at'))
            .values('month')
            .annotate(amount=Sum('amount'), count=Count('id'))
            .order_by('month')
        )
        monthly_data = [
            {
                'month': m['month'].strftime('%b %Y'),
                'amount': float(m['amount'] or 0),
                'count':  m['count'],
            }
            for m in monthly
        ]

        # Per-vendor breakdown
        vendor_breakdown = (
            qs.values('vendor__id', 'vendor__shop_name', 'vendor__commission_rate')
            .annotate(
                total=Sum('amount'),
                pending=Sum('amount', filter=Q(status='pending')),
                settled=Sum('amount', filter=Q(status='settled')),
                orders=Count('id'),
            )
            .order_by('-total')
        )
        vendor_data = [
            {
                'vendor_id':       v['vendor__id'],
                'vendor_name':     v['vendor__shop_name'],
                'commission_rate': float(v['vendor__commission_rate']),
                'total':           float(v['total'] or 0),
                'pending':         float(v['pending'] or 0),
                'settled':         float(v['settled'] or 0),
                'orders':          v['orders'],
            }
            for v in vendor_breakdown
        ]

        return Response({
            'summary':  summary,
            'monthly':  monthly_data,
            'vendors':  vendor_data,
        })


class AdminUpdateCommissionRateView(APIView):
    """Update a vendor's commission rate."""
    permission_classes = [IsAdminUser]

    def patch(self, request, pk):
        try:
            vendor = Vendor.objects.get(pk=pk)
        except Vendor.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        rate = request.data.get('commission_rate')
        if rate is None:
            return Response({'detail': 'commission_rate required.'}, status=status.HTTP_400_BAD_REQUEST)
        vendor.commission_rate = rate
        vendor.save(update_fields=['commission_rate'])
        return Response({'id': vendor.id, 'commission_rate': float(vendor.commission_rate)})


class AdminSettleCommissionView(APIView):
    """Mark a vendor's pending commissions as settled."""
    permission_classes = [IsAdminUser]

    def post(self, request, vendor_id):
        from django.utils import timezone
        updated = VendorCommission.objects.filter(
            vendor_id=vendor_id, status='pending'
        ).update(status='settled', settled_at=timezone.now())
        return Response({'settled': updated})


class AdminTogglePremiumView(APIView):
    """Toggle a vendor's premium status — SuperAdmin only."""
    permission_classes = [IsSuperAdminUser]

    def post(self, request, pk):
        try:
            vendor = Vendor.objects.get(pk=pk)
        except Vendor.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        vendor.is_premium = not vendor.is_premium
        vendor.save(update_fields=['is_premium'])
        return Response({'id': vendor.id, 'is_premium': vendor.is_premium})


class AdminSiteSettingsView(APIView):
    """Read / update platform-wide settings (singleton)."""
    permission_classes = [IsAdminUser]

    def get(self, request):
        s = SiteSettings.get()
        return Response({'default_commission_rate': float(s.default_commission_rate)})

    def patch(self, request):
        s = SiteSettings.get()
        rate = request.data.get('default_commission_rate')
        if rate is not None:
            try:
                s.default_commission_rate = float(rate)
                s.save(update_fields=['default_commission_rate'])
            except (ValueError, TypeError):
                return Response({'detail': 'Invalid rate.'}, status=status.HTTP_400_BAD_REQUEST)
        return Response({'default_commission_rate': float(s.default_commission_rate)})
