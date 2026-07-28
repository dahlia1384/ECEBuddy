# syntax=docker/dockerfile:1

# ---- Client build ----
FROM node:22-slim AS client-builder
WORKDIR /app
COPY package*.json ./
COPY client/package*.json client/
RUN npm ci
COPY client client
RUN npm run build --workspace client

# ---- Server build ----
FROM node:22-slim AS server-builder
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
COPY server/package*.json server/
RUN npm ci
COPY server server
RUN npm run build --workspace server

# ---- Runtime ----
FROM node:22-slim
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY package*.json ./
COPY server/package*.json server/
COPY client/package*.json client/
RUN npm ci --omit=dev --workspace server
# better-sqlite3 ships bundled prebuilt binaries, and its loader always prefers
# them over a source build. Its linux-arm64 prebuild links against a newer
# glibc than this base image ships, so remove it to force a source compile
# (the build toolchain above makes that reliable here).
RUN rm -rf node_modules/better-sqlite3/prebuilds \
  && npm rebuild better-sqlite3 --build-from-source

COPY --from=server-builder /app/server/dist server/dist
COPY --from=client-builder /app/client/dist client/dist

ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

CMD ["node", "server/dist/index.js"]
