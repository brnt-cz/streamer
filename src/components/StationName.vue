<script setup lang="ts">
import { computed } from 'vue'
import { parseStationName } from '../utils/countryFlags'

const props = defineProps<{ name: string }>()

const segments = computed(() => parseStationName(props.name))
</script>

<template>
  <template v-for="(segment, index) in segments" :key="index">
    <span v-if="segment.type === 'flag'" role="img" :aria-label="segment.code" :title="segment.code">{{ segment.value }}</span>
    <template v-else>{{ segment.value }}</template>
  </template>
</template>
