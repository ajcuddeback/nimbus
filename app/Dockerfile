# Frontend multi-stage Dockerfile

# Stage 1: build the Angular app (with SSR/server bundle)
FROM node:20-bookworm AS build
WORKDIR /usr/src/app

# install deps
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps

# copy source
COPY . .

# build for prod (SSR + browser)
RUN npm run build -- --configuration=production

# Stage 2: lightweight runtime for serving the SSR bundle with Node
FROM node:20-alpine AS runtime
WORKDIR /usr/src/app
ENV NODE_ENV=production

# copy built artifacts
COPY --from=build /usr/src/app/dist /usr/src/app/dist
COPY --from=build /usr/src/app/package.json /usr/src/app/package.json

EXPOSE 4000

# adjust this if your build outputs somewhere else
CMD ["node", "dist/app/server/server.mjs"]