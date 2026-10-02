<script setup lang="ts">
import { computed } from "vue";
import FormLabel from "./FormLabel.vue";
import {
  fieldKey,
  type SignupField,
  type FieldValue,
} from "../services/signup";
const props = defineProps<{
  field: SignupField;
  error?: string;
  modelValue: FieldValue;
}>();
const emit = defineEmits<{ "update:modelValue": [value: FieldValue] }>();
const id = computed(() => `signup-${fieldKey(props.field)}`);
const inputType = computed(() =>
  props.field.name === "email"
    ? "email"
    : /phone|mobile/i.test(props.field.name)
      ? "tel"
      : props.field.fieldTypeCode === "datetime"
        ? "datetime-local"
        : ["date", "number"].includes(props.field.fieldTypeCode)
          ? props.field.fieldTypeCode
          : "text",
);
const autocomplete = computed(
  () =>
    ({
      firstName: "given-name",
      lastName: "family-name",
      email: "email",
      street: "street-address",
      city: "address-level2",
      zip: "postal-code",
      birthday: "bday",
      phone: "tel",
      mobile: "tel",
    })[props.field.name] || "off",
);
function update(event: Event) {
  const input = event.target as HTMLInputElement;
  emit(
    "update:modelValue",
    props.field.fieldTypeCode === "number"
      ? input.value === ""
        ? ""
        : Number(input.value)
      : input.value,
  );
}
</script>
<template>
  <div
    v-if="field.fieldTypeCode !== 'hidden'"
    class="signup-field"
    :class="{ 'checkbox-field': field.fieldTypeCode === 'checkbox' }"
  >
    <template v-if="field.fieldTypeCode === 'checkbox'">
      <input
        :id="id"
        type="checkbox"
        :checked="modelValue === true"
        :required="field.mandatory"
        :disabled="field.readonly"
        :aria-invalid="!!error"
        :aria-describedby="error ? `${id}-error` : undefined"
        @change="
          emit('update:modelValue', ($event.target as HTMLInputElement).checked)
        "
      />
      <label :for="id"
        ><FormLabel :text="field.label" /><span
          v-if="field.mandatory"
          aria-hidden="true"
        >
          *</span
        ></label
      >
    </template>
    <template v-else>
      <label :for="id"
        ><FormLabel :text="field.label" /><span
          v-if="field.mandatory"
          aria-hidden="true"
        >
          *</span
        ></label
      >
      <textarea
        v-if="field.fieldTypeCode === 'textarea'"
        :id="id"
        :value="String(modelValue ?? '')"
        :required="field.mandatory"
        :readonly="field.readonly"
        :maxlength="field.length ?? undefined"
        :aria-invalid="!!error"
        :aria-describedby="error ? `${id}-error` : undefined"
        rows="4"
        @input="update"
      />
      <select
        v-else-if="
          ['select', 'radioselect', 'multiselect', 'api'].includes(
            field.fieldTypeCode,
          ) && field.options
        "
        :id="id"
        :value="modelValue"
        :multiple="field.fieldTypeCode === 'multiselect'"
        :required="field.mandatory"
        :disabled="field.readonly"
        :aria-invalid="!!error"
        :aria-describedby="error ? `${id}-error` : undefined"
        @change="
          emit(
            'update:modelValue',
            field.fieldTypeCode === 'multiselect'
              ? Array.from(
                  ($event.target as HTMLSelectElement).selectedOptions,
                ).map((o) => o.value)
              : ($event.target as HTMLSelectElement).value,
          )
        "
      >
        <option v-if="field.fieldTypeCode !== 'multiselect'" value="">
          Bitte auswählen
        </option>
        <option
          v-for="option in field.options"
          :key="option.id"
          :value="String(option.id)"
        >
          {{ option.name }}
        </option>
      </select>
      <input
        v-else
        :id="id"
        :type="inputType"
        :value="modelValue"
        :required="field.mandatory"
        :readonly="field.readonly"
        :maxlength="field.length ?? undefined"
        :autocomplete="autocomplete"
        :aria-invalid="!!error"
        :aria-describedby="error ? `${id}-error` : undefined"
        @input="update"
      />
    </template>
    <p v-if="field.note" class="field-note"><FormLabel :text="field.note" /></p>
    <p v-if="error" :id="`${id}-error`" class="field-error">{{ error }}</p>
  </div>
</template>
