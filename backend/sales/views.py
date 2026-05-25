from django.utils import timezone
from django.db.models import Sum, Count, Q
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate

from .models import Product, Customer, Sale
from .serializers import (
    ProductSerializer,
    CustomerSerializer,
    SaleSerializer,
    SaleListSerializer,
)


@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    username = request.data.get("username")
    password = request.data.get("password")
    user = authenticate(username=username, password=password)
    if user:
        token, _ = Token.objects.get_or_create(user=user)
        return Response({"token": token.key, "username": user.username})
    return Response(
        {"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_view(request):
    request.user.auth_token.delete()
    return Response({"message": "Logged out"})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    from datetime import timedelta

    today = timezone.now()
    week_start = today - timedelta(days=today.weekday())

    total_customers = Customer.objects.count()
    total_products = Product.objects.count()
    
    unpaid_sales_qs = Sale.objects.filter(status__in=["unpaid", "partial"])
    unpaid_count = unpaid_sales_qs.count()
    
    # Python calculation to use balance_due which relies on total_amount and paid_amount
    unpaid_total = sum(s.balance_due for s in unpaid_sales_qs)

    paid_this_week_sales = Sale.objects.filter(paid_date__gte=week_start)
    paid_this_week = sum(s.paid_amount for s in paid_this_week_sales)

    # To accurately get total revenue collected, we just sum paid_amount on all sales
    total_revenue = Sale.objects.aggregate(t=Sum("paid_amount"))["t"] or 0
    is_saturday = today.weekday() == 5

    return Response(
        {
            "total_customers": total_customers,
            "total_products": total_products,
            "unpaid_count": unpaid_count,
            "unpaid_total": str(unpaid_total),
            "paid_this_week": str(paid_this_week),
            "total_revenue": str(total_revenue),
            "is_saturday": is_saturday,
        }
    )


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]


class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        search = self.request.query_params.get("search")
        if search:
            qs = qs.filter(
                Q(name__icontains=search)
                | Q(email__icontains=search)
                | Q(company__icontains=search)
            )
        return qs


class SaleViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Sale.objects.select_related("customer").prefetch_related("items__product")
        status_filter = self.request.query_params.get("status")
        if status_filter:
            statuses = [s.strip() for s in status_filter.split(',')]
            qs = qs.filter(status__in=statuses)
        return qs

    def get_serializer_class(self):
        if self.action == "list":
            return SaleListSerializer
        return SaleSerializer

    @action(detail=True, methods=["post"], url_path="mark-paid")
    def mark_paid(self, request, pk=None):
        sale = self.get_object()
        if sale.status == "paid":
            return Response(
                {"error": "Sale is already paid"}, status=status.HTTP_400_BAD_REQUEST
            )
            
        import decimal
        try:
            amount = request.data.get("amount")
            if amount is not None:
                amount = decimal.Decimal(str(amount))
                if amount <= 0:
                    raise ValueError
        except:
            return Response({"error": "Invalid amount"}, status=status.HTTP_400_BAD_REQUEST)

        if amount is not None:
            sale.paid_amount += amount
        else:
            sale.paid_amount = sale.total_amount

        if sale.paid_amount >= sale.total_amount:
            sale.status = "paid"
            sale.paid_date = timezone.now()
        else:
            sale.status = "partial"

        sale.save(update_fields=["status", "paid_date", "paid_amount"])
        return Response(SaleSerializer(sale).data)

    @action(detail=False, methods=["post"], url_path="mark-all-paid")
    def mark_all_paid(self, request):
        ids = request.data.get("ids", [])
        if not ids:
            return Response(
                {"error": "No sale IDs provided"}, status=status.HTTP_400_BAD_REQUEST
            )
        now = timezone.now()
        # For bulk actions, we'll mark the entire balance as paid. 
        sales_to_update = Sale.objects.filter(id__in=ids).exclude(status="paid")
        updated = 0
        for sale in sales_to_update:
            sale.paid_amount = sale.total_amount
            sale.status = "paid"
            sale.paid_date = now
            sale.save(update_fields=["paid_amount", "status", "paid_date"])
            updated += 1
        return Response({"updated": updated})
