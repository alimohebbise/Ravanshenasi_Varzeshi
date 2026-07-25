import os

from django.db import transaction
from django.db.models import F
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from .models import Category, Product, ProductImage, Order, OrderItem, Payment
from .permissions import IsCoach, IsProductOwner
from .payments import MockPaymentGateway
from .serializers import (
    CategorySerializer, ProductSerializer, CheckoutSerializer,
    OrderSerializer, OrderItemSerializer,
    SimulatePaymentSerializer, FulfillmentUpdateSerializer,
)

ALLOWED_PRODUCT_IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg"}


def _save_product_images(product, files, start_order=0):
    for idx, image in enumerate(files):
        ext = os.path.splitext(image.name)[1].lower()
        if ext not in ALLOWED_PRODUCT_IMAGE_EXTENSIONS:
            continue
        ProductImage.objects.create(product=product, image=image, order=start_order + idx)


class PublicProductListView(generics.ListAPIView):
    """Published products, optionally filtered by category/type/coach/search."""
    serializer_class = ProductSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = Product.objects.filter(status=Product.PUBLISHED).select_related(
            "coach", "coach__coach_application", "category"
        ).prefetch_related("images")
        params = self.request.query_params
        category_id = params.get("category_id")
        if category_id:
            qs = qs.filter(category_id=category_id)
        product_type = params.get("product_type")
        if product_type:
            qs = qs.filter(product_type=product_type)
        coach_id = params.get("coach_id")
        if coach_id:
            qs = qs.filter(coach_id=coach_id)
        search = params.get("search")
        if search:
            qs = qs.filter(title__icontains=search)
        return qs


class MyProductListView(generics.ListAPIView):
    """Coach's own products — all statuses, for the product dashboard."""
    serializer_class = ProductSerializer
    permission_classes = [IsCoach]

    def get_queryset(self):
        return Product.objects.filter(coach=self.request.user).select_related(
            "coach", "category"
        ).prefetch_related("images")


class ProductCreateView(generics.CreateAPIView):
    serializer_class = ProductSerializer
    permission_classes = [IsCoach]

    def perform_create(self, serializer):
        product = serializer.save(coach=self.request.user)
        _save_product_images(product, self.request.FILES.getlist("images"))


class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ProductSerializer

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsProductOwner()]

    def get_queryset(self):
        qs = Product.objects.select_related(
            "coach", "coach__coach_application", "category"
        ).prefetch_related("images")
        user = self.request.user
        if self.request.method not in permissions.SAFE_METHODS:
            return qs
        if user.is_authenticated and user.role in ("coach", "owner"):
            return qs
        return qs.filter(status=Product.PUBLISHED)

    def perform_update(self, serializer):
        product = serializer.save()
        new_images = self.request.FILES.getlist("images")
        _save_product_images(product, new_images, start_order=product.images.count())


@api_view(["DELETE"])
@permission_classes([IsCoach])
def delete_product_image(request, pk, image_id):
    product = get_object_or_404(Product, pk=pk)
    if request.user.role != "owner" and product.coach != request.user:
        return Response({"error": "دسترسی غیرمجاز."}, status=status.HTTP_403_FORBIDDEN)
    image = get_object_or_404(ProductImage, pk=image_id, product=product)
    image.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


class CategoryListView(generics.ListAPIView):
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]
    queryset = Category.objects.all()
    pagination_class = None


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def checkout(request):
    """Validates the cart against live product data, reserves physical stock,
    and creates an Order + OrderItems + a pending Payment — all atomically."""
    serializer = CheckoutSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    with transaction.atomic():
        total = 0
        has_physical = False
        resolved_items = []

        for item in data["items"]:
            product = Product.objects.select_for_update().filter(
                pk=item["product_id"], status=Product.PUBLISHED
            ).first()
            if not product:
                return Response(
                    {"error": "یکی از محصولات موجود نیست یا منتشر نشده است."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            quantity = item["quantity"]
            if product.product_type == Product.PHYSICAL:
                has_physical = True
                if (product.stock or 0) < quantity:
                    return Response(
                        {"error": f"موجودی کافی برای «{product.title}» وجود ندارد."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
            total += product.price * quantity
            resolved_items.append((product, quantity))

        if has_physical and not data["shipping_address_line"]:
            return Response(
                {"error": "برای سفارش شامل کالای فیزیکی، آدرس ارسال الزامی است."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        order = Order.objects.create(
            buyer=request.user,
            total_amount=total,
            has_physical_items=has_physical,
            shipping_full_name=data["shipping_full_name"],
            shipping_phone=data["shipping_phone"],
            shipping_province=data["shipping_province"],
            shipping_city=data["shipping_city"],
            shipping_address_line=data["shipping_address_line"],
            shipping_postal_code=data["shipping_postal_code"],
        )

        for product, quantity in resolved_items:
            is_physical = product.product_type == Product.PHYSICAL
            OrderItem.objects.create(
                order=order,
                product=product,
                coach=product.coach,
                product_title_snapshot=product.title,
                product_type_snapshot=product.product_type,
                unit_price_snapshot=product.price,
                quantity=quantity,
                fulfillment_status=OrderItem.PENDING if is_physical else OrderItem.NOT_APPLICABLE,
            )
            if is_physical:
                product.stock = product.stock - quantity
                product.save(update_fields=["stock"])

        Payment.objects.create(order=order)

    return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def simulate_payment(request, order_id):
    """Simulated payment gateway callback. Flips Order/Payment status only —
    stock was already reserved at checkout time."""
    order = get_object_or_404(Order, pk=order_id, buyer=request.user)
    if order.status not in (Order.PENDING_PAYMENT, Order.PAYMENT_FAILED):
        return Response(
            {"error": "این سفارش قبلاً پردازش شده است."}, status=status.HTTP_400_BAD_REQUEST
        )

    serializer = SimulatePaymentSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    simulate_success = serializer.validated_data["outcome"] == "success"

    result = MockPaymentGateway().charge(order, simulate_success)

    with transaction.atomic():
        payment = order.payment
        payment.gateway_reference = result.reference
        if result.success:
            payment.status = Payment.SUCCEEDED
            order.status = Order.PAID
            order.items.filter(product_type_snapshot=Product.PHYSICAL).update(
                fulfillment_status=OrderItem.PROCESSING
            )
        else:
            payment.status = Payment.FAILED
            order.status = Order.PAYMENT_FAILED
            for item in order.items.filter(product_type_snapshot=Product.PHYSICAL):
                if item.product_id:
                    Product.objects.filter(pk=item.product_id).update(
                        stock=F("stock") + item.quantity
                    )
        payment.save()
        order.save(update_fields=["status", "updated_at"])

    return Response(OrderSerializer(order).data)


class MyOrdersListView(generics.ListAPIView):
    """Buyer's own order history."""
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(buyer=self.request.user).prefetch_related(
            "items", "payment"
        )


class OrderDetailView(generics.RetrieveAPIView):
    """Viewable by the buyer, a coach who sold an item in it, or an owner."""
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Order.objects.prefetch_related("items", "payment")

    def get_object(self):
        order = super().get_object()
        user = self.request.user
        if order.buyer == user or user.role == "owner" or order.items.filter(coach=user).exists():
            return order
        self.permission_denied(self.request)


class MySalesOrderItemsListView(generics.ListAPIView):
    """Coach's sales/fulfillment queue — order items from paid-or-further orders."""
    serializer_class = OrderItemSerializer
    permission_classes = [IsCoach]

    def get_queryset(self):
        return OrderItem.objects.filter(
            coach=self.request.user,
            order__status__in=[Order.PAID, Order.PROCESSING, Order.SHIPPED, Order.DELIVERED],
        ).select_related("order", "product").order_by("-order__created_at")


@api_view(["PATCH"])
@permission_classes([IsCoach])
def update_fulfillment_status(request, item_id):
    item = get_object_or_404(OrderItem, pk=item_id)
    if request.user.role != "owner" and item.coach != request.user:
        return Response({"error": "دسترسی غیرمجاز."}, status=status.HTTP_403_FORBIDDEN)
    if item.fulfillment_status == OrderItem.NOT_APPLICABLE:
        return Response(
            {"error": "این قلم سفارش نیازی به ارسال ندارد."}, status=status.HTTP_400_BAD_REQUEST
        )

    serializer = FulfillmentUpdateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    item.fulfillment_status = serializer.validated_data["fulfillment_status"]
    item.save(update_fields=["fulfillment_status"])
    item.order.refresh_status_from_items()
    return Response(OrderItemSerializer(item).data)
