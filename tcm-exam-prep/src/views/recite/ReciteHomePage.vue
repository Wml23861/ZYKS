<template>
  <div class="page-recite">
    <div class="recite-hero">
      <h1 class="page-title">背诵辅助</h1>
      <p class="page-subtitle">利用碎片时间反复记忆核心考点，选择合适的模式开始</p>
    </div>

    <div class="mode-grid">
      <div class="mode-card mode-card--songs" @click="goTo('formula-songs')">
        <div class="mode-icon">
          <span class="icon-char">歌</span>
        </div>
        <div class="mode-body">
          <h3 class="mode-title">方歌背诵</h3>
          <p class="mode-desc">经典方剂歌诀，含组成功效主治。逐行渐进式展示，辅助理解记忆。</p>
          <div class="mode-tags">
            <TcmTag type="key" size="sm">方剂学</TcmTag>
            <TcmTag type="memorize" size="sm">歌诀</TcmTag>
          </div>
        </div>
        <span class="mode-arrow">&rarr;</span>
      </div>

      <div class="mode-card mode-card--herbs" @click="goTo('herb-properties')">
        <div class="mode-icon">
          <span class="icon-char">药</span>
        </div>
        <div class="mode-body">
          <h3 class="mode-title">药性背诵</h3>
          <p class="mode-desc">常用中药性味归经、功效主治。按分类筛选，卡片翻转记忆。</p>
          <div class="mode-tags">
            <TcmTag type="key" size="sm">中药学</TcmTag>
            <TcmTag type="memorize" size="sm">性味</TcmTag>
          </div>
        </div>
        <span class="mode-arrow">&rarr;</span>
      </div>

      <div class="mode-card mode-card--acu" @click="goTo('acupoints')">
        <div class="mode-icon">
          <span class="icon-char">穴</span>
        </div>
        <div class="mode-body">
          <h3 class="mode-title">穴位背诵</h3>
          <p class="mode-desc">经络腧穴定位、归经与主治。重点穴位全覆盖，精准掌握。</p>
          <div class="mode-tags">
            <TcmTag type="key" size="sm">针灸学</TcmTag>
            <TcmTag type="memorize" size="sm">定位</TcmTag>
          </div>
        </div>
        <span class="mode-arrow">&rarr;</span>
      </div>
    </div>

    <div class="tips-section">
      <h3 class="tips-heading">背诵小贴士</h3>
      <div class="tips-grid">
        <div class="tip-item">
          <span class="tip-num">1</span>
          <span>方歌建议每天背诵 1-2 首，反复吟诵直至脱口而出</span>
        </div>
        <div class="tip-item">
          <span class="tip-num">2</span>
          <span>药性背诵可采用分类对比法，同类药物放一起比较记忆</span>
        </div>
        <div class="tip-item">
          <span class="tip-num">3</span>
          <span>穴位背诵建议配合人体图示，定位与主治结合记忆</span>
        </div>
        <div class="tip-item">
          <span class="tip-num">4</span>
          <span>艾宾浩斯遗忘曲线：学后1天、3天、7天及时复习</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import TcmTag from '@/components/ui/TcmTag.vue'
const router = useRouter()
function goTo(name: string): void { router.push({ name }) }
</script>

<style scoped>
.page-recite {
  width: 100%;
}

.recite-hero {
  margin-bottom: 36px;
}

.page-title {
  font-family: var(--tcm-font-decorative);
  font-size: 28px;
  color: #3d3027;
  margin: 0 0 8px 0;
}

.page-subtitle {
  font-size: 15px;
  color: #999;
  margin: 0;
}

/* Mode cards — horizontal layout using full width */
.mode-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 40px;
}

.mode-card {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 28px 32px;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.25s;
  position: relative;
  border: 1.5px solid #e8dcc8;
  background: #fffefb;
}

.mode-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 28px rgba(139, 69, 19, 0.08);
}

.mode-card--songs:hover { border-color: #c0392b; background: #fefaf8; }
.mode-card--herbs:hover { border-color: #5e8246; background: #f9fbf7; }
.mode-card--acu:hover   { border-color: #b8860b; background: #fffefa; }

.mode-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.mode-card--songs .mode-icon { background: #fdf0ed; border: 2px solid #c0392b; }
.mode-card--herbs .mode-icon { background: #e8f5e9; border: 2px solid #5e8246; }
.mode-card--acu   .mode-icon { background: #fff8e1; border: 2px solid #b8860b; }

.icon-char {
  font-family: var(--tcm-font-decorative);
  font-size: 24px;
  font-weight: 700;
}

.mode-card--songs .icon-char { color: #c0392b; }
.mode-card--herbs .icon-char { color: #5e8246; }
.mode-card--acu   .icon-char { color: #b8860b; }

.mode-body { flex: 1; }

.mode-title {
  font-family: var(--tcm-font-decorative);
  font-size: 18px;
  font-weight: 700;
  color: #3d3027;
  margin: 0 0 6px 0;
}

.mode-desc {
  font-size: 14px;
  color: #888;
  line-height: 1.6;
  margin: 0 0 10px 0;
}

.mode-tags { display: flex; gap: 6px; }

.mode-arrow {
  font-size: 22px;
  color: #d0c8b8;
  transition: all 0.2s;
  flex-shrink: 0;
}
.mode-card:hover .mode-arrow { color: #8b4513; transform: translateX(4px); }

/* Tips */
.tips-section {
  background: linear-gradient(135deg, #faf7f0, #f5efe0);
  border: 1px solid #e8dcc8;
  border-radius: 14px;
  padding: 28px 36px;
  margin-bottom: 40px;
}

.tips-heading {
  font-family: var(--tcm-font-decorative);
  font-size: 17px;
  color: #5c4a32;
  margin: 0 0 18px 0;
}

.tips-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 12px 32px;
}

.tip-item {
  display: flex;
  align-items: baseline;
  gap: 10px;
  font-size: 14px;
  color: #6b5a30;
  line-height: 1.6;
}

.tip-num {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #8b4513;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

@media (max-width: 640px) {
  .mode-card { flex-direction: column; align-items: flex-start; }
  .tips-grid { grid-template-columns: 1fr; }
}
</style>
