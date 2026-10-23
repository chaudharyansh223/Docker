FROM node:22-alpine

WORKDIR ./app/

COPY ./backend/ ./backend/

RUN apk update && \
    apk upgrade && \
    apk add curl

WORKDIR /app/backend/

RUN npm install package.json

EXPOSE 3000

CMD ["npm", "start"]
