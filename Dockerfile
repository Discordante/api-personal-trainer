# ---- Builder stage (Node 24 LTS) ----
FROM node:24-alpine AS builder
WORKDIR /app

# Install dependencies (CI-mode for reproducibility)
COPY package*.json ./
RUN npm ci

# Build NestJS
COPY tsconfig*.json ./
COPY src ./src
RUN npm run build

# ---- Runner stage (production, Node 24 LTS) ----
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install only production deps
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled dist
COPY --from=builder /app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/main.js"]
