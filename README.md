# 26HS STUW1

Code examples from class. Each folder is a standalone project with its own README.

## Projects

| Week | Project | Content |
| ---- | ------- | ------- |
| 3 | [26HS_WEEK3_NUXT_CONCEPTS_POKEMON](./26HS_WEEK3_NUXT_CONCEPTS_POKEMON/README.md) | Live coding: Nuxt pages, layouts, components and the Pokémon example with the core Vue concepts (ref, v-model, event listeners, props, emits, v-for, v-if, computed, class & style bindings). A bit messy, but documented in detail. |
| 3 | [26HS_WEEK3_NUXT_POKEMON_CLEAN](./26HS_WEEK3_NUXT_POKEMON_CLEAN/README.md) | The same code, tidied up, with a list of what was cleaned up. Has a `Dockerfile` for deploying it on Coolify. |
| 5 | [26HS_WEEK5_NUXT_POKEMON_FETCH](./26HS_WEEK5_NUXT_POKEMON_FETCH/README.md) | The clean version, but the Pokémon come from the PokéAPI. They're loaded with `useFetch` inside a `usePokemon` composable. |
| 5 | [26HS_WEEK5_DECISION_MODELS](./26HS_WEEK5_DECISION_MODELS/README.md) | Two demos with local AI models in Ollama. The camera's main color is named by the decision model Nimble, and news articles are sorted into topics. Also compares Nimble with the embedding model EmbeddingGemma 2. |
| – | [WORKING_DIRECTORY](./WORKING_DIRECTORY/README.md) | Where we code together in class. Starts as a copy of the week 3 clean app. |

## Running a project

```bash
cd <project-folder>
npm install
npm run dev
```

Then open `http://localhost:3000`.

`26HS_WEEK5_DECISION_MODELS` also needs [Ollama](https://ollama.com) running with the models `nimble` and `embeddinggemma-2`. Its README has the details.
