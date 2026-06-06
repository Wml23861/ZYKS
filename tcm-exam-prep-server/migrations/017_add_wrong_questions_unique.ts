import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  // 先清理重复数据：每个 (user_id, question_id) 只保留 last_wrong_at 最新的那条
  const duplicates = await knex('wrong_question_records')
    .select('user_id', 'question_id')
    .groupBy('user_id', 'question_id')
    .havingRaw('COUNT(*) > 1')

  for (const dup of duplicates) {
    // 找到这条题目最新记录的 id
    const [latest] = await knex('wrong_question_records')
      .select('id')
      .where({ user_id: dup.user_id, question_id: dup.question_id })
      .orderBy('last_wrong_at', 'desc')
      .limit(1)

    if (latest) {
      // 删除该题目的其他旧记录
      await knex('wrong_question_records')
        .where({ user_id: dup.user_id, question_id: dup.question_id })
        .whereNot({ id: latest.id })
        .del()
    }
  }

  // 添加唯一约束防止新重复（幂等：已存在则跳过）
  try {
    await knex.schema.alterTable('wrong_question_records', (t) => {
      t.unique(['user_id', 'question_id'])
    })
  } catch {
    // 唯一约束已存在，跳过
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('wrong_question_records', (t) => {
    t.dropUnique(['user_id', 'question_id'])
  })
}
