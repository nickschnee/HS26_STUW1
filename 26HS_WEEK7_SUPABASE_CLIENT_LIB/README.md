# Week 7: The Pokémon team in Supabase, straight from the browser

The same app as [`26HS_WEEK7_SUPABASE_SEPARATED_CONCERNS`](../26HS_WEEK7_SUPABASE_SEPARATED_CONCERNS/README.md), but **without our own API**. There is no `server/` folder. The browser talks to Supabase directly with the client library [`@supabase/supabase-js`](https://supabase.com/docs/reference/javascript/introduction).

This version is less code, but the database is now open to everyone who has the publishable key. And everyone has it: it's in the browser. What they may do is decided only by **Row Level Security (RLS)** in Supabase.

Compare the two folders to see what separation of concerns buys you.

## Slides

[Supabase](https://docs.google.com/presentation/d/1VzaeCR_JQaP07y24gOSa0C25YC8pVKok4qsCuTKejBM/edit?usp=sharing), chapter "Supabase im Frontend"

## The architecture

```
┌──────────────────────────────┐
│  app/pages/pokemon.vue       │  UI: shows the cards, reacts to clicks
└──────────────┬───────────────┘
               │ addPokemon(pikachu)
               ▼
┌──────────────────────────────┐
│  app/composables/useTeam.js  │  supabase.from("team").insert(...)
└──────────────┬───────────────┘
               │ uses
               ▼
┌──────────────────────────────┐
│  app/composables/            │  creates the client with the
│  useSupabase.js              │  publishable key
└──────────────┬───────────────┘
               │ HTTPS, straight from the browser
───────────────┼─────────────────────────────────────
               ▼
     RLS policies check every request
               ▼
           Supabase (Postgres)
```

Side by side with the separated version:

| | Separated concerns | Client library (this folder) |
| --- | --- | --- |
| Who talks to Supabase? | Our server (`server/api/team/`) | The browser (`app/composables/useTeam.js`) |
| Key | Secret key, in `.env` on the server | Publishable key, sent to every browser |
| Who decides what is allowed? | Our server code | RLS policies in Supabase |
| "Max. 3 Pokémon" | Can be checked on the server | Only in the browser, so anyone can skip it |
| Swap the database | Change `server/` only | Change every place that uses `supabase` |

## Setup

### 1. Create the `team` table and the policies

Open **SQL Editor** in the Supabase dashboard and run:

```sql
create table if not exists team (
  id integer primary key,          -- the Pokémon id from the PokéAPI (25 = Pikachu)
  name text not null,
  image text not null,
  created_at timestamptz default now()
);

alter table team enable row level security;

-- The publishable key logs in as the role "anon".
-- These three policies let anon read, add and remove rows.
create policy "anyone can read the team"
  on team for select to anon using (true);

create policy "anyone can add a pokemon"
  on team for insert to anon with check (true);

create policy "anyone can remove a pokemon"
  on team for delete to anon using (true);
```

If you already created the table for the separated version, `create table if not exists` skips it, and both apps share the same team.

- **`for select / insert / delete`**: one policy per action. There is no `update` policy, because the app never changes a row.
- **`to anon`**: the policy applies to requests with the publishable key.
- **`using (true)`**: which existing rows anon may see or delete. `true` means all of them.
- **`with check (true)`**: which new rows anon may insert. `true` means any row.

`true` is fine for a class demo, but it means **anyone can empty your table**. In a real app, users log in and the policies only allow their own rows, for example `using (auth.uid() = user_id)`.

### 2. Copy the keys into `.env`

In the dashboard, go to **Project Settings → API Keys**. Copy the project URL and the **publishable key** (`sb_publishable_...`). Do **not** use the secret key here: everything in this app ends up in the browser.

Copy `.env.example` to `.env` and fill in your values:

```bash
NUXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

`NUXT_PUBLIC_` tells Nuxt to put the value into `runtimeConfig.public` (see `nuxt.config.ts`). Everything in `public` is sent to the browser. That's fine for the publishable key, and wrong for anything secret.

### 3. Run it

```bash
npm install
npm run dev
```

Open `http://localhost:3000/pokemon` and add a few Pokémon. Open the **Network** tab in the DevTools: the requests go straight to `your-project-id.supabase.co/rest/v1/team`, and the publishable key is in the `apikey` header.

## What changed compared to the separated version

| File | Change |
| ---- | ------ |
| `server/` | Deleted. No API routes, no secret key. |
| `app/composables/useSupabase.js` | New: creates the Supabase client with the publishable key |
| `app/composables/useTeam.js` | Calls `supabase.from("team")` instead of `/api/team` |
| `nuxt.config.ts` | `runtimeConfig.public` for the URL and the publishable key |
| `.env.example` | `NUXT_PUBLIC_SUPABASE_URL` and `NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` |
| `app/pages/pokemon.vue` | Unchanged (only a comment). The page still only calls `useTeam()`. |

## The files

### `app/composables/useSupabase.js`

```js
let supabase;

export function useSupabase() {
  // create the client only once, and reuse it after that
  if (!supabase) {
    const config = useRuntimeConfig();
    supabase = createClient(
      config.public.supabaseUrl,
      config.public.supabasePublishableKey
    );
  }

  return supabase;
}
```

The same `createClient` as in `server/utils/supabase.js`, but with the publishable key from `useRuntimeConfig()` instead of the secret key from `process.env`. We create the client only once. Otherwise every visit to `/pokemon` would create a new one, and Supabase warns about "Multiple GoTrueClient instances" in the console.

### `app/composables/useTeam.js`

```js
const { data: team, error, refresh } = await useAsyncData("team", async () => {
  const { data, error } = await supabase
    .from("team")
    .select("id, name, image")
    .order("created_at");

  if (error) throw error;
  return data;
}, { server: false, default: () => [] });

async function addPokemon(pokemon) {
  const { error } = await supabase
    .from("team")
    .insert({ id: pokemon.id, name: pokemon.name, image: pokemon.image });

  if (error) throw error;
  await refresh();
}
```

- The queries are exactly the ones from `server/api/team/`. The library works the same in the browser and on the server.
- **`useAsyncData`** is like `useFetch`, but for any async function, not just a URL.
- **`server: false`** runs the query in the browser only. Without it, Nuxt would run the first load on the server, and you wouldn't see it in the Network tab.

## The RLS pitfall: an empty list instead of an error

When RLS blocks a request, Supabase often **doesn't return an error**. It acts as if the rows don't exist:

| Query (publishable key) | RLS on, no policy for it | Result |
| ----------------------- | ------------------------ | ------ |
| `select()` | `{ data: [], error: null }` | The team looks empty |
| `insert()` | `error.code: "42501"`, `new row violates row-level security policy` | The only one that fails loudly |
| `delete().eq("id", 25)` | `{ error: null }` | Nothing deleted, no error |
| `update().eq("id", 25)` | `{ error: null }` | Nothing changed, no error |

Tested with `@supabase/supabase-js` 2.118 against a local Supabase.

Why? RLS works like an invisible `WHERE` on every query. Without a policy, that `WHERE` is false for every row, so `select` finds nothing and `delete` has nothing to delete. That isn't an error for Postgres, it's just zero rows. Only `insert` adds a new row that fails the check.

So if the team is suddenly empty, or a delete "works" but the Pokémon comes back after a reload, **check the policies first**. In the dashboard, search for "Policies" to see the policies of the `team` table, or run `select * from pg_policies where tablename = 'team';` in the SQL Editor.

To see if a `delete` actually removed something, add `.select()`. It returns the deleted rows, so an empty array means RLS blocked it:

```js
const { data } = await supabase.from("team").delete().eq("id", 25).select();
// data = [] → nothing was deleted
```

## Common problems

| Problem | Fix |
| ------- | --- |
| The team is always empty, but rows are in the Table Editor | The `select` policy is missing. Run the SQL from step 1. |
| `new row violates row-level security policy` | The `insert` policy is missing. |
| Removing a Pokémon does nothing, and it comes back after a reload | The `delete` policy is missing. |
| Error 500 `supabaseUrl is required.` | `.env` is missing, isn't in the project folder, or the variable names are wrong. They must start with `NUXT_PUBLIC_`. Restart `npm run dev` after changing `.env`. |
| "Das Team konnte nicht geladen werden." | Look at the browser console and the Network tab. The real error message from Supabase is there. |
| `Invalid API key` | The key in `.env` is wrong or incomplete. Copy the publishable key again. |

## Ideas to try next

- Delete the `select` policy and reload the page. The team is empty, and there is no error anywhere.
- Copy the URL and the `apikey` header from the Network tab and add a fourth Pokémon with `curl` or Postman. The "max. 3" check in `pokemon.vue` can't stop you.
- Add Supabase Auth with a login, a `user_id` column, and policies with `auth.uid() = user_id`, so everyone only sees their own team.
