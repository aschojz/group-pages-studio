<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import UiButton from "../components/UiButton.vue";
import { parseGroupId } from "../services/publicGroups";
const router = useRouter();
const id = ref("");
const hash = ref("");
const error = ref("");
function open() {
  const parsed = parseGroupId(id.value.trim());
  if (!parsed || !/^[a-zA-Z0-9_-]{1,128}$/.test(hash.value.trim())) {
    error.value =
      "Bitte gib die Homepage-Kennung und eine gültige Gruppen-ID ein.";
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
    <div class="eyebrow"><span></span> GRUPPEN ENTDECKEN</div>
    <h1>Deine Gruppen<br /><em>auf einen Blick.</em></h1>
    <p>
      Öffne eine Gruppen-Homepage über ihren Link oder gib die Kennung und
      Gruppen-ID unten ein. Dort findest du die Gruppe, ihre Untergruppen und
      Informationen zur Anmeldung.
    </p>
    <form class="entry-form" @submit.prevent="open">
      <label for="homepage-hash">Homepage-Kennung</label>
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
    <RouterLink class="settings-entry-link" to="/admin/settings"
      >Darstellung & Einstellungen</RouterLink
    >
  </section>
</template>
