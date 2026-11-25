FROM node:24-alpine AS builder

ENV HUSKY=0

WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma
COPY prisma7.config.ts ./

RUN npm ci

COPY . .

RUN npm run build

RUN npm prune --omit=dev --ignore-scripts

FROM node:24-alpine AS runner

ENV NODE_ENV=production \
    PORT=3000

WORKDIR /app

RUN apk add --no-cache openssl

COPY --from=builder --chown=node:node /app/package*.json ./
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist ./dist
# Necessários para aplicar as migrations a partir da imagem (npm run db:deploy).
COPY --from=builder --chown=node:node /app/prisma ./prisma
COPY --from=builder --chown=node:node /app/prisma7.config.ts ./

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:' + process.env.PORT + '/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "dist/src/main.js"]
