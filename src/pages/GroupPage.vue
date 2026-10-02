<script setup lang="ts">
import PageHero from "../components/PageHero.vue";
import GroupCard from "../components/GroupCard.vue";
import GroupDetails from "../components/GroupDetails.vue";
import MarkdownText from "../components/MarkdownText.vue";
import { computed, nextTick, ref, watch } from "vue";
import { useRoute } from "vue-router";
import GroupListItem from "../components/GroupListItem.vue";
import UiButton from "../components/UiButton.vue";
import {
  childIds,
  buildHierarchy,
  getGroupHomepage,
  resolveGroupPath,
  visibleChildren,
  isDemo as demoEnabled,
  inheritedGroupImage,
  type PublicGroup,
} from "../services/publicGroups";

const route = useRoute();
const isDemo = computed(
  () => demoEnabled && route.params.homepageHash === "demo",
);
const hierarchy = ref(new Map<number, PublicGroup>());
const group = ref<PublicGroup>();
const children = ref<PublicGroup[]>([]);
const ancestors = ref<PublicGroup[]>([]);
const loading = ref(true);
const error = ref("");
const search = ref("");
const retry = ref(0);
const heading = ref<HTMLElement>();
const failedHeaderImages = ref<string[]>([]);
const headerImage = computed(() =>
  inheritedGroupImage(
    group.value,
    hierarchy.value,
    ancestors.value,
    failedHeaderImages.value,
  ),
);
function headerImageFailed() {
  if (headerImage.value) failedHeaderImages.value.push(headerImage.value);
}
const filtered = computed(() =>
  children.value.filter((g) =>
    g.name
      .toLocaleLowerCase("de")
      .includes(search.value.toLocaleLowerCase("de")),
  ),
);
const categories = computed(() =>
  filtered.value.filter((child) => childIds(child).length),
);
const teams = computed(() =>
  filtered.value.filter((child) => !childIds(child).length),
);
const isBranch = computed(
  () => !!group.value && childIds(group.value).length > 0,
);
function destination(id: number, trail: PublicGroup[]) {
  return {
    name: "group",
    params: {
      homepageHash: route.params.homepageHash,
      groupIds: [...trail.map((g) => g.id), id].map(String),
    },
  };
}

watch(
  [
    () => route.params.homepageHash,
    () => String(route.params.groupIds),
    () => retry.value,
  ],
  async (_, __, onCleanup) => {
    const controller = new AbortController();
    onCleanup(() => controller.abort());
    loading.value = true;
    error.value = "";
    group.value = undefined;
    children.value = [];
    ancestors.value = [];
    search.value = "";
    failedHeaderImages.value = [];
    try {
      const homepage = await getGroupHomepage(
        route.params.homepageHash,
        controller.signal,
        retry.value > 0,
      );
      const groups = buildHierarchy(homepage);
      const path = resolveGroupPath(route.params.groupIds, groups);
      const loaded = path[path.length - 1]!;
      const trail = path.slice(0, -1);
      const result = visibleChildren(loaded, groups);
      if (controller.signal.aborted) return;
      group.value = loaded;
      hierarchy.value = groups;
      children.value = result.filter(
        (child) => !trail.some((parent) => parent.id === child.id),
      );
      ancestors.value = trail;
      document.title = `${loaded.name} · Weihnachten neu erleben`;
    } catch (cause) {
      if (controller.signal.aborted) return;
      error.value =
        cause instanceof Error
          ? cause.message
          : "Die Gruppe konnte nicht geladen werden.";
      document.title = "Gruppe nicht verfügbar · Weihnachten neu erleben";
    } finally {
      if (!controller.signal.aborted) {
        loading.value = false;
        await nextTick();
        heading.value?.focus({ preventScroll: true });
      }
    }
  },
  { immediate: true },
);
watch(
  () => [route.name, group.value?.name],
  () => {
    if (group.value)
      document.title = `${route.name === "signup" ? "Anmeldung · " : ""}${group.value.name} · Weihnachten neu erleben`;
  },
);
</script>
<template>
  <section
    v-if="loading"
    class="state-panel"
    aria-live="polite"
    aria-busy="true"
  >
    <span class="loader" aria-hidden="true"></span>
    <h1>Wir finden deinen Platz.</h1>
    <p>Die Gruppen werden geladen …</p>
  </section>
  <section v-else-if="error" class="state-panel" role="alert">
    <div class="eyebrow">GRUPPEN-HOMEPAGE</div>
    <h1 ref="heading" tabindex="-1">Gerade nicht erreichbar.</h1>
    <p>{{ error }}</p>
    <UiButton @click="retry++">Erneut versuchen</UiButton
    ><RouterLink class="text-link" to="/">Zum Einstieg</RouterLink>
  </section>
  <template v-else-if="group">
    <PageHero
      :title="group.name"
      :image="headerImage"
      @image-error="headerImageFailed"
    >
      <template #breadcrumbs>
        <nav class="breadcrumbs" aria-label="Brotkrumennavigation">
          <template v-for="(ancestor, index) in ancestors" :key="ancestor.id"
            ><RouterLink
              :to="destination(ancestor.id, ancestors.slice(0, index))"
              >{{ ancestor.name }}</RouterLink
            ><span aria-hidden="true">/</span></template
          >
          <template v-if="route.name === 'signup'">
            <RouterLink :to="{ name: 'group', params: route.params }">{{
              group.name
            }}</RouterLink>
            <span aria-hidden="true">/</span
            ><span aria-current="page">Anmeldung</span>
          </template>
          <span v-else aria-current="page">{{
            ancestors.length ? group.name : "Mitmachen"
          }}</span>
        </nav>
      </template>
      <template #title
        ><span ref="heading" tabindex="-1">{{ group.name }}</span></template
      >
    </PageHero>
    <RouterView v-if="route.name === 'signup'" v-slot="{ Component }">
      <component :is="Component" :group="group" />
    </RouterView>
    <template v-else>
      <section v-if="isBranch" id="groups" class="groups-section">
        <MarkdownText
          v-if="group.information.note"
          class="category-description"
          :text="group.information.note"
        />
        <div v-if="children.length > 3" class="search-field">
          <label for="search">In diesem Bereich suchen</label
          ><input
            id="search"
            v-model="search"
            type="search"
            placeholder="Name eines Teams oder Bereichs"
          />
        </div>
        <div v-if="!ancestors.length && filtered.length" class="group-grid">
          <GroupListItem
            v-for="child in filtered"
            :key="child.id"
            :group="child"
            :children="visibleChildren(child, hierarchy)"
            :to="destination(child.id, [group])"
            tall
          />
        </div>
        <div v-if="ancestors.length && categories.length" class="group-list">
          <GroupListItem
            v-for="child in categories"
            :key="child.id"
            :group="child"
            :children="visibleChildren(child, hierarchy)"
            :to="destination(child.id, [...ancestors, group])"
          />
        </div>
        <div v-if="ancestors.length && teams.length" class="group-grid">
          <GroupCard
            v-for="(child, index) in teams"
            :key="child.id"
            :group="child"
            :index="index"
            :to="destination(child.id, [...ancestors, group])"
          />
        </div>
        <p v-if="!filtered.length" class="empty-state">
          {{
            search
              ? "Keine passende Gruppe gefunden. Probiere einen anderen Suchbegriff."
              : "Hier sind derzeit keine öffentlichen Untergruppen verfügbar."
          }}
        </p>
      </section>
      <section v-else class="team-section">
        <div class="team-content">
          <MarkdownText
            v-if="group.information.note"
            :text="group.information.note"
          />
          <GroupDetails :group="group" />
        </div>
        <aside class="signup-panel">
          <h3>{{ group.signUpHeadline || "Anmeldung" }}</h3>
          <template v-if="group.canSignUp">
            <p v-if="isDemo">In dieser Vorschau ist keine Anmeldung möglich.</p>
            <UiButton
              v-if="!isDemo"
              :to="{ name: 'signup', params: route.params }"
              >Zur Anmeldung</UiButton
            >
            <span v-else class="demo-label">Beispielteam</span></template
          >
          <p v-else>
            Für dieses Team ist aktuell keine öffentliche Anmeldung möglich.
          </p>
        </aside>
      </section>
      <div v-if="ancestors.length" class="back-row">
        <RouterLink
          class="back-link"
          :to="
            destination(
              ancestors[ancestors.length - 1]!.id,
              ancestors.slice(0, -1),
            )
          "
          >← Zurück zu {{ ancestors[ancestors.length - 1]!.name }}</RouterLink
        >
      </div>
    </template>
  </template>
</template>
