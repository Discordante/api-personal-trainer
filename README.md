# Personal Trainer API

API en **NestJS + Prisma**, empaquetada en **Docker (Debian slim)**, publicada en **GHCR** y desplegada en **Render** mediante **GitHub Actions**.

---

## Stack

- **Node.js 24 (Debian slim)**
- **NestJS + Prisma + Postgres**
- **Docker multi-stage** (build, deps, runtime no-root)
- **CI/CD con GitHub Actions**
- **Despliegue automático en Render**

---

## Entornos

| Entorno     | Rama      | Deploy automático | Condición                                  | Secret en GitHub                          |
| ----------- | --------- | ----------------- | ------------------------------------------ | ----------------------------------------- |
| **dev**     | `develop` | ✅                | Siempre                                    | `RENDER_DEPLOY_HOOK` (env: `development`) |
| **staging** | `staging` | ✅                | Siempre                                    | `RENDER_DEPLOY_HOOK` (env: `staging`)     |
| **prod**    | `main`    | ✅                | Solo si `semantic-release` publica versión | `RENDER_DEPLOY_HOOK` (env: `production`)  |

---

## Dockerfile

```dockerfile
FROM node:24-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund
COPY prisma ./prisma && npx prisma generate
COPY tsconfig*.json ./ && COPY src ./src
RUN npm run build

FROM node:24-slim AS runner
WORKDIR /app
ENV NODE_ENV=production PORT=3000 NODE_OPTIONS=--enable-source-maps
USER node
COPY --from=builder --chown=node:node /app ./
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

`.dockerignore` incluye: `node_modules`, `dist`, `.git`, `.env`, `coverage`, etc.

### Migraciones en Render

En **Pre-Deploy Command** de Render:

```bash
npx prisma migrate deploy
```

---

## CI/CD (GitHub Actions)

Pipeline modular:

1. **CI** → tests en cada push.
2. **Release** → `semantic-release` (solo en `main`).
3. **Build** → imagen Docker a GHCR (`:beta`, `:rc`, `:latest`, `:vX.Y.Z`, `:sha-<7>`).
4. **Deploy** → Render vía Deploy Hook.

### Secrets en GitHub

Se configuran por entorno en _Settings → Environments_:

- `RENDER_DEPLOY_HOOK` (URL completa de Render con `?key=...`).

Ejemplo de uso en job de deploy:

```yaml
- name: Trigger deploy (Render)
  run: |
    curl -fsSL -X POST "$RENDER_DEPLOY_HOOK"
  env:
    RENDER_DEPLOY_HOOK: ${{ secrets.RENDER_DEPLOY_HOOK }}
```

---

## Desarrollo local

Instalación y migraciones:

```bash
npm ci
npx prisma generate
npx prisma migrate dev
npm run start:dev
```

Usando Docker local:

```bash
docker build -t personal-trainer-api .
docker run --rm -p 3000:3000 --env-file .env personal-trainer-api
```

---

## Notas

- **No** ejecutes migraciones en `main.ts`.
- **Sí** en Render Pre-Deploy.
- Usa **commits convencionales** (`feat:`, `fix:`, `chore:`…) para versionado automático.
- Usuario **no root** en contenedor.
- Secrets gestionados siempre en GitHub/Render (no en código).

---
