# Použijeme ofíciální obraz Bun
FROM oven/bun:1 AS base

# Krok 1: Instalace závislostí
FROM base AS deps
WORKDIR /app

# Zkopírujeme package.json a zámky balíčků
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile || bun install

# Krok 2: Sestavení (Build) Next.js aplikace
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Při buildu potřebujeme dočasně ignorovat chybějící environment variables,
# protože ty se dodají většinou až při "docker compose up" v produkci.
ENV SKIP_ENV_VALIDATION=1

RUN bun run build

# Krok 3: Finální "běžící" image (Production)
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Vytvoření nestandardního uživatele z bezpečnostních důvodů
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Kopírování public složky a vygenerovaných standalone souborů z buildu
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Přepnutí na bezpečnějšího uživatele
USER nextjs

# Expozice portu Next.js (standardně 3000)
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Spuštění serveru
CMD ["bun", "server.js"]
