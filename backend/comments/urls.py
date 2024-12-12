from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CommentViewSet, get_captcha

router = DefaultRouter()
router.register(r"comments", CommentViewSet)

urlpatterns = [
    path("", include(router.urls)),
    path("captcha/", get_captcha, name="captcha"),
]
