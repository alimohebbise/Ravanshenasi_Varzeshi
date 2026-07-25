from django.urls import path

from .views import (
    PublicProductListView, MyProductListView, ProductCreateView, ProductDetailView,
    delete_product_image, CategoryListView,
    checkout, simulate_payment,
    MyOrdersListView, OrderDetailView,
    MySalesOrderItemsListView, update_fulfillment_status,
)

urlpatterns = [
    path("products/", PublicProductListView.as_view(), name="product-list"),
    path("products/my/", MyProductListView.as_view(), name="my-products"),
    path("products/create/", ProductCreateView.as_view(), name="product-create"),
    path("products/<int:pk>/", ProductDetailView.as_view(), name="product-detail"),
    path(
        "products/<int:pk>/images/<int:image_id>/",
        delete_product_image,
        name="product-image-delete",
    ),
    path("categories/", CategoryListView.as_view(), name="shop-categories"),
    path("checkout/", checkout, name="shop-checkout"),
    path("orders/", MyOrdersListView.as_view(), name="my-orders"),
    path("orders/<int:pk>/", OrderDetailView.as_view(), name="order-detail"),
    path(
        "orders/<int:order_id>/simulate-payment/",
        simulate_payment,
        name="simulate-payment",
    ),
    path("sales/", MySalesOrderItemsListView.as_view(), name="my-sales"),
    path(
        "sales/<int:item_id>/fulfillment/",
        update_fulfillment_status,
        name="update-fulfillment",
    ),
]
