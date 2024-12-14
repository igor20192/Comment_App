from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.exceptions import InvalidToken
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework import status
from decouple import config
import logging
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from django.contrib.auth.password_validation import validate_password
from rest_framework.permissions import IsAuthenticated

logger = logging.getLogger(__name__)


class CustomTokenRefreshView(TokenRefreshView):

    def post(self, request, *args, **kwargs):
        try:
            # Get refresh token from cookies
            refresh_token = request.COOKIES.get("refresh_token")
            if not refresh_token:
                return Response(
                    {"error": "No refresh token found in cookies"},
                    status=status.HTTP_401_UNAUTHORIZED,
                )

            # Add refresh token to request.data
            request.data["refresh"] = refresh_token

            # Update token
            response = super().post(request, *args, **kwargs)

            if response.status_code == status.HTTP_200_OK:
                access_token = response.data.get("access")
                new_refresh_token = response.data.get("refresh")  # New refresh token

                # Install access_token to cookie
                response.set_cookie(
                    key="access_token",
                    value=access_token,
                    httponly=True,
                    secure=settings.USE_HTTPS,
                    samesite="Lax",
                )

                # Set a new refresh_token in the cookie
                response.set_cookie(
                    key="refresh_token",
                    value=new_refresh_token,
                    httponly=True,
                    secure=settings.USE_HTTPS,
                    samesite="Lax",
                )

                # Removing tokens from JSON response
                response.data = {"message": "Token refresh successful"}

            return response

        except InvalidToken as e:
            logger.error(f"Invalid token during refresh: {e}")
            return Response(
                {"error": "Token is invalid or blacklisted"},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        except Exception as e:
            logger.error(f"Token refresh error: {e}")
            return Response(
                {"error": "Failed to refresh token"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class AuthCheckView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            user = request.user

            # Remove print statement and use proper logging
            logger.debug(f"Auth check requested for user: {user.username}")

            return Response(
                {
                    "is_authenticated": True,
                    "username": user.username,
                    "email": user.email,  # Additional useful information
                    "id": user.id,  # Additional useful information
                },
                status=status.HTTP_200_OK,
            )

        except AttributeError as e:
            logger.error(f"Authentication error: {str(e)}")
            return Response(
                {
                    "error": "Authentication failed",
                    "detail": "User data is incomplete or invalid",
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )
        except Exception as e:
            logger.error(f"Unexpected error in auth check: {str(e)}")
            return Response(
                {"error": "Internal server error"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def validate_registration_data(self, username, email, password):
        """Validate registration input data"""
        errors = {}

        # Username validation
        if not username or len(username) < 3:
            errors["username"] = "Username must be at least 3 characters long"
        elif len(username) > 150:
            errors["username"] = "Username must be less than 150 characters"
        elif not username.isalnum():
            errors["username"] = "Username must contain only letters and numbers"

        # Email validation
        if not email:
            errors["email"] = "Email is required"
        else:
            try:
                validate_email(email)
                if User.objects.filter(email=email).exists():
                    errors["email"] = "Email already registered"
            except ValidationError:
                errors["email"] = "Invalid email format"

        # Password validation
        if not password:
            errors["password"] = "Password is required"
        else:
            try:
                validate_password(password)
            except ValidationError as e:
                errors["password"] = list(e.messages)

        return errors

    def post(self, request):
        try:
            # Extract data
            username = request.data.get("username", "").strip()
            email = request.data.get("email", "").strip().lower()
            password = request.data.get("password", "")

            # Validate input data
            validation_errors = self.validate_registration_data(
                username, email, password
            )

            if validation_errors:
                return Response(
                    {"errors": validation_errors}, status=status.HTTP_400_BAD_REQUEST
                )

            # Check if username exists
            if User.objects.filter(username=username).exists():
                logger.warning(
                    f"Registration attempt with existing username: {username}"
                )
                return Response(
                    {"error": "Username already taken"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Create user
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                is_active=True,  # Set to False if email verification is required
            )

            # Log successful registration
            logger.info(f"New user registered successfully: {username}")

            return Response(
                {
                    "message": "Registration successful",
                    "user_id": user.id,
                    # Don't include sensitive information in response
                },
                status=status.HTTP_201_CREATED,
            )

        except Exception as e:
            logger.error(f"Registration error: {str(e)}", exc_info=True)
            return Response(
                {"error": "Registration failed. Please try again later."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")

        user = authenticate(username=username, password=password)
        if not user:
            return Response({"error": "Invalid credentials"}, status=401)

        refresh = RefreshToken.for_user(user)
        response = Response({"message": "Login successful"})
        # Устанавливаем access_token в cookies
        response.set_cookie(
            key="access_token",
            value=str(refresh.access_token),
            httponly=True,
            secure=config("SET_COOKIE_SECURE", default=False, cast=bool),
            samesite="Lax",
        )
        # Устанавливаем refresh_token в cookies
        response.set_cookie(
            key="refresh_token",
            value=str(refresh),
            httponly=True,
            secure=config("SET_COOKIE_SECURE", default=False, cast=bool),
            samesite="Lax",
        )
        return response


class LogoutView(APIView):
    def post(self, request):
        try:
            refresh_token = request.COOKIES.get("refresh_token")
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()

            response = Response({"message": "Logout successful"}, status=200)
            response.delete_cookie("access_token")
            response.delete_cookie("refresh_token")
            return response
        except Exception as e:
            logger.error(f"Logout error: {e}")
            return Response(
                {"error": "Failed to logout"},
                status=status.HTTP_400_BAD_REQUEST,
            )
