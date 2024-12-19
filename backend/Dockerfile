# Use slim variant for smaller base image
FROM python:3.12-slim-bullseye as builder

# Set working directory
WORKDIR /app

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    VIRTUAL_ENV=/opt/venv

# Create and activate virtual environment
RUN python -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt 

# Final stage
FROM python:3.12-slim-bullseye

WORKDIR /app

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    VIRTUAL_ENV=/opt/venv \
    PATH="/opt/venv/bin:$PATH"

# Copy virtual environment from builder
COPY --from=builder $VIRTUAL_ENV $VIRTUAL_ENV

# Copy application code
COPY . .

# Add a non-root user and set up directories with proper permissions
RUN useradd -m appuser && \
    mkdir -p /app/staticfiles /app/media /app/static/images && \
    chown -R appuser:appuser /app && \
    chown -R appuser:appuser $VIRTUAL_ENV && \
    chmod -R 755 /app

# Switch to non-root user
USER appuser







