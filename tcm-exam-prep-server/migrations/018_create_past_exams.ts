import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  const hasPastExams = await knex.schema.hasTable('past_exams')
  if (!hasPastExams) {
    await knex.schema.createTable('past_exams', (t) => {
      t.text('id').primary()
      t.integer('year').notNullable()
      t.integer('unit').notNullable().comment('1=第一单元, 2=第二单元')
      t.integer('total_questions').notNullable().defaultTo(150)
      t.integer('time_limit').notNullable().defaultTo(150).comment('考试时间（分钟）')
      t.text('summary').notNullable().defaultTo('').comment('年度考试总结分析')
      t.text('key_points').notNullable().defaultTo('').comment('重点难点分析')
      t.text('source').notNullable().defaultTo('考生回忆版').comment('数据来源')
      t.integer('created_at').notNullable()
      t.unique(['year', 'unit'])
    })
  }

  const hasQuestions = await knex.schema.hasTable('past_exam_questions')
  if (!hasQuestions) {
    await knex.schema.createTable('past_exam_questions', (t) => {
      t.text('id').primary()
      t.text('exam_id').notNullable().references('id').inTable('past_exams').onDelete('CASCADE')
      t.text('type').notNullable().comment('A1/A2/B1')
      t.text('subject_id').notNullable().defaultTo('')
      t.text('question_stem').notNullable()
      t.text('options').notNullable().comment('JSON: [{key, text}]')
      t.text('correct_answer').notNullable()
      t.text('explanation').notNullable().defaultTo('')
      t.integer('difficulty').notNullable().defaultTo(3).comment('1-5')
      t.text('key_point_tag').notNullable().defaultTo('').comment('重点/难点/高频/基础')
      t.integer('exam_frequency').notNullable().defaultTo(1).comment('历年出现频次')
      t.integer('sort_order').notNullable().defaultTo(0)
    })
  }

  const hasCol = await knex.schema.hasColumn('exam_records', 'past_exam_id')
  if (!hasCol) {
    await knex.schema.alterTable('exam_records', (t) => {
      t.text('past_exam_id').nullable().references('id').inTable('past_exams').onDelete('SET NULL')
    })
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('exam_records', (t) => {
    t.dropColumn('past_exam_id')
  })
  await knex.schema.dropTableIfExists('past_exam_questions')
  await knex.schema.dropTableIfExists('past_exams')
}
