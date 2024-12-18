from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.core.cache import cache
from rest_framework import status
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
                    secure=settings.SET_COOKIE_SECURE,
                    samesite="Lax",
                )

                # Set a new refresh_token in the cookie
                response.set_cookie(
                    key="refresh_token",
                    value=new_refresh_token,
                    httponly=True,
                    secure=settings.SET_COOKIE_SECURE,
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
    """Handle user authentication and token generation."""

    permission_classes = [AllowAny]

    def post(self, request):
        """
        Process login requests and generate authentication tokens.

        Args:
            request: HTTP request object containing username and password

        Returns:
            Response with authentication tokens in cookies
        """
        try:
            username = request.data.get("username")
            password = request.data.get("password")

            # Validate input
            if not username or not password:
                return Response(
                    {"error": "Username and password are required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Rate limiting
            ip_address = request.META.get(
                "HTTP_X_FORWARDED_FOR", request.META.get("REMOTE_ADDR")
            )
            cache_key = f"login_attempts_{ip_address}"
            login_attempts = cache.get(cache_key, 0)

            if login_attempts >= 5:  # Max 5 attempts per 15 minutes
                return Response(
                    {"error": "Too many login attempts. Please try again later."},
                    status=status.HTTP_429_TOO_MANY_REQUESTS,
                )

            # Authenticate user
            user = authenticate(username=username, password=password)

            if not user:
                # Increment failed login attempts
                cache.set(cache_key, login_attempts + 1, 900)  # 15 minutes

                logger.warning(f"Failed login attempt for username: {username}")
                return Response(
                    {"error": "Invalid credentials"},
                    status=status.HTTP_401_UNAUTHORIZED,
                )

            if not user.is_active:
                return Response(
                    {"error": "Account is disabled"}, status=status.HTTP_403_FORBIDDEN
                )

            # Generate tokens
            refresh = RefreshToken.for_user(user)

            # Clear failed login attempts on successful login
            cache.delete(cache_key)

            # Prepare response
            response = Response(
                {
                    "message": "Login successful",
                    "user": {
                        "id": user.id,
                        "username": user.username,
                    },
                }
            )

            # Cookie settings
            cookie_settings = {
                "httponly": True,
                "secure": settings.SET_COOKIE_SECURE,
                "samesite": "Lax",
                "path": "/",
            }

            # Set access token cookie
            response.set_cookie(
                key="access_token",
                value=str(refresh.access_token),
                max_age=settings.SIMPLE_JWT["ACCESS_TOKEN_LIFETIME"].total_seconds(),
                **cookie_settings,
            )

            # Set refresh token cookie
            response.set_cookie(
                key="refresh_token",
                value=str(refresh),
                max_age=settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds(),
                **cookie_settings,
            )

            # Log successful login
            logger.info(f"Successful login for user: {username}")

            return response

        except Exception as e:
            logger.error(f"Login error: {str(e)}")
            return Response(
                {"error": "An error occurred during login"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class LogoutView(APIView):
    """Handle user logout and token invalidation."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        """
        Process logout requests and invalidate tokens.

        Args:
            request: HTTP request object containing tokens in cookies

        Returns:
            Response confirming logout status
        """
        try:
            # Get tokens from cookies
            refresh_token = request.COOKIES.get("refresh_token")
            access_token = request.COOKIES.get("access_token")

            if not refresh_token:
                return Response(
                    {"error": "No refresh token provided"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            try:
                # Blacklist the refresh token
                token = RefreshToken(refresh_token)
                token.blacklist()

                # Log successful token blacklisting
                logger.info(f"Token blacklisted for user: {request.user.username}")

            except TokenError as e:
                logger.warning(
                    f"Invalid token during logout for user: {request.user.username}"
                )
                # Continue with logout even if token is invalid
                pass

            # Prepare response
            response = Response(
                {"message": "Logout successful"}, status=status.HTTP_200_OK
            )

            # Delete both tokens
            response.delete_cookie(
                "access_token",
                path="/",
                domain=settings.SESSION_COOKIE_DOMAIN,
            )
            response.delete_cookie(
                "refresh_token",
                path="/",
                domain=settings.SESSION_COOKIE_DOMAIN,
            )

            # Clear any session data if using sessions
            if hasattr(request, "session"):
                request.session.flush()

            logger.info(f"Successful logout for user: {request.user.username}")
            return response

        except Exception as e:
            logger.error(f"Logout error for user {request.user.username}: {str(e)}")
            return Response(
                {
                    "error": "An error occurred during logout",
                    "detail": str(e) if settings.DEBUG else "Please try again",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def handle_no_permission(self):
        """Handle unauthorized logout attempts."""
        return Response(
            {"error": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED
        )
