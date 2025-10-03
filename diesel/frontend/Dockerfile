# Utilise Node pour builder le frontend React
FROM node:18-alpine AS build

WORKDIR /app

# Copier les fichiers de config et installer les dépendances
COPY package*.json ./
RUN npm install

# Copier le reste et builder l'application
COPY . .
RUN npm run build

# Étape pour servir avec nginx
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html

# Config nginx
EXPOSE 3011
CMD ["nginx", "-g", "daemon off;"]
