# syntax=docker/dockerfile:1
#
# VizIt frontend
#

# Build the app
FROM node:22-slim AS build

WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./

ARG VITE_APP_TITLE=
ARG VITE_APP_SUBTITLE=
ARG VITE_HOME_PAGE=
ARG VITE_ABOUT_PAGE=
ARG VITE_BACKEND_URL=

RUN set -eu; \
    for v in VITE_APP_TITLE VITE_APP_SUBTITLE VITE_HOME_PAGE VITE_ABOUT_PAGE VITE_BACKEND_URL; do \
        eval "[ -n \"\${$v:-}\" ] || unset $v"; \
    done; \
    npm run build:nginx

# Serve with Nginx
FROM nginx:1.27-alpine AS runtime

COPY --from=build /app/frontend/dist /usr/share/nginx/html
COPY .docker/nginx.conf.template /etc/nginx/templates/default.conf.template

EXPOSE 80
