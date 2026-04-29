from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.db.models import Count, Q

from config.throttles import LoginRateThrottle, RegisterRateThrottle
from .serializers import (
    UserSerializer, RegisterSerializer,
    CustomTokenObtainPairSerializer, ChangePasswordSerializer,
    AddressSerializer,
)
from .models import Address

User = get_user_model()


class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('admin', 'superadmin')


class IsSuperAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'superadmin'


# ─── Admin: list all users ────────────────────────────────────────────────────

class AdminCustomerListView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        qs = User.objects.all().order_by('-date_joined')
        role   = self.request.query_params.get('role')
        search = self.request.query_params.get('search', '')
        if role:
            qs = qs.filter(role=role)
        if search:
            qs = qs.filter(
                Q(email__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)
            )
        return qs


# ─── SuperAdmin: platform stats ───────────────────────────────────────────────

class SuperAdminStatsView(APIView):
    permission_classes = [IsSuperAdminUser]

    def get(self, request):
        from apps.orders.models import Order
        from apps.vendors.models import Vendor
        from apps.products.models import Product

        role_counts = {
            r['role']: r['count']
            for r in User.objects.values('role').annotate(count=Count('id'))
        }
        return Response({
            'total_users':      User.objects.count(),
            'total_customers':  role_counts.get('customer', 0),
            'total_vendors':    role_counts.get('vendor', 0),
            'total_admins':     role_counts.get('admin', 0),
            'total_superadmins':role_counts.get('superadmin', 0),
            'total_orders':     Order.objects.count(),
            'total_products':   Product.objects.count(),
            'total_vendors_db': Vendor.objects.count(),
            'pending_vendors':  Vendor.objects.filter(status='pending').count(),
        })


# ─── SuperAdmin: list all users with filters ─────────────────────────────────

class SuperAdminUserListView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsSuperAdminUser]

    def get_queryset(self):
        qs = User.objects.all().order_by('-date_joined')
        role   = self.request.query_params.get('role')
        search = self.request.query_params.get('search', '')
        if role:
            qs = qs.filter(role=role)
        if search:
            qs = qs.filter(
                Q(email__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)
            )
        return qs


# ─── SuperAdmin: update a user's role / status ───────────────────────────────

class SuperAdminUserDetailView(APIView):
    permission_classes = [IsSuperAdminUser]

    def get(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(UserSerializer(user).data)

    def patch(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Prevent modifying another superadmin
        if user.role == 'superadmin' and user != request.user:
            return Response({'detail': 'Cannot modify another superadmin.'}, status=status.HTTP_403_FORBIDDEN)

        allowed = {'role', 'is_active', 'is_verified', 'first_name', 'last_name', 'phone'}
        for field in allowed:
            if field in request.data:
                # Sync Django flags when promoting to superadmin/admin
                if field == 'role':
                    new_role = request.data['role']
                    user.role = new_role
                    if new_role == 'superadmin':
                        user.is_superuser = True
                        user.is_staff = True
                    elif new_role == 'admin':
                        user.is_superuser = False
                        user.is_staff = True
                    else:
                        user.is_superuser = False
                        user.is_staff = False
                else:
                    setattr(user, field, request.data[field])
        user.save()
        return Response(UserSerializer(user).data)

    def delete(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        if user == request.user:
            return Response({'detail': 'Cannot delete yourself.'}, status=status.HTTP_400_BAD_REQUEST)
        if user.role == 'superadmin':
            return Response({'detail': 'Cannot delete a superadmin.'}, status=status.HTTP_403_FORBIDDEN)
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ─── SuperAdmin: create admin account ────────────────────────────────────────

class SuperAdminCreateAdminView(APIView):
    permission_classes = [IsSuperAdminUser]

    def post(self, request):
        data = request.data.copy()
        data['role'] = 'admin'
        serializer = RegisterSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        user.is_staff = True
        user.is_verified = True
        user.role = 'admin'
        user.save(update_fields=['is_staff', 'is_verified', 'role'])
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


# ─── Standard views ───────────────────────────────────────────────────────────

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [RegisterRateThrottle]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        user.is_verified = True
        user.save(update_fields=['is_verified'])
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }, status=status.HTTP_201_CREATED)


class AdminVerifyUserView(APIView):
    permission_classes = [IsAdminUser]

    def patch(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        user.is_verified = not user.is_verified
        user.save(update_fields=['is_verified'])
        return Response(UserSerializer(user).data)


class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [LoginRateThrottle]


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response({'detail': 'Successfully logged out.'})
        except Exception:
            return Response({'detail': 'Invalid token.'}, status=status.HTTP_400_BAD_REQUEST)


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return super().update(request, *args, **kwargs)


class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user
        if not user.check_password(serializer.validated_data['old_password']):
            return Response({'old_password': 'Wrong password.'}, status=status.HTTP_400_BAD_REQUEST)
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        return Response({'detail': 'Password updated successfully.'})


class AvatarUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [__import__('rest_framework.parsers', fromlist=['MultiPartParser']).MultiPartParser]

    def patch(self, request):
        file = request.FILES.get('avatar')
        if not file:
            return Response({'detail': 'No file provided.'}, status=status.HTTP_400_BAD_REQUEST)
        request.user.avatar = file
        request.user.save(update_fields=['avatar'])
        return Response(UserSerializer(request.user, context={'request': request}).data)


class AddressListCreateView(generics.ListCreateAPIView):
    serializer_class = AddressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # First address is automatically default
        if not Address.objects.filter(user=self.request.user).exists():
            serializer.save(user=self.request.user, is_default=True)
        else:
            serializer.save(user=self.request.user)


class AddressDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AddressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)

    def update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return super().update(request, *args, **kwargs)


class SetDefaultAddressView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            addr = Address.objects.get(pk=pk, user=request.user)
        except Address.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        Address.objects.filter(user=request.user, is_default=True).update(is_default=False)
        addr.is_default = True
        addr.save(update_fields=['is_default'])
        return Response(AddressSerializer(addr).data)
