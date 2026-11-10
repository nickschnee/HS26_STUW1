# 26HS STUW1

Code examples from class. Each folder is a standalone project with its own README.

## Projects

| Week | Project | Content |
| ---- | ------- | ------- |
| 3 | [26HS_WEEK3_NUXT_CONCEPTS_POKEMON](./26HS_WEEK3_NUXT_CONCEPTS_POKEMON/README.md) | Live coding: Nuxt pages, layouts, components and the Pokémon example with the core Vue concepts (ref, v-model, event listeners, props, emits, v-for, v-if, computed, class & style bindings). A bit messy, but documented in detail. |
| 3 | [26HS_WEEK3_NUXT_POKEMON_CLEAN](./26HS_WEEK3_NUXT_POKEMON_CLEAN/README.md) | The same code, tidied up, with a list of what was cleaned up. Has a `Dockerfile` for deploying it on Coolify. |
| 5 | [26HS_WEEK5_NUXT_POKEMON_FETCH](./26HS_WEEK5_NUXT_POKEMON_FETCH/README.md) | The clean version, but the Pokémon come from the PokéAPI. They're loaded with `useFetch` inside a `usePokemon` composable. |
| 5 | [26HS_WEEK5_DECISION_MODELS](./26HS_WEEK5_DECISION_MODELS/README.md) | Two demos with local AI models in Ollama. The camera's main color is named by the decision model Nimble, and news articles are sorted into topics. Also compares Nimble with the embedding model EmbeddingGemma 2. |
| 6 | [26HS_WEEK6_SQLITE](./26HS_WEEK6_SQLITE/readme.md) | Crash course on databases with SQLite. Covers installing the `sqlite3` CLI on Mac and Windows, DBeaver, a `users`/`posts` schema with a foreign key, simple CRUD queries and scripting with `better-sqlite3` in Node.js. Has a link to the slides. |
| 6 | [26HS_WEEK6_IMMOSCRAPER_DB](./26HS_WEEK6_IMMOSCRAPER_DB/readme.md) | A real-world SQLite database with 185k property listings from homegate.ch (2024), with images, floor plans and PDFs on immo.nickschnee.ch. The README has a UML diagram of the schema, the tables and example queries. The database is too large for the repo, download it from [immo.nickschnee.ch](https://immo.nickschnee.ch). |
| 7 | [26HS_WEEK7_SUPABASE_SEPARATED_CONCERNS](./26HS_WEEK7_SUPABASE_SEPARATED_CONCERNS/README.md) | The Pokémon from week 5, but the team is saved in Supabase. The page only calls our own API (`/api/team`), and only the server routes talk to the database, so the database can be swapped (the README shows the same routes with SQLite). Has a link to the slides. |
| 7 | [26HS_WEEK7_SUPABASE_CLIENT_LIB](./26HS_WEEK7_SUPABASE_CLIENT_LIB/README.md) | The same app without our own API: the browser talks to Supabase directly with `@supabase/supabase-js` and the publishable key. Row Level Security policies decide what is allowed. The README compares both versions and explains the RLS pitfall (an empty list instead of an error). |
| 8 | [26HS_WEEK8_SUPABASE_AUTH](./26HS_WEEK8_SUPABASE_AUTH/README.md) | The client library version with Supabase Auth: register and log in with e-mail and password. Every row has a `user_id`, and RLS policies with `auth.uid() = user_id` make sure everyone only sees their own team. Has a link to the slides. |

## Running a project

```bash
cd <project-folder>
npm install
npm run dev
```

Then open `http://localhost:3000`.

`26HS_WEEK5_DECISION_MODELS` also needs [Ollama](https://ollama.com) running with the models `nimble` and `embeddinggemma-2`. Its README has the details.

`26HS_WEEK7_SUPABASE_SEPARATED_CONCERNS` needs a Supabase project and a `.env` file with its URL and secret key. Its README has the setup.

`26HS_WEEK7_SUPABASE_CLIENT_LIB` needs the same Supabase project, three RLS policies and a `.env` file with the URL and the publishable key. Its README has the SQL.

`26HS_WEEK8_SUPABASE_AUTH` needs a Supabase project with the new `team` table (with `user_id`) and its policies, "Confirm email" turned off for class, and the same `.env` as the client library version. Its README has the SQL.

`26HS_WEEK6_SQLITE` has only a README and no app. Its README explains how to set up SQLite and the Node.js scripts.

`26HS_WEEK6_IMMOSCRAPER_DB` has only a README too. Download [immo.db.zip](https://immo.nickschnee.ch/immo.db.zip), unzip it and open `immo.db` with `sqlite3` or DBeaver.
