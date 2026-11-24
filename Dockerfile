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

RUN apk add --no-cache openssl curl

COPY --from=builder --chown=node:node /app/package*.json ./
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist ./dist

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health

CMD ["node", "dist/src/main.js"]
