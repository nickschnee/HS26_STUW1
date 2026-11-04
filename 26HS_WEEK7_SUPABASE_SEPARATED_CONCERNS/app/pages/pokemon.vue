<script setup>
const { data: allPokemon, error } = await usePokemon()

// the team now comes from the database (through our own API)
const { team, error: teamError, addPokemon, removePokemon } = await useTeam()

const search = ref('')

const isTeamFull = computed(() => team.value.length >= 3)
const teamCount = computed(() => team.value.length)

// all Pokémon that are not in the team and match the search text
const filteredPokemon = computed(() => {
  return allPokemon.value.filter((pokemon) =>
    !team.value.some((member) => member.id === pokemon.id) &&
    pokemon.name.toLowerCase().includes(search.value.toLowerCase())
  )
})

function addToTeam(pokemon) {
  if (!isTeamFull.value) {
    addPokemon(pokemon)
  } else {
    alert('Team is full!')
  }
}
</script>

<template>
  <h2 :class="{ red: isTeamFull }">Dein Team hat {{ teamCount }} Pokemon:</h2>

  <p v-if="teamError">Das Team konnte nicht geladen werden.</p>

  <p v-else-if="team.length === 0">Füge ein Pokemon in dein Team ein!</p>

  <div v-else class="grid">
    <PokemonCard
      :pokemonArray="team"
      @selectPokemon="removePokemon"
    />
  </div>

  <h2>Wähle ein Pokemon aus, um es dem Team hinzuzufügen:</h2>

  <input v-model="search" type="text" placeholder="Pokemon suchen ...">

  <p v-if="error">Die Pokemon konnten nicht geladen werden.</p>

  <div v-else class="grid">
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
