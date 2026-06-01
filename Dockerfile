FROM mcr.microsoft.com/playwright:v1.60.0-jammy

WORKDIR /app

# Java is required by allure-commandline to generate HTML reports
RUN apt-get update && \
    apt-get install -y --no-install-recommends openjdk-17-jre-headless && \
    rm -rf /var/lib/apt/lists/*

# Install dependencies first (layer-cached until package*.json changes)
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Default: run all tests; override via docker-compose command or docker run args
CMD ["npx", "playwright", "test"]
