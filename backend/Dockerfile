# Multi-stage Dockerfile for Railway deployment
# Stage 1: Build TypeScript
FROM node:18-alpine AS builder

RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies for TypeScript)
RUN npm install

# Copy source files and TypeScript config
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript
RUN npm run build

# Copy prisma schema
COPY prisma ./prisma

# Stage 2: Production image
FROM node:18-alpine AS runner

RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm install --omit=dev

# Copy prisma schema and generate client
COPY prisma ./prisma
RUN npx prisma generate

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production
ENV PORT=4000

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 4000

CMD ["node", "dist/index.js"]