# App web de GESCA en un contenedor.
#   Etapa 1 (construccion): instala dependencias y genera la versión web con Expo.
#   Etapa 2 (servidor): sirve los archivos estáticos con Nginx. Pesa poco y no lleva Node.
#
# La URL y la llave pública de Supabase se leen del archivo app/.env al construir
# (Expo las incrusta en el JavaScript). La llave service_role nunca va ahí.

FROM node:22-alpine AS construccion
WORKDIR /app
COPY package.json package-lock.json ./
# --ignore-scripts: no se ejecutan scripts de instalación de terceros (la app no los necesita).
RUN npm ci --ignore-scripts
COPY . .
RUN npm run export:web

# Imagen de Nginx que corre sin usuario root.
FROM nginxinc/nginx-unprivileged:1.27-alpine AS servidor
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=construccion /app/dist /usr/share/nginx/html
EXPOSE 8080
