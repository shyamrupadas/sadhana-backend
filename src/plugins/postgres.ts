import { FastifyPluginAsync } from 'fastify'
import fastifyPlugin from 'fastify-plugin'
import fastifyPostgres from '@fastify/postgres'

const postgresPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(fastifyPostgres, {
    connectionString: fastify.config.DATABASE_URL,
  })

  fastify.log.info('PostgreSQL connection established')
}

export default fastifyPlugin(postgresPlugin)

