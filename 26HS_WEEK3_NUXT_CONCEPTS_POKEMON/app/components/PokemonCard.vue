<script setup>

//props: Data coming in from Parent
defineProps({
  pokemonArray: Object,
})

defineEmits(['selectPokemon']);


</script>

<template>

  <div
      @click="$emit('selectPokemon', pokemon)"
      class="card"
      v-for="pokemon in pokemonArray"
      :key="pokemon.id">

    <img :src="pokemon.image" :alt="pokemon.name + 'Pokemon'">

    <h2> {{pokemon.name}}</h2>

  </div>

</template>

<style>

.card {
  width: 170px;
  padding: 12px;
  border: 2px solid black;
  border-radius: 10px;
  background-color: bisque;
}

</style>