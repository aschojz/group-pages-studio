<script setup lang="ts">
import type { RouteLocationRaw } from "vue-router";
defineProps<{
  secondary?: boolean;
  href?: string;
  to?: RouteLocationRaw;
}>();
</script>
<template>
  <RouterLink v-if="to" :to="to" class="button" :class="{ secondary }"
    ><slot
  /></RouterLink>
  <a v-else-if="href" :href="href" class="button" :class="{ secondary }"
    ><slot
  /></a>
  <button v-else class="button" :class="{ secondary }"><slot /></button>
</template>
