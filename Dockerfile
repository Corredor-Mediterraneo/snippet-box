FROM node:22-alpine AS build

WORKDIR /app

# Install all dependencies
COPY package*.json ./
RUN npm install

# Install client dependencies
# python3, make, g++ needed for sqlite3 native compilation (node-gyp)
RUN apk add --no-cache python3 make g++
COPY client/package*.json ./client/
RUN cd client && npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build client
RUN npm run build:client

# Build server
RUN npm run build:server

# Production stage
FROM node:22-alpine

WORKDIR /app

# Copy built files from build stage
COPY --from=build /app/build ./build
COPY --from=build /app/client/build ./public

# Copy package.json for production dependencies
COPY package*.json ./

# Install production dependencies only
RUN npm prune --production

# Create necessary directories
RUN mkdir -p ./data ./data/backups

# Copy original database if it exists (for migration)
COPY db.sqlite3 ./data/db.sqlite3

EXPOSE 5000

ENV NODE_ENV=production

CMD ["node", "build/server.js"]
