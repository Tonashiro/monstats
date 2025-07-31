# Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install

COPY . .

RUN yarn global add wait-on

EXPOSE 3000

CMD ["sh", "-c", "\
  wait-on tcp:$DATABASE_HOST:$DATABASE_PORT && \
  yarn prisma generate && \
  yarn prisma migrate deploy && \
  yarn dev"]
