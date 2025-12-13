import { FastifyPluginAsync } from 'fastify'
import fastifyPlugin from 'fastify-plugin'
import fastifyEnv from '@fastify/env'

const schema = {
  type: 'object',
  required: ['DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET'],
  properties: {
    DATABASE_URL: {
      type: 'string',
    },
    NODE_ENV: {
      type: 'string',
      default: 'development',
    },
    JWT_SECRET: {
      type: 'string',
    },
    JWT_REFRESH_SECRET: {
      type: 'string',
    },
    JWT_EXPIRES_IN: {
      type: 'string',
      default: '15m',
    },
    JWT_REFRESH_EXPIRES_IN: {
      type: 'string',
      default: '7d',
    },
    COOKIE_SECRET: {
      type: 'string',
      default: 'my-secret',
    },
  },
}

const envPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(fastifyEnv, {
    schema,
    dotenv: true,
  })
}

export default fastifyPlugin(envPlugin)
