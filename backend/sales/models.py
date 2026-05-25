from django.db import models
from decimal import Decimal


class Product(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    default_price = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ["name"]


class Customer(models.Model):
    name = models.CharField(max_length=255)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=50, blank=True)
    company = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ["name"]


class Sale(models.Model):
    STATUS_UNPAID = "unpaid"
    STATUS_PAID = "paid"
    STATUS_CHOICES = [
        (STATUS_UNPAID, "Unpaid"),
        (STATUS_PAID, "Paid"),
    ]

    CAR_CHOICES = [
        ("58371", "58371"),
        ("A07731", "A07731"),
    ]

    customer = models.ForeignKey(
        Customer, on_delete=models.PROTECT, related_name="sales"
    )
    car_id = models.CharField(
        max_length=20, choices=CAR_CHOICES, blank=True, null=True
    )
    status = models.CharField(
        max_length=10, choices=STATUS_CHOICES, default=STATUS_UNPAID
    )
    subtotal = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("0.00")
    )
    discount_total = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("0.00")
    )
    total_amount = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("0.00")
    )
    notes = models.TextField(blank=True)
    date_created = models.DateTimeField(auto_now_add=True)
    paid_date = models.DateTimeField(null=True, blank=True)

    def recalculate_totals(self):
        items = self.items.all()
        subtotal = sum(item.quantity * item.unit_price for item in items)
        total = sum(item.line_total for item in items)
        discount_total = subtotal - total
        self.subtotal = subtotal
        self.discount_total = discount_total
        self.total_amount = total
        self.save(update_fields=["subtotal", "discount_total", "total_amount"])

    def __str__(self):
        return f"Sale #{self.pk} — {self.customer.name}"

    class Meta:
        ordering = ["-date_created"]


class SaleItem(models.Model):
    sale = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(
        Product, on_delete=models.PROTECT, related_name="sale_items"
    )
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    discount_percent = models.DecimalField(
        max_digits=5, decimal_places=2, default=Decimal("0.00")
    )
    line_total = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("0.00")
    )

    def save(self, *args, **kwargs):
        self.line_total = (
            self.quantity * self.unit_price * (1 - self.discount_percent / 100)
        )
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.product.name} x{self.quantity}"
