# Deploying QABuddy.AI to a DigitalOcean Droplet (8GB RAM / 4vCPU)

This guide documents the original target droplet deployment utilizing Docker Compose, Qdrant Server, Caddy TLS, and local CPU inference.

## Prerequisites

1. Set up an Ubuntu 22.04 LTS droplet with at least 8GB RAM / 4vCPUs (required for local model running).
2. Install Docker and Docker Compose.
3. Configure your domain DNS (A record) pointing to the droplet IP.

## Setup Directory

Create a directory and copy the project files:
```bash
mkdir -p /opt/qabuddy
cd /opt/qabuddy
```

Configure `.env`:
```env
GROQ_API_KEY=your-groq-key
HUGGINGFACE_API_KEY=your-hf-token
QDRANT_URL=http://qdrant:6333
DOMAIN_NAME=qabuddy.yourdomain.com
```

## Docker Compose File (`docker-compose.yml`)

The compose setup defines Qdrant server, Caddy reverse-proxy with SSL, and the Flask app.

```yaml
version: '3.8'

services:
  qdrant:
    image: qdrant/qdrant:latest
    container_name: qdrant
    restart: always
    ports:
      - "6333:6333"
    volumes:
      - qdrant_data:/qdrant/storage

  app:
    build: .
    container_name: qabuddy-app
    restart: always
    ports:
      - "8000:8000"
    environment:
      - QDRANT_URL=http://qdrant:6333
      - GROQ_API_KEY=${GROQ_API_KEY}
      - HUGGINGFACE_API_KEY=${HUGGINGFACE_API_KEY}
    depends_on:
      - qdrant

  caddy:
    image: caddy:latest
    container_name: caddy
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      - app

volumes:
  qdrant_data:
  caddy_data:
  caddy_config:
```

## Caddyfile

Configure automatic HTTPS with Let's Encrypt using Caddyfile:

```caddy
{$DOMAIN_NAME} {
    reverse_proxy /api/* app:8000
    file_server {
        root /opt/qabuddy/dist
    }
}
```

## Running Ingestion on Droplet

To load the database locally on the droplet:
```bash
docker-compose exec app python -m app.ingestion.cli ingest --all --local --reset
```
This runs the local BGE-M3 dense and sparse encoders on the CPU.
