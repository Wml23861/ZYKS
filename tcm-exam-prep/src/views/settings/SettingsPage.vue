<template>
  <div class="page-settings">
    <h1 class="page-title">设置</h1>
    <p class="page-subtitle">调整学习目标和偏好，打造专属学习体验</p>

    <div v-if="!isLoaded" class="loading-state">
      <TcmSkeleton variant="card" />
    </div>

    <template v-else>
      <!-- 每日目标 -->
      <TcmCard title="每日目标" class="settings-section">
        <div class="form-grid">
          <div class="form-item">
            <label class="form-label">每日学习知识点</label>
            <p class="form-hint">计划每天学习的知识点数量</p>
            <input
              v-model.number="form.dailyStudyGoal"
              type="number"
              min="1"
              max="200"
              class="form-input"
            />
          </div>

          <div class="form-item">
            <label class="form-label">每日刷题目标</label>
            <p class="form-hint">计划每天完成的题目数量</p>
            <input
              v-model.number="form.dailyQuestionGoal"
              type="number"
              min="1"
              max="500"
              class="form-input"
            />
          </div>

          <div class="form-item">
            <label class="form-label">每日复习目标</label>
            <p class="form-hint">计划每天复习的题目/知识点数量</p>
            <input
              v-model.number="form.dailyReviewGoal"
              type="number"
              min="1"
              max="200"
              class="form-input"
            />
          </div>
        </div>
      </TcmCard>

      <!-- 默认考试设置 -->
      <TcmCard title="默认考试设置" class="settings-section">
        <div class="form-grid">
          <div class="form-item">
            <label class="form-label">默认考试时长（分钟）</label>
            <p class="form-hint">模拟考试默认时长</p>
            <div class="select-wrapper">
              <select v-model.number="form.defaultExamDuration" class="form-select">
                <option :value="30">30 分钟</option>
                <option :value="60">60 分钟</option>
                <option :value="90">90 分钟</option>
                <option :value="120">120 分钟</option>
              </select>
            </div>
          </div>

          <div class="form-item">
            <label class="form-label">默认题量</label>
            <p class="form-hint">模拟考试默认题目数量</p>
            <div class="select-wrapper">
              <select v-model.number="form.defaultExamQuestionCount" class="form-select">
                <option :value="50">50 题</option>
                <option :value="100">100 题</option>
                <option :value="150">150 题</option>
              </select>
            </div>
          </div>

          <div class="form-item">
            <label class="form-label">考试日期</label>
            <p class="form-hint">设置你的执业医师考试日期，系统将倒计时提醒</p>
            <input
              v-model="form.examDateStr"
              type="date"
              class="form-input"
            />
            <p v-if="examCountdown" class="form-countdown">
              距离考试还有 <strong>{{ examCountdown }}</strong> 天
            </p>
          </div>
        </div>
      </TcmCard>

      <!-- 闪卡设置 -->
      <TcmCard title="闪卡记忆设置" class="settings-section">
        <div class="form-grid">
          <div class="form-item">
            <label class="form-label">每日新卡数量</label>
            <p class="form-hint">每天新增学习的闪卡数量上限</p>
            <input
              v-model.number="form.dailyNewCards"
              type="number"
              min="1"
              max="200"
              class="form-input"
            />
          </div>

          <div class="form-item">
            <label class="form-label">每日复习上限</label>
            <p class="form-hint">每天复习闪卡的数量上限</p>
            <input
              v-model.number="form.dailyReviewCards"
              type="number"
              min="1"
              max="500"
              class="form-input"
            />
          </div>
        </div>
      </TcmCard>

      <!-- 外观设置 -->
      <TcmCard title="外观设置" class="settings-section">
        <div class="form-grid">
          <!-- 季节主题 -->
          <div class="form-item">
            <label class="form-label">四季主题</label>
            <p class="form-hint">选择适合当下的视觉风格 — 四君子配色</p>
            <div class="season-grid">
              <button
                v-for="s in seasons"
                :key="s.key"
                :class="['season-btn', { 'is-active': form.season === s.key }]"
                :style="{ '--season-color': s.color }"
                @click="form.season = s.key"
              >
                <span class="season-icon">{{ s.icon }}</span>
                <span class="season-name">{{ s.label }}</span>
                <span class="season-desc">{{ s.desc }}</span>
              </button>
            </div>
          </div>

          <!-- 明暗模式 -->
          <div class="form-item">
            <label class="form-label">明暗模式</label>
            <p class="form-hint">选择明亮、暗色或跟随系统</p>
            <div class="option-row">
              <button
                :class="['option-btn', { 'is-active': form.themeMode === 'light' }]"
                @click="form.themeMode = 'light'"
              >☀️ 明亮</button>
              <button
                :class="['option-btn', { 'is-active': form.themeMode === 'dark' }]"
                @click="form.themeMode = 'dark'"
              >🌙 暗色</button>
              <button
                :class="['option-btn', { 'is-active': form.themeMode === 'system' }]"
                @click="form.themeMode = 'system'"
              >💻 跟随系统</button>
            </div>
          </div>

          <!-- 字体大小 -->
          <div class="form-item">
            <label class="form-label">字体大小</label>
            <p class="form-hint">调整界面文字大小</p>
            <div class="option-row">
              <button :class="['option-btn', { 'is-active': form.fontSize === 'small' }]" @click="form.fontSize = 'small'">小</button>
              <button :class="['option-btn', { 'is-active': form.fontSize === 'medium' }]" @click="form.fontSize = 'medium'">中</button>
              <button :class="['option-btn', { 'is-active': form.fontSize === 'large' }]" @click="form.fontSize = 'large'">大</button>
            </div>
          </div>
        </div>
      </TcmCard>

      <!-- 修改密码 -->
      <TcmCard title="修改密码" class="settings-section">
        <div class="form-grid">
          <div class="form-item">
            <label class="form-label">原密码</label>
            <input v-model="pwForm.oldPassword" type="password" class="form-input" placeholder="输入当前密码" />
          </div>
          <div class="form-item">
            <label class="form-label">新密码</label>
            <input v-model="pwForm.newPassword" type="password" class="form-input" placeholder="新密码（至少6位）" />
          </div>
        </div>
        <p v-if="pwForm.message" :class="['pw-msg', pwForm.ok ? 'pw-msg--ok' : 'pw-msg--err']">{{ pwForm.message }}</p>
        <TcmButton variant="outline" size="md" :loading="pwForm.loading" @click="handleChangePassword">修改密码</TcmButton>
      </TcmCard>

      <!-- 管理员：用户管理 -->
      <TcmCard v-if="authStore.user?.role === 'admin'" title="用户管理" class="settings-section">
        <div v-if="userList.length > 0" class="user-list">
          <div v-for="u in userList" :key="u.id" class="user-row">
            <div class="user-info">
              <span class="user-name">{{ u.displayName || u.username }}</span>
              <span class="user-role-badge">{{ u.role === 'admin' ? '管理员' : '用户' }}</span>
            </div>
            <div v-if="u.id !== authStore.user?.id" class="user-actions-row">
              <input v-model="resetPw[u.id]" type="text" class="form-input form-input--sm" placeholder="新密码" />
              <TcmButton size="sm" variant="text" @click="handleResetUserPw(u.id)">重置</TcmButton>
            </div>
          </div>
        </div>
        <TcmButton variant="text" size="sm" :loading="loadingUsers" @click="loadUserList">刷新用户列表</TcmButton>
      </TcmCard>

      <!-- 操作按钮 -->
      <div class="settings-actions">
        <TcmButton variant="primary" size="lg" :loading="saving" @click="handleSave">
          保存设置
        </TcmButton>
        <TcmButton variant="secondary" size="lg" @click="handleReset">
          恢复默认
        </TcmButton>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue'
import TcmCard from '@/components/ui/TcmCard.vue'
import TcmButton from '@/components/ui/TcmButton.vue'
import TcmSkeleton from '@/components/ui/TcmSkeleton.vue'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { apiGet, apiPut, apiPost } from '@/utils/api-client'
import { daysUntilExam } from '@/utils/date'
import type { AppSettings, ThemeMode, FontSize, Season } from '@/types'

const settingsStore = useSettingsStore()
const authStore = useAuthStore()
const isLoaded = ref(false)
const saving = ref(false)

// 密码修改
const pwForm = reactive({ oldPassword: '', newPassword: '', loading: false, message: '', ok: false })
async function handleChangePassword(): Promise<void> {
  pwForm.message = ''
  if (!pwForm.oldPassword || !pwForm.newPassword) { pwForm.message = '请填写原密码和新密码'; return }
  if (pwForm.newPassword.length < 6) { pwForm.message = '新密码至少6位'; return }
  pwForm.loading = true
  try {
    await apiPut('/api/auth/password', { oldPassword: pwForm.oldPassword, newPassword: pwForm.newPassword })
    pwForm.message = '密码修改成功'; pwForm.ok = true
    pwForm.oldPassword = ''; pwForm.newPassword = ''
  } catch (e: unknown) {
    const err = e as Error; pwForm.message = err.message || '修改失败'; pwForm.ok = false
  } finally { pwForm.loading = false }
}

// 用户管理（管理员）
interface UserItem { id: string; username: string; displayName: string; role: string; createdAt: number }
const userList = ref<UserItem[]>([])
const resetPw = reactive<Record<string, string>>({})
const loadingUsers = ref(false)
async function loadUserList(): Promise<void> {
  loadingUsers.value = true
  try { userList.value = await apiGet<UserItem[]>('/api/auth/users') } catch { userList.value = [] }
  finally { loadingUsers.value = false }
}
async function handleResetUserPw(userId: string): Promise<void> {
  const pw = resetPw[userId]
  if (!pw || pw.length < 6) return
  try {
    await apiPost(`/api/auth/reset-password/${userId}`, { newPassword: pw })
    resetPw[userId] = ''
    alert('密码已重置')
  } catch (e: unknown) {
    const err = e as Error; alert(err.message || '重置失败')
  }
}
onMounted(() => { if (authStore.user?.role === 'admin') loadUserList() })

const seasons = [
  { key: 'spring' as Season, label: '春 · 兰', desc: '青绿生机', icon: '🌿', color: '#4A8C6F' },
  { key: 'summer' as Season, label: '夏 · 竹', desc: '赤红热烈', icon: '🎋', color: '#C0392B' },
  { key: 'autumn' as Season, label: '秋 · 菊', desc: '金黄沉稳', icon: '🍂', color: '#B8860B' },
  { key: 'winter' as Season, label: '冬 · 梅', desc: '墨蓝沉静', icon: '❄️', color: '#3D5A80' },
]

const form = reactive({
  dailyStudyGoal: 20,
  dailyQuestionGoal: 50,
  dailyReviewGoal: 30,
  defaultExamDuration: 60,
  defaultExamQuestionCount: 100,
  season: 'summer' as Season,
  themeMode: 'light' as ThemeMode,
  fontSize: 'medium' as FontSize,
  dailyNewCards: 20,
  dailyReviewCards: 100,
  examDateStr: '',
})

const examCountdown = computed(() => {
  if (!form.examDateStr) return null
  const ts = new Date(form.examDateStr + 'T00:00:00').getTime()
  if (isNaN(ts)) return null
  return daysUntilExam(ts)
})

function loadFormFromSettings(settings: AppSettings): void {
  form.dailyStudyGoal = settings.dailyStudyGoal
  form.dailyQuestionGoal = settings.dailyQuestionGoal
  form.dailyReviewGoal = settings.dailyReviewGoal
  form.defaultExamDuration = settings.defaultExamDuration
  form.defaultExamQuestionCount = settings.defaultExamQuestionCount
  form.season = settings.season || 'summer'
  form.themeMode = settings.themeMode
  form.fontSize = settings.fontSize
  form.dailyNewCards = settings.dailyNewCards
  form.dailyReviewCards = settings.dailyReviewCards
  form.examDateStr = settings.examDate
    ? new Date(settings.examDate).toISOString().slice(0, 10)
    : ''
}

async function handleSave(): Promise<void> {
  saving.value = true
  try {
    const examDate = form.examDateStr
      ? new Date(form.examDateStr + 'T00:00:00').getTime()
      : null

    await settingsStore.updateSettings({
      dailyStudyGoal: form.dailyStudyGoal,
      dailyQuestionGoal: form.dailyQuestionGoal,
      dailyReviewGoal: form.dailyReviewGoal,
      defaultExamDuration: form.defaultExamDuration,
      defaultExamQuestionCount: form.defaultExamQuestionCount,
      season: form.season,
      themeMode: form.themeMode,
      fontSize: form.fontSize,
      dailyNewCards: form.dailyNewCards,
      dailyReviewCards: form.dailyReviewCards,
      examDate,
    })
  } finally {
    saving.value = false
  }
}

async function handleReset(): Promise<void> {
  await settingsStore.resetSettings()
  loadFormFromSettings(settingsStore.settings)
}

onMounted(async () => {
  try {
    await settingsStore.loadSettings()
  } finally {
    loadFormFromSettings(settingsStore.settings)
    isLoaded.value = true
  }
})
</script>

<style scoped>
.page-settings {
  max-width: var(--tcm-content-max-width);
  margin: 0 auto;
}

.page-title {
  font-family: var(--tcm-font-decorative);
  font-size: var(--tcm-font-2xl);
  color: var(--tcm-text-primary);
  margin-bottom: 8px;
}

.page-subtitle {
  font-size: var(--tcm-font-base);
  color: var(--tcm-text-secondary);
  margin-bottom: 24px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ===== 设置分区 ===== */
.settings-section {
  margin-bottom: 20px;
}

/* ===== 表单项 ===== */
.form-grid {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-item {
  display: flex;
  flex-direction: column;
}

.form-label {
  font-size: var(--tcm-font-base);
  font-weight: 600;
  color: var(--tcm-text-primary);
  margin-bottom: 8px;
}

.form-hint {
  font-size: var(--tcm-font-sm);
  color: var(--tcm-text-secondary);
  margin: 0 0 8px 0;
}

.form-input {
  width: 100%;
  max-width: 280px;
  padding: 10px 14px;
  border: 1px solid var(--tcm-border);
  border-radius: var(--tcm-radius-md);
  background: var(--tcm-bg-base);
  color: var(--tcm-text-primary);
  font-size: var(--tcm-font-base);
  font-family: var(--tcm-font-family);
  transition: border-color var(--tcm-transition-fast);
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: var(--tcm-primary-500);
}

.form-input[type='date'] {
  font-family: var(--tcm-font-family);
}

.select-wrapper {
  max-width: 240px;
}

.form-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--tcm-border);
  border-radius: var(--tcm-radius-md);
  background: var(--tcm-bg-base);
  color: var(--tcm-text-primary);
  font-size: var(--tcm-font-base);
  font-family: var(--tcm-font-family);
  cursor: pointer;
  transition: border-color var(--tcm-transition-fast);
  appearance: auto;
}

.form-select:focus {
  outline: none;
  border-color: var(--tcm-primary-500);
}

.form-countdown {
  margin: 8px 0 0 0;
  font-size: var(--tcm-font-sm);
  color: var(--tcm-primary-500);
}

.form-countdown strong {
  font-family: var(--tcm-font-mono);
  font-size: var(--tcm-font-lg);
}

/* ===== 选项按钮 ===== */
.option-row {
  display: flex;
  gap: 8px;
}

.option-btn {
  padding: 8px 20px;
  border: 1px solid var(--tcm-border);
  border-radius: var(--tcm-radius-md);
  background: var(--tcm-bg-base);
  color: var(--tcm-text-secondary);
  font-size: var(--tcm-font-base);
  font-family: var(--tcm-font-family);
  cursor: pointer;
  transition: all var(--tcm-transition-fast);
}

.option-btn:hover {
  border-color: var(--tcm-primary-300);
}

.option-btn.is-active {
  border-color: var(--tcm-primary-500);
  background: var(--tcm-primary-50);
  color: var(--tcm-primary-700);
  font-weight: 600;
}

/* ===== 季节选择器 ===== */
.season-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 10px;
}
.season-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 14px 10px;
  border: 2px solid var(--tcm-border-light);
  border-radius: var(--tcm-radius-lg);
  background: var(--tcm-bg-base);
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}
.season-btn:hover {
  border-color: var(--season-color, var(--tcm-primary-300));
  transform: translateY(-1px);
}
.season-btn.is-active {
  border-color: var(--season-color, var(--tcm-primary-500));
  background: color-mix(in srgb, var(--season-color, var(--tcm-primary-500)) 8%, var(--tcm-bg-base));
}
.season-icon { font-size: 24px; line-height: 1; }
.season-name { font-size: 14px; font-weight: 700; color: var(--tcm-text-primary); }
.season-desc { font-size: 11px; color: var(--tcm-text-secondary); }

@media (max-width: 480px) {
  .season-grid { grid-template-columns: repeat(2, 1fr); }
}

/* ===== 操作按钮 ===== */
.settings-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding: 8px 0 40px;
}

/* 密码修改 */
.pw-msg { margin: 12px 0 8px; font-size: var(--tcm-font-sm); }
.pw-msg--ok { color: var(--tcm-jade-500); }
.pw-msg--err { color: var(--tcm-error); }

/* 用户管理 */
.user-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }
.user-row { display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: var(--tcm-bg-base); border-radius: var(--tcm-radius-sm); gap: 8px; }
.user-info { display: flex; align-items: center; gap: 8px; }
.user-name { font-size: var(--tcm-font-sm); font-weight: 500; color: var(--tcm-text-primary); }
.user-role-badge { font-size: 11px; padding: 1px 8px; border-radius: 10px; background: #E8F5E9; color: var(--tcm-jade-500); }
.user-actions-row { display: flex; align-items: center; gap: 6px; }
.form-input--sm { width: 120px; padding: 6px 10px; font-size: var(--tcm-font-sm); }
</style>
