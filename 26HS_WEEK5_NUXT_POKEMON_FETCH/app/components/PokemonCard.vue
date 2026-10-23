<script setup>
// Props: data coming in from the parent
defineProps({
  pokemonArray: Array,
})

// Emits: events going out to the parent
defineEmits(['selectPokemon'])
</script>

<template>
  <div
    v-for="pokemon in pokemonArray"
    :key="pokemon.id"
    class="card"
    @click="$emit('selectPokemon', pokemon)"
  >
    <img :src="pokemon.image" :alt="pokemon.name + ' Pokemon'">

    <h2>{{ pokemon.name }}</h2>
  </div>
</template>

<style scoped>
.card {
  width: 170px;
  padding: 12px;
  border: 2px solid black;
  border-radius: 10px;
  background-color: bisque;
}
</style>
