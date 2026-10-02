<script setup lang="ts">
import { watchEffect } from "vue";
import { config } from "./services/config";
import { useRoute } from "vue-router";
import UiButton from "./components/UiButton.vue";
const route = useRoute();
watchEffect(() => {
  if (route.name === "settings")
    document.title = `Darstellung & Einstellungen · ${config.brand.name}`;
  else if (route.path === "/")
    document.title = `Gruppen · ${config.brand.name}`;
});
function skipToContent() {
  document
    .getElementById("group-pages-studio-root")
    ?.shadowRoot?.getElementById("main")
    ?.focus();
}
</script>
<template>
  <a class="skip-link" href="#main" @click.prevent="skipToContent"
    >Zum Inhalt</a
  >
  <header class="site-header">
    <RouterLink
      to="/"
      class="wordmark"
      :aria-label="`${config.brand.name} · Start`"
    >
      <img
        v-if="config.brand.logoUrl"
        :src="config.brand.logoUrl"
        :alt="config.brand.name"
        width="1353"
        height="446"
      />
      <span v-else>{{ config.brand.name }}</span>
    </RouterLink>
    <span v-if="config.brand.headerText" class="header-label">{{
      config.brand.headerText
    }}</span>
    <UiButton
      v-if="config.brand.websiteUrl"
      secondary
      :href="config.brand.websiteUrl"
      >{{ config.brand.websiteLabel || "Zur Website" }}</UiButton
    >
  </header>
  <main id="main" tabindex="-1"><RouterView /></main>
  <footer class="site-footer">
    <span>{{ config.brand.name }}</span>
    <p v-if="config.brand.footerText">{{ config.brand.footerText }}</p>
    <a v-if="config.brand.imprintUrl" :href="config.brand.imprintUrl"
      >Impressum</a
    ><a v-if="config.brand.privacyUrl" :href="config.brand.privacyUrl"
      >Datenschutz</a
    >
  </footer>
</template>
