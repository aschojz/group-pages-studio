<script setup lang="ts">
import { computed } from "vue";
import { safeImageUrl } from "../services/publicGroups";
const props = defineProps<{ text: string }>();
// CT privacy labels contain links. Render only text and safe links, never raw HTML.
const parts = computed(() => {
  const doc = new DOMParser().parseFromString(props.text, "text/html");
  const result: { text: string; href?: string }[] = [];
  function visit(node: Node) {
    if (node.nodeType === Node.TEXT_NODE)
      result.push({ text: node.textContent || "" });
    else if (node instanceof Element) {
      if (["SCRIPT", "STYLE", "IFRAME"].includes(node.tagName)) return;
      if (node.tagName === "A")
        result.push({
          text: node.textContent || "",
          href: safeImageUrl(node.getAttribute("href")),
        });
      else if (node.tagName === "BR") result.push({ text: " " });
      else node.childNodes.forEach(visit);
    }
  }
  doc.body.childNodes.forEach(visit);
  return result;
});
</script>
<template>
  <template v-for="(part, index) in parts" :key="index"
    ><a
      v-if="part.href"
      :href="part.href"
      target="_blank"
      rel="noopener noreferrer"
      >{{ part.text }}</a
    ><template v-else>{{ part.text }}</template></template
  >
</template>
