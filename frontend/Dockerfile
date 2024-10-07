# Dockerfile for frontend
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
# Kopiera övriga filer
COPY . .
# Bygg Next.js-applikationen
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
