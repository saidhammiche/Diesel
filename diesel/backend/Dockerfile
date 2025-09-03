FROM node:18-alpine

WORKDIR /app

# Copier les fichiers nécessaires
COPY package*.json ./
RUN npm install

COPY . .

# Le backend écoute sur 5009
EXPOSE 5000
CMD ["npm", "start"]
