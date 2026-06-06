<template>
  <div class="acupoint-image" @click="showLightbox = true">
    <!-- 穴位图 -->
    <div class="image-wrapper">
      <img
        :src="imageSrc"
        :alt="`${name} - ${meridian}`"
        class="acupoint-img"
        @error="onImageError"
        loading="lazy"
      />
      <!-- 穴位标记覆盖层 -->
      <div v-if="!imgFailed && markerStyle" class="point-overlay" :style="markerStyle">
        <div class="point-pulse"></div>
        <div class="point-dot"></div>
      </div>
    </div>

    <!-- 图片加载失败时的回退 -->
    <div v-if="imgFailed" class="image-fallback">
      <span class="fallback-meridian">{{ meridian }}</span>
      <span class="fallback-point">{{ name }}</span>
      <span class="fallback-code">{{ code }}</span>
      <span class="fallback-hint">穴位图待添加</span>
    </div>

    <!-- 图注 -->
    <div class="image-caption">
      <span class="caption-name">{{ name }}</span>
      <span class="caption-code">{{ code }}</span>
      <span class="caption-meridian">{{ meridian }}</span>
    </div>

    <!-- 图片灯箱 -->
    <Teleport to="body">
      <Transition name="lightbox">
        <div v-if="showLightbox && !imgFailed" class="lightbox-overlay" @click="showLightbox = false">
          <button class="lightbox-close" @click="showLightbox = false">&times;</button>
          <img :src="imageSrc" :alt="name" class="lightbox-img" @click.stop />
          <p class="lightbox-title">{{ meridian }} · {{ name }} ({{ code }})</p>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  code: string
  name: string
  meridian: string
  imagePath?: string
  markX?: number   // 穴位在图片中的X百分比(0-100)
  markY?: number   // 穴位在图片中的Y百分比(0-100)
}>()

const showLightbox = ref(false)
const imgFailed = ref(false)

// 图片路径：优先用传入的imagePath，否则按经络+区域自动匹配
const imageSrc = computed(() => {
  if (props.imagePath) return props.imagePath
  // 经络去空格转文件名
  const m = props.meridian.replace(/\s/g, '')
  return `/images/acupoints/${m}.jpg`
})

const markerStyle = computed(() => {
  if (props.markX == null || props.markY == null) return null
  return {
    left: `${props.markX}%`,
    top: `${props.markY}%`,
  }
})

function onImageError() {
  imgFailed.value = true
}
</script>

<style scoped>
.acupoint-image {
  width: 100%;
  cursor: pointer;
  position: relative;
}

.image-wrapper {
  position: relative;
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
  background: var(--tcm-bg-surface);
  border: 1px solid var(--tcm-border-light);
}

.acupoint-img {
  width: 100%;
  height: auto;
  display: block;
  min-height: 200px;
  object-fit: contain;
  background: #fafaf7;
}

/* 穴位标记 */
.point-overlay {
  position: absolute;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.point-pulse {
  width: 20px; height: 20px;
  border-radius: 50%;
  border: 2.5px solid var(--tcm-error-text, #C0392B);
  animation: acupoint-pulse 2s ease-in-out infinite;
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
}

.point-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--tcm-error-text, #C0392B);
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 0 6px rgba(192,57,43,0.6);
}

@keyframes acupoint-pulse {
  0%, 100% { width: 20px; height: 20px; opacity: 0.7; }
  50% { width: 32px; height: 32px; opacity: 0.1; }
}

/* 图注 */
.image-caption {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 4px;
  font-size: 13px;
}

.caption-name {
  font-weight: 700;
  color: var(--tcm-text-primary);
  font-family: var(--tcm-font-decorative);
}
.caption-code {
  color: var(--tcm-primary-500);
  font-weight: 600;
  font-family: monospace;
}
.caption-meridian {
  color: var(--tcm-text-secondary);
  font-size: 12px;
}

/* 回退 */
.image-fallback {
  width: 100%;
  aspect-ratio: 3/4;
  background: var(--tcm-bg-surface);
  border: 2px dashed var(--tcm-border);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: default;
}

.fallback-meridian {
  font-size: 14px;
  color: var(--tcm-text-secondary);
  font-family: var(--tcm-font-decorative);
}
.fallback-point {
  font-size: 24px;
  color: var(--tcm-text-primary);
  font-family: var(--tcm-font-decorative);
  font-weight: 700;
}
.fallback-code {
  font-size: 16px;
  color: var(--tcm-primary-500);
  font-family: monospace;
  font-weight: 600;
}
.fallback-hint {
  font-size: 12px;
  color: var(--tcm-text-disabled);
  margin-top: 8px;
  padding: 4px 12px;
  background: var(--tcm-primary-50);
  border-radius: 100px;
}

/* 灯箱 */
.lightbox-overlay {
  position: fixed; inset: 0;
  z-index: 10000;
  background: rgba(0,0,0,0.88);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.lightbox-close {
  position: fixed;
  top: 16px; right: 24px;
  background: none; border: none;
  color: #fff; font-size: 36px;
  cursor: pointer; z-index: 10001;
  width: 48px; height: 48px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 50%;
  transition: background 0.2s;
}
.lightbox-close:hover { background: rgba(255,255,255,0.12); }

.lightbox-img {
  max-width: 90vw;
  max-height: 80vh;
  object-fit: contain;
  border-radius: 8px;
}

.lightbox-title {
  color: #ccc;
  font-size: 15px;
  margin-top: 16px;
  font-family: var(--tcm-font-decorative);
}

.lightbox-enter-active, .lightbox-leave-active { transition: opacity 0.25s; }
.lightbox-enter-from, .lightbox-leave-to { opacity: 0; }
</style>
