# syntax=docker/dockerfile:1
#
# VizIt backend
#

# Build the virtual environment
FROM python:3.12-slim AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        libcurl4-openssl-dev \
        libssl-dev \
        zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY backend/requirements.txt /tmp/requirements.txt

RUN pip install --no-cache-dir --upgrade pip setuptools wheel \
    && pip install --no-cache-dir --no-binary pyBigWig -r /tmp/requirements.txt \
    && python -c "import pyBigWig; assert pyBigWig.remote, 'pyBigWig was built WITHOUT libcurl'"

# Run the backend
FROM python:3.12-slim AS runtime

RUN apt-get update && apt-get install -y --no-install-recommends \
        libcurl4 \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /opt/venv /opt/venv

ENV PATH="/opt/venv/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

RUN useradd --create-home --uid 1000 vizit

WORKDIR /app
COPY backend/ /app/backend/

RUN mkdir -p /data \
             /app/backend/datasets \
             /app/backend/SampleSheets \
             /app/backend/DatasetFiles \
    && chown -R vizit:vizit /data /app

USER vizit
EXPOSE 8000

CMD ["sh", "-c", "exec uvicorn backend.main:app --host 0.0.0.0 --port 8000 --workers ${UVICORN_WORKERS:-4} --proxy-headers --forwarded-allow-ips='*'"]
