FROM node:20-alpine

WORKDIR /app

COPY server.js .

EXPOSE 5000

CMD ["node", "server.js"]


