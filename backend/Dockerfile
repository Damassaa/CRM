FROM node:20-alpine

# Install OpenSSL for Prisma and other dependencies
RUN apk add --no-cache openssl openssl-dev libc6-compat dos2unix

WORKDIR /app

# Copy package files first
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install --legacy-peer-deps

# Generate Prisma Client
RUN npx prisma generate

# Copy entrypoint script FIRST and fix its line endings
COPY entrypoint.sh /entrypoint.sh
RUN dos2unix /entrypoint.sh || sed -i 's/\r$//' /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Copy all source code
COPY . .

# Expose port
EXPOSE 3001

# Use entrypoint to fix scripts at runtime
ENTRYPOINT ["/entrypoint.sh"]

# Default command
CMD ["sh", "/app/start.sh"]
