<script setup lang="ts">
import { markdownSummary } from "../utils/markdown";
import GroupImage from "./GroupImage.vue";
import BrandStar from "./BrandStar.vue";
import { computed, ref, watch } from "vue";
import type { RouteLocationRaw } from "vue-router";
import { safeImageUrl, type PublicGroup } from "../services/publicGroups";
const props = defineProps<{
  group: PublicGroup;
  to: RouteLocationRaw;
  index: number;
}>();
const failedImage = ref(false);
const image = computed(() => safeImageUrl(props.group.information.imageUrl));
watch(image, () => {
  failedImage.value = false;
});
</script>
<template>
  <RouterLink class="group-card" :to="to">
    <div class="card-art" :class="`art-${index % 3}`">
      <GroupImage
        v-if="image && !failedImage"
        :source="group.information.imageUrl"
        :width="480"
        :height="320"
        alt=""
        lazy
        @error="failedImage = true"
      />
      <BrandStar v-else class="art-star" />
    </div>
    <div class="card-content">
      <h3>{{ group.name }}</h3>
      <p v-if="group.information.note">
        {{ markdownSummary(group.information.note) }}
      </p>
      <span class="card-arrow" aria-hidden="true">↗</span>
    </div>
  </RouterLink>
</template>
