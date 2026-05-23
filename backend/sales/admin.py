from django.contrib import admin
from .models import Product, Customer, Sale, SaleItem


class SaleItemInline(admin.TabularInline):
    model = SaleItem
    extra = 0
    readonly_fields = ["line_total"]


@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "customer",
        "status",
        "total_amount",
        "date_created",
        "paid_date",
    ]
    list_filter = ["status"]
    inlines = [SaleItemInline]


admin.site.register(Product)
admin.site.register(Customer)
