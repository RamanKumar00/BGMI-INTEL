FROM python:3.11-slim

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency specifications
COPY data-pipeline/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend files and SQLite database
COPY data-pipeline /app

EXPOSE 8000

ENV PORT=8000
CMD python -m uvicorn server:app --host 0.0.0.0 --port ${PORT:-8000}
