import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('ai_conversations', (t) => {
    t.text('id').primary()
    t.text('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
    t.text('title').notNullable().defaultTo('新的对话')
    t.integer('created_at').notNullable()
    t.integer('updated_at').notNullable()
  })

  await knex.schema.createTable('ai_messages', (t) => {
    t.text('id').primary()
    t.text('conversation_id').notNullable().references('id').inTable('ai_conversations').onDelete('CASCADE')
    t.text('role').notNullable() // 'user' | 'ai'
    t.text('content').notNullable()
    t.text('time').notNullable().defaultTo('')
    t.integer('created_at').notNullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('ai_messages')
  await knex.schema.dropTableIfExists('ai_conversations')
}
