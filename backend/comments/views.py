from hashlib import md5
from django.conf import settings
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from django.core.cache import cache
from .models import Comment
from .serializers import CommentSerializer
from captcha.models import CaptchaStore
from captcha.helpers import captcha_image_url
from django.http import JsonResponse
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter
import logging
from django.utils.timezone import now

# Get a logger instance for this module
logger = logging.getLogger(__name__)


def get_captcha(request):
    captcha_key = CaptchaStore.generate_key()
    captcha_image = captcha_image_url(captcha_key)
    return JsonResponse({"key": captcha_key, "image": captcha_image})


class CommentViewSet(ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Comment.objects.filter(parent__isnull=True).prefetch_related("replies")
    serializer_class = CommentSerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    ordering_fields = ["username", "email", "created_at"]
    ordering = ["-created_at"]
    filterset_fields = ["username", "email"]

    CACHE_TIMEOUT = getattr(settings, "COMMENT_CACHE_TIMEOUT", 300)
    CACHE_KEY_PREFIX = "comment_list"

    def _generate_cache_key(self, request):
        """Generate a deterministic cache key based on request parameters"""
        try:
            page = request.query_params.get("page", "1")
            ordering = request.query_params.get("ordering", "-created_at")

            filtered_params = sorted(
                (k, v)
                for k, v in request.query_params.items()
                if k not in ["page", "ordering"]
            )

            param_string = f"page={page}:ordering={ordering}:" + "&".join(
                f"{k}={v}" for k, v in filtered_params
            )

            param_hash = md5(param_string.encode()).hexdigest()
            cache_key = f"{self.CACHE_KEY_PREFIX}:{param_hash}"

            logger.debug(
                "Generated cache key: %s for parameters: %s", cache_key, param_string
            )

            return cache_key

        except Exception as e:
            logger.error(
                "Error generating cache key: %s. Parameters: %s",
                str(e),
                request.query_params,
                exc_info=True,
            )
            raise

    def list(self, request, *args, **kwargs):
        start_time = now()
        request_id = id(request)  # Unique identifier for this request

        logger.info(
            "Processing list request [ID:%s]. Query params: %s",
            request_id,
            request.query_params,
        )

        try:
            cache_key = self._generate_cache_key(request)
            cached_data = cache.get(cache_key)

            if cached_data:
                logger.info("Cache hit [ID:%s] for key: %s", request_id, cache_key)
                return Response(cached_data)

            logger.debug(
                "Cache miss [ID:%s] for key: %s. Fetching from database",
                request_id,
                cache_key,
            )

            response = super().list(request, *args, **kwargs)

            if response.status_code == 200:
                logger.debug(
                    "Caching response [ID:%s] with key: %s for %s seconds",
                    request_id,
                    cache_key,
                    self.CACHE_TIMEOUT,
                )
                cache.set(cache_key, response.data, timeout=self.CACHE_TIMEOUT)

            processing_time = (now() - start_time).total_seconds()
            logger.info(
                "Request completed [ID:%s]. Status: %s. Processing time: %.3f seconds",
                request_id,
                response.status_code,
                processing_time,
            )

            return response

        except Exception as e:
            logger.error(
                "Error processing list request [ID:%s]: %s",
                request_id,
                str(e),
                exc_info=True,
            )
            # Fall back to uncached response
            response = super().list(request, *args, **kwargs)

            logger.info(
                "Fallback response [ID:%s] completed with status: %s",
                request_id,
                response.status_code,
            )

            return response
