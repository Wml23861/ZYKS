import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.table('videos', (table) => {
    table.text('ocr_text').defaultTo('')        // OCR 原始文字
    table.text('info_draft').defaultTo('')       // AI 整理后的信息稿
    table.text('quiz_questions_json').defaultTo('[]')  // 关联试题 [{ questionId, source }]
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.table('videos', (table) => {
    table.dropColumn('quiz_questions_json')
    table.dropColumn('info_draft')
    table.dropColumn('ocr_text')
  })
}
