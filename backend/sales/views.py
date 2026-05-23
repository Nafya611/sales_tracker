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
    unpaid_sales = Sale.objects.filter(status="unpaid")
    unpaid_count = unpaid_sales.count()
    unpaid_total = unpaid_sales.aggregate(t=Sum("total_amount"))["t"] or 0
    paid_this_week = (
        Sale.objects.filter(status="paid", paid_date__gte=week_start).aggregate(
            t=Sum("total_amount")
        )["t"]
        or 0
    )
    total_revenue = (
        Sale.objects.filter(status="paid").aggregate(t=Sum("total_amount"))["t"] or 0
    )
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
            qs = qs.filter(status=status_filter)
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
        sale.status = "paid"
        sale.paid_date = timezone.now()
        sale.save(update_fields=["status", "paid_date"])
        return Response(SaleSerializer(sale).data)

    @action(detail=False, methods=["post"], url_path="mark-all-paid")
    def mark_all_paid(self, request):
        ids = request.data.get("ids", [])
        if not ids:
            return Response(
                {"error": "No sale IDs provided"}, status=status.HTTP_400_BAD_REQUEST
            )
        now = timezone.now()
        updated = Sale.objects.filter(id__in=ids, status="unpaid").update(
            status="paid", paid_date=now
        )
        return Response({"updated": updated})
