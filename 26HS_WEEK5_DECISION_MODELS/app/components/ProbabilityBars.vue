<script setup>
// Shows one bar per option, sorted from highest to lowest.
// values: { red: 0.8, blue: 0.15, ... }
const props = defineProps({
  values: Object,
  // "percent" for probabilities (0–1), "number" for similarity scores
  format: { type: String, default: 'percent' },
  // optional: a CSS color per option, e.g. { red: '#e53935' }
  colors: { type: Object, default: () => ({}) },
})

const rows = computed(() => {
  const entries = Object.entries(props.values).sort((a, b) => b[1] - a[1])
  const highest = entries[0]?.[1] ?? 1
  const lowest = entries.at(-1)?.[1] ?? 0

  return entries.map(([label, value]) => ({
    label,
    value,
    // probabilities fill the bar by their own size.
    // Similarity scores are all close together (e.g. 0.62–0.66), so the bar
    // goes from the lowest score (empty) to the highest score (full).
    width: props.format === 'percent'
      ? value * 100
      : 5 + ((value - lowest) / (highest - lowest || 1)) * 95,
    text: props.format === 'percent' ? `${Math.round(value * 100)} %` : value.toFixed(3),
  }))
})
</script>

<template>
  <div class="bars">
    <div v-for="(row, index) in rows" :key="row.label" class="row" :class="{ winner: index === 0 }">
      <span class="label">{{ row.label }}</span>
      <div class="track">
        <div class="bar" :style="{ width: row.width + '%', backgroundColor: colors[row.label] || 'steelblue' }" />
      </div>
      <span class="value">{{ row.text }}</span>
    </div>
  </div>
</template>

<style scoped>
.bars {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.row {
  display: grid;
  grid-template-columns: 120px 1fr 70px;
  align-items: center;
  gap: 10px;
}

.winner {
  font-weight: bold;
}

.track {
  height: 18px;
  background-color: #eee;
  border-radius: 9px;
  overflow: hidden;
}

.bar {
  height: 100%;
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 9px;
  box-sizing: border-box;
  transition: width 0.4s;
}

.value {
  text-align: right;
  font-variant-numeric: tabular-nums;
}
</style>
