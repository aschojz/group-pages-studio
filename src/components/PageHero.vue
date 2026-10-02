<script setup lang="ts">
import GroupImage from "./GroupImage.vue";
defineProps<{ title: string; image?: string | null }>();
defineEmits<{ imageError: [] }>();
</script>
<template>
  <section class="page-hero">
    <GroupImage
      v-if="image"
      :key="image"
      class="page-hero-image"
      :source="image"
      alt=""
      :width="1920"
      :height="960"
      @error="$emit('imageError')"
    />
    <div class="page-hero-content">
      <slot name="breadcrumbs" />
      <h1 tabindex="-1" class="page-title">
        <slot name="title">{{ title }}</slot>
      </h1>
    </div>
  </section>
</template>
