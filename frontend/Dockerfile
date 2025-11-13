FROM node:20-alpine

WORKDIR /app

# Install required dependencies
RUN apk add --no-cache libc6-compat dos2unix

# Copy package files first
COPY package*.json ./

# Clean install with specific ajv versions for react-scripts 5.0.1 compatibility
RUN rm -rf node_modules package-lock.json && \
    npm install --legacy-peer-deps

# Force correct ajv versions AFTER main install
RUN npm install ajv@6.12.6 ajv-keywords@3.5.2 --save-exact --legacy-peer-deps

# Copy entrypoint and fix line endings
COPY entrypoint.sh /entrypoint.sh
RUN dos2unix /entrypoint.sh || sed -i 's/\r$//' /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Copy source code
COPY . .

# Set environment variables
ENV NODE_ENV=development
ENV WATCHPACK_POLLING=true
ENV SKIP_PREFLIGHT_CHECK=true
ENV GENERATE_SOURCEMAP=false
ENV TSC_COMPILE_ON_ERROR=true

# Expose port
EXPOSE 3000

# Use entrypoint
ENTRYPOINT ["/entrypoint.sh"]

# Default command
CMD ["npm", "start"]
