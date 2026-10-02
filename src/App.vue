<script setup lang="ts">
import { computed } from "vue";
import wneLogo from "./assets/wne-logo.svg";
import { useRoute } from "vue-router";
import UiButton from "./components/UiButton.vue";
import { isDemo as demoEnabled } from "./services/publicGroups";
const route = useRoute();
const isDemo = computed(
  () => demoEnabled && route.params.homepageHash === "demo",
);
function skipToContent() {
  document.getElementById("main")?.focus();
}
</script>
<template>
  <a class="skip-link" href="#main" @click.prevent="skipToContent"
    >Zum Inhalt</a
  >
  <div v-if="isDemo" class="demo-banner">
    Designvorschau · Beispieldaten, keine echten Teams oder Anmeldungen
  </div>
  <header class="site-header">
    <RouterLink
      to="/"
      class="wordmark"
      aria-label="Weihnachten neu erleben · Start"
    >
      <img
        :src="wneLogo"
        alt="Weihnachten neu erleben"
        width="1353"
        height="446"
      />
    </RouterLink>
    <span class="header-label">GEMEINSAM MÖGLICH MACHEN</span>
    <UiButton secondary href="https://weihnachten-neu-erleben.de/"
      >Zur WNE-Website</UiButton
    >
  </header>
  <main id="main" tabindex="-1"><RouterView /></main>
  <footer class="site-footer">
    <span>WEIHNACHTEN NEU ERLEBEN</span>
    <p>Viele Menschen. Eine gemeinsame Geschichte.</p>
    <a href="https://weihnachten-neu-erleben.de/impressum/">Impressum</a
    ><a href="https://weihnachten-neu-erleben.de/datenschutz/">Datenschutz</a>
  </footer>
</template>
