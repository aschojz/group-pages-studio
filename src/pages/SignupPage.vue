<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import UiButton from "../components/UiButton.vue";
import SignupFieldInput from "../components/SignupField.vue";
import {
  buildHierarchy,
  getGroupHomepage,
  resolveGroupPath,
  isDemo,
  type PublicGroup,
} from "../services/publicGroups";
import {
  fieldKey,
  initialValues,
  loadSignupForm,
  requestSignupToken,
  signupPayload,
  signupStatus,
  submitSignup,
  SignupError,
  type FieldValue,
  type SignupField,
  type SignupResult,
} from "../services/signup";
const props = defineProps<{ group: PublicGroup }>();
const route = useRoute();
const router = useRouter();
const group = ref<PublicGroup>(props.group);
const loading = ref(true);
const sending = ref(false);
const emailStep = ref(false);
const mailSent = ref(false);
const email = ref("");
const token = ref("");
const fields = ref<SignupField[]>([]);
const values = ref<Record<string, FieldValue>>({});
const personId = ref<number | null>(null);
const privacyForSelf = ref<SignupField[]>([]);
const fieldErrors = ref<Record<string, string>>({});
const error = ref("");
const result = ref<SignupResult>();
const retry = ref(0);
const formElement = ref<HTMLFormElement>();
const titleElement = ref<HTMLElement>();
let activeController: AbortController;
const detailRoute = computed(() => ({ name: "group", params: route.params }));
const status = computed(() =>
  group.value ? signupStatus(group.value) : undefined,
);
const supported = new Set([
  "text",
  "date",
  "datetime",
  "textarea",
  "checkbox",
  "number",
  "select",
  "multiselect",
  "radioselect",
  "hidden",
]);
const unsupported = computed(() =>
  fields.value.some(
    (f) =>
      !supported.has(f.fieldTypeCode) &&
      !(f.fieldTypeCode === "api" && f.options?.length),
  ),
);
const action = computed(() =>
  status.value?.waiting
    ? "Auf die Warteliste anmelden"
    : status.value?.application
      ? "Bewerbung absenden"
      : "Anmeldung absenden",
);
function resumeUrl() {
  return `${window.location.origin}${window.location.pathname}${router.resolve({ name: "signup", params: route.params }).href}?token=$token`;
}
async function readForm(signupToken: string, signal: AbortSignal) {
  const data = await loadSignupForm(group.value!.id, signupToken, signal);
  if (signal.aborted) return;
  // The form endpoint does not enrich roles, so its role-dependent signup flags
  // may be false even for an open group. Use the freshly loaded homepage flags.
  group.value = {
    ...data.group,
    canSignUp: group.value!.canSignUp,
    signUpConditions: group.value!.signUpConditions,
  };
  const self = data.signUpPersons?.find(
    (p) => p.person.domainIdentifier === String(data.requesterId),
  );
  if (data.requesterId && !self)
    throw new Error(
      "Die anmeldende Person konnte nicht eindeutig zugeordnet werden. Bitte starte über den ChurchTools-Anmeldelink erneut.",
    );
  if (self && ["IN_GROUP", "REQUESTED"].includes(self.status))
    throw new Error(
      self.status === "IN_GROUP"
        ? "Du bist bereits in diesem Team angemeldet."
        : "Deine Anmeldung für dieses Team liegt bereits vor.",
    );
  personId.value = self ? Number(self.person.domainIdentifier) : null;
  if (
    personId.value === null &&
    group.value.signUpConditions?.canSignUpAsNewPerson === false
  )
    throw new Error(
      "Dieses Team erlaubt aktuell keine Anmeldung neuer Personen.",
    );
  fields.value = [...data.form].sort((a, b) => a.sortKey - b.sortKey);
  values.value = initialValues(fields.value, self?.formData);
  if (data.email) {
    const field = fields.value.find((f) => f.name === "email");
    if (field && !values.value[fieldKey(field)])
      values.value[fieldKey(field)] = data.email;
  }
  // Existing persons confirm their own privacy once; never sign up anyone else.
  privacyForSelf.value =
    self && self.hasAcceptedPrivacy === false
      ? (data.acceptPrivacyForSelfForm ?? [])
      : [];
  Object.assign(values.value, initialValues(privacyForSelf.value));
  token.value = data.token || signupToken;
  emailStep.value = false;
}
function showError(cause: unknown) {
  error.value =
    cause instanceof Error
      ? cause.message
      : "Die Anmeldung konnte nicht geladen werden.";
  if (cause instanceof SignupError) {
    for (const item of cause.fields) {
      const index = item.fieldId.match(/forms\[0\]\.form\[(\d+)\]/)?.[1];
      const field =
        index !== undefined
          ? fields.value[Number(index)]
          : fields.value.find(
              (f) => fieldKey(f) === item.fieldId || f.name === item.fieldId,
            );
      if (field)
        fieldErrors.value[fieldKey(field)] =
          item.message || "Bitte prüfe dieses Feld.";
      if (item.fieldId === "hasAcceptedPrivacyForOther")
        for (const f of privacyForSelf.value)
          fieldErrors.value[fieldKey(f)] =
            item.message || "Bitte bestätige die Datenschutzzustimmung.";
    }
  }
}
watch(
  () => [
    route.params.homepageHash,
    route.params.groupIds,
    route.query.token,
    retry.value,
  ],
  async (_, __, onCleanup) => {
    const controller = new AbortController();
    activeController = controller;
    onCleanup(() => controller.abort());
    loading.value = true;
    sending.value = false;
    error.value = "";
    result.value = undefined;
    group.value = props.group;
    fields.value = [];
    values.value = {};
    token.value = "";
    email.value = "";
    mailSent.value = false;
    emailStep.value = false;
    privacyForSelf.value = [];
    fieldErrors.value = {};
    try {
      if (retry.value > 0) {
        const homepage = await getGroupHomepage(
          route.params.homepageHash,
          controller.signal,
          true,
        );
        const groups = buildHierarchy(homepage);
        const path = resolveGroupPath(route.params.groupIds, groups);
        if (controller.signal.aborted) return;
        group.value = path[path.length - 1]!;
      }
      document.title = `Anmeldung · ${group.value.name} · Weihnachten neu erleben`;
      if (isDemo && route.params.homepageHash === "demo")
        throw new Error(
          "In der Designvorschau ist keine echte Anmeldung möglich.",
        );
      if (!signupStatus(group.value).open) return;
      const existingToken =
        typeof route.query.token === "string" ? route.query.token : undefined;
      if (existingToken) await readForm(existingToken, controller.signal);
      else if ((group.value.settings?.emailVerificationMode ?? "all") === "all")
        emailStep.value = true;
      else {
        const response = await requestSignupToken(
          group.value.id,
          String(route.params.homepageHash),
          controller.signal,
        );
        if (controller.signal.aborted) return;
        if (!response.token)
          throw new Error(
            "ChurchTools hat keinen Anmeldelink geliefert. Bitte starte die Anmeldung erneut.",
          );
        await readForm(response.token, controller.signal);
      }
    } catch (cause) {
      if (!controller.signal.aborted) showError(cause);
    } finally {
      if (!controller.signal.aborted) {
        loading.value = false;
        await nextTick();
        titleElement.value?.focus({ preventScroll: true });
      }
    }
  },
  { immediate: true },
);
async function sendEmail() {
  if (sending.value || !group.value || !email.value) return;
  sending.value = true;
  error.value = "";
  const signal = activeController.signal;
  try {
    const response = await requestSignupToken(
      group.value.id,
      String(route.params.homepageHash),
      signal,
      email.value,
      resumeUrl(),
    );
    if (signal.aborted) return;
    if (response.token) await readForm(response.token, signal);
    else if (response.success) mailSent.value = true;
    else throw new Error("ChurchTools hat keinen Anmeldelink geliefert.");
  } catch (cause) {
    if (!signal.aborted) showError(cause);
  } finally {
    if (!signal.aborted) sending.value = false;
  }
}
async function send() {
  if (
    sending.value ||
    !group.value ||
    !token.value ||
    !status.value?.open ||
    unsupported.value ||
    !formElement.value?.reportValidity()
  )
    return;
  sending.value = true;
  error.value = "";
  fieldErrors.value = {};
  const signal = activeController.signal;
  try {
    const payload = signupPayload(
      token.value,
      fields.value,
      values.value,
      personId.value,
    );
    const withPrivacy = privacyForSelf.value.length
      ? {
          ...payload,
          hasAcceptedPrivacyForOther: privacyForSelf.value.every(
            (f) => values.value[fieldKey(f)] === true,
          ),
        }
      : payload;
    const response = await submitSignup(group.value.id, withPrivacy, signal);
    if (signal.aborted) return;
    result.value = response;
    values.value = {};
    token.value = "";
    await nextTick();
    titleElement.value?.focus({ preventScroll: true });
  } catch (cause) {
    if (!signal.aborted) {
      showError(cause);
      await nextTick();
      formElement.value
        ?.querySelector<HTMLElement>('[aria-invalid="true"]')
        ?.focus();
    }
  } finally {
    if (!signal.aborted) sending.value = false;
  }
}
</script>
<template>
  <section class="signup-section">
    <div
      v-if="loading"
      class="signup-loading"
      aria-live="polite"
      aria-busy="true"
    >
      <span class="loader" aria-hidden="true"></span>
      <h2>{{ group?.signUpHeadline || "Anmeldung" }}</h2>
      <p>Das Formular wird geladen …</p>
    </div>
    <template v-else>
      <div v-if="result" class="signup-feedback" role="status">
        <h2>
          {{
            result.verificationNotice
              ? "Bitte bestätige deine E-Mail"
              : status?.waiting
                ? "Dein Platz auf der Warteliste ist angefragt"
                : status?.application
                  ? "Deine Bewerbung ist eingegangen"
                  : "Du bist angemeldet"
          }}
        </h2>
        <p v-if="result.verificationNotice">
          {{
            result.verificationEmail
              ? `Wir haben eine E-Mail an ${result.verificationEmail} geschickt.`
              : "Wir haben dir eine E-Mail geschickt."
          }}
          Öffne den Link darin, um deine Anmeldung zu bestätigen.
        </p>
        <p v-else-if="status?.waiting">
          Die Teamleitung meldet sich, sobald ein Platz frei wird.
        </p>
        <p v-else-if="status?.application">
          Die Teamleitung prüft deine Anfrage.
        </p>
        <p v-else>
          Deine Anmeldung wurde erfolgreich an ChurchTools übermittelt.
        </p>
        <RouterLink class="back-link signup-back" :to="detailRoute"
          >← Zurück zum Team</RouterLink
        >
      </div>
      <div v-else-if="mailSent" class="signup-feedback" role="status">
        <h2>Prüfe dein E-Mail-Postfach</h2>
        <p>Öffne den Anmeldelink in der E-Mail, um das Formular auszufüllen.</p>
        <RouterLink class="back-link signup-back" :to="detailRoute"
          >← Zurück zum Team</RouterLink
        >
      </div>
      <template v-else>
        <h2 ref="titleElement" tabindex="-1">
          {{ group?.signUpHeadline || "Anmeldung" }}
        </h2>
        <p v-if="group && !status?.open" class="signup-status">
          {{ status?.reason }}
        </p>
        <template v-else>
          <p v-if="status?.waiting" class="signup-status">
            Dieses Team ist voll. Du kannst dich auf die Warteliste anmelden.
          </p>
          <p v-else-if="status?.application" class="signup-status">
            Die Teamleitung prüft deine Anmeldung anschließend.
          </p>
          <div v-if="error" class="signup-error" role="alert">
            <p>{{ error }}</p>
            <UiButton
              v-if="!fields.length && !emailStep"
              secondary
              @click="retry++"
              >Erneut laden</UiButton
            >
          </div>
          <form
            v-if="emailStep"
            class="signup-form"
            @submit.prevent="sendEmail"
          >
            <p>
              Für dieses Team wird zuerst deine E-Mail-Adresse bestätigt. Wir
              schicken dir einen Link zum Formular.
            </p>
            <fieldset :disabled="sending">
              <div class="signup-field">
                <label for="signup-email">E-Mail *</label
                ><input
                  id="signup-email"
                  v-model="email"
                  type="email"
                  autocomplete="email"
                  required
                />
              </div>
              <UiButton type="submit" :disabled="sending">{{
                sending ? "Wird gesendet …" : "Anmeldelink anfordern"
              }}</UiButton>
            </fieldset>
          </form>
          <form
            v-else-if="token"
            ref="formElement"
            class="signup-form"
            :aria-busy="sending"
            @submit.prevent="send"
          >
            <p class="required-note">
              Mit * gekennzeichnete Felder sind Pflichtfelder.
            </p>
            <fieldset :disabled="sending">
              <SignupFieldInput
                v-for="field in fields"
                :key="fieldKey(field)"
                :field="field"
                :model-value="values[fieldKey(field)] ?? null"
                :error="fieldErrors[fieldKey(field)]"
                @update:model-value="values[fieldKey(field)] = $event"
              /><SignupFieldInput
                v-for="field in privacyForSelf"
                :key="fieldKey(field)"
                :field="field"
                :model-value="values[fieldKey(field)] ?? false"
                :error="fieldErrors[fieldKey(field)]"
                @update:model-value="values[fieldKey(field)] = $event"
              />
              <p v-if="unsupported" role="alert">
                Ein Feldtyp dieses Formulars wird noch nicht unterstützt. Die
                Anmeldung kann deshalb hier noch nicht abgeschickt werden.
              </p>
              <UiButton type="submit" :disabled="sending || unsupported">{{
                sending ? "Wird gesendet …" : action
              }}</UiButton>
            </fieldset>
          </form>
        </template>
        <RouterLink class="back-link signup-back" :to="detailRoute"
          >← Zurück zum Team</RouterLink
        >
      </template>
    </template>
  </section>
</template>
