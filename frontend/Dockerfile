FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Pass API URL at build time
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

FROM node:20-alpine

WORKDIR /app

# adapter-static outputs to build/
COPY --from=builder /app/build ./build

RUN npm install -g serve

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s \
  CMD wget -qO- http://localhost:80 || exit 1

CMD ["serve", "-s", "build", "-l", "80"]
