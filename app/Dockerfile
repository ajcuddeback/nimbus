# Frontend multi-stage Dockerfile
# Stage 1: build the Angular app (with SSR/server bundle)
FROM node:18-bullseye AS build
WORKDIR /usr/src/app
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps
COPY . .
# Build production artifacts (SSR + browser)
RUN npm run build -- --configuration=production

# Stage 2: lightweight runtime for serving the SSR bundle with Node
FROM node:18-alpine AS runtime
WORKDIR /usr/src/app
ENV NODE_ENV=production
# Copy only the server bundle and built browser assets
COPY --from=build /usr/src/app/dist /usr/src/app/dist
COPY --from=build /usr/src/app/package.json /usr/src/app/package.json

EXPOSE 4000
# The project defines a start script to run the SSR server: node dist/app/server/server.mjs
CMD ["node", "dist/app/server/server.mjs"]
