FROM node:20-alpine

# Install OpenSSL for Prisma and other dependencies
RUN apk add --no-cache openssl openssl-dev libc6-compat

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Expose port
EXPOSE 3001

# Start command (will be overridden by docker-compose)
CMD ["npm", "run", "dev"]
