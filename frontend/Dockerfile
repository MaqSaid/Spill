# Spill Frontend — Multi-stage Docker build
# For production: builds static assets
# For development: runs vite dev server

FROM node:20-alpine as builder

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .
RUN npm run build

# ─── Production: Serve static files with nginx ────────────────────────────
FROM nginx:alpine as production

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# ─── Development: Vite dev server ─────────────────────────────────────────
FROM node:20-alpine as development

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
