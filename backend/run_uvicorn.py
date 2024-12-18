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
        "--workers",
        "4",
        "--reload",
    ],
)
