import 'fastify'
import { PostgresDb } from '@fastify/postgres'

declare module 'fastify' {
  interface FastifyInstance {
    pg: PostgresDb
    config: {
      DATABASE_URL: string
      NODE_ENV: string
    }
  }
}

