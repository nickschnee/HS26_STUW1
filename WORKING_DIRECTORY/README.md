# Working directory: Pokémon app

This is where we code together in class. It starts as a copy of [`26HS_WEEK3_NUXT_POKEMON_CLEAN`](../26HS_WEEK3_NUXT_POKEMON_CLEAN/README.md): the Pokémon app from week 3, tidied up.

Right now the Pokémon come from a hard-coded list in `app/data/pokemon.js`. Step by step, we will load them from the internet instead (the [PokeAPI](https://pokeapi.co)).

## Getting started

```bash
cd WORKING_DIRECTORY
npm install
npm run dev
```

Then open `http://localhost:3000`. The routes are `/`, `/about`, `/contact` and `/pokemon`.

You need Node.js 24.22.1 or newer (`node -v` shows your version).

## What's inside

```
app/
  app.vue
  components/   MyButton, Navigation, PokemonCard
  data/         pokemon.js (the hard-coded Pokémon)
  layouts/      default, content-page
  pages/        index, about, contact, pokemon
public/         images and favicon
```

The concepts (pages, layouts, components, ref, v-model, props, emits, v-for, v-if, computed, class bindings) are explained in the [week 3 README](../26HS_WEEK3_NUXT_CONCEPTS_POKEMON/README.md).
