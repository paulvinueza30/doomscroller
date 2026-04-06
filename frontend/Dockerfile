FROM oven/bun:1 AS builder

WORKDIR /app

COPY package*.json ./
RUN bun install

COPY . .

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN bun run build

FROM oven/bun:1

WORKDIR /app

COPY --from=builder /app/build ./build

EXPOSE 80

CMD ["bun", "x", "serve", "-s", "build", "-l", "80"]