import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('real_exam_records', (t) => {
    t.string('id').primary()
    t.string('user_id').notNullable().index()
    t.string('units').notNullable()
    t.integer('total_questions').notNullable().defaultTo(150)
    t.integer('time_limit').notNullable().defaultTo(7200)
    t.integer('answered_questions').defaultTo(0)
    t.integer('correct_count').defaultTo(0)
    t.integer('score').defaultTo(0)
    t.integer('duration').defaultTo(0)
    t.text('answers_json').defaultTo('[]')
    t.integer('is_completed').defaultTo(0)
    t.bigint('start_time').notNullable()
    t.bigint('end_time')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('real_exam_records')
}
