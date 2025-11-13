FROM node:20-alpine

# Install OpenSSL for Prisma and other dependencies
RUN apk add --no-cache openssl openssl-dev libc6-compat dos2unix

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

# Fix line endings for shell scripts (convert CRLF to LF)
RUN dos2unix /app/start.sh || sed -i 's/\r$//' /app/start.sh
RUN dos2unix /app/wait-for-db.sh || sed -i 's/\r$//' /app/wait-for-db.sh
RUN chmod +x /app/start.sh /app/wait-for-db.sh

# Expose port
EXPOSE 3001

# Start command
CMD ["sh", "/app/start.sh"]
