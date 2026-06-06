<template>
  <div class="real-exam-result" v-if="detail">
    <!-- 成绩总览 -->
    <div class="score-hero">
      <div class="score-circle" :style="{ borderColor: scoreColor }">
        <span class="score-num" :style="{ color: scoreColor }">{{ detail.record.score }}</span>
        <span class="score-label">分</span>
      </div>
      <div class="score-info">
        <h1>{{ gradeLabel }}</h1>
        <p>正确 {{ detail.record.correct_count }} / {{ detail.record.total_questions }} 题 · 用时 {{ formatTime(detail.record.duration) }}</p>
      </div>
    </div>

    <!-- 左右分栏 -->
    <div class="result-layout">
      <!-- 左侧：统计表 -->
      <div class="result-left">
        <TcmCard title="科目成绩统计">
          <table class="stats-table">
            <thead><tr><th>科目</th><th>总题数</th><th>错题数</th><th>正确率</th></tr></thead>
            <tbody>
              <tr v-for="(v, k) in detail.stats.bySubject" :key="k">
                <td class="subj-name">{{ subjectNames[k] || k }}</td>
                <td>{{ (v as any).total }}</td>
                <td class="wrong-cell">{{ (v as any).wrong }}</td>
                <td :style="{ color: rateColor((v as any).correct/(v as any).total) }">{{ ((v as any).correct/(v as any).total*100).toFixed(0) }}%</td>
              </tr>
            </tbody>
          </table>
        </TcmCard>

        <TcmCard title="章节失分分析" class="mt-16">
          <div v-for="(v, k) in detail.stats.byChapter" :key="k" class="chapter-group" v-show="(v as any).total > 0">
            <div class="chapter-header-row" @click="toggleChapter(k)">
              <span class="chap-expand">{{ expandedChapters.has(k) ? '▾' : '▸' }}</span>
              <span class="chap-name">{{ v.chapterTitle || k }}</span>
              <span class="chap-wrong">{{ (v as any).wrong }}错/{{ (v as any).total }}题</span>
              <TcmProgress :percent="((v as any).total - (v as any).wrong)/(v as any).total*100" :show-label="false" color="var(--tcm-primary-500)" />
            </div>
            <div v-if="expandedChapters.has(k)" class="chapter-questions">
              <div v-for="(a, idx) in getChapterQuestions(k)" :key="a.questionId" class="chap-q-item">
                <span :class="['chap-q-dot', a.isCorrect ? 'dot-ok' : 'dot-err']">{{ a.isCorrect ? '✓' : '✗' }}</span>
                <span class="chap-q-num">第{{ idx + 1 }}题</span>
                <span class="chap-q-stem">{{ getQuestionBrief(a.questionId) }}</span>
                <span v-if="!a.isCorrect" class="chap-q-answer">你的:{{ a.userAnswer || '未答' }} 正确:{{ getCorrectAnswerForQ(a.questionId) }}</span>
              </div>
            </div>
          </div>
        </TcmCard>
      </div>

      <!-- 右侧：Tab切换 -->
      <div class="result-right">
        <div class="tab-bar">
          <button v-for="t in tabs" :key="t.key" :class="['tab-btn', { active: activeTab === t.key }]" @click="activeTab = t.key">{{ t.label }}</button>
        </div>

        <!-- 雷达图 -->
        <TcmCard v-if="activeTab === 'radar'" title="薄弱点雷达图">
          <div class="radar-container">
            <div v-for="(v, k) in detail.stats.bySubject" :key="k" class="radar-bar">
              <span class="radar-label">{{ subjectNames[k] || k }}</span>
              <div class="radar-track"><div class="radar-fill" :style="{ width: ((v as any).correct/(v as any).total*100)+'%', background: rateColor((v as any).correct/(v as any).total) }"></div></div>
              <span class="radar-pct">{{ ((v as any).correct/(v as any).total*100).toFixed(0) }}%</span>
            </div>
          </div>
        </TcmCard>

        <!-- 逐题复盘 -->
        <TcmCard v-if="activeTab === 'review'" title="逐题复盘">
          <div v-for="(a, idx) in detail.answers" :key="a.questionId" class="review-item">
            <div class="review-header" @click="toggleReview(idx)">
              <span :class="['review-dot', a.isCorrect ? 'dot-correct' : 'dot-wrong']"></span>
              <span class="review-num">第{{ idx+1 }}题</span>
              <span class="review-badge">{{ getQuestionType(idx) }}</span>
              <span v-if="!a.isCorrect" class="review-answer">你的:{{ a.userAnswer }} 正确:{{ getCorrectAnswer(idx) }}</span>
              <span v-else class="review-correct-mark">✓</span>
              <span class="review-expand">{{ expandedReviews.has(idx) ? '▾' : '▸' }}</span>
            </div>
            <div v-if="expandedReviews.has(idx)" class="review-detail">
              <div class="review-stem" v-html="renderMd(getQuestionStem(idx))"></div>
              <div class="review-options">
                <div v-for="opt in getQuestionOptions(idx)" :key="opt.key"
                  :class="['review-opt', {
                    'opt-correct': opt.key === getCorrectAnswer(idx),
                    'opt-user-wrong': opt.key === a.userAnswer && opt.key !== getCorrectAnswer(idx)
                  }]">
                  <strong>{{ opt.key }}.</strong> {{ opt.text }}
                </div>
              </div>
              <div class="review-explanation">
                <strong>解析：</strong>{{ getExplanation(idx) }}
              </div>
              <div class="review-meta">
                <span>科目: {{ subjectNames[getSubjectId(idx)] || getSubjectId(idx) }}</span>
                <span>难度: {{ '★'.repeat(Number(getDifficulty(idx))) }}</span>
              </div>
            </div>
          </div>
        </TcmCard>

        <!-- 历次趋势 -->
        <TcmCard v-if="activeTab === 'trend'" title="历次模考趋势">
          <div v-if="trendData.length > 0" class="trend-list">
            <div v-for="t in trendData" :key="t.id" class="trend-item" @click="viewRecord(t.id)">
              <span class="trend-date">{{ formatDate(t.date) }}</span>
              <span class="trend-score" :style="{ color: rateColor(t.score/100) }">{{ t.score }}分</span>
              <span>{{ t.correctCount }}/{{ t.totalQuestions }}</span>
              <span class="trend-arrow">→</span>
            </div>
          </div>
          <TcmEmpty v-else description="暂无历史记录" />
        </TcmCard>
      </div>
    </div>

    <div class="result-actions">
      <TcmButton variant="primary" @click="$router.push({ name: 'real-exam-entry' })">返回模考</TcmButton>
      <TcmButton variant="secondary" @click="handlePrint">打印成绩单</TcmButton>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MarkdownIt from 'markdown-it'
import { apiGet } from '@/utils/api-client'
import TcmCard from '@/components/ui/TcmCard.vue'
import TcmButton from '@/components/ui/TcmButton.vue'
import TcmProgress from '@/components/ui/TcmProgress.vue'
import TcmEmpty from '@/components/ui/TcmEmpty.vue'

const route = useRoute()
const router = useRouter()
const examId = (route.params.examId as string) || ''
const detail = ref<any>(null)
const trendData = ref<any[]>([])
const activeTab = ref('radar')
const expandedReviews = reactive(new Set<number>())
const expandedChapters = reactive(new Set<string>())
const tabs = [
  { key: 'radar', label: '薄弱点' },
  { key: 'review', label: '逐题复盘' },
  { key: 'trend', label: '历史趋势' },
]
const md = new MarkdownIt({ html: false, breaks: true })
const renderMd = (s: string) => md.render(s || '')

const subjectNames: Record<string, string> = {
  zhongji: '中基', zhenjuan: '中诊', zhongyao: '中药', fangji: '方剂', zhenjiu: '针灸',
  zhongnei: '中内', zhongwai: '中外', zhongfu: '中妇', zhonger: '中儿',
  neike: '西医内科', zhenduan: '诊基', chuanran: '传染病', lunli: '伦理', fagui: '法规',
}

const scoreColor = computed(() => {
  const s = detail.value?.record?.score || 0
  return s >= 80 ? 'var(--tcm-jade-500)' : s >= 60 ? 'var(--tcm-gold-500)' : 'var(--tcm-error)'
})
const gradeLabel = computed(() => {
  const s = detail.value?.record?.score || 0
  return s >= 90 ? '优秀' : s >= 80 ? '良好' : s >= 70 ? '一般' : s >= 60 ? '及格' : '不及格'
})

function rateColor(r: number): string { return r >= 0.8 ? '#2E5E4E' : r >= 0.6 ? '#D4A030' : '#C0392B' }
function formatTime(s: number): string { const m = Math.floor(s/60); const sec = s%60; return m+'分'+sec+'秒' }
function formatDate(ts: number): string { return new Date(ts).toLocaleDateString('zh-CN') }
function toggleReview(i: number): void { expandedReviews.has(i) ? expandedReviews.delete(i) : expandedReviews.add(i) }
function toggleChapter(k: string): void { expandedChapters.has(k) ? expandedChapters.delete(k) : expandedChapters.add(k) }
function getChapterQuestions(chapterId: string): any[] {
  return (detail.value?.answers || []).filter((a: any) => {
    const q = (detail.value?.questions || []).find((q: any) => q.id === a.questionId)
    return q && q.chapterId === chapterId
  })
}
function getQuestionBrief(qid: string): string {
  const q = (detail.value?.questions || []).find((q: any) => q.id === qid)
  return q ? q.questionStem?.substring(0, 40) + (q.questionStem?.length > 40 ? '...' : '') : ''
}
function getCorrectAnswerForQ(qid: string): string {
  const q = (detail.value?.questions || []).find((q: any) => q.id === qid)
  return q?.correctAnswer || ''
}
function handlePrint(): void { window.print() }

function getQ(idx: number): any { return detail.value?.questions?.find((q: any) => q.id === detail.value.answers[idx].questionId) }
function getQuestionType(idx: number): string { return getQ(idx)?.question_type || '' }
function getCorrectAnswer(idx: number): string { return getQ(idx)?.correct_answer || '' }
function getQuestionStem(idx: number): string { return getQ(idx)?.question_stem || '' }
function getQuestionOptions(idx: number): any[] { return getQ(idx)?.options_json ? JSON.parse(getQ(idx).options_json) : getQ(idx)?.options || [] }
function getExplanation(idx: number): string { return getQ(idx)?.explanation || '' }
function getSubjectId(idx: number): string { return getQ(idx)?.subject_id || '' }
function getDifficulty(idx: number): number { return getQ(idx)?.difficulty || 1 }

function viewRecord(id: string): void { router.push({ name: 'real-exam-result', params: { examId: id } }) }

onMounted(async () => {
  try {
    detail.value = await apiGet<any>(`/api/real-exam/records/${examId}`)
    trendData.value = await apiGet<any[]>('/api/real-exam/trend')
  } catch { detail.value = null }
})
</script>

<style scoped>
.real-exam-result { max-width: 1400px; }
.score-hero { display: flex; align-items: center; gap: 24px; padding: 32px; background: var(--tcm-bg-surface); border-radius: var(--tcm-radius-lg); margin-bottom: 24px; border: 1px solid var(--tcm-border-light); }
.score-circle { width: 100px; height: 100px; border-radius: 50%; border: 4px solid; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.score-num { font-size: 36px; font-weight: 700; line-height: 1; }
.score-label { font-size: 14px; color: var(--tcm-text-secondary); }
.score-info h1 { font-family: var(--tcm-font-decorative); font-size: var(--tcm-font-2xl); margin: 0; }
.score-info p { color: var(--tcm-text-secondary); margin: 4px 0 0; }
.result-layout { display: flex; gap: 24px; align-items: flex-start; }
.result-left { width: 480px; flex-shrink: 0; }
.result-right { flex: 1; min-width: 0; }
@media (max-width: 1000px) { .result-layout { flex-direction: column; } .result-left { width: 100%; } }
.stats-table { width: 100%; border-collapse: collapse; font-size: var(--tcm-font-sm); }
.stats-table th { background: var(--tcm-bg-base); padding: 8px 10px; text-align: left; font-weight: 600; }
.stats-table td { padding: 8px 10px; border-bottom: 1px solid var(--tcm-border-light); }
.subj-name { font-weight: 500; }
.wrong-cell { color: var(--tcm-error); font-weight: 600; }
.mt-16 { margin-top: 16px; }
.chapter-group { border-bottom: 1px solid var(--tcm-border-light); }
.chapter-header-row { display: flex; align-items: center; gap: 8px; padding: 10px 0; cursor: pointer; }
.chapter-header-row:hover { background: var(--tcm-bg-base); }
.chap-expand { width: 16px; font-size: 12px; color: var(--tcm-text-disabled); }
.chap-name { font-size: var(--tcm-font-sm); font-weight: 500; min-width: 100px; flex: 1; }
.chap-wrong { font-size: var(--tcm-font-xs); color: var(--tcm-error); min-width: 70px; }
.chapter-questions { padding: 0 0 8px 20px; }
.chap-q-item { display: flex; align-items: center; gap: 8px; padding: 4px 0; font-size: var(--tcm-font-xs); border-bottom: 1px dashed var(--tcm-border-light); }
.chap-q-dot { width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; border-radius: 50%; font-size: 10px; flex-shrink: 0; }
.dot-ok { background: #E8F5E9; color: var(--tcm-jade-500); }
.dot-err { background: #FFEBEE; color: var(--tcm-error); }
.chap-q-num { color: var(--tcm-text-disabled); min-width: 40px; }
.chap-q-stem { flex: 1; color: var(--tcm-text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.chap-q-answer { color: var(--tcm-error); white-space: nowrap; font-size: 11px; }
.tab-bar { display: flex; gap: 4px; margin-bottom: 16px; }
.tab-btn { padding: 8px 18px; border: 1px solid var(--tcm-border); border-radius: var(--tcm-radius-sm); background: var(--tcm-bg-surface); cursor: pointer; font-family: inherit; font-size: var(--tcm-font-sm); }
.tab-btn.active { background: var(--tcm-primary-500); color: #fff; border-color: var(--tcm-primary-500); }
.radar-bar { display: flex; align-items: center; gap: 10px; padding: 6px 0; }
.radar-label { width: 70px; font-size: var(--tcm-font-sm); }
.radar-track { flex: 1; height: 10px; background: var(--tcm-bg-base); border-radius: 5px; overflow: hidden; }
.radar-fill { height: 100%; border-radius: 5px; min-width: 2px; }
.radar-pct { width: 36px; font-size: var(--tcm-font-xs); font-weight: 600; text-align: right; }
.review-item { border-bottom: 1px solid var(--tcm-border-light); }
.review-header { display: flex; align-items: center; gap: 10px; padding: 10px 0; cursor: pointer; font-size: var(--tcm-font-sm); }
.review-dot { width: 8px; height: 8px; border-radius: 50%; }
.dot-correct { background: var(--tcm-jade-500); }
.dot-wrong { background: var(--tcm-error); }
.review-badge { font-size: 11px; padding: 1px 6px; background: var(--tcm-bg-base); border-radius: 3px; }
.review-answer { color: var(--tcm-error); font-size: var(--tcm-font-xs); }
.review-correct-mark { color: var(--tcm-jade-500); }
.review-expand { margin-left: auto; color: var(--tcm-text-disabled); }
.review-detail { padding: 0 0 16px 18px; }
.review-stem { font-size: var(--tcm-font-sm); line-height: 1.7; margin-bottom: 10px; }
.review-options { display: flex; flex-direction: column; gap: 4px; margin-bottom: 10px; }
.review-opt { font-size: var(--tcm-font-sm); padding: 4px 8px; border-radius: var(--tcm-radius-sm); }
.opt-correct { background: #E8F5E9; }
.opt-user-wrong { background: #FFEBEE; }
.review-explanation { font-size: var(--tcm-font-xs); color: var(--tcm-text-secondary); line-height: 1.6; margin-bottom: 6px; }
.review-meta { display: flex; gap: 16px; font-size: 11px; color: var(--tcm-text-disabled); }
.trend-list { display: flex; flex-direction: column; gap: 6px; }
.trend-item { display: flex; align-items: center; gap: 16px; padding: 10px 14px; background: var(--tcm-bg-base); border-radius: var(--tcm-radius-sm); cursor: pointer; }
.trend-item:hover { background: var(--tcm-bg-surface); }
.trend-date { font-size: var(--tcm-font-sm); min-width: 90px; }
.trend-score { font-weight: 700; }
.trend-arrow { margin-left: auto; color: var(--tcm-text-disabled); }
.result-actions { display: flex; gap: 12px; justify-content: center; margin-top: 32px; padding: 20px 0; }
</style>
