class JWTAuthenticationFromCookieMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Ищем токен в cookie
        access_token = request.COOKIES.get("access_token")
        if access_token and "HTTP_AUTHORIZATION" not in request.META:
            # Добавляем токен в заголовок Authorization
            request.META["HTTP_AUTHORIZATION"] = f"Bearer {access_token}"
        return self.get_response(request)
