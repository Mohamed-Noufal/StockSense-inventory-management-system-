# ==============================================================================
# StockSense — Backend Container Image
# ==============================================================================
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONPATH=/app

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy backend code, configuration, and scripts
COPY backend/ /app/backend/
COPY config/ /app/config/
COPY scripts/ /app/scripts/

# Ensure runtime directories exist and non-root execution (S-8)
RUN useradd -m -u 1000 appuser && \
    mkdir -p /app/data/attachments && \
    chmod +x /app/scripts/docker_entrypoint.sh && \
    chown -R appuser:appuser /app

USER appuser

EXPOSE 8000

ENTRYPOINT ["/app/scripts/docker_entrypoint.sh"]
CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
