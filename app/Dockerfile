FROM node:20-bookworm AS build
WORKDIR /usr/src/app

COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps

COPY . .

RUN npm run build -- --configuration=production

FROM node:20-alpine AS runtime
WORKDIR /usr/src/app

COPY --from=build /usr/src/app/dist/app/browser ./dist/app/browser

CMD ["sleep", "infinity"]
