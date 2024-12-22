# Build stage
FROM node:23-alpine as build

# Add labels for better maintainability
LABEL maintainer="Comment_App"
LABEL description="React application frontend"

# Set working directory
WORKDIR /app/frontend

# Add node_modules/.bin to PATH
ENV PATH /app/frontend/node_modules/.bin:$PATH

# Copy dependency files
COPY comment-frontend/package*.json ./

# Install dependencies with specific flags for production
RUN npm ci --silent --only=production \
    && npm cache clean --force

# Copy application code
COPY comment-frontend/ ./

# Build application
RUN npm run build

#Checking the contents of the build directory
RUN ls -l /app/frontend/build

# Production stage
FROM nginx:1.27.3-alpine

# Add nginx configuration
COPY comment-frontend/nginx/production/nginx.conf /etc/nginx/conf.d/default.conf

# Create necessary directories and set correct permissions
RUN mkdir -p /var/cache/nginx/client_temp /var/log/nginx \
    && chmod -R 755 /var/cache/nginx /var/log/nginx \
    && chown -R nginx:nginx /var/cache/nginx /var/log/nginx /usr/share/nginx/html \
    && touch /var/run/nginx.pid \
    && chown nginx:nginx /var/run/nginx.pid

# Copy built assets from the builder
COPY --from=build /app/frontend/build /usr/share/nginx/html

# Check the contents of the html directory
RUN ls -l /usr/share/nginx/html

# Expose port
EXPOSE 80

# Set healthcheck
HEALTHCHECK --interval=30s --timeout=3s \
    CMD wget --quiet --tries=1 --spider http://localhost:80 || exit 1

# Start nginx (no need for non-root user)
CMD ["nginx", "-g", "daemon off;"]
