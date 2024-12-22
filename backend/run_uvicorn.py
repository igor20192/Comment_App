import subprocess
import os

os.environ["DJANGO_SETTINGS_MODULE"] = "comment_app.settings"

subprocess.run(
    [
        "uvicorn",
        "comment_app.asgi:application",
        "--host",
        "0.0.0.0",
        "--port",
        "8000",
        "--ssl-keyfile",
        "/etc/letsencrypt/live/comments.icu/privkey.pem",
        "--ssl-certfile",
        "/etc/letsencrypt/live/comments.icu/fullchain.pem",
        "--workers",
        "4",
        "--reload",
    ],
)
