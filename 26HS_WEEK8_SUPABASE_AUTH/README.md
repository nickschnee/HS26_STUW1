# Week 8: Every user gets their own Pokémon team

The app from [`26HS_WEEK7_SUPABASE_CLIENT_LIB`](../26HS_WEEK7_SUPABASE_CLIENT_LIB/README.md), with **Supabase Auth**. You register and log in with e-mail and password, and everyone only sees and changes their own team.

In week 7 the policies said `using (true)`: anyone with the publishable key could read and delete every row. Now each row has a `user_id`, and the policies only allow rows where `auth.uid() = user_id`.

- **Authentication** (who are you?): Supabase Auth checks the password and gives the browser a token.
- **Authorization** (what may you do?): the RLS policies read the user from that token and decide which rows they may see and change.

## Slides

[Supabase Authentication](https://docs.google.com/presentation/d/1GZaIb8n_CL9JMnr8mjgRjyfvltTxDAfHF7tw1jSIZz0/edit?usp=sharing), slides 4 to 10 (the JWT and the exercise are on slides 7 to 10)

## The architecture

**1. Login: the browser gets a token**

```
┌──────────────────────────────┐
│  app/pages/login.vue         │  form for e-mail and password
└──────────────┬───────────────┘
               │ signIn(email, password)
               ▼
┌──────────────────────────────┐
│  app/composables/useAuth.js  │  supabase.auth.signInWithPassword(...)
└──────────────┬───────────────┘
               │ uses
               ▼
┌──────────────────────────────┐
│  app/composables/            │  saves the session (with the token)
│  useSupabase.js              │  in localStorage
└──────────────┬───────────────┘
───────────────┼─────────────────────────────────────
               ▼
   Supabase Auth checks the password, returns a token
               ▼
           auth.users (the accounts)
```

**2. With the token: RLS knows the user**

```
┌──────────────────────────────┐
│  app/pages/pokemon.vue       │  only for logged-in users (middleware)
└──────────────┬───────────────┘
               │ addPokemon(pikachu)
               ▼
┌──────────────────────────────┐
│  app/composables/useTeam.js  │  supabase.from("team").insert(...), same as week 7
└──────────────┬───────────────┘
               │ uses
               ▼
┌──────────────────────────────┐
│  app/composables/            │  sends the token with every request
│  useSupabase.js              │
└──────────────┬───────────────┘
───────────────┼─────────────────────────────────────
               ▼
     RLS policies: auth.uid() = user_id
               ▼
           team (every row has a user_id)
```

Who sees what:

| Who | Key | Role in Postgres | Result |
| --- | --- | --- | --- |
| Guest (not logged in) | publishable key | `anon` | No policy for `anon`: an empty list, inserts fail |
| Logged in | publishable key + token | `authenticated` | Only the rows with their own `user_id` |
| Server | secret key | `service_role` | Skips RLS, sees everything. Never put it in the browser. |

## Setup

### 1. Create the `team` table and the policies

The table now has a `user_id`. It's a different table than in week 7, so either use a **new Supabase project**, or delete the old table first with `drop table team;` (this deletes the week 7 team, and the week 7 apps stop working).

Open **SQL Editor** in the Supabase dashboard and run:

```sql
create table team (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  id integer not null,             -- the Pokémon id from the PokéAPI (25 = Pikachu)
  name text not null,
  image text not null,
  created_at timestamptz default now(),
  primary key (user_id, id)        -- every user can have Pikachu once
);

alter table team enable row level security;

create policy "users can read their own team"
  on team for select to authenticated using (auth.uid() = user_id);

create policy "users can add to their own team"
  on team for insert to authenticated with check (auth.uid() = user_id);

create policy "users can remove from their own team"
  on team for delete to authenticated using (auth.uid() = user_id);
```

- **`user_id uuid ... default auth.uid()`**: Supabase fills in the id of the logged-in user, so the app doesn't have to send it.
- **`references auth.users on delete cascade`**: `auth.users` is the table where Supabase Auth keeps the accounts. If you delete a user, their team is deleted too.
- **`primary key (user_id, id)`**: in week 7 the key was only `id`, so Pikachu could be in the table once. Now every user can have their own Pikachu.
- **`to authenticated`**: the policies only apply to logged-in users. There is no policy for `anon` anymore, so guests get nothing.
- **`auth.uid() = user_id`**: `auth.uid()` reads the user id from the token. `using` decides which rows you may see and delete, `with check` which rows you may insert.

### 2. Turn off "Confirm email" (for class)

By default, Supabase sends a confirmation e-mail after every registration, and you can only log in after clicking the link. The built-in e-mail service only sends a few e-mails per hour (see the slides on e-mail sending).

For class, go to **Authentication → Sign In / Providers → Email** and turn off **Confirm email**. Then `signUp` logs you in right away. Turn it back on for a real app.

### 3. Copy the keys into `.env`

The same as in week 7: in the dashboard, go to **Project Settings → API Keys** and copy the project URL and the **publishable key** (`sb_publishable_...`).

```bash
NUXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

### 4. Run it

```bash
npm install
npm run dev
```

Open `http://localhost:3000/pokemon`. You're sent to `/login`. Register, add a few Pokémon, log out, and register a second user in another browser (or a private window). Each user sees only their own team.

Open the **Network** tab in the DevTools: every request to `/rest/v1/team` now has an `Authorization: Bearer eyJ...` header. That's the token. Paste it into [jwt.io](https://jwt.io) to see what's inside: `sub` is the user id, `role` is `authenticated`.

## What changed compared to week 7

| File | Change |
| ---- | ------ |
| `app/composables/useAuth.js` | New: `signUp`, `signIn`, `signOut` and the logged-in `user` |
| `app/pages/login.vue` | New: form for e-mail and password |
| `app/middleware/auth.js` | New: sends guests from `/pokemon` to `/login` |
| `app/pages/pokemon.vue` | `definePageMeta({ middleware: 'auth' })`, shows the e-mail and a logout button |
| `app/composables/useTeam.js` | Only comments. The queries are the same, RLS does the filtering. |
| `app/composables/useSupabase.js` | Only comments |
| `nuxt.config.ts` | `ssr: false`, see below |
| SQL | `user_id` column, new primary key, policies with `auth.uid() = user_id` |

## The files

### `app/composables/useAuth.js`

```js
export function useAuth() {
  const supabase = useSupabase();
  const user = useState("user", () => null);

  async function loadUser() {
    const { data } = await supabase.auth.getSession();
    user.value = data.session?.user ?? null;
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    user.value = data.user;
  }

  async function signOut() {
    await supabase.auth.signOut();
    user.value = null;
    clearNuxtData("team");
  }

  // signUp works like signIn, see the file
  return { user, loadUser, signUp, signIn, signOut };
}
```

- **`useState("user")`**: like `ref`, but every page and component that calls `useAuth()` gets the same `user`.
- **`signInWithPassword`**: Supabase Auth checks the password. If it's right, supabase-js saves the session in `localStorage` and sends the token with every request from now on. You don't have to pass it anywhere.
- **`getSession()`**: reads the saved session from `localStorage`. That's why you're still logged in after a reload.
- **`clearNuxtData("team")`**: forgets the team in the browser, so the next user doesn't see it for a moment.

### `app/middleware/auth.js`

```js
export default defineNuxtRouteMiddleware(async () => {
  const { user, loadUser } = useAuth();
  await loadUser();

  if (!user.value) {
    return navigateTo("/login");
  }
});
```

Route middleware runs before a page opens. `pokemon.vue` uses it with `definePageMeta({ middleware: 'auth' })`.

The middleware only protects the **page**. Anyone can still send requests to Supabase with the publishable key and skip your page. What protects the **data** are the RLS policies.

### `app/composables/useTeam.js`

Exactly the queries from week 7:

```js
await supabase.from("team").select("id, name, image").order("created_at");
await supabase.from("team").insert({ id: pokemon.id, name: pokemon.name, image: pokemon.image });
await supabase.from("team").delete().eq("id", pokemon.id);
```

There is no `.eq("user_id", ...)` anywhere. RLS works like an invisible `where user_id = auth.uid()` on every query, and the `default auth.uid()` fills in the `user_id` on insert.

### `nuxt.config.ts`: `ssr: false`

supabase-js keeps the session in `localStorage`, and only the browser has `localStorage`. With server-side rendering, the server would render `/pokemon` without knowing who is logged in. `ssr: false` makes the whole app run in the browser, like a classic single-page app.

If you need SSR with auth, the session has to be in a cookie instead. [`@nuxtjs/supabase`](https://supabase.nuxtjs.org) does that for you.

## Tested

Tested with `@supabase/supabase-js` 2.118 against a local Supabase (`npx supabase start`):

| Test | Result |
| ---- | ------ |
| Ash and Misty both add Pikachu | Works, every user has their own row |
| Ash reads the team | Only Ash's Pokémon |
| Guest reads the team | `{ data: [], error: null }` |
| Guest inserts a Pokémon | `42501 new row violates row-level security policy` |
| Ash deletes Misty's Pokémon | `{ data: [], error: null }`, nothing deleted |
| Ash inserts a row with Misty's `user_id` | `42501`, blocked by `with check` |
| Wrong password | `Invalid login credentials` |
| Open `/pokemon` without login | Redirect to `/login` |
| Reload after login | Still logged in |

## Common problems

| Problem | Fix |
| ------- | --- |
| After "Registrieren": "Bestätige deine E-Mail-Adresse" | "Confirm email" is on. Click the link in the e-mail, or turn it off (step 2). |
| `Email rate limit exceeded` | The built-in e-mail service is limited to a few e-mails per hour. Turn off "Confirm email", or wait. |
| `Invalid login credentials` | Wrong e-mail or password, or the e-mail isn't confirmed yet. |
| `Password should be at least 6 characters` | Supabase needs at least 6 characters. |
| `User already registered` | Use "Einloggen" instead of "Registrieren". |
| The team is always empty | The `select` policy is missing, or you're not logged in. Check the `Authorization` header in the Network tab. |
| `new row violates row-level security policy` | The `insert` policy is missing, or the table has no `default auth.uid()` on `user_id`. |
| Logged in, but the team is empty and adding fails with `42501` | The table and policies are still the ones from week 7 (policies only `to anon`). Run `drop table team;` and step 1 again. |

## Ideas to try next

- Copy the token from the Network tab and paste it into [jwt.io](https://jwt.io). Find the `sub` and compare it with the `user_id` in the Table Editor.
- Delete the `select` policy and reload. The team is empty, without an error.
- The "max. 3 Pokémon" check is still only in `pokemon.vue`. Enforce it in the database with an `insert` policy: `with check (auth.uid() = user_id and (select count(*) from team where user_id = auth.uid()) < 3)`.
- Add a magic link login with `supabase.auth.signInWithOtp({ email })`.
- Add a GitHub login with `supabase.auth.signInWithOAuth({ provider: "github" })`.
