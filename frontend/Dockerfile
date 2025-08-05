# Build stage: use official Node.js image to build the React app
FROM node:20 AS build

# Set working directory inside the container
WORKDIR /app

# Copy dependency files first for better caching
COPY package.json package-lock.json ./
# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .
# Build the production-ready static files
RUN npm run build

# Production stage: use nginx to serve the built static files
FROM nginx:alpine

# Copy built files from build stage to nginx's public folder
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80 for HTTP traffic
EXPOSE 80

# Start nginx when the container launches
CMD ["nginx", "-g", "daemon off;"]