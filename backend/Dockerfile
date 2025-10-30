FROM node:20-bullseye-slim AS builder

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json backend/
COPY shared/package.json shared/

RUN npm install --workspace backend --workspace shared

COPY backend backend
COPY shared shared

RUN npm run prisma:generate --workspace backend
RUN npm run build --workspace backend

FROM node:20-bullseye-slim AS runner

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/backend ./backend
COPY --from=builder /app/shared ./shared
COPY package.json package-lock.json ./

WORKDIR /app/backend

EXPOSE 3001

CMD ["node", "dist/index.js"]
