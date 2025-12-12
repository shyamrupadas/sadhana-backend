# Getting Started with [Fastify-CLI](https://www.npmjs.com/package/fastify-cli)
This project was bootstrapped with Fastify-CLI.

## Database Setup

Приложение использует PostgreSQL базу данных от Neon.

### Настройка переменных окружения

Создайте файл `.env` в корне проекта:

```
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
```

### Использование базы данных в маршрутах

```typescript
fastify.get('/example', async (request, reply) => {
  const client = await fastify.pg.connect()
  
  try {
    const { rows } = await client.query('SELECT * FROM users')
    return { users: rows }
  } finally {
    client.release()
  }
})
```

### Тестирование подключения

Запустите приложение и откройте `http://localhost:3000/db-test` для проверки подключения к базе данных.

## Available Scripts

In the project directory, you can run:

### `npm run dev`

To start the app in dev mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### `npm start`

For production mode

### `npm run test`

Run the test cases.

## Learn More

To learn Fastify, check out the [Fastify documentation](https://fastify.dev/docs/latest/).
