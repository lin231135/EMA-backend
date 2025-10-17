FROM oven/bun:1.1.12

WORKDIR /app

# Copy package files first for better caching
COPY package.json bun.lockb ./

RUN bun install

# Copy the rest of the application
COPY . .

CMD ["bun", "run", "dev"]