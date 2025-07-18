FROM oven/bun:1.1.12

WORKDIR /app

COPY . .

RUN bun install

CMD ["bun", "run", "dev"]