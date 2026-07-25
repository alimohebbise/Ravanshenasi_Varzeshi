from django.contrib import admin
from .models import Category, Product, ProductImage, Order, OrderItem, Payment


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 0


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name",)
    search_fields = ("name",)


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("title", "coach", "product_type", "price", "stock", "status", "created_at")
    list_filter = ("product_type", "status")
    search_fields = ("title", "coach__username")
    inlines = [ProductImageInline]


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("id", "buyer", "status", "total_amount", "created_at")
    list_filter = ("status",)
    search_fields = ("buyer__username",)
    inlines = [OrderItemInline]


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("order", "status", "gateway", "gateway_reference", "created_at")
    list_filter = ("status", "gateway")
