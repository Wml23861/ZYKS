import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  // 添加视频格式字段（现有视频根据 file_url 推断）
  await knex.schema.alterTable('videos', (t) => {
    t.text('format').notNullable().defaultTo('mp4')
    t.text('processing_status').notNullable().defaultTo('raw')
    t.text('processing_error').notNullable().defaultTo('')
    t.integer('processing_progress').notNullable().defaultTo(0)
    t.text('processing_step').notNullable().defaultTo('')
    t.text('transcoded_variants_json').notNullable().defaultTo('[]')
    t.text('extracted_difficult_points_json').notNullable().defaultTo('[]')
    t.text('subject_match_json').notNullable().defaultTo('[]')
    t.text('ai_transcript').notNullable().defaultTo('')
    t.text('ai_summary').notNullable().defaultTo('')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('videos', (t) => {
    t.dropColumn('format')
    t.dropColumn('processing_status')
    t.dropColumn('processing_error')
    t.dropColumn('processing_progress')
    t.dropColumn('processing_step')
    t.dropColumn('transcoded_variants_json')
    t.dropColumn('extracted_difficult_points_json')
    t.dropColumn('subject_match_json')
    t.dropColumn('ai_transcript')
    t.dropColumn('ai_summary')
  })
}
