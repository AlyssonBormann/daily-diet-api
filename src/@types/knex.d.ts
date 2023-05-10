// eslint-disable-next-line
import { knex } from 'knex'

declare module 'knex/types/tables' {
  export interface Tables {
    snack: {
      id: string
      session_id?: string
      name: string
      description: string
      created_at: string
      is_in_diet: boolean
    }
  }
}
