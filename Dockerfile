# Use Bun's official image
FROM oven/bun:1.3.1-slim

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build the frontend
RUN bun run build:client

# Expose the application port
EXPOSE 3000

# Start the server
CMD ["bun", "run", "server/index.ts"]
