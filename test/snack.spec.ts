import { describe, test, afterAll, beforeAll, beforeEach, expect } from 'vitest'
import request from 'supertest'
import { execSync } from 'node:child_process'
import { app } from '../src/app'

describe('snack routes', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(async () => {
    execSync('npm run knex migrate:rollback --all')
    execSync('npm run knex migrate:latest')
  })

  test('should be able to create a new snack', async () => {
    await request(app.server)
      .post('/snack')
      .send({
        name: 'test name',
        description: 'test description ',
        createdAt: new Date().toISOString(),
        isInDiet: true,
      })
      .expect(201)
  })

  test('should be able list all snack', async () => {
    const createSnackeResponse = await request(app.server)
      .post('/snack')
      .send({
        name: 'test name',
        description: 'test description',
        createdAt: new Date().toISOString(),
        isInDiet: true,
      })
      .expect(201)

    const cookies = createSnackeResponse.get('Set-Cookie')

    const listSnackeResponse = await request(app.server)
      .get('/snack')
      .set('Cookie', cookies)
      .expect(200)

    expect(listSnackeResponse.body.snacks).toEqual([
      expect.objectContaining({
        name: 'test name',
        description: 'test description',
      }),
    ])
  })

  test.only('should be able update a snack', async () => {
    const createSnackeResponse = await request(app.server)
      .post('/snack')
      .send({
        name: 'test 1',
        description: 'test description',
        createdAt: new Date().toISOString(),
        isInDiet: true,
      })
      .expect(201)

    const cookies = createSnackeResponse.get('Set-Cookie')

    await request(app.server)
      .post('/snack')
      .send({
        name: 'test 2',
        description: 'test description',
        createdAt: new Date().toISOString(),
        isInDiet: true,
      })
      .set('Cookie', cookies)
      .expect(201)

    const listSnackesResponse = await request(app.server)
      .get('/snack')
      .set('Cookie', cookies)
      .expect(200)

    const snackId = listSnackesResponse.body.snacks[0].id

    await request(app.server)
      .put(`/snack/${snackId}`)
      .set('Cookie', cookies)
      .send({
        name: 'test 3',
        description: 'test description 3',
      })
      .expect(201)
  })
})
