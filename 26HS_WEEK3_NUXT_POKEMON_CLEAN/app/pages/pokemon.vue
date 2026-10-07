<script setup>
import allPokemon from '~/data/pokemon.js'

const team = ref([])
const search = ref('')

const isTeamFull = computed(() => team.value.length >= 3)
const teamCount = computed(() => team.value.length)

// all Pokémon that are not in the team and match the search text
const filteredPokemon = computed(() => {
  return allPokemon.filter((pokemon) =>
    !team.value.includes(pokemon) &&
    pokemon.name.toLowerCase().includes(search.value.toLowerCase())
  )
})

function addToTeam(pokemon) {
  if (!isTeamFull.value) {
    team.value.push(pokemon)
  } else {
    alert('Team is full!')
  }
}

function removeFromTeam(pokemon) {
  team.value = team.value.filter((teamPokemon) => teamPokemon !== pokemon)
}
</script>

<template>
  <h2 :class="{ red: isTeamFull }">Dein Team hat {{ teamCount }} Pokemon:</h2>

  <p v-if="team.length === 0">Füge ein Pokemon in dein Team ein!</p>

  <div v-else class="grid">
    <PokemonCard
      :pokemonArray="team"
      @selectPokemon="removeFromTeam"
    />
  </div>

  <h2>Wähle ein Pokemon aus, um es dem Team hinzuzufügen:</h2>

  <input v-model="search" type="text" placeholder="Pokemon suchen ...">

  <div class="grid">
    <PokemonCard
      :pokemonArray="filteredPokemon"
      @selectPokemon="addToTeam"
    />
  </div>
</template>

<style scoped>
.grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

input {
  width: 170px;
  padding: 16px;
  margin-bottom: 8px;
  border: 2px solid black;
  border-radius: 10px;
}

.red {
  color: red;
}
</style>
