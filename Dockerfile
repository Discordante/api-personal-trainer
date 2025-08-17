# ---------- Dependencies stage ----------
FROM node:24-slim AS deps
WORKDIR /app
COPY package*.json ./
RUN apt-get update && apt-get upgrade -y && rm -rf /var/lib/apt/lists/* \
  && npm ci --omit=dev --ignore-scripts --no-audit --no-fund

# ---------- Builder stage ----------
FROM node:24-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm ci --ignore-scripts --no-audit --no-fund
COPY tsconfig*.json ./
COPY prisma ./prisma
RUN npx prisma generate
COPY src ./src
RUN npm run build

# ---------- Runner stage ----------
FROM node:24-slim AS runner
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
ENV PORT=3000
ENV NODE_OPTIONS=--enable-source-maps

# Copiamos deps de prod con permisos de 'node'
COPY --from=deps --chown=node:node /app/node_modules ./node_modules

# Copiamos SOLO lo generado por Prisma con permisos de 'node'
COPY --from=builder --chown=node:node /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=node:node /app/node_modules/@prisma/client ./node_modules/@prisma/client

# App (también con owner correcto por consistencia)
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/prisma ./prisma
COPY --chown=node:node package*.json ./

USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]
