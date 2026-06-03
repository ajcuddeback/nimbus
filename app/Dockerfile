FROM node:20-bookworm AS build
WORKDIR /usr/src/app

COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps

COPY . .

RUN npm run build -- --configuration=production

# Export stage: BuildKit extracts this to the host via --output
FROM scratch AS export
COPY --from=build /usr/src/app/dist/app/browser /
