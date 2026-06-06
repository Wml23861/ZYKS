/** 题目相关类型定义 */

export type QuestionType = 'A1' | 'A2' | 'B1' | 'A3' | 'A4'

export type QuestionDifficulty = 1 | 2 | 3 | 4 | 5

export interface Option {
  /** 选项标识 (A/B/C/D/E) */
  key: string
  /** 选项文本内容 */
  text: string
}

export interface Question {
  /** 唯一标识 */
  id: string
  /** 题目类型 */
  type: QuestionType
  /**
   * B1 型题的特殊字段：
   * - 对于 B1 题组的"根题目"：isGroupRoot = true，sharedOptions 存放 5 个共享选项
   * - 对于 B1 题组的"子题目"：groupId 指向根题目的 id
   * - 对于 A1/A2：两个字段均为 null
   */
  isGroupRoot: boolean
  groupId: string | null
  /** 所属科目 */
  subjectId: string
  /** 所属章节 */
  chapterId: string
  /** 所属节 */
  sectionId: string
  /** 关联知识点 */
  knowledgePointIds: string[]
  /** 难度 (1-5) */
  difficulty: QuestionDifficulty
  /** 出现过的考试年份 */
  examYears: number[]
  /** 题干 (支持 Markdown) */
  questionStem: string
  /** 5 个选项 (A1/A2/B1子题用这个) */
  options: Option[]
  /** B1 题组共享的 5 个选项 (仅 B1 根题目使用) */
  sharedOptions: Option[] | null
  /** 正确答案 (选项 key，如 'A') */
  correctAnswer: string
  /** 题目解析 (支持 Markdown) */
  explanation: string
  /** 标签 */
  tags: string[]
  /** 在题组中的排序 (B1 子题使用) */
  orderInGroup: number
}

export interface QuestionFilter {
  subjectId?: string
  chapterId?: string
  sectionId?: string
  type?: QuestionType
  difficulty?: QuestionDifficulty
  tags?: string[]
  /** 仅错题 */
  wrongOnly?: boolean
  /** 仅未做过 */
  unansweredOnly?: boolean
  /** 包含的题目 ID */
  questionIds?: string[]
}
