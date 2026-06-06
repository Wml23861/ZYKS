import { Router } from 'express'
import { authRoutes } from './auth.routes.js'
import { subjectRoutes } from './subject.routes.js'
import { knowledgeRoutes } from './knowledge.routes.js'
import { questionRoutes } from './question.routes.js'
import { flashcardRoutes } from './flashcard.routes.js'
import { studyRoutes } from './study.routes.js'
import { examRoutes } from './exam.routes.js'
import { wrongQuestionRoutes } from './wrong-question.routes.js'
import { noteRoutes } from './note.routes.js'
import { pastExamRoutes } from './past-exam.routes.js'
import { videoRoutes } from './video.routes.js'
import { settingsRoutes } from './settings.routes.js'
import { aiRoutes } from './ai.routes.js'
import { realExamRoutes } from './real-exam.routes.js'
import { aiConversationRoutes } from './ai-conversation.routes.js'

const router = Router()

// 认证路由
router.use('/auth', authRoutes)

// 参考数据（公开）
router.use('/subjects', subjectRoutes)
router.use('/', knowledgeRoutes) // /api/chapters, /api/sections, /api/knowledge-points
router.use('/questions', questionRoutes)
router.use('/flashcards', flashcardRoutes)

// 用户数据（需登录）
router.use('/', studyRoutes)       // /api/study-records, /api/review-schedules
router.use('/', examRoutes)        // /api/exam-records
router.use('/', pastExamRoutes)   // /api/past-exams
router.use('/', wrongQuestionRoutes) // /api/wrong-questions
router.use('/real-exam', realExamRoutes)
router.use('/', noteRoutes)        // /api/notes
router.use('/', videoRoutes)       // /api/videos
router.use('/', settingsRoutes)    // /api/settings
router.use('/ai', aiRoutes)        // /api/ai/chat
router.use('/', aiConversationRoutes) // /api/ai/conversations

export { router as routes }
