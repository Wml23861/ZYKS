<template>
  <Teleport to="body">
    <Transition name="confirm">
      <div v-if="visible" class="confirm-overlay" @click.self="onCancel">
        <div class="confirm-dialog" :class="type + '-border'">
          <div class="confirm-icon" :class="type">
            <span v-if="type === 'danger'">&#x26A0;</span>
            <span v-else-if="type === 'info'">&#x2139;</span>
            <span v-else>&#x2753;</span>
          </div>
          <h3 class="confirm-title">{{ title }}</h3>
          <p class="confirm-message">{{ message }}</p>
          <div class="confirm-actions">
            <TcmButton variant="outline" @click="onCancel">{{ cancelText }}</TcmButton>
            <TcmButton :variant="type === 'danger' ? 'danger' : 'primary'" :loading="loading" @click="onConfirm">
              {{ confirmText }}
            </TcmButton>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import TcmButton from './TcmButton.vue'

interface ConfirmOptions {
  title?: string
  message?: string
  type?: 'danger' | 'warning' | 'info'
  confirmText?: string
  cancelText?: string
  onConfirm: () => Promise<void> | void
}

const visible = ref(false)
const loading = ref(false)
const title = ref('')
const message = ref('')
const type = ref<'danger' | 'warning' | 'info'>('info')
const confirmText = ref('确定')
const cancelText = ref('取消')
let _onConfirm: (() => Promise<void> | void) | null = null

function show(opts: ConfirmOptions) {
  title.value = opts.title || '确认操作'
  message.value = opts.message || ''
  type.value = opts.type || 'info'
  confirmText.value = opts.confirmText || '确定'
  cancelText.value = opts.cancelText || '取消'
  _onConfirm = opts.onConfirm
  visible.value = true
  loading.value = false
}

function onCancel() {
  visible.value = false
}

async function onConfirm() {
  if (!_onConfirm) return
  loading.value = true
  try {
    await _onConfirm()
  } finally {
    loading.value = false
    visible.value = false
  }
}

defineExpose({ show })
</script>

<style scoped>
.confirm-overlay {
  position: fixed; inset: 0; z-index: 9999;
  background: rgba(0,0,0,0.45); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
}
.confirm-dialog {
  background: var(--tcm-bg-surface); border-radius: var(--tcm-radius-xl);
  padding: 32px; max-width: 400px; width: 90%;
  text-align: center;
  box-shadow: var(--tcm-shadow-xl);
  border: 2px solid var(--tcm-border, #d0c8b0);
}
.confirm-dialog.danger-border { border-color: rgba(220,38,38,0.45); }
.confirm-dialog.warning-border { border-color: rgba(245,158,11,0.45); }
.confirm-dialog.info-border { border-color: rgba(59,130,246,0.45); }
.confirm-icon {
  width: 56px; height: 56px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 16px; font-size: 26px;
}
.confirm-icon.danger { background: rgba(220,38,38,0.1); color: #dc2626; }
.confirm-icon.warning { background: rgba(245,158,11,0.1); color: #f59e0b; }
.confirm-icon.info { background: rgba(59,130,246,0.1); color: #3b82f6; }

.confirm-title { font-size: 18px; font-weight: 600; color: var(--tcm-text-primary); margin-bottom: 8px; }
.confirm-message { font-size: 14px; color: var(--tcm-text-secondary); line-height: 1.6; margin-bottom: 24px; white-space: pre-line; }

.confirm-actions { display: flex; gap: 12px; justify-content: center; }

.confirm-enter-active { transition: all 0.25s ease-out; }
.confirm-leave-active { transition: all 0.15s ease-in; }
.confirm-enter-from, .confirm-leave-to { opacity: 0; }
.confirm-enter-from .confirm-dialog, .confirm-leave-to .confirm-dialog { transform: scale(0.9); }
</style>
