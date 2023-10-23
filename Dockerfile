FROM node:16-bookworm

WORKDIR /usr/src/app

COPY package*.json ./
RUN  npm install

COPY . .

CMD ["npm","start"]