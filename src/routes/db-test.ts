import { FastifyPluginAsync } from 'fastify'

const dbTest: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get('/db-test', async (request, reply) => {
    const client = await fastify.pg.connect()
    
    try {
      const { rows } = await client.query('SELECT NOW() as current_time')
      return { success: true, time: rows[0].current_time }
    } finally {
      client.release()
    }
  })
}

export default dbTest

