import uuid
import requests as http_requests
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.conf import settings
from django.http import JsonResponse

from apps.orders.models import Order
from .models import Payment
from .serializers import PaymentSerializer, PaymentCreateSerializer


class PaymentInitiateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = PaymentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            order = Order.objects.get(order_number=data['order_number'], customer=request.user)
        except Order.DoesNotExist:
            return Response({'detail': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

        if hasattr(order, 'payment') and order.payment.status == 'completed':
            return Response({'detail': 'Order already paid.'}, status=status.HTTP_400_BAD_REQUEST)

        method = data['method']
        transaction_id = ''
        payment_status = Payment.STATUS_PENDING

        if method == Payment.METHOD_COD:
            payment_status = Payment.STATUS_COMPLETED
            transaction_id = f'COD-{uuid.uuid4().hex[:8].upper()}'

        elif method in (Payment.METHOD_BKASH, Payment.METHOD_NAGAD):
            phone = data.get('phone_number', '')
            if not phone:
                return Response({'detail': 'phone_number is required for mobile payments.'}, status=status.HTTP_400_BAD_REQUEST)
            transaction_id = f'{method.upper()}-{uuid.uuid4().hex[:10].upper()}'
            payment_status = Payment.STATUS_COMPLETED

        elif method == Payment.METHOD_CARD:
            transaction_id = f'CARD-{uuid.uuid4().hex[:10].upper()}'
            payment_status = Payment.STATUS_COMPLETED

        payment, _ = Payment.objects.update_or_create(
            order=order,
            defaults={
                'user': request.user,
                'method': method,
                'status': payment_status,
                'amount': order.total,
                'transaction_id': transaction_id,
            },
        )

        if payment_status == Payment.STATUS_COMPLETED and order.status == Order.STATUS_PENDING:
            order.status = Order.STATUS_CONFIRMED
            order.save(update_fields=['status'])

        return Response(PaymentSerializer(payment).data, status=status.HTTP_200_OK)


class BangoPayInitiateView(APIView):
    """Create a BangoPay payment URL and return it to the frontend."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        order_number = request.data.get('order_number')
        if not order_number:
            return Response({'detail': 'order_number is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            order = Order.objects.get(order_number=order_number, customer=request.user)
        except Order.DoesNotExist:
            return Response({'detail': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

        if hasattr(order, 'payment') and order.payment.status == 'completed':
            return Response({'detail': 'Order already paid.'}, status=status.HTTP_400_BAD_REQUEST)

        frontend_url = settings.FRONTEND_URL
        user = request.user
        cus_name  = f"{user.first_name} {user.last_name}".strip() or user.username
        cus_email = user.email

        payload = {
            'success_url': f'{frontend_url}/checkout/success?order={order_number}',
            'cancel_url':  f'{frontend_url}/checkout/cancel?order={order_number}',
            'amount':      str(order.total),
            'cus_name':    cus_name,
            'cus_email':   cus_email,
            'metadata': {
                'order_number': order_number,
                'phone': order.shipping_address.get('phone', ''),
            },
        }

        headers = {
            'API-KEY':      settings.BANGOPAY_API_KEY,
            'Content-Type': 'application/json',
            'SECRET-KEY':   settings.BANGOPAY_SECRET_KEY,
            'BRAND-KEY':    settings.BANGOPAY_BRAND_KEY,
        }

        # Demo mode — skip live API call when using placeholder keys
        is_demo = settings.BANGOPAY_API_KEY in ('demo_api_key', '', None)
        if is_demo:
            resp_data   = {'status': True, 'message': 'demo', 'payment_url': ''}
            payment_url = ''  # frontend will redirect to /checkout/success directly
        else:
            try:
                resp = http_requests.post(
                    settings.BANGOPAY_CREATE_URL,
                    json=payload,
                    headers=headers,
                    timeout=15,
                )
                resp_data = resp.json()
            except Exception as e:
                return Response({'detail': f'BangoPay gateway error: {str(e)}'}, status=status.HTTP_502_BAD_GATEWAY)

            if not resp_data.get('status'):
                return Response({'detail': resp_data.get('message', 'Payment initiation failed.')}, status=status.HTTP_400_BAD_REQUEST)

            payment_url = resp_data.get('payment_url', '')

        # In demo mode mark payment completed immediately (no redirect needed)
        pay_status = Payment.STATUS_COMPLETED if is_demo else Payment.STATUS_PENDING
        txn_id     = f'DEMO-{uuid.uuid4().hex[:10].upper()}' if is_demo else ''

        Payment.objects.update_or_create(
            order=order,
            defaults={
                'user':             request.user,
                'method':           Payment.METHOD_BANGOPAY,
                'status':           pay_status,
                'amount':           order.total,
                'transaction_id':   txn_id,
                'gateway_response': resp_data,
            },
        )

        if is_demo and order.status == Order.STATUS_PENDING:
            order.status = Order.STATUS_CONFIRMED
            order.save(update_fields=['status'])

        return Response({'payment_url': payment_url, 'order_number': order_number})


class BangoPayVerifyView(APIView):
    """Called after BangoPay redirects to success_url. Verifies the transaction."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        transaction_id = request.data.get('transaction_id')
        order_number   = request.data.get('order_number')

        if not transaction_id or not order_number:
            return Response({'detail': 'transaction_id and order_number are required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            order = Order.objects.get(order_number=order_number, customer=request.user)
        except Order.DoesNotExist:
            return Response({'detail': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

        headers = {
            'API-KEY':      settings.BANGOPAY_API_KEY,
            'Content-Type': 'application/json',
            'SECRET-KEY':   settings.BANGOPAY_SECRET_KEY,
            'BRAND-KEY':    settings.BANGOPAY_BRAND_KEY,
        }

        is_demo = settings.BANGOPAY_API_KEY in ('demo_api_key', '', None)
        if is_demo:
            resp_data = {'status': True, 'message': 'demo verified'}
            verified  = True
        else:
            try:
                resp = http_requests.post(
                    settings.BANGOPAY_VERIFY_URL,
                    json={'transaction_id': transaction_id},
                    headers=headers,
                    timeout=15,
                )
                resp_data = resp.json()
            except Exception as e:
                return Response({'detail': f'Verification error: {str(e)}'}, status=status.HTTP_502_BAD_GATEWAY)

            verified = resp_data.get('status', False)
        pay_status = Payment.STATUS_COMPLETED if verified else Payment.STATUS_FAILED

        payment, _ = Payment.objects.update_or_create(
            order=order,
            defaults={
                'user':             request.user,
                'method':           Payment.METHOD_BANGOPAY,
                'status':           pay_status,
                'amount':           order.total,
                'transaction_id':   transaction_id,
                'gateway_response': resp_data,
            },
        )

        if verified and order.status == Order.STATUS_PENDING:
            order.status = Order.STATUS_CONFIRMED
            order.save(update_fields=['status'])

        return Response({
            'verified':     verified,
            'order_number': order_number,
            'payment':      PaymentSerializer(payment).data,
        })


class InvoiceView(APIView):
    """Return full invoice data for an order."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, order_number):
        try:
            order = Order.objects.select_related('customer', 'payment') \
                                  .prefetch_related('items__product', 'items__vendor') \
                                  .get(order_number=order_number, customer=request.user)
        except Order.DoesNotExist:
            return Response({'detail': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

        items = [
            {
                'name':        item.product_name,
                'quantity':    item.quantity,
                'unit_price':  str(item.unit_price),
                'total_price': str(item.total_price),
                'vendor':      item.vendor.shop_name if item.vendor else '',
            }
            for item in order.items.all()
        ]

        payment_info = {}
        if hasattr(order, 'payment'):
            p = order.payment
            payment_info = {
                'method':         p.get_method_display(),
                'status':         p.status,
                'transaction_id': p.transaction_id,
            }

        user = order.customer
        return Response({
            'invoice_number': f'INV-{order.order_number}',
            'order_number':   order.order_number,
            'created_at':     order.created_at.strftime('%d %b %Y, %I:%M %p'),
            'status':         order.status,
            'customer': {
                'name':  f"{user.first_name} {user.last_name}".strip() or user.username if user else 'N/A',
                'email': user.email if user else '',
            },
            'shipping_address': order.shipping_address,
            'items':            items,
            'subtotal':         str(order.subtotal),
            'shipping_cost':    str(order.shipping_cost),
            'discount':         str(order.discount),
            'total':            str(order.total),
            'payment':          payment_info,
        })


class PaymentDetailView(generics.RetrieveAPIView):
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Payment.objects.filter(user=self.request.user)
