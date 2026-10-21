FROM node:lts-alpine

WORKDIR app/

COPY server.js package.json .

COPY ./public/ ./public/

RUN npm install

EXPOSE 3000

CMD ["npm", "start"]
