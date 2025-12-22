# Backend Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Expose port
EXPOSE 5000

# Run migrations and start server
CMD ["sh", "-c", "npm run migrate && npm start"]
