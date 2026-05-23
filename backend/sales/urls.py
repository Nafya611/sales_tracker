from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProductViewSet,
    CustomerViewSet,
    SaleViewSet,
    login_view,
    logout_view,
    dashboard_stats,
)

router = DefaultRouter()
router.register("products", ProductViewSet, basename="product")
router.register("customers", CustomerViewSet, basename="customer")
router.register("sales", SaleViewSet, basename="sale")

urlpatterns = [
    path("", include(router.urls)),
    path("login/", login_view),
    path("logout/", logout_view),
    path("dashboard/", dashboard_stats),
]
