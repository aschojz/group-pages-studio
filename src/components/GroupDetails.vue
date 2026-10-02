<script setup lang="ts">
import { computed } from "vue";
import { safeImageUrl, type PublicGroup } from "../services/publicGroups";
const props = defineProps<{ group: PublicGroup }>();
const rows = computed(() =>
  [
    [
      "Treffen",
      [
        props.group.information.weekday?.name,
        props.group.information.meetingTime,
      ]
        .filter(Boolean)
        .join(" · "),
    ],
    ["Standort", props.group.information.campus?.name],
    ["Zielgruppe", props.group.information.targetGroup?.name],
    [
      "Altersgruppen",
      props.group.information.ageGroups?.map((g) => g.name).join(", "),
    ],
  ].filter((row) => row[1]),
);
</script>
<template>
  <dl v-if="rows.length" class="team-facts">
    <template v-for="[label, value] in rows" :key="label"
      ><dt>{{ label }}</dt>
      <dd>{{ value }}</dd></template
    >
  </dl>
  <section v-if="group.information.groupPlaces?.length" class="detail-block">
    <h3>Treffpunkt</h3>
    <div
      v-for="place in group.information.groupPlaces"
      :key="place.id"
      class="team-place"
    >
      <strong>{{ place.name || place.meetingAt }}</strong>
      <p>
        {{
          [
            place.street,
            place.addition,
            [place.zip, place.city].filter(Boolean).join(" "),
          ]
            .filter(Boolean)
            .join(", ")
        }}
      </p>
    </div>
  </section>
  <section v-if="group.information.leader?.length" class="detail-block">
    <h3>Teamleitung</h3>
    <div class="team-leaders">
      <div
        v-for="leader in group.information.leader"
        :key="leader.domainIdentifier"
        class="team-leader"
      >
        <img
          v-if="safeImageUrl(leader.imageUrl)"
          :src="safeImageUrl(leader.imageUrl)"
          alt=""
          loading="lazy"
        /><span v-else class="leader-initials">{{ leader.initials }}</span
        ><span>{{ leader.title }}</span>
      </div>
    </div>
  </section>
</template>
