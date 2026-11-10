# Week 8: Every user gets their own Pokémon team

The app from [`26HS_WEEK7_SUPABASE_CLIENT_LIB`](../26HS_WEEK7_SUPABASE_CLIENT_LIB/README.md), with **Supabase Auth**. You register and log in with e-mail and password, and everyone only sees and changes their own team.

In week 7 the policies said `using (true)`: anyone with the publishable key could read and delete every row. Now each row has a `user_id`, and the policies only allow rows where `auth.uid() = user_id`.

- **Authentication** (who are you?): Supabase Auth checks the password and gives the browser a token.
- **Authorization** (what may you do?): the RLS policies read the user from that token and decide which rows they may see and change.

## Slides

[Supabase Authentication](https://docs.google.com/presentation/d/1GZaIb8n_CL9JMnr8mjgRjyfvltTxDAfHF7tw1jSIZz0/edit?usp=sharing):

- Slides 4 to 9: the token (JWT). The exercise is on slide 7.
- Slides 10 to 12: JWT meets RLS
- Slides 13 to 18: other login methods (magic link, OAuth, phone, anonymous)

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

By default, Supabase sends a confirmation e-mail after every registration, and you can only log in after clicking the link. The built-in e-mail service only sends 2 e-mails per hour (see the slides on e-mail sending).

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

Open the **Network** tab in the DevTools: every request to `/rest/v1/team` now has an `Authorization: Bearer eyJ...` header. That's the token. Paste it into [jwt.io](https://jwt.io) to see what's inside: `sub` is the user id, `role` is `authenticated`. More in [How the token works](#how-the-token-works-jwt).

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

## Auth methods

The most important methods of `supabase.auth`:

```js
// Sign up (with "Confirm email" off, you're logged in right away)
const { data, error } = await supabase.auth.signUp({ email, password });

// Log in
const { data, error } = await supabase.auth.signInWithPassword({ email, password });

// The saved session from localStorage (with the token), or null
const { data: { session } } = await supabase.auth.getSession();

// Asks Supabase Auth who the token belongs to
const { data: { user } } = await supabase.auth.getUser();

// Log out: deletes the session in localStorage
await supabase.auth.signOut();
```

- **`getSession()`** only reads `localStorage`. It's fast, but it doesn't check whether the token is still valid. The app uses it in the middleware, because the middleware only decides which page to show.
- **`getUser()`** sends the token to Supabase Auth and gets the user back. Use it when you need to be sure, for example on a server.

## How the token works (JWT)

The token is a **JSON Web Token** (JWT, [RFC 7519](https://datatracker.ietf.org/doc/html/rfc7519)). It has three parts, separated by dots:

```
eyJhbGciOiJFUzI1NiIs… . eyJpc3MiOiJodHRwOi8v… . IeVO1AqNXKaBgS50CW…
       header                  payload                signature
```

| Part | Contains |
| ---- | -------- |
| Header | How the token was signed, for example `"alg": "ES256"` |
| Payload | The claims: `sub` (the user id), `role` (`authenticated`), `exp` (expires after one hour), `email`, … |
| Signature | Calculated from header and payload with a key that only Supabase Auth has |

Header and payload are only Base64-encoded, not encrypted. **Anyone can read the token, but nobody can change it.** If you change one character in the payload, the signature doesn't match anymore.

Which key signs the token:

- **ES256** (a key pair): the private key signs, and only Supabase Auth knows it. The public key checks, and anyone may see it at `/auth/v1/.well-known/jwks.json`. The local Supabase (`npx supabase start`) signs like this.
- **HS256** (one JWT secret): the same secret signs and checks. Whoever has the secret can build a valid token for any user. We tested it: with the secret, a self-made token with Misty's `sub` returns Misty's team. That's why the JWT secret and the secret key never go into the frontend or onto GitHub.

Our class project in the Supabase cloud signs with **HS256**, so your token on jwt.io probably shows `"alg": "HS256"`, not `ES256` like the example on the slides. To see which one your project uses, look at `alg` in the header on [jwt.io](https://jwt.io), or in the dashboard under **Project Settings → JWT Keys**.

### The auth flow

```
pokemon.vue calls addPokemon(pikachu)
↓
supabase-js sends the request with "Authorization: Bearer <token>"
↓
Supabase checks the signature of the token
   wrong signature or expired  →  401, the whole request is rejected
   no token                    →  role anon (no policy, so an empty list)
↓
RLS checks the policy: auth.uid() = user_id
   row belongs to someone else →  not visible, insert fails with 42501
↓
Allowed ✅
```

A changed token doesn't get an empty list like RLS gives you. Supabase rejects the whole request with an error, before RLS even runs.

## Exercise: take your own token apart

The same steps as on the slides:

1. **Find the token.** Log in to the app. DevTools → **Application** → **Local Storage** → `sb-…-auth-token`. Copy the value of `access_token`.
2. **Read it on jwt.io.** Paste the token into [jwt.io](https://jwt.io). Find `sub`, `role` and `exp`. Compare `sub` with your `user_id` in the Table Editor.
3. **With and without the token.** **Network** tab → the request to your Supabase URL + `/rest/v1/team` → **Copy as cURL**. Run it in the terminal, then again without the `Authorization` line. What comes back?
4. **Forge the token.** jwt.io → **JWT Encoder**: paste the payload, replace `sub` with the `user_id` of a second user, enter any secret. Put the token into the cURL command. What happens?

On Windows, choose **Copy as cURL (bash)** and run it in Git Bash, or import the command into Postman.

About step 3:

- The request doesn't go to the app on `localhost:3000`. There is no own API in week 8: supabase-js talks to Supabase directly. The URL is `NUXT_PUBLIC_SUPABASE_URL` from your `.env` plus `/rest/v1/team`, for example `https://your-project-id.supabase.co/rest/v1/team?select=id%2Cname%2Cimage&order=created_at.asc`. With a local Supabase it's `http://127.0.0.1:54321/rest/v1/team?...`. Type `team` into the filter of the Network tab to find it.
- `/rest/v1/` is the REST API that Supabase creates for every table.
- Copy the `GET` request, not the `OPTIONS` request next to it (that's only the CORS check of the browser).
- In the cURL, delete only the line `-H 'authorization: Bearer eyJ...'`. Keep the `apikey` line: with the publishable key alone you're `anon`.
- The token is only valid for one hour. If you get `401` with `JWT expired`, reload the app and copy the request again.

What you should see: step 3 without the token returns `[]` (you're `anon`). Step 4 returns `401`, because your made-up secret isn't the key that Supabase uses:

```json
{"code":"PGRST301","details":"None of the keys was able to decode the JWT","hint":null,"message":"No suitable key or wrong key type"}
```

`PGRST301` means the JWT is invalid: Supabase tried all its keys, and none of them gives the same signature. ("Decode" here means verify. Reading the token still works, as jwt.io shows.) Add `-i` to the cURL command to see the status line `HTTP/2 401`.

### Try to cheat in the console

Can you add a Pokémon to someone else's team? Log in, open the DevTools **Console** and run (with the URL and publishable key from your `.env`):

```js
const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
const sb = createClient("https://your-project-id.supabase.co", "sb_publishable_...");

await sb.from("team").insert({
  user_id: "the-user-id-of-someone-else",
  id: 150, name: "mewtwo", image: "https://…",
});
```

The new client finds your session in `localStorage`, so it sends your token. You can write any `user_id` you want, but `auth.uid()` comes from the signed token, and the `with check` policy compares the two. The answer is `42501 new row violates row-level security policy`.

(The console may warn about "Multiple GoTrueClient instances". That's because the app already has a client. You can ignore it.)

## Other login methods

E-mail and password is only one way to log in. All methods end the same way: supabase-js gets a session with a JWT and saves it in `localStorage`. After that, nothing changes: `useTeam.js`, the policies and `auth.uid()` work exactly like before. Only `login.vue` and `useAuth.js` change.

| Method | Call | When you get the token | Setup |
| ------ | ---- | ---------------------- | ----- |
| E-mail & password | `signInWithPassword()` | Right away | Nothing (turn off "Confirm email" for class) |
| Magic link | `signInWithOtp({ email })` | After clicking the link in the e-mail | Add the redirect URL |
| OAuth (GitHub, Google, …) | `signInWithOAuth({ provider })` | After a detour to GitHub | An OAuth app at the provider |
| Phone | `signInWithOtp({ phone })` + `verifyOtp()` | After typing the code from the SMS | An SMS provider, costs money |
| Anonymous | `signInAnonymously()` | Right away | Turn it on in the dashboard |

The JWT shows how the user logged in: `amr` is `password` for a password login and `otp` for a magic link or a code (tested).

### Magic link

```js
async function signInWithMagicLink(email) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: "http://localhost:3000/pokemon" },
  });
  if (error) throw error;
  // no session yet: show "Check your e-mail"
}
```

1. `signInWithOtp` asks Supabase to send an e-mail. Unlike `signInWithPassword`, it returns **no session** yet.
2. The user clicks the link. It goes to Supabase (`/auth/v1/verify`), which redirects to `emailRedirectTo` with the token in the URL (`/pokemon#access_token=…`).
3. supabase-js reads the token from the URL and saves the session. Our middleware calls `getSession()`, which waits for that, so `/pokemon` opens logged in. We tested this with the week 8 app, unchanged.

Setup:

- The redirect URL must be allowed: **Authentication → URL Configuration → Redirect URLs**, for example `http://localhost:3000/**`. Otherwise Supabase redirects to the Site URL.
- If the e-mail doesn't exist yet, Supabase creates the user. To only let existing users in, pass `shouldCreateUser: false`.
- Every login sends an e-mail, so the e-mail limit applies (2 per hour with the built-in service, and one request per 60 seconds per user).

**A code instead of a link:** it's the same method. Only the e-mail is different. Add `{{ .Token }}` to the **Magic Link** template under **Authentication → Emails**, and the e-mail contains a 6-digit code. The user types it into your page, and you call:

```js
const { data, error } = await supabase.auth.verifyOtp({ email, token: "123456", type: "email" });
```

### OAuth (GitHub, Google, …)

```js
async function signInWithGitHub() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: { redirectTo: "http://localhost:3000/pokemon" },
  });
  if (error) throw error;
  // the browser is already on its way to GitHub
}
```

1. `signInWithOAuth` sends the browser to GitHub right away. Your page is gone.
2. The user logs in at GitHub and allows the app. **Only GitHub sees the password.**
3. GitHub sends the browser back to Supabase (`https://<project-id>.supabase.co/auth/v1/callback`). Supabase gets the profile (e-mail, name) and creates the user in `auth.users`.
4. Supabase redirects to `redirectTo` with the token in the URL, just like the magic link.

Setup for GitHub:

1. Supabase dashboard → **Authentication → Sign In / Providers → GitHub**. Copy the **Callback URL**.
2. GitHub → **Settings → Developer settings → OAuth Apps → New OAuth App**. Homepage URL: `http://localhost:3000`. Authorization callback URL: the URL from step 1. Copy the **Client ID** and generate a **Client Secret**.
3. Back in Supabase: turn on **GitHub Enabled**, paste the Client ID and Client Secret, **Save**. Add `http://localhost:3000/**` under **URL Configuration → Redirect URLs**.

The Client Secret only goes into the Supabase dashboard, never into the frontend or onto GitHub. Google, Apple, Discord, Azure and the others work the same way: change `provider` and create an OAuth app at that provider.

Without setup, Supabase answers `400 Unsupported provider: provider is not enabled`.

### Phone

```js
await supabase.auth.signInWithOtp({ phone: "+41791234567" });
await supabase.auth.verifyOtp({ phone: "+41791234567", token: "123456", type: "sms" });
```

Like the e-mail code, but by SMS. Supabase needs an SMS provider (Twilio, MessageBird, Vonage, …), and every SMS costs money. Without one, you get `Unsupported phone provider`.

### Anonymous

```js
const { data, error } = await supabase.auth.signInAnonymously();
```

The user gets a real token without an e-mail. The payload has `"role": "authenticated"` and `"is_anonymous": true`. Turn it on under **Authentication → Sign In / Providers → Allow anonymous sign-ins**.

**Careful:** anonymous users pass our policies, because they are `to authenticated`. We tested it: an anonymous user can add Pokémon to their own team. To keep them out, check the claim in the policy:

```sql
create policy "only real users can add"
  on team for insert to authenticated
  with check (auth.uid() = user_id and (auth.jwt() ->> 'is_anonymous')::boolean is false);
```

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
| Magic link: `signInWithOtp({ email, options: { emailRedirectTo } })` | `session: null` first. Clicking the link in the e-mail opens `/pokemon`, logged in |
| Magic link template with `{{ .Token }}`, then `verifyOtp({ email, token, type: "email" })` | Logged in. Wrong code: `Token has expired or is invalid` |
| `signInWithOtp` with `shouldCreateUser: false` for an unknown e-mail | `Signups not allowed for otp` |
| `signInAnonymously()` | Token with `role: authenticated`, `is_anonymous: true`. Can insert into `team` |
| Anonymous user, insert policy with `is_anonymous is false` | `42501`, blocked |
| `signInWithOAuth({ provider: "github" })` without setup | `400 Unsupported provider: provider is not enabled` |
| `signInWithOtp({ phone })` without SMS provider | `Unsupported phone provider` |
| Forged token (cloud project, HS256) | `PGRST301 No suitable key or wrong key type` |

## Common problems

| Problem | Fix |
| ------- | --- |
| After "Registrieren": "Bestätige deine E-Mail-Adresse" | "Confirm email" is on. Click the link in the e-mail, or turn it off (step 2). |
| `Email rate limit exceeded` | The built-in e-mail service is limited to 2 e-mails per hour. Turn off "Confirm email", or wait. |
| `Invalid login credentials` | Wrong e-mail or password, or the e-mail isn't confirmed yet. |
| `Password should be at least 6 characters` | Supabase needs at least 6 characters. |
| `User already registered` | Use "Einloggen" instead of "Registrieren". |
| The team is always empty | The `select` policy is missing, or you're not logged in. Check the `Authorization` header in the Network tab. |
| `new row violates row-level security policy` | The `insert` policy is missing, or the table has no `default auth.uid()` on `user_id`. |
| Logged in, but the team is empty and adding fails with `42501` | The table and policies are still the ones from week 7 (policies only `to anon`). Run `drop table team;` and step 1 again. |

## Ideas to try next

- Delete the `select` policy and reload. The team is empty, without an error.
- The "max. 3 Pokémon" check is still only in `pokemon.vue`. Enforce it in the database with an `insert` policy: `with check (auth.uid() = user_id and (select count(*) from team where user_id = auth.uid()) < 3)`.
- Add a magic link or a GitHub login to `login.vue`, see [Other login methods](#other-login-methods).
