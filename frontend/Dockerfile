FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY frontend/package.json frontend/
COPY shared/package.json shared/

RUN npm install --workspace frontend --workspace shared

COPY frontend frontend
COPY shared shared

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build --workspace frontend

FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/frontend/dist /usr/share/nginx/html
# Ensure PWA icons are available at root (some hosting environments skip them otherwise)
COPY frontend/public/icon-192x192.png /usr/share/nginx/html/icon-192x192.png
COPY frontend/public/icon-512x512.png /usr/share/nginx/html/icon-512x512.png
COPY frontend/public/favicon.svg /usr/share/nginx/html/favicon.svg
COPY frontend/public/icon.svg /usr/share/nginx/html/icon.svg

EXPOSE 80
