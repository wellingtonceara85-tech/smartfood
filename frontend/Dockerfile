FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY frontend/package.json ./
RUN npm install

FROM base AS build
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
COPY --from=deps /app/node_modules ./node_modules
COPY frontend/ ./
RUN npm run build

FROM base AS runtime
ENV NODE_ENV=production
RUN npm install -g serve
COPY --from=build /app/dist ./dist

EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
