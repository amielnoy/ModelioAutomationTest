FROM mcr.microsoft.com/playwright:v1.60.0-jammy

WORKDIR /app

# Install dependencies first (layer-cached until package*.json changes)
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Default: run all tests; override via docker-compose command or docker run args
CMD ["npx", "playwright", "test"]
