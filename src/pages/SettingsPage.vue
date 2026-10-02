<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import UiButton from "../components/UiButton.vue";
import {
  config,
  applyConfig,
  cloneConfig,
  defaultConfig,
  themeVariables,
  validateConfig,
  safeConfigUrl,
  type ExtensionConfig,
} from "../services/config";
import {
  adminAccess,
  configRequest,
  createConfigCategory,
  loadConfigLocation,
  permissionAllows,
  saveConfig,
  type ConfigLocation,
  ConfigApiError,
} from "../services/configStorage";
import { baseUrl } from "../services/publicGroups";
const isDevelopment = import.meta.env.DEV;
const username = ref("");
const password = ref("");
const otpCode = ref("");
const otpPersonId = ref<number>();
async function localLogin() {
  if (busy.value) return;
  busy.value = true;
  error.value = "";
  try {
    if (otpPersonId.value) {
      await configRequest("/login/totp", true, "POST", {
        code: otpCode.value,
        personId: otpPersonId.value,
      });
      otpCode.value = "";
      otpPersonId.value = undefined;
    } else {
      const response = await configRequest<{
        status: string;
        personId: number;
      }>("/login", true, "POST", {
        username: username.value,
        password: password.value,
        rememberMe: false,
      });
      if (response.status === "totp") {
        otpPersonId.value = response.personId;
        return;
      }
      if (response.status === "twoFactorSetup")
        throw new Error(
          "Bitte die Zwei-Faktor-Einrichtung zuerst direkt in ChurchTools abschließen.",
        );
    }
    await load();
  } catch (cause) {
    error.value =
      cause instanceof Error
        ? cause.message
        : "Die Anmeldung ist fehlgeschlagen.";
  } finally {
    password.value = "";
    busy.value = false;
  }
}
const draft = ref(cloneConfig(config));
const saved = ref(cloneConfig(config));
const location = ref<ConfigLocation>();
const permissions = ref<Record<string, unknown>>({});
const loading = ref(true);
const busy = ref(false);
const signedIn = ref(false);
const error = ref("");
const message = ref("");
const publicNotice = ref("");
const dirty = computed(
  () => JSON.stringify(draft.value) !== JSON.stringify(saved.value),
);
const canSave = computed(
  () =>
    !!location.value?.categoryId &&
    permissionAllows(
      permissions.value[
        location.value?.valueId ? "edit custom data" : "create custom data"
      ],
      location.value.categoryId,
    ),
);
const canCreateCategory = computed(
  () =>
    !!location.value &&
    !location.value.categoryId &&
    permissionAllows(permissions.value["create custom category"]) &&
    permissionAllows(permissions.value["view custom category"]),
);
const preview = computed(() => {
  try {
    return {
      ...themeVariables(validateConfig(draft.value)),
      background: draft.value.design.background,
      color: draft.value.design.text,
    };
  } catch {
    return {
      ...themeVariables(defaultConfig),
      background: defaultConfig.design.background,
      color: defaultConfig.design.text,
    };
  }
});
const previewLogo = computed(() =>
  safeConfigUrl(draft.value.brand.logoUrl) ? draft.value.brand.logoUrl : "",
);
const brandFields: {
  key: keyof ExtensionConfig["brand"];
  label: string;
  type?: string;
}[] = [
  { key: "name", label: "Name" },
  { key: "logoUrl", label: "Logo-Adresse" },
  { key: "websiteLabel", label: "Website-Button" },
  { key: "websiteUrl", label: "Website-Adresse" },
  { key: "headerText", label: "Text im Header" },
  { key: "footerText", label: "Text im Footer" },
  { key: "imprintUrl", label: "Impressum-Adresse" },
  { key: "privacyUrl", label: "Datenschutz-Adresse" },
];
const colors: {
  key: "background" | "text" | "surface" | "accent" | "highlight";
  label: string;
}[] = [
  { key: "background", label: "Seitenhintergrund" },
  { key: "text", label: "Schrift" },
  { key: "surface", label: "Flächen" },
  { key: "accent", label: "Auszeichnungen / Links" },
  { key: "highlight", label: "Wichtige Aktionen" },
];
const dimensions: {
  key:
    | "contentWidth"
    | "headerHeight"
    | "logoWidth"
    | "sectionSpacing"
    | "buttonPaddingY"
    | "buttonBorder"
    | "radius";
  label: string;
  min: number;
  max: number;
}[] = [
  { key: "contentWidth", label: "Inhaltsbreite", min: 800, max: 1920 },
  { key: "headerHeight", label: "Headerhöhe", min: 60, max: 160 },
  { key: "logoWidth", label: "Logobreite", min: 80, max: 300 },
  { key: "sectionSpacing", label: "Abschnittsabstand", min: 24, max: 120 },
  {
    key: "buttonPaddingY",
    label: "Button-Innenabstand oben / unten",
    min: 6,
    max: 24,
  },
  { key: "buttonBorder", label: "Button-Rahmen", min: 1, max: 4 },
  { key: "radius", label: "Eckenradius", min: 0, max: 24 },
];
async function checkPublicAccess() {
  publicNotice.value = "";
  try {
    const publicLocation = await loadConfigLocation();
    if (!publicLocation.categoryId || !publicLocation.config)
      publicNotice.value =
        "Die Konfiguration ist für Gäste noch nicht lesbar. Bitte in ChurchTools die Kategorie public-config und ihre Daten ausschließlich zum Lesen freigeben.";
  } catch {
    publicNotice.value =
      "Die Konfiguration ist für Gäste noch nicht lesbar. Bitte in ChurchTools die Extension sowie die Kategorie public-config und ihre Daten ausschließlich zum Lesen freigeben.";
  }
}
async function load() {
  loading.value = true;
  error.value = "";
  message.value = "";
  location.value = undefined;
  signedIn.value = false;
  try {
    const access = await adminAccess();
    signedIn.value = true;
    permissions.value = access.permissions;
    location.value = await loadConfigLocation(true);
    const value = location.value.config ?? cloneConfig();
    saved.value = cloneConfig(value);
    draft.value = cloneConfig(value);
    if (location.value.config) applyConfig(value);
    if (location.value.categoryId) await checkPublicAccess();
  } catch (cause) {
    error.value =
      cause instanceof Error
        ? cause.message
        : "Die Einstellungen konnten nicht geladen werden.";
  } finally {
    loading.value = false;
  }
}
async function setupCategory() {
  if (!location.value || !canCreateCategory.value || busy.value) return;
  busy.value = true;
  error.value = "";
  try {
    // Confirm absence with unrestricted category visibility before creating anything.
    const current = await loadConfigLocation(true);
    location.value = current.categoryId
      ? current
      : await createConfigCategory(current);
    permissions.value = (await adminAccess()).permissions;
    message.value =
      "Kategorie eingerichtet. Prüfe nun die Lese- und Schreibrechte für public-config in ChurchTools.";
  } catch (cause) {
    error.value =
      cause instanceof Error
        ? cause.message
        : "Die Einrichtung ist fehlgeschlagen.";
  } finally {
    busy.value = false;
  }
}
async function save() {
  if (!location.value || !canSave.value || busy.value) return;
  error.value = "";
  message.value = "";
  busy.value = true;
  try {
    const value = validateConfig(draft.value);
    // Read current IDs first: don't create a duplicate config after another admin saved.
    const current = await loadConfigLocation(true);
    if (
      !current.categoryId ||
      !permissionAllows(
        permissions.value[
          current.valueId ? "edit custom data" : "create custom data"
        ],
        current.categoryId,
      )
    )
      throw new ConfigApiError(
        403,
        "Für das Speichern fehlen die passenden CCM-Rechte.",
      );
    if (
      JSON.stringify(current.config ?? cloneConfig()) !==
      JSON.stringify(saved.value)
    )
      throw new ConfigApiError(
        409,
        "Die Einstellungen wurden inzwischen geändert. Bitte neu laden und deine Änderungen erneut prüfen.",
      );
    location.value = await saveConfig(current, value);
    saved.value = cloneConfig(value);
    draft.value = cloneConfig(value);
    applyConfig(value);
    message.value = "Die Einstellungen wurden in ChurchTools gespeichert.";
    await checkPublicAccess();
  } catch (cause) {
    error.value =
      cause instanceof Error ? cause.message : "Speichern fehlgeschlagen.";
  } finally {
    busy.value = false;
  }
}
function reset() {
  draft.value = cloneConfig();
  message.value =
    "WNE-Standardwerte in die Vorschau übernommen. Zum Übernehmen speichern.";
}
onMounted(load);
</script>
<template>
  <section class="settings-page">
    <div class="settings-intro">
      <h1>Darstellung & Einstellungen</h1>
      <p>
        Marke und Design für die gesamte Extension. Gruppeninhalte und
        Formularfelder werden weiterhin in ChurchTools gepflegt.
      </p>
    </div>
    <p v-if="loading" role="status">Einstellungen werden geladen …</p>
    <div v-if="error" class="signup-error" role="alert">{{ error }}</div>
    <p v-if="message" role="status" class="settings-notice">{{ message }}</p>
    <template v-if="!loading && !signedIn"
      ><p>Dieser Bereich verwendet deine ChurchTools-Anmeldung.</p>
      <div class="settings-actions">
        <UiButton :href="baseUrl">In ChurchTools anmelden</UiButton
        ><UiButton secondary @click="load">Anmeldung erneut prüfen</UiButton>
      </div>
      <form
        v-if="isDevelopment"
        class="signup-form settings-login"
        @submit.prevent="localLogin"
      >
        <p>
          Für die lokale Vorschau hier mit deinem ChurchTools-Konto anmelden.
        </p>
        <fieldset :disabled="busy">
          <template v-if="!otpPersonId"
            ><div class="signup-field">
              <label for="settings-username">E-Mail oder Benutzername</label
              ><input
                id="settings-username"
                v-model="username"
                autocomplete="username"
                required
              />
            </div>
            <div class="signup-field">
              <label for="settings-password">Passwort</label
              ><input
                id="settings-password"
                v-model="password"
                type="password"
                autocomplete="current-password"
                required
              /></div
          ></template>
          <div v-else class="signup-field">
            <label for="settings-otp">Bestätigungscode</label
            ><input
              id="settings-otp"
              v-model="otpCode"
              inputmode="numeric"
              autocomplete="one-time-code"
              pattern="[0-9]{6}"
              required
            />
          </div>
          <UiButton type="submit" :disabled="busy">{{
            busy
              ? "Anmeldung läuft …"
              : otpPersonId
                ? "Code bestätigen"
                : "Anmelden"
          }}</UiButton>
        </fieldset>
      </form>
    </template>

    <template v-if="!loading && signedIn">
      <div v-if="location && !location.categoryId" class="settings-notice">
        <p>
          Die CCM-Kategorie public-config ist noch nicht eingerichtet oder für
          dich nicht sichtbar.
        </p>
        <UiButton
          v-if="canCreateCategory"
          type="button"
          :disabled="busy"
          @click="setupCategory"
          >Konfigurationskategorie einrichten</UiButton
        >
        <p v-else>
          Für die Einrichtung werden „create custom category“ und Leserechte für
          alle Kategorien benötigt. Die Kategorie kann alternativ in ChurchTools
          eingerichtet werden.
        </p>
      </div>
      <p v-if="publicNotice" class="settings-notice">{{ publicNotice }}</p>
      <p v-if="location?.categoryId && !canSave" class="settings-notice">
        Du kannst die Einstellungen ansehen. Zum Speichern benötigst du
        {{ location.valueId ? "edit custom data" : "create custom data" }} für
        die Kategorie public-config.
      </p>
      <div class="settings-layout">
        <form class="signup-form settings-form" @submit.prevent="save">
          <fieldset :disabled="busy || !location">
            <legend>Marke</legend>
            <div
              v-for="field in brandFields"
              :key="field.key"
              class="signup-field"
            >
              <label :for="`brand-${field.key}`">{{ field.label }}</label
              ><input
                :id="`brand-${field.key}`"
                v-model="draft.brand[field.key]"
                :required="field.key === 'name'"
                maxlength="500"
              />
            </div>
            <div class="signup-field checkbox-field">
              <input
                id="logo-invert"
                v-model="draft.design.logoInvert"
                type="checkbox"
              />
              <label for="logo-invert"
                >Logo invertieren (für dunkle Hintergründe)</label
              >
            </div>
          </fieldset>
          <fieldset :disabled="busy || !location">
            <legend>Farben & Schrift</legend>
            <div v-for="field in colors" :key="field.key" class="signup-field">
              <label :for="`color-${field.key}`">{{ field.label }}</label>
              <div class="color-control">
                <input
                  type="color"
                  :value="draft.design[field.key]"
                  :aria-label="`${field.label} auswählen`"
                  @input="
                    draft.design[field.key] = (
                      $event.target as HTMLInputElement
                    ).value
                  "
                /><input
                  :id="`color-${field.key}`"
                  v-model="draft.design[field.key]"
                  pattern="#[a-fA-F0-9]{6}"
                  required
                  maxlength="7"
                />
              </div>
            </div>
            <div class="signup-field">
              <label for="font">Schrift</label
              ><select id="font" v-model="draft.design.font">
                <option value="Montserrat">Montserrat</option>
                <option value="system">Systemschrift</option>
              </select>
            </div>
          </fieldset>
          <fieldset :disabled="busy || !location">
            <legend>Größen & Abstände</legend>
            <div
              v-for="field in dimensions"
              :key="field.key"
              class="signup-field"
            >
              <label :for="`size-${field.key}`">{{ field.label }} (px)</label
              ><input
                :id="`size-${field.key}`"
                v-model.number="draft.design[field.key]"
                type="number"
                :min="field.min"
                :max="field.max"
                required
              />
            </div>
          </fieldset>
          <div class="settings-actions">
            <UiButton type="submit" :disabled="busy || !canSave || !dirty">{{
              busy ? "Wird gespeichert …" : "Speichern"
            }}</UiButton
            ><UiButton secondary type="button" :disabled="busy" @click="reset"
              >Auf Standard zurücksetzen</UiButton
            ><UiButton secondary type="button" :disabled="busy" @click="load"
              >Neu laden</UiButton
            >
          </div>
          <p class="required-note">
            Die Vorschau ändert noch keine gespeicherten Einstellungen.
            „Speichern“ übernimmt die Werte für alle Seiten.
          </p>
        </form>
        <aside class="settings-preview" aria-label="Designvorschau">
          <h2>Vorschau</h2>
          <div class="preview-frame" :style="preview">
            <div class="preview-header">
              <img
                v-if="previewLogo"
                :src="previewLogo"
                :alt="draft.brand.name"
              /><span v-else>{{ draft.brand.name }}</span
              ><small>{{ draft.brand.headerText }}</small>
            </div>
            <div class="preview-content">
              <span class="preview-accent">Deine Teams</span>
              <h3>Gemeinsam mitmachen</h3>
              <p>
                So erscheinen Texte, Flächen und Aktionen mit deinen
                Einstellungen.
              </p>
              <div class="preview-card">
                <h4>Beispielteam</h4>
                <p>Ein Platz für deine Ideen.</p>
              </div>
              <div class="settings-actions">
                <UiButton type="button">Zur Anmeldung</UiButton
                ><UiButton secondary type="button">{{
                  draft.brand.websiteLabel || "Zur Website"
                }}</UiButton>
              </div>
            </div>
            <div class="preview-footer">
              <strong>{{ draft.brand.name }}</strong>
              <p>{{ draft.brand.footerText }}</p>
            </div>
          </div>
        </aside>
      </div>
    </template>
  </section>
</template>
