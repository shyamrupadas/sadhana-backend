import { FastifyPluginAsync } from 'fastify'
import { AuthService } from '../../services/auth.service'
import { ApiShemas } from '../../schema'
import { AppError } from '../../utils/errors'

const authRoutes: FastifyPluginAsync = async (fastify): Promise<void> => {
  const authService = new AuthService(fastify)

  fastify.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      return reply.code(error.statusCode).send(error.toJSON())
    }

    fastify.log.error(error)
    return reply.code(500).send({
      message: 'Internal Server Error',
      code: 'INTERNAL_ERROR',
    })
  })

  fastify.post<{
    Body: ApiShemas['RegisterRequest']
    Reply: ApiShemas['AuthResponse']
  }>(
    '/register',
    {
      schema: {
        body: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 6 },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              accessToken: { type: 'string' },
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  email: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { email, password } = request.body
      const result = await authService.register(email, password)
      const refreshToken = await authService.generateRefreshTokenForUser(result.user.id)

      reply.setCookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 7 * 24 * 60 * 60,
      })

      return reply.code(201).send(result)
    }
  )

  fastify.post<{
    Body: ApiShemas['LoginRequest']
    Reply: ApiShemas['AuthResponse']
  }>(
    '/login',
    {
      schema: {
        body: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              accessToken: { type: 'string' },
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  email: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { email, password } = request.body
      const result = await authService.login(email, password)
      const refreshToken = await authService.generateRefreshTokenForUser(result.user.id)

      reply.setCookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 7 * 24 * 60 * 60,
      })

      return reply.send(result)
    }
  )

  fastify.post<{
    Reply: ApiShemas['AuthResponse'] | ApiShemas['Error']
  }>(
    '/refresh',
    {
      schema: {
        response: {
          200: {
            type: 'object',
            properties: {
              accessToken: { type: 'string' },
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  email: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const refreshToken = request.cookies.refreshToken

      if (!refreshToken) {
        const errorResponse: ApiShemas['Error'] = {
          message: 'Refresh token not found',
          code: 'UNAUTHORIZED',
        }
        return reply.code(401).send(errorResponse)
      }

      const result = await authService.refreshAccessToken(refreshToken)
      const newRefreshToken = await authService.generateRefreshTokenForUser(
        result.user.id
      )

      reply.setCookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 7 * 24 * 60 * 60,
      })

      return reply.send(result)
    }
  )
}

export default authRoutes
