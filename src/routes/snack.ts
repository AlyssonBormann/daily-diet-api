import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { randomUUID } from 'node:crypto'
import { checkSessionIdExists } from '../middlewares/check-session-id-exits'
import { knex } from '../database'

export async function snackRoutes(app: FastifyInstance) {
  const getSnackParamsSchema = z.object({
    id: z.string().uuid(),
  })

  app.post('/', async (request, reply) => {
    const createSnackSchema = z.object({
      name: z.string(),
      description: z.string(),
      createdAt: z.string().datetime(),
      isInDiet: z.boolean(),
    })

    const { name, description, createdAt, isInDiet } = createSnackSchema.parse(
      request.body,
    )

    let sessionId = request.cookies.sessionId

    if (!sessionId) {
      sessionId = randomUUID()

      reply.cookie('sessionId', sessionId, {
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 30, // 30 dias
      })
    }

    await knex('snack').insert({
      id: randomUUID(),
      session_id: sessionId,
      name,
      description,
      created_at: createdAt,
      is_in_diet: isInDiet,
    })

    return reply.status(201).send()
  })

  app.put(
    '/:id',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const updateSnackSchema = z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        createdAt: z.string().datetime().optional(),
        isInDiet: z.boolean().optional(),
      })

      const { id } = getSnackParamsSchema.parse(request.params)

      const { sessionId } = request.cookies

      const { name, description, createdAt, isInDiet } =
        updateSnackSchema.parse(request.body)

      await knex('snack').where({ id, session_id: sessionId }).update({
        name,
        description,
        created_at: createdAt,
        is_in_diet: isInDiet,
      })

      return reply.status(201).send()
    },
  )

  app.get('/', { preHandler: [checkSessionIdExists] }, async (request) => {
    const { sessionId } = request.cookies

    const snacks = await knex('snack').where('session_id', sessionId)

    return { snacks }
  })

  app.delete(
    '/:id',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const getTransactionParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = getTransactionParamsSchema.parse(request.params)

      const { sessionId } = request.cookies

      await knex('snack').where({ id, session_id: sessionId }).first().delete()

      return reply.status(201).send()
    },
  )

  app.get(
    '/:id',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const getTransactionParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = getTransactionParamsSchema.parse(request.params)

      const { sessionId } = request.cookies

      const snack = await knex('snack')
        .where({ id, session_id: sessionId })
        .first()

      return { snack }
    },
  )

  app.get(
    '/summary',
    { preHandler: [checkSessionIdExists] },
    async (request) => {
      const { sessionId } = request.cookies

      const summarySnack = await knex('snack')
        .select(
          knex.raw(
            'count(*) filter (where is_in_diet = true) as totalWithinDiet',
          ),
          knex.raw(
            'count(*) filter (where is_in_diet = false) as totalOutsideDiet',
          ),
          knex.raw('count(*) as total'),
        )
        .where('session_id', sessionId)

      return { summary: summarySnack }
    },
  )
}
