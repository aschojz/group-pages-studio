<script setup lang="ts">
import { computed } from "vue";
import { safeImageUrl } from "../services/publicGroups";
const props = defineProps<{
  source?: string | null;
  width: number;
  height: number;
  alt?: string;
  lazy?: boolean;
}>();
const emit = defineEmits<{ error: [] }>();
function sizedUrl(scale: number) {
  const source = safeImageUrl(props.source);
  if (!source) return;
  const url = new URL(source);
  url.searchParams.set("w", String(props.width * scale));
  url.searchParams.set("h", String(props.height * scale));
  return url.href;
}
const src = computed(() => sizedUrl(1));
const srcset = computed(() =>
  src.value ? `${src.value} 1x, ${sizedUrl(2)} 2x` : undefined,
);
</script>
<template>
  <img
    v-if="src"
    :src="src"
    :srcset="srcset"
    :width="width"
    :height="height"
    :alt="alt || ''"
    :loading="lazy ? 'lazy' : 'eager'"
    @error="emit('error')"
  />
</template>
