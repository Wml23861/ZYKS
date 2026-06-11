<template>
  <button
    :class="buttonClasses"
    :disabled="disabled"
    @click="$emit('click', $event)"
  >
    <el-icon v-if="icon && !loading" class="tcm-btn-icon">
      <component :is="icon" />
    </el-icon>
    <span v-if="loading" class="tcm-btn-loading"></span>
    <span v-if="$slots.default" class="tcm-btn-text">
      <slot />
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
  variant: {
    type: String as () => 'primary' | 'secondary' | 'outline' | 'text' | 'gold' | 'danger',
    default: 'primary',
  },
  size: {
    type: String as () => 'sm' | 'md' | 'lg',
    default: 'md',
  },
  icon: {
    type: String,
    default: '',
  },
  loading: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  block: {
    type: Boolean,
    default: false,
  },
})

defineEmits<{
  click: [event: MouseEvent]
}>()

const buttonClasses = computed(() => {
  const base = 'tcm-btn'
  const variant = `tcm-btn--${props.variant}`
  const size = `tcm-btn--${props.size}`
  const block = props.block ? 'tcm-btn--block' : ''
  const disabled = props.disabled || props.loading ? 'tcm-btn--disabled' : ''
  return [base, variant, size, block, disabled].filter(Boolean).join(' ')
})
</script>

<style scoped>
.tcm-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: none;
  cursor: pointer;
  font-family: var(--tcm-font-family);
  font-weight: 500;
  border-radius: var(--tcm-radius-md);
  transition: all var(--tcm-transition-fast);
  white-space: nowrap;
  user-select: none;
}

.tcm-btn:active:not(.tcm-btn--disabled) {
  transform: scale(0.97);
}

.tcm-btn--sm { padding: 6px 12px; font-size: var(--tcm-font-sm); }
.tcm-btn--md { padding: 8px 18px; font-size: var(--tcm-font-base); }
.tcm-btn--lg { padding: 10px 24px; font-size: var(--tcm-font-md); }

.tcm-btn--primary {
  background: var(--tcm-primary-500);
  color: #fff;
}
.tcm-btn--primary:hover:not(.tcm-btn--disabled) {
  background: var(--tcm-primary-700);
}

.tcm-btn--secondary {
  background: var(--tcm-bg-surface);
  color: var(--tcm-text-primary);
  border: 1px solid var(--tcm-border);
}
.tcm-btn--secondary:hover:not(.tcm-btn--disabled) {
  background: var(--tcm-border-light);
}

.tcm-btn--outline {
  background: transparent;
  color: var(--tcm-primary-500);
  border: 1px solid var(--tcm-primary-500);
}
.tcm-btn--outline:hover:not(.tcm-btn--disabled) {
  background: var(--tcm-primary-500);
  color: #fff;
}

.tcm-btn--text {
  background: transparent;
  color: var(--tcm-text-secondary);
}
.tcm-btn--text:hover:not(.tcm-btn--disabled) {
  color: var(--tcm-primary-500);
  background: var(--tcm-bg-surface);
}

.tcm-btn--gold {
  background: var(--tcm-gold-500);
  color: #fff;
}
.tcm-btn--gold:hover:not(.tcm-btn--disabled) {
  background: var(--tcm-gold-700);
}

.tcm-btn--danger {
  background: #dc2626; color: #fff; border: 1px solid #dc2626;
}
.tcm-btn--danger:hover:not(.tcm-btn--disabled) {
  background: #b91c1c; border-color: #b91c1c;
}

.tcm-btn--block { width: 100%; }
.tcm-btn--disabled { opacity: 0.5; cursor: not-allowed; }

.tcm-btn-icon { font-size: 1.1em; }
.tcm-btn-loading {
  width: 14px; height: 14px;
  border: 2px solid transparent;
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
