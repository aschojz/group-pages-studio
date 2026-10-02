<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import UiButton from "../components/UiButton.vue";
import { isDemo, parseGroupId } from "../services/publicGroups";
const router = useRouter();
const id = ref("");
const hash = ref("");
const error = ref("");
function open() {
  const parsed = parseGroupId(id.value.trim());
  if (!parsed || !/^[a-zA-Z0-9_-]{1,128}$/.test(hash.value.trim())) {
    error.value =
      "Bitte gib den Homepage-Hash und eine gültige Gruppen-ID ein.";
    return;
  }
  router.push({
    name: "group",
    params: { homepageHash: hash.value.trim(), groupIds: [String(parsed)] },
  });
}
</script>
<template>
  <section class="entry hero">
    <div class="eyebrow"><span></span> DEIN EINSATZ. UNSER WEIHNACHTEN.</div>
    <h1>Gemeinsam wird<br /><em>mehr daraus.</em></h1>
    <p>
      Öffne deine Gruppen-Homepage über ihren Link. Jeder Bereich führt dich
      Schritt für Schritt zu den Teams, die dazugehören.
    </p>
    <UiButton v-if="isDemo" to="/demo/100"
      >Beispiel-Homepage entdecken</UiButton
    >
    <form class="entry-form" @submit.prevent="open">
      <label for="homepage-hash">Homepage-Hash</label>
      <input id="homepage-hash" v-model="hash" autocomplete="off" required />
      <label for="group-id">Gruppen-ID</label>
      <div>
        <input
          id="group-id"
          v-model="id"
          inputmode="numeric"
          placeholder="z. B. 123"
          :aria-invalid="!!error"
          aria-describedby="entry-error"
        /><UiButton>Gruppe öffnen</UiButton>
      </div>
      <p id="entry-error" role="alert">{{ error }}</p>
    </form>
  </section>
</template>
