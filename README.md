# Joker Server

## Requirements

1. npm: "6.14+"
2. git: "2.24+"
3. nodejs: "14.16+" (https://nodejs.org/)
4. mongodb: "4.0+" (https://www.mongodb.com/)

## Server configuration

Configuration can be added to .env file in project root:
```
PORT=3000
SERVER_HOST=localhost
BASE_URL=http://localhost:3000

MONGO_URL=mongodb://127.0.0.1:27017/joker
```

#### Start

```
npm install
npm start

```

#### Tests mode

```
npm run dev
```
