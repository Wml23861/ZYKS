import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('knowledge_points', (t) => {
    t.text('id').primary()
    t.text('section_id').references('id').inTable('sections').onDelete('SET NULL')
    t.text('chapter_id').notNullable().references('id').inTable('chapters').onDelete('CASCADE')
    t.text('subject_id').notNullable().references('id').inTable('subjects').onDelete('CASCADE')
    t.text('title').notNullable()
    t.text('content').notNullable().defaultTo('')
    t.text('difficulty').notNullable().defaultTo('basic')
    t.text('tags_json').notNullable().defaultTo('[]')
    t.text('related_question_ids_json').notNullable().defaultTo('[]')
    t.text('related_flashcard_ids_json').notNullable().defaultTo('[]')
    t.integer('sort_order').notNullable().defaultTo(0)
    t.integer('is_key_point').notNullable().defaultTo(0)
    t.integer('is_difficult_point').notNullable().defaultTo(0)
    t.integer('frequency_level').notNullable().defaultTo(0)
    t.integer('is_predicted').notNullable().defaultTo(0)
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('knowledge_points')
}
