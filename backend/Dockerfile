# Använd en officiell Node.js-bild som bas
FROM node:alpine
# Skapa och ange arbetskatalog
WORKDIR /app
COPY package*.json ./
RUN npm install
# Kopiera övriga filer
COPY . .
EXPOSE 3001
CMD ["node", "server.js"]
