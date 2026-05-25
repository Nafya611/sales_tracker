from rest_framework import serializers
from .models import Product, Customer, Sale, SaleItem


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = "__all__"


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = "__all__"


class SaleItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)

    class Meta:
        model = SaleItem
        fields = [
            "id",
            "product",
            "product_name",
            "quantity",
            "unit_price",
            "discount_percent",
            "line_total",
        ]
        read_only_fields = ["line_total"]


class SaleSerializer(serializers.ModelSerializer):
    items = SaleItemSerializer(many=True)
    customer_name = serializers.CharField(source="customer.name", read_only=True)

    class Meta:
        model = Sale
        fields = [
            "id",
            "customer",
            "customer_name",
            "car_id",
            "status",
            "subtotal",
            "discount_total",
            "total_amount",
            "paid_amount",
            "balance_due",
            "notes",
            "date_created",
            "paid_date",
            "items",
        ]
        read_only_fields = [
            "subtotal",
            "discount_total",
            "total_amount",
            "paid_amount",
            "balance_due",
            "date_created",
            "paid_date",
        ]

    def create(self, validated_data):
        items_data = validated_data.pop("items")
        sale = Sale.objects.create(**validated_data)
        for item_data in items_data:
            SaleItem.objects.create(sale=sale, **item_data)
        sale.recalculate_totals()
        return sale

    def update(self, instance, validated_data):
        items_data = validated_data.pop("items", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if items_data is not None:
            instance.items.all().delete()
            for item_data in items_data:
                SaleItem.objects.create(sale=instance, **item_data)
            instance.recalculate_totals()
        return instance


class SaleListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list view — no nested items."""

    customer_name = serializers.CharField(source="customer.name", read_only=True)
    item_count = serializers.IntegerField(source="items.count", read_only=True)

    class Meta:
        model = Sale
        fields = [
            "id",
            "customer",
            "customer_name",
            "car_id",
            "status",
            "subtotal",
            "discount_total",
            "total_amount",
            "paid_amount",
            "balance_due",
            "item_count",
            "notes",
            "date_created",
            "paid_date",
            "paid_date",
        ]
