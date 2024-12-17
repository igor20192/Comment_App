FROM node:23-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install

FROM node:23-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
RUN npm run build && rm -rf node_modules

USER node
EXPOSE 3000
CMD ["npm", "start"]