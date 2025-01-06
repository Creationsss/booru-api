FROM oven/bun:latest

WORKDIR /app

COPY package.json ./

RUN test -f bun.lockb && cp bun.lockb . || true

RUN [ -f bun.lockb ] && bun install --frozen-lockfile || bun install

COPY . .

CMD ["bun", "run", "start"]
