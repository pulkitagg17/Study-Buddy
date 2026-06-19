# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /usr/src/app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build
RUN npm prune --production

# Stage 2: Runtime
FROM node:20-alpine AS runner
RUN addgroup -g 1001 nodejs && adduser -D -u 1001 -G nodejs nodejs
WORKDIR /usr/src/app

ENV NODE_ENV=production

COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules

USER nodejs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "const http=require('http'); const req=http.get('http://127.0.0.1:3000/api/health', res=>process.exit(res.statusCode===200?0:1)); req.on('error', ()=>process.exit(1));"

CMD ["node", "dist/index.js"]
