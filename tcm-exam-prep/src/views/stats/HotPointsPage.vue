<template>
  <div class="page-hotpoints">
    <div class="page-header">
      <div>
        <h1 class="page-title">考点预测</h1>
        <p class="page-subtitle">
          基于历年真题分析，筛选高频考点与预测考点，助你精准复习
        </p>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="filter-bar">
      <div class="filter-group">
        <label class="filter-label">科目筛选</label>
        <select v-model="filterSubjectId" class="filter-select">
          <option value="">全部科目</option>
          <option
            v-for="subject in subjectsWithPoints"
            :key="subject.id"
            :value="subject.id"
          >
            {{ subject.name }} ({{ subject.pointCount }})
          </option>
        </select>
      </div>
      <div class="filter-group">
        <label class="filter-label">搜索知识点</label>
        <input
          v-model="searchQuery"
          type="text"
          class="filter-input"
          placeholder="输入知识点关键词..."
        />
      </div>
    </div>

    <!-- Stats Summary -->
    <div class="stats-summary">
      <div class="summary-item">
        <span class="summary-num">{{ hotPoints.length }}</span>
        <span class="summary-label">考点总数</span>
      </div>
      <div class="summary-item">
        <span class="summary-num summary-predicted">{{ predictedCount }}</span>
        <span class="summary-label">预测考点</span>
      </div>
      <div class="summary-item">
        <span class="summary-num summary-high">{{ highFreqCount }}</span>
        <span class="summary-label">高频考点(4-5星)</span>
      </div>
    </div>

    <!-- Grouped by Subject -->
    <div
      v-for="group in groupedPoints"
      :key="group.subjectId"
      class="subject-group"
    >
      <div class="group-header">
        <div class="group-title-row">
          <span class="group-dot" :style="{ background: group.color }" />
          <h2 class="group-name">{{ group.subjectName }}</h2>
          <TcmTag type="key" size="sm">{{ group.points.length }} 个考点</TcmTag>
        </div>
        <router-link
          :to="`/subjects/${group.subjectId}`"
          class="group-link"
        >
          进入科目 &#x2192;
        </router-link>
      </div>

      <div class="points-grid">
        <div
          v-for="point in group.points"
          :key="point.id"
          class="point-card"
          :class="{ 'point-card--predicted': point.isPredicted }"
          @click="goToChapter(point)"
        >
          <div class="point-header">
            <div class="point-title">{{ point.title }}</div>
            <div class="point-badges">
              <!-- Frequency stars -->
              <span v-if="point.frequencyLevel >= 1" class="freq-badge" :title="`考频: ${point.frequencyLevel}/5 星`">
                <span
                  v-for="i in 5"
                  :key="i"
                  class="freq-star"
                  :class="{ 'freq-star--active': i <= point.frequencyLevel }"
                >&#x2605;</span>
              </span>
              <!-- Predicted badge -->
              <span v-if="point.isPredicted" class="predicted-badge">
                &#x1F4CC; 预测
              </span>
              <!-- Difficulty badge -->
              <TcmTag
                :type="point.isDifficultPoint ? 'difficult' : 'key'"
                size="sm"
              >
                {{ getDifficultyLabel(point.difficulty) }}
              </TcmTag>
            </div>
          </div>

          <div v-if="point.content" class="point-preview">
            {{ getContentPreview(point.content) }}
          </div>

          <div class="point-meta">
            <span class="point-tags">
              <TcmTag
                v-for="tag in point.tags"
                :key="tag.type"
                :type="tag.type === 'high-frequency' ? 'high-frequency' : tag.type === 'key' ? 'key' : 'default'"
                size="sm"
              >
                {{ tag.label }}
              </TcmTag>
            </span>
            <span class="point-navigate">学习此考点 &#x2192;</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <TcmEmpty
      v-if="groupedPoints.length === 0 && searchQuery && hotPoints.length > 0"
      description="没有匹配的知识点，请尝试其他搜索词"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSubjectStore } from '@/stores/useSubjectStore'
import { subjectRepo } from '@/db/repositories/subjectRepo'
import type { KnowledgePoint, Subject, Chapter } from '@/types'
import TcmTag from '@/components/ui/TcmTag.vue'
import TcmEmpty from '@/components/ui/TcmEmpty.vue'

interface PointItem extends KnowledgePoint {
  chapterName?: string
}

interface SubjectGroup {
  subjectId: string
  subjectName: string
  color: string
  points: PointItem[]
}

interface SubjectSummary {
  id: string
  name: string
  pointCount: number
}

const router = useRouter()
const subjectStore = useSubjectStore()
const filterSubjectId = ref('')
const searchQuery = ref('')
const allKnowledgePoints = ref<KnowledgePoint[]>([])
const allChapters = ref<Chapter[]>([])
const isLoading = ref(true)

const allSubjects = computed<Subject[]>(() => subjectStore.subjects)

// Get all hot points (frequencyLevel >= 3 or isPredicted === true)
const hotPoints = computed<PointItem[]>(() => {
  const allPoints: KnowledgePoint[] = allKnowledgePoints.value
  const chapters = allChapters.value

  const filtered = allPoints.filter(
    (kp) => kp.frequencyLevel >= 3 || kp.isPredicted === true
  )

  return filtered.map((kp) => {
    const chapter = chapters.find((c) => c.id === kp.chapterId)
    return {
      ...kp,
      chapterName: chapter?.title ?? '',
    }
  }).sort((a, b) => {
    // Sort: predicted first, then by frequencyLevel desc
    if (a.isPredicted !== b.isPredicted) return a.isPredicted ? -1 : 1
    return b.frequencyLevel - a.frequencyLevel
  }) as PointItem[]
})

const predictedCount = computed(() => hotPoints.value.filter((p) => p.isPredicted).length)
const highFreqCount = computed(() => hotPoints.value.filter((p) => p.frequencyLevel >= 4).length)

// Subjects that have hot points
const subjectsWithPoints = computed<SubjectSummary[]>(() => {
  const map = new Map<string, number>()
  for (const p of hotPoints.value) {
    map.set(p.subjectId, (map.get(p.subjectId) ?? 0) + 1)
  }
  return Array.from(map.entries())
    .map(([id, count]) => {
      const s = allSubjects.value.find((sub) => sub.id === id)
      return {
        id,
        name: s?.shortName ?? id,
        pointCount: count,
      }
    })
    .sort((a, b) => b.pointCount - a.pointCount)
})

// Group and filter points
const groupedPoints = computed<SubjectGroup[]>(() => {
  let points = hotPoints.value

  // Filter by subject
  if (filterSubjectId.value) {
    points = points.filter((p) => p.subjectId === filterSubjectId.value)
  }

  // Filter by search query
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    points = points.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        (p.content && p.content.toLowerCase().includes(q)),
    )
  }

  // Group by subject
  const groups = new Map<string, PointItem[]>()
  for (const p of points) {
    const list = groups.get(p.subjectId) ?? []
    list.push(p)
    groups.set(p.subjectId, list)
  }

  return Array.from(groups.entries())
    .map(([subjectId, pts]) => {
      const subject = allSubjects.value.find((s) => s.id === subjectId)
      return {
        subjectId,
        subjectName: subject?.name ?? subjectId,
        color: subject?.color ?? '#C0392B',
        points: pts,
      }
    })
    .sort((a, b) => b.points.length - a.points.length)
})

function getContentPreview(content: string): string {
  const clean = content.replace(/[#*`_~\[\]]/g, '').trim()
  return clean.length > 120 ? clean.slice(0, 120) + '...' : clean
}

function getDifficultyLabel(level: string): string {
  switch (level) {
    case 'basic': return '基础'
    case 'intermediate': return '中等'
    case 'advanced': return '较难'
    default: return level
  }
}

function goToChapter(point: PointItem): void {
  if (point.subjectId && point.chapterId) {
    router.push(`/subjects/${point.subjectId}/chapters/${point.chapterId}`)
  }
}

onMounted(async () => {
  try {
    if (subjectStore.subjects.length === 0) {
      await subjectStore.loadSubjects()
    }
    const points = await subjectRepo.getAllKnowledgePoints()
    allKnowledgePoints.value = points
    // Collect chapters from all subjects
    const allCh: Chapter[] = []
    for (const subj of subjectStore.subjects) {
      try {
        const chapters = await subjectRepo.getChapters(subj.id)
        allCh.push(...chapters)
      } catch { /* ignore */ }
    }
    allChapters.value = allCh
  } finally {
    isLoading.value = false
  }
})
</script>

<style scoped>
.page-hotpoints { /* 宽度动态填充 */ }

.page-header { margin-bottom: 24px; }
.page-title {
  font-family: var(--tcm-font-decorative);
  font-size: var(--tcm-font-2xl);
  color: var(--tcm-text-primary);
  margin-bottom: 4px;
}
.page-subtitle {
  font-size: var(--tcm-font-sm);
  color: var(--tcm-text-secondary);
}

/* Filter Bar */
.filter-bar {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  padding: 14px 18px;
  background: var(--tcm-bg-surface);
  border: 1px solid var(--tcm-border-light);
  border-radius: var(--tcm-radius-md);
  flex-wrap: wrap;
}
.filter-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.filter-label {
  font-size: var(--tcm-font-xs);
  font-weight: 600;
  color: var(--tcm-text-secondary);
}
.filter-select {
  padding: 6px 12px;
  border: 1px solid var(--tcm-border);
  border-radius: var(--tcm-radius-sm);
  font-size: var(--tcm-font-sm);
  font-family: var(--tcm-font-family);
  background: var(--tcm-bg-base);
  color: var(--tcm-text-primary);
  min-width: 160px;
  cursor: pointer;
}
.filter-input {
  padding: 6px 12px;
  border: 1px solid var(--tcm-border);
  border-radius: var(--tcm-radius-sm);
  font-size: var(--tcm-font-sm);
  font-family: var(--tcm-font-family);
  background: var(--tcm-bg-base);
  color: var(--tcm-text-primary);
  min-width: 200px;
  outline: none;
  transition: border-color var(--tcm-transition-fast);
}
.filter-input:focus { border-color: var(--tcm-primary-300); }
.filter-input::placeholder { color: var(--tcm-text-disabled); }

/* Stats */
.stats-summary { display: flex; gap: 12px; margin-bottom: 28px; }
.summary-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 16px 12px;
  background: var(--tcm-bg-surface);
  border: 1px solid var(--tcm-border-light);
  border-radius: var(--tcm-radius-md);
}
.summary-num {
  font-size: var(--tcm-font-2xl);
  font-weight: 700;
  color: var(--tcm-primary-500);
  font-family: var(--tcm-font-decorative);
}
.summary-predicted { color: var(--tcm-gold-500); }
.summary-high { color: var(--tcm-error); }
.summary-label { font-size: var(--tcm-font-xs); color: var(--tcm-text-secondary); }

/* Subject Group */
.subject-group { margin-bottom: 28px; }
.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}
.group-title-row { display: flex; align-items: center; gap: 10px; }
.group-dot {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  flex-shrink: 0;
}
.group-name {
  font-family: var(--tcm-font-decorative);
  font-size: var(--tcm-font-lg);
  color: var(--tcm-text-primary);
}
.group-link {
  font-size: var(--tcm-font-sm);
  color: var(--tcm-primary-500);
  text-decoration: none;
}
.group-link:hover { text-decoration: underline; }

/* Points Grid */
.points-grid { display: flex; flex-direction: column; gap: 12px; }

.point-card {
  padding: 18px 20px;
  background: var(--tcm-bg-surface);
  border: 1px solid var(--tcm-border-light);
  border-radius: var(--tcm-radius-lg);
  cursor: pointer;
  transition: all var(--tcm-transition-normal);
}
.point-card:hover {
  border-color: var(--tcm-primary-300);
  box-shadow: var(--tcm-shadow-md);
  transform: translateX(4px);
}
.point-card--predicted {
  border-color: var(--tcm-gold-300);
  background: linear-gradient(135deg, var(--tcm-bg-surface), #FFF8E1);
  box-shadow: 0 2px 12px rgba(184, 134, 11, 0.15);
}
.point-card--predicted:hover {
  border-color: var(--tcm-gold-500);
  box-shadow: 0 4px 20px rgba(184, 134, 11, 0.25);
}

.point-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 10px; flex-wrap: wrap; }
.point-title {
  font-size: var(--tcm-font-md);
  font-weight: 600;
  color: var(--tcm-text-primary);
  line-height: var(--tcm-leading-tight);
}
.point-badges { display: flex; align-items: center; gap: 8px; flex-shrink: 0; flex-wrap: wrap; }

/* Freq stars */
.freq-badge {
  display: inline-flex;
  gap: 1px;
  font-size: 14px;
  line-height: 1;
}
.freq-star { color: var(--tcm-border-light); }
.freq-star--active { color: var(--tcm-gold-500); }

/* Predicted badge */
.predicted-badge {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px 10px;
  background: linear-gradient(135deg, #FFF8E1, #FFF3CD);
  border: 1px solid var(--tcm-gold-300);
  border-radius: 12px;
  font-size: var(--tcm-font-xs);
  color: var(--tcm-gold-700);
  font-weight: 600;
}

.point-preview {
  font-size: var(--tcm-font-sm);
  color: var(--tcm-text-secondary);
  line-height: var(--tcm-leading-relaxed);
  margin-bottom: 10px;
  padding-left: 0;
}

.point-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.point-tags { display: flex; gap: 4px; flex-wrap: wrap; }
.point-navigate {
  font-size: var(--tcm-font-xs);
  color: var(--tcm-primary-500);
  font-weight: 600;
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .filter-bar { gap: 12px; }
  .filter-select { min-width: 120px; }
  .filter-input { min-width: 140px; }
  .point-header { flex-direction: column; gap: 8px; }
  .point-card { padding: 14px 16px; }
}
</style>
