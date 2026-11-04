# Week 7: Saving the Pokémon team in Supabase

This project starts from [`26HS_WEEK5_NUXT_POKEMON_FETCH`](../26HS_WEEK5_NUXT_POKEMON_FETCH/README.md). The only change: the **team** is no longer a `ref([])` that is gone after a reload. It is saved in a [Supabase](https://supabase.com) database.

The Vue page never talks to Supabase. It talks to our own API (`/api/team`), and only the server talks to the database. This is called **separation of concerns**, and it's why we could swap Supabase for another database without touching the frontend.

For comparison, [`26HS_WEEK7_SUPABASE_CLIENT_LIB`](../26HS_WEEK7_SUPABASE_CLIENT_LIB/README.md) is the same app without our own API: the browser talks to Supabase directly.

## Slides

[Supabase](https://docs.google.com/presentation/d/1VzaeCR_JQaP07y24gOSa0C25YC8pVKok4qsCuTKejBM/edit?usp=sharing)

## The architecture

```
┌──────────────────────────────┐
│  app/pages/pokemon.vue       │  UI: shows the cards, reacts to clicks
└──────────────┬───────────────┘
               │ addPokemon(pikachu)
               ▼
┌──────────────────────────────┐
│  app/composables/useTeam.js  │  calls our own API with $fetch
└──────────────┬───────────────┘
               │ POST /api/team        ← browser
───────────────┼─────────────────────────────────────
               ▼                       ← server
┌──────────────────────────────┐
│  server/api/team/*.js        │  one file per request
└──────────────┬───────────────┘
               │ supabase.from("team").insert(...)
               ▼
┌──────────────────────────────┐
│  server/utils/supabase.js    │  the only file with the secret key
└──────────────┬───────────────┘
               ▼
           Supabase (Postgres)
```

Each layer only knows the layer directly below it:

- **The page** doesn't know there is an API. It calls `addPokemon()`.
- **The composable** doesn't know there is a database. It calls `/api/team`.
- **The server routes** are the only place that knows about Supabase.

Why this is worth it:

| | |
| --- | --- |
| **Secret key stays secret** | The Supabase secret key has full access to the database. It lives in `.env` on the server and is never sent to the browser. |
| **Swappable database** | Switch from Supabase to SQLite, MySQL or anything else by changing only the `server/` folder. See [Swapping the database](#swapping-the-database). |
| **One place for rules** | Checks like "max. 3 Pokémon" can live on the server, where nobody can skip them from the browser console. |
| **Reusable** | A mobile app or a second website can use the same `/api/team`. |

## Setup

### 1. Create a Supabase project

Sign up on [supabase.com](https://supabase.com) and create a new project (the free plan is enough). Pick the region **Central EU (Zurich)**.

### 2. Create the `team` table

Open **SQL Editor** in the Supabase dashboard and run:

```sql
create table team (
  id integer primary key,          -- the Pokémon id from the PokéAPI (25 = Pikachu)
  name text not null,
  image text not null,
  created_at timestamptz default now()
);

alter table team enable row level security;
```

- `id` is the **Pokémon id**, not a new number. So a team member looks exactly like a Pokémon from `usePokemon()`: `{ id, name, image }`. And because it's the primary key, the same Pokémon can't be in the team twice.
- `created_at` is filled in by the database. We sort by it so the team stays in the order you picked it.
- **Row Level Security (RLS)** is on, and we add no policies. That locks the table for the publishable key: anyone who tries it from the browser gets an empty list. Only our server can read and write, because the secret key skips RLS.

### 3. Copy the keys into `.env`

In the dashboard, go to **Project Settings → API Keys**. Copy the project URL and a **secret key** (`sb_secret_...`).

Copy `.env.example` to `.env` and fill in your values:

```bash
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SECRET_KEY=sb_secret_...
```

> `.env` is in `.gitignore`. Never commit it, and never put the secret key in a file under `app/`. Everything in `app/` ends up in the browser.

### 4. Run it

```bash
npm install
npm run dev
```

Open `http://localhost:3000/pokemon`, add a few Pokémon and reload the page. The team is still there. Open **Table Editor → team** in Supabase to see the rows.

## What changed since week 5

| File | Change |
| ---- | ------ |
| `server/utils/supabase.js` | New: connects to Supabase with the secret key |
| `server/api/team/index.get.js` | New: `GET /api/team` loads the team |
| `server/api/team/index.post.js` | New: `POST /api/team` adds a Pokémon |
| `server/api/team/[id].delete.js` | New: `DELETE /api/team/25` removes a Pokémon |
| `app/composables/useTeam.js` | New: loads the team and calls the API |
| `app/pages/pokemon.vue` | Uses `useTeam()` instead of `ref([])` |
| `package.json` | New dependency `@supabase/supabase-js` |
| `.env.example` | New: template for the two keys |

## The files, from bottom to top

### `server/utils/supabase.js`

```js
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);
```

Nuxt reads `.env` when you run `npm run dev` and puts the values in `process.env`. Everything in `server/` runs on the server only, so the key never reaches the browser.

### `server/api/team/`

Nuxt turns every file in `server/api/` into a URL. The file name decides the URL and the HTTP method:

| File | Request | What it does |
| ---- | ------- | ------------ |
| `index.get.js` | `GET /api/team` | `supabase.from("team").select(...)` |
| `index.post.js` | `POST /api/team` | `supabase.from("team").insert(...)` |
| `[id].delete.js` | `DELETE /api/team/25` | `supabase.from("team").delete().eq("id", 25)` |

`[id]` in the file name is a placeholder, like `[id].vue` for pages. `getRouterParam(event, "id")` reads it.

Each route follows the same pattern: run the query, throw an error if Supabase returns one, otherwise return the result.

```js
export default defineEventHandler(async () => {
  const { data, error } = await supabase
    .from("team")
    .select("id, name, image")
    .order("created_at");

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message });
  }

  return data;
});
```

You can open `http://localhost:3000/api/team` in the browser to see the JSON.

### `app/composables/useTeam.js`

```js
const { data: team, error, refresh } = await useFetch("/api/team", {
  default: () => [],
});

async function addPokemon(pokemon) {
  await $fetch("/api/team", { method: "POST", body: pokemon });
  await refresh();
}
```

- **`useFetch`** loads the team once when the page opens, like `usePokemon()` in week 5.
- **`$fetch`** sends a single request. We use it for clicks, because `useFetch` is meant for loading data when the page opens.
- **`refresh()`** runs the `useFetch` again, so `team` shows what is now in the database.

### `app/pages/pokemon.vue`

Before:

```js
const team = ref([])

function addToTeam(pokemon) {
  if (!isTeamFull.value) {
    team.value.push(pokemon)
  } ...
}
```

After:

```js
const { team, error: teamError, addPokemon, removePokemon } = await useTeam()

function addToTeam(pokemon) {
  if (!isTeamFull.value) {
    addPokemon(pokemon)
  } ...
}
```

`team` is still a ref with an array of `{ id, name, image }`, so the template and `PokemonCard` stayed almost the same. One detail: the team members now come from the database, so they are new objects. `team.value.includes(pokemon)` no longer finds them. We compare the ids instead:

```js
!team.value.some((member) => member.id === pokemon.id)
```

## What happens when you click on Pikachu

1. `PokemonCard` emits `selectPokemon` with Pikachu.
2. `pokemon.vue` checks that the team isn't full and calls `addPokemon(pikachu)`.
3. `useTeam.js` sends `POST /api/team` with `{ id: 25, name: "Pikachu", image: "..." }`.
4. `server/api/team/index.post.js` inserts the row into Supabase.
5. `useTeam.js` calls `refresh()`, which sends `GET /api/team`.
6. `team` gets the new list, and Vue shows Pikachu in the team.

Open the **Network** tab in the browser's DevTools to watch steps 3 and 5.

## Swapping the database

Say we want to use SQLite from [week 6](../26HS_WEEK6_SQLITE/readme.md) instead of Supabase. We replace `server/utils/supabase.js` with a SQLite connection (`npm install better-sqlite3`):

```js
// server/utils/db.js
import Database from "better-sqlite3";

export const db = new Database("team.db");

db.exec(`
  CREATE TABLE IF NOT EXISTS team (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    image TEXT NOT NULL,
    created_at TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%f'))
  )
`);
```

`%f` adds milliseconds. `CURRENT_TIMESTAMP` only has seconds, so two Pokémon added in the same second could swap places.

and rewrite the three routes with SQL:

```js
// server/api/team/index.get.js
import { db } from "~~/server/utils/db.js";

export default defineEventHandler(() => {
  return db.prepare("SELECT id, name, image FROM team ORDER BY created_at").all();
});
```

```js
// server/api/team/index.post.js
import { db } from "~~/server/utils/db.js";

export default defineEventHandler(async (event) => {
  const pokemon = await readBody(event);
  db.prepare("INSERT INTO team (id, name, image) VALUES (?, ?, ?)")
    .run(pokemon.id, pokemon.name, pokemon.image);
  return { ok: true };
});
```

```js
// server/api/team/[id].delete.js
import { db } from "~~/server/utils/db.js";

export default defineEventHandler((event) => {
  db.prepare("DELETE FROM team WHERE id = ?").run(getRouterParam(event, "id"));
  return { ok: true };
});
```

`app/` stays exactly the same. The URLs and the JSON they return didn't change, so the page and the composable don't notice.

## Common problems

| Problem | Fix |
| ------- | --- |
| "Das Team konnte nicht geladen werden." | Look at the terminal where `npm run dev` runs. The real error message is there. Restart `npm run dev` after changing `.env`. |
| `supabaseUrl is required` (in the terminal) | `.env` is missing, isn't in the project folder, or `SUPABASE_URL` has a typo. |
| `Could not find the table 'public.team'` | The table doesn't exist yet, or it has a different name. Run the SQL from step 2. |
| `Invalid API key` | The key in `.env` is wrong or incomplete. Copy it again. |
| The team is always empty, or `new row violates row-level security policy` | You copied the publishable key. The server needs the **secret** key (`sb_secret_...`). |

## Ideas to try next

- Move the "max. 3 Pokémon" check into `index.post.js` and return an error with `statusCode: 400`. Then try to add a fourth Pokémon from the browser console with `$fetch`.
- Show a loading text while a Pokémon is being saved.
- Add a `nickname` column and an input field to give each team member a nickname (`PATCH /api/team/[id]`).
