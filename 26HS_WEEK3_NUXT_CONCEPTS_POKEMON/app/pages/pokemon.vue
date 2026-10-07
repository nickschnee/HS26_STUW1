<script setup>

import allPokemon from '~/data/pokemon.js'

console.log(allPokemon);

const team = ref([])

const search = ref('')

const isTeamFull = computed(() => team.value.length >= 3);

const teamCount = computed(() => team.value.length);

function addToTeam(pokemon){
  //alert('add new Pokemon ' + pokemon.name);

  // ist das team voll?
  if (!isTeamFull.value){

  team.value.push(pokemon);
  console.log(team.value);

  } else {
    alert('Team is full!')
  }

}

function removeFromTeam(pokemon){
  team.value = team.value.filter((teamPokemon) => teamPokemon !== pokemon)
}

const filteredPokemon = computed(() => {

  return allPokemon.filter((pokemon) => !team.value.includes(pokemon) && pokemon.name.toLowerCase().includes(search.value.toLowerCase()));

});

</script>

<template>

  <h2 :class="{red: isTeamFull}"> Dein Team hat {{teamCount}} Pokemon:</h2>

  <p v-if="team.length == 0"> Füge ein Pokemon in dein Team ein!</p>

  <div v-else>

    <div class="grid">
      <PokemonCard
          :pokemonArray="team"
          @selectPokemon="removeFromTeam">
      </PokemonCard>
    </div>

  </div>

  <h2> Wähle ein Pokemon aus, um es dem Team hinzuzufügen:</h2>

  <input v-model="search" type="text" placeholder="Pokemon suchen ...">

  <div class="grid">
    <PokemonCard
    :pokemonArray="filteredPokemon"
    @selectPokemon="addToTeam">
    </PokemonCard>
  </div>

</template>

<style>

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