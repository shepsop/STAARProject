FROM node:18 AS frontend-build

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy Python requirements and install
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application
COPY backend/ ./backend/

# Copy frontend build from previous stage
COPY --from=frontend-build /app/frontend/build ./frontend/build

# Create startup script
RUN echo '#!/bin/bash\ncd /app/backend && gunicorn --bind=0.0.0.0:8000 --timeout 600 app:app' > /app/startup.sh && \
    chmod +x /app/startup.sh

EXPOSE 8000

CMD ["/app/startup.sh"]
