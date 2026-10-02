<script setup lang="ts">
import type { RouteLocationRaw } from "vue-router";
import type { PublicGroup } from "../services/publicGroups";
import { markdownSummary } from "../utils/markdown";
defineProps<{
  group: PublicGroup;
  children: PublicGroup[];
  to: RouteLocationRaw;
  tall?: boolean;
}>();
</script>
<template>
  <RouterLink
    class="group-list-item"
    :class="{ 'category-card': tall }"
    :to="to"
  >
    <div class="group-list-copy">
      <h3>{{ group.name }}</h3>
      <p v-if="group.information.note" class="list-description">
        {{ markdownSummary(group.information.note) }}
      </p>
      <ul
        v-if="children.length"
        class="child-preview"
        aria-label="Untergruppen"
      >
        <li v-for="child in children" :key="child.id">{{ child.name }}</li>
      </ul>
    </div>
    <span class="list-action" aria-hidden="true">↗</span>
  </RouterLink>
</template>
