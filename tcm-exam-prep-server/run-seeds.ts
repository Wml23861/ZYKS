import knexModule from 'knex'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function main() {
  const db = knexModule.default({
    client: 'better-sqlite3',
    connection: { filename: path.resolve(__dirname, 'data/tcm-exam.db') },
    useNullAsDefault: true,
  })

  // 清理所有表（按外键依赖顺序）
  const tables = [
    'video_annotations', 'videos', 'notes', 'wrong_question_records',
    'review_schedules', 'study_records', 'exam_records', 'app_settings',
    'past_exam_questions', 'past_exams',
    'flashcards', 'questions', 'knowledge_points', 'sections',
    'chapters', 'subjects',
  ]
  for (const t of tables) {
    await db(t).del()
  }

  // 运行种子
  const { seed: seed1 } = await import('./seeds/001_subjects_structure.ts')
  const { seed: seed2 } = await import('./seeds/002_sections_seed.ts')
  const { seed: seed2b } = await import('./seeds/002b_knowledge_points_seed.ts')
  const { seed: seed3 } = await import('./seeds/003_questions_seed.ts')
  const { seed: seed4 } = await import('./seeds/004_flashcards_seed.ts')
  const { seed: seed5 } = await import('./seeds/005_questions_expanded_seed.ts')
  const { seed: seed6 } = await import('./seeds/006_flashcards_expanded_seed.ts')
  const { seed: seed7 } = await import('./seeds/006_questions_massive_seed.ts')
  const { seed: seed8 } = await import('./seeds/007_sections_expanded_seed.ts')
  const { seed: seed9 } = await import('./seeds/008_questions_continuation.ts')
  const { seed: seed10 } = await import('./seeds/009_yixue_content_seed.ts')
  const { seed: seed11 } = await import('./seeds/010_yixue_questions_seed.ts')
  const { seed: seed12 } = await import('./seeds/013_massive_content_seed.ts')
  const { seed: seed13 } = await import('./seeds/015_massive_questions_seed.ts')
  const { seed: seed14 } = await import('./seeds/016_massive_flashcards_seed.ts')
  const { seed: seed15 } = await import('./seeds/020_massive_knowledge_points.ts')
  const { seed: seed16 } = await import('./seeds/021_sections_expansion.ts')
  const { seed: seed17 } = await import('./seeds/022_massive_questions.ts')
  const { seed: seed18 } = await import('./seeds/024_massive_flashcards.ts')
  const { seed: seed19 } = await import('./seeds/023_more_questions.ts')
  const { seed: seed20 } = await import('./seeds/030_a3_a4_b1_questions.ts')
  const { seed: seed25 } = await import('./seeds/040_past_exam_unit1.ts')
  const { seed: seed26 } = await import('./seeds/041_past_exam_unit2.ts')
  const { seed: seed27 } = await import('./seeds/042_past_exam_unit3.ts')
  const { seed: seed28 } = await import('./seeds/043_past_exam_unit4.ts')
  const { seed: seed29 } = await import('./seeds/050_past_exam_metadata.ts')

  await seed1(db)
  await seed2(db)
  await seed2b(db)
  await seed3(db)
  await seed4(db)
  await seed5(db)
  await seed6(db)
  await seed7(db)
  await seed8(db)
  await seed9(db)
  await seed10(db)
  await seed11(db)
  await seed12(db)
  await seed13(db)
  await seed14(db)
  await seed15(db)
  await seed16(db)
  await seed17(db)
  await seed18(db)
  await seed19(db)
  await seed20(db)
  await seed25(db)
  await seed26(db)
  await seed27(db)
  await seed28(db)
  await seed29(db)

  // 验证
  const sub = await db('subjects').count('* as c').first() as { c: number }
  const ch = await db('chapters').count('* as c').first() as { c: number }
  const sec = await db('sections').count('* as c').first() as { c: number }
  const kp = await db('knowledge_points').count('* as c').first() as { c: number }
  const q = await db('questions').count('* as c').first() as { c: number }
  const fc = await db('flashcards').count('* as c').first() as { c: number }

  console.log('\n=== 数据导入完成 ===')
  console.log(`科目: ${sub.c}`)
  console.log(`章节: ${ch.c}`)
  console.log(`小节: ${sec.c}`)
  console.log(`知识点: ${kp.c}`)
  console.log(`题目: ${q.c}`)
  console.log(`记忆卡片: ${fc.c}`)

  await db.destroy()
  process.exit(0)
}

main()
