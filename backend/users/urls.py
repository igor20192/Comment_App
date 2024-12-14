from django.urls import path
from .views import LoginView, LogoutView, RegisterView, AuthCheckView

urlpatterns = [
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/logout/", LogoutView.as_view(), name="logout"),
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/check/", AuthCheckView.as_view(), name="auth-check"),
]
