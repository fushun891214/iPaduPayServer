FROM --platform=linux/amd64 node:20

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 8081

CMD ["npm", "start"]