FROM node:22-bookworm-slim AS builder
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build:production && pnpm prune --prod

FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
RUN groupadd --system trappola && useradd --system --gid trappola --home /app trappola
COPY --from=builder --chown=trappola:trappola /app/node_modules ./node_modules
COPY --from=builder --chown=trappola:trappola /app/server-dist ./server-dist
COPY --from=builder --chown=trappola:trappola /app/server/migrations ./server/migrations
COPY --from=builder --chown=trappola:trappola /app/dist ./dist
RUN mkdir -p /app/uploads && chown trappola:trappola /app/uploads
USER trappola
EXPOSE 3000
CMD ["node", "server-dist/index.mjs"]
