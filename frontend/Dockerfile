FROM node:20-alpine

WORKDIR /app

# Install required dependencies
RUN apk add --no-cache libc6-compat

# Copy package files
COPY package*.json ./

# Clean install with forced resolutions
RUN rm -rf node_modules package-lock.json && \
    npm install --legacy-peer-deps && \
    npm install ajv@^8.12.0 ajv-keywords@^5.1.0 --save-dev --legacy-peer-deps

# Copy source code
COPY . .

# Set environment
ENV NODE_ENV=development
ENV WATCHPACK_POLLING=true

# Expose port
EXPOSE 3000

# Start command
CMD ["npm", "start"]
