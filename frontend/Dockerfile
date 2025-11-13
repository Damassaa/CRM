FROM node:20-alpine

WORKDIR /app

# Install required dependencies
RUN apk add --no-cache libc6-compat

# Copy package files
COPY package*.json ./

# Install dependencies with compatible ajv version
# react-scripts 5.0.1 requires ajv v6, not v8
RUN rm -rf node_modules package-lock.json && \
    npm install --legacy-peer-deps && \
    npm install ajv@^6.12.6 ajv-keywords@^3.5.2 --save-dev --legacy-peer-deps

# Copy source code
COPY . .

# Set environment
ENV NODE_ENV=development
ENV WATCHPACK_POLLING=true
ENV SKIP_PREFLIGHT_CHECK=true

# Expose port
EXPOSE 3000

# Start command
CMD ["npm", "start"]
