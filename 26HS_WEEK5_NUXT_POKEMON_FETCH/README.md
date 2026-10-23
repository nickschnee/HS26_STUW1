# Week 5: Fetching Pokémon from the PokéAPI

This project starts from [`26HS_WEEK3_NUXT_POKEMON_CLEAN`](../26HS_WEEK3_NUXT_POKEMON_CLEAN/README.md). The only change: the Pokémon no longer come from the local file `data/pokemon.js`. They are loaded from the [PokéAPI](https://pokeapi.co) through a **composable**.

## Running the project

```bash
npm install
npm run dev
```

Then open `http://localhost:3000/pokemon`.

## What changed

| File | Change |
| ---- | ------ |
| `app/data/pokemon.js` | Deleted |
| `app/composables/usePokemon.js` | New: loads the Pokémon from the API |
| `app/pages/pokemon.vue` | Uses `usePokemon()` instead of the import and shows a message if loading fails |

## What is a composable?

A composable is a function that wraps reusable logic, often logic that uses Vue features like `ref` or `computed`. By convention its name starts with `use`.

Nuxt **auto-imports** every composable in `app/composables/`. That's why `pokemon.vue` calls `usePokemon()` without an `import`.

Moving the fetch into a composable keeps the page small. The page doesn't need to know the API URL or what the response looks like. It just gets a list of Pokémon.

## `app/composables/usePokemon.js`

```js
export function usePokemon() {
  return useFetch(API_URL, {
    query: { limit: 151 },
    default: () => [],
    transform: (response) => response.results.map(toPokemon),
  })
}
```

- **`useFetch`** is Nuxt's built-in way to load data. It runs on the server during the first page load, so the HTML already contains the Pokémon. The browser doesn't fetch them a second time.
- **`query: { limit: 151 }`** becomes `?limit=151` in the URL. That gives us the first generation.
- **`default: () => []`** means `data` is an empty array, not `null`, until the data arrives (or if it fails). So `.filter()` in the page always works.
- **`transform`** reshapes the API response before it goes into `data`.

The API response looks like this:

```json
{
  "count": 1351,
  "next": "https://pokeapi.co/api/v2/pokemon?offset=151&limit=151",
  "previous": null,
  "results": [
    { "name": "bulbasaur", "url": "https://pokeapi.co/api/v2/pokemon/1/" },
    { "name": "ivysaur", "url": "https://pokeapi.co/api/v2/pokemon/2/" }
  ]
}
```

`toPokemon` turns each entry into the same shape our old data file used, so `PokemonCard` didn't need any changes:

```js
{ id: 1, name: 'Bulbasaur', image: 'https://raw.githubusercontent.com/.../1.png' }
```

- The **id** is read from the URL (`.../pokemon/1/` → `1`)
- The **name** gets a capital first letter (`bulbasaur` → `Bulbasaur`)
- The **image** is built from the id. It's the same sprite URL as before.

## `app/pages/pokemon.vue`

```js
const { data: allPokemon, error } = await usePokemon()
```

- `useFetch` returns several refs. We only need `data` (renamed to `allPokemon`) and `error`.
- `await` makes Nuxt wait until the data is loaded before it shows the page.
- `allPokemon` is now a **ref**, so the `computed` uses `allPokemon.value.filter(...)`. Before, it was `allPokemon.filter(...)`.
- If the request fails, `error` is set and the template shows a message (`v-if="error"`) instead of the grid.

## What was left out

The old data file also had `type` and `hp`. The list endpoint doesn't include them. You would need one extra request per Pokémon (`/pokemon/1`, `/pokemon/2`, …). The cards never showed these fields, so we left them out.

Ideas to try next:

- Add `lazy: true` to `useFetch` and show a loading text with `status === 'pending'`
- Make the limit a parameter: `usePokemon(20)`
- Build a detail page `pages/pokemon/[id].vue` that loads one Pokémon with its types and stats
