from django.conf import settings
from django.core.validators import FileExtensionValidator
from django.db import models


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)

    class Meta:
        ordering = ["name"]
        verbose_name_plural = "categories"

    def __str__(self):
        return self.name


class Product(models.Model):
    DIGITAL_COURSE = "digital_course"
    PHYSICAL = "physical"
    PRODUCT_TYPE_CHOICES = [
        (DIGITAL_COURSE, "دوره آنلاین"),
        (PHYSICAL, "کالای فیزیکی"),
    ]

    DRAFT = "draft"
    PUBLISHED = "published"
    STATUS_CHOICES = [(DRAFT, "Draft"), (PUBLISHED, "Published")]

    coach = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="products",
    )
    title = models.CharField(max_length=255)
    description = models.TextField()
    product_type = models.CharField(max_length=20, choices=PRODUCT_TYPE_CHOICES)
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="products",
    )
    price = models.DecimalField(max_digits=12, decimal_places=0)
    stock = models.PositiveIntegerField(null=True, blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default=DRAFT)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} ({self.coach.username})"

    @property
    def is_in_stock(self):
        if self.product_type == self.DIGITAL_COURSE:
            return True
        return (self.stock or 0) > 0


class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(
        upload_to="shop/products/",
        validators=[FileExtensionValidator(allowed_extensions=["png", "jpg", "jpeg"])],
    )
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self):
        return f"Image for {self.product_id}"


class Order(models.Model):
    PENDING_PAYMENT = "pending_payment"
    PAID = "paid"
    PAYMENT_FAILED = "payment_failed"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"
    STATUS_CHOICES = [
        (PENDING_PAYMENT, "در انتظار پرداخت"),
        (PAID, "پرداخت شده"),
        (PAYMENT_FAILED, "پرداخت ناموفق"),
        (PROCESSING, "در حال پردازش"),
        (SHIPPED, "ارسال شده"),
        (DELIVERED, "تحویل داده شده"),
        (CANCELLED, "لغو شده"),
    ]

    buyer = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="orders"
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=PENDING_PAYMENT)
    total_amount = models.DecimalField(max_digits=12, decimal_places=0)

    has_physical_items = models.BooleanField(default=False)
    shipping_full_name = models.CharField(max_length=150, blank=True)
    shipping_phone = models.CharField(max_length=20, blank=True)
    shipping_province = models.CharField(max_length=100, blank=True)
    shipping_city = models.CharField(max_length=100, blank=True)
    shipping_address_line = models.TextField(blank=True)
    shipping_postal_code = models.CharField(max_length=20, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Order #{self.id} ({self.buyer.username})"

    def refresh_status_from_items(self):
        """Roll up Order.status from physical OrderItem fulfillment statuses."""
        physical_items = self.items.exclude(
            fulfillment_status=OrderItem.NOT_APPLICABLE
        )
        if not physical_items.exists():
            return
        statuses = set(physical_items.values_list("fulfillment_status", flat=True))
        if statuses == {OrderItem.DELIVERED}:
            self.status = self.DELIVERED
        elif OrderItem.SHIPPED in statuses:
            self.status = self.SHIPPED
        elif OrderItem.PROCESSING in statuses:
            self.status = self.PROCESSING
        self.save(update_fields=["status", "updated_at"])


class OrderItem(models.Model):
    NOT_APPLICABLE = "not_applicable"
    PENDING = "pending"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    FULFILLMENT_CHOICES = [
        (NOT_APPLICABLE, "—"),
        (PENDING, "در انتظار"),
        (PROCESSING, "در حال آماده‌سازی"),
        (SHIPPED, "ارسال شده"),
        (DELIVERED, "تحویل داده شده"),
    ]

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(
        Product, on_delete=models.SET_NULL, null=True, related_name="order_items"
    )
    coach = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="sold_order_items"
    )
    product_title_snapshot = models.CharField(max_length=255)
    product_type_snapshot = models.CharField(max_length=20)
    unit_price_snapshot = models.DecimalField(max_digits=12, decimal_places=0)
    quantity = models.PositiveIntegerField(default=1)
    fulfillment_status = models.CharField(
        max_length=20, choices=FULFILLMENT_CHOICES, default=NOT_APPLICABLE
    )

    def __str__(self):
        return f"{self.product_title_snapshot} x{self.quantity} (order #{self.order_id})"


class Payment(models.Model):
    INITIATED = "initiated"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    STATUS_CHOICES = [
        (INITIATED, "شروع شده"),
        (SUCCEEDED, "موفق"),
        (FAILED, "ناموفق"),
    ]

    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name="payment")
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default=INITIATED)
    gateway = models.CharField(max_length=30, default="mock")
    gateway_reference = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Payment for order #{self.order_id} ({self.status})"
