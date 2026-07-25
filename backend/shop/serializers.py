from rest_framework import serializers

from .models import Category, Product, ProductImage, Order, OrderItem, Payment


def _coach_display_name(user):
    try:
        app = user.coach_application
        return f"{app.first_name} {app.last_name}"
    except Exception:
        return user.get_full_name() or user.username


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name"]


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ["id", "image", "order"]


class ProductSerializer(serializers.ModelSerializer):
    coach_id = serializers.IntegerField(source="coach.id", read_only=True)
    coach_name = serializers.SerializerMethodField()
    images = ProductImageSerializer(many=True, read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        source="category", queryset=Category.objects.all(),
        required=False, allow_null=True,
    )
    category_name = serializers.CharField(source="category.name", read_only=True, default=None)
    is_in_stock = serializers.ReadOnlyField()

    class Meta:
        model = Product
        fields = [
            "id", "coach_id", "coach_name",
            "title", "description", "product_type",
            "category_id", "category_name",
            "price", "stock", "is_in_stock", "status", "images",
            "created_at", "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at", "coach_id", "coach_name", "images"]

    def get_coach_name(self, obj):
        return _coach_display_name(obj.coach)

    def validate(self, attrs):
        product_type = attrs.get(
            "product_type", getattr(self.instance, "product_type", None)
        )
        if product_type == Product.PHYSICAL:
            stock = attrs["stock"] if "stock" in attrs else getattr(self.instance, "stock", None)
            if stock is None:
                raise serializers.ValidationError(
                    {"stock": "برای کالای فیزیکی، تعیین موجودی الزامی است."}
                )
        elif product_type == Product.DIGITAL_COURSE:
            attrs["stock"] = None
        return attrs


class CheckoutItemSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)


class CheckoutSerializer(serializers.Serializer):
    items = CheckoutItemSerializer(many=True)
    shipping_full_name = serializers.CharField(required=False, allow_blank=True, default="")
    shipping_phone = serializers.CharField(required=False, allow_blank=True, default="")
    shipping_province = serializers.CharField(required=False, allow_blank=True, default="")
    shipping_city = serializers.CharField(required=False, allow_blank=True, default="")
    shipping_address_line = serializers.CharField(required=False, allow_blank=True, default="")
    shipping_postal_code = serializers.CharField(required=False, allow_blank=True, default="")

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("سبد خرید خالی است.")
        return value


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ["id", "status", "gateway", "gateway_reference", "created_at", "updated_at"]
        read_only_fields = fields


class OrderItemSerializer(serializers.ModelSerializer):
    product_id = serializers.IntegerField(source="product.id", read_only=True, default=None)
    coach_id = serializers.IntegerField(source="coach.id", read_only=True)
    coach_name = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = [
            "id", "product_id", "coach_id", "coach_name",
            "product_title_snapshot", "product_type_snapshot",
            "unit_price_snapshot", "quantity", "fulfillment_status",
        ]
        read_only_fields = fields

    def get_coach_name(self, obj):
        return _coach_display_name(obj.coach)


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    payment = PaymentSerializer(read_only=True)
    buyer_id = serializers.IntegerField(source="buyer.id", read_only=True)
    buyer_name = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            "id", "buyer_id", "buyer_name", "status", "total_amount",
            "has_physical_items",
            "shipping_full_name", "shipping_phone", "shipping_province",
            "shipping_city", "shipping_address_line", "shipping_postal_code",
            "items", "payment", "created_at", "updated_at",
        ]
        read_only_fields = fields

    def get_buyer_name(self, obj):
        return obj.buyer.get_full_name() or obj.buyer.username


class SimulatePaymentSerializer(serializers.Serializer):
    outcome = serializers.ChoiceField(choices=["success", "failure"])


class FulfillmentUpdateSerializer(serializers.Serializer):
    fulfillment_status = serializers.ChoiceField(
        choices=[OrderItem.PROCESSING, OrderItem.SHIPPED, OrderItem.DELIVERED]
    )
