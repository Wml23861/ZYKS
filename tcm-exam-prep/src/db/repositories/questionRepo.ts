import { apiGet, apiPost, apiPut, apiDelete } from '@/utils/api-client'
import type { Question, QuestionFilter, WrongQuestionRecord } from '@/types'

export const questionRepo = {
  async findAll(): Promise<Question[]> {
    return apiGet<Question[]>('/api/questions', { limit: '1000' })
  },

  async countAll(): Promise<number> {
    try {
      const res = await apiGet<{ count: number }>('/api/questions/count')
      return res.count
    } catch { return 0 }
  },

  async findById(id: string): Promise<Question | undefined> {
    try { return await apiGet<Question>(`/api/questions/${id}`) } catch { return undefined }
  },

  async findByFilter(filter: QuestionFilter): Promise<Question[]> {
    const params: Record<string, string> = {}
    if (filter.subjectId) params.subjectId = filter.subjectId
    if (filter.chapterId) params.chapterId = filter.chapterId
    if (filter.sectionId) params.sectionId = filter.sectionId
    if (filter.type) params.type = filter.type
    if (filter.difficulty) params.difficulty = String(filter.difficulty)
    if (filter.questionIds?.length) params.questionIds = filter.questionIds.join(',')
    return apiGet<Question[]>('/api/questions', { ...params, limit: '1000' })
  },

  async countBySubject(subjectId: string): Promise<number> {
    const questions = await apiGet<Question[]>('/api/questions', { subjectId, limit: '1000' })
    return questions.length
  },

  // 错题本操作
  async getWrongQuestions(): Promise<WrongQuestionRecord[]> {
    return apiGet<WrongQuestionRecord[]>('/api/wrong-questions')
  },

  async getWrongQuestion(questionId: string): Promise<WrongQuestionRecord | undefined> {
    try { return await apiGet<WrongQuestionRecord>(`/api/wrong-questions/${questionId}`) } catch { return undefined }
  },

  async addWrongQuestion(record: WrongQuestionRecord): Promise<void> {
    await apiPost('/api/wrong-questions', record)
  },

  async removeWrongQuestion(id: string): Promise<void> {
    await apiDelete(`/api/wrong-questions/${id}`)
  },

  async markMastered(id: string): Promise<void> {
    await apiPut(`/api/wrong-questions/${id}`, { isMastered: true })
  },

  async getUnmasteredWrongQuestions(subjectId?: string): Promise<WrongQuestionRecord[]> {
    return apiGet<WrongQuestionRecord[]>('/api/wrong-questions', {
      mastered: 'false',
      ...(subjectId ? { subjectId } : {}),
    })
  },
}
