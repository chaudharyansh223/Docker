FROM node:22-alpine AS builder

WORKDIR /notes/backend/

COPY ./backend/ ./

RUN npm install

FROM node:22-alpine

WORKDIR /notes/backend/

COPY --from=builder /notes/backend/ .

CMD ["node", "server.js"]
