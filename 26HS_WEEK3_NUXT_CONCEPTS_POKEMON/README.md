# Week 3: Nuxt Concepts & Pokémon Team Builder

This project is the live-coding session from week 3. It has two parts:

1. **Nuxt basics:** pages, layouts and components
2. **Pokémon example:** a small "build your team" app where we learned the core Vue concepts

Yes, it's a bit of a mess. We built it live, step by step, and tried things out along the way. This README documents the project **as it is**, mess included, so you can follow how everything is connected.

> A tidied-up version of the same code is in [`26HS_WEEK3_NUXT_POKEMON_CLEAN`](../26HS_WEEK3_NUXT_POKEMON_CLEAN/README.md).

---

## Running the project

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

| URL         | What you'll see                                    |
| ----------- | -------------------------------------------------- |
| `/`         | Index page with navigation, an image and 4 buttons |
| `/about`    | About page with navigation                         |
| `/contact`  | Contact page using the `content-page` layout       |
| `/pokemon`  | The Pokémon team builder                           |

> There is no link to `/contact` or `/pokemon` in the navigation. Type the URL into the browser yourself.

---

## Folder structure

```
app/
├── app.vue                  ← root of the app: wraps everything in <NuxtLayout> + <NuxtPage>
├── pages/                   ← every file here becomes a route automatically
│   ├── index.vue            → /
│   ├── about.vue            → /about
│   ├── contact.vue          → /contact
│   └── pokemon.vue          → /pokemon
├── layouts/                 ← "frames" around pages
│   ├── default.vue          ← used by every page unless told otherwise
│   └── content-page.vue     ← used only by contact.vue
├── components/              ← reusable building blocks, auto-imported by Nuxt
│   ├── Navigation.vue
│   ├── MyButton.vue
│   └── PokemonCard.vue
└── data/
    └── pokemon.js           ← our "database": a plain JS array of Pokémon objects
public/
└── nick.jpg                 ← files in /public are served from the root, e.g. "/nick.jpg"
```

---

## Part 1: Nuxt Basics

### `app.vue`: the entry point

```vue
<NuxtLayout>
  <NuxtPage />
</NuxtLayout>
```

- `<NuxtPage />` is the placeholder where the **current page** gets rendered (depending on the URL).
- `<NuxtLayout>` wraps that page in a **layout**.

### Pages (`app/pages/`)

Nuxt uses **file-based routing**: you don't have to configure routes. Create a file in `pages/` and it becomes a URL.

- `index.vue` → `/`
- `about.vue` → `/about`
- `contact.vue` → `/contact`
- `pokemon.vue` → `/pokemon`

To link between pages, use `<NuxtLink>` (written as `<nuxt-link>` in `Navigation.vue`, which is the same thing). It switches pages without reloading the whole website.

```vue
<nuxt-link to="/about">About</nuxt-link>
```

### Layouts (`app/layouts/`)

A layout is a frame around a page. The `<slot />` marks where the page content goes.

**`default.vue`** is used automatically by every page. Ours does nothing except render the page:

```vue
<template>
  <slot/>
</template>
```

**`content-page.vue`** adds a heading above and below the page:

```vue
<template>
  <h1> Ich bin eine Content Page</h1>
  <slot/>
  <h1> Ende Contact Page</h1>
</template>
```

A page chooses a different layout with `definePageMeta` (see `contact.vue`):

```js
definePageMeta({
  layout: 'content-page',
})
```

The layout name is the file name without `.vue`.

### Components (`app/components/`)

Components are reusable pieces of UI. Nuxt **auto-imports** everything in `components/`, so you can use `<Navigation />` or `<MyButton />` in any page without importing it.

- **`Navigation.vue`**: a nav bar with links to Home and About. It's used in `index.vue` and `about.vue`.
- **`MyButton.vue`**: a button we used 4 times on the index page to show that one component can be reused many times.

#### Messy bits in Part 1

- `index.vue` imports `Navigation` manually (`import Navigation from "~/components/Navigation.vue"`). That's allowed, but not needed, because Nuxt auto-imports it. `about.vue` uses it without an import, and that works too.
- The navigation is placed **inside each page** and not in the layout. That's why `/contact` and `/pokemon` have no navigation. If you put `<Navigation />` into `layouts/default.vue`, every page using that layout would get it.
- `MyButton.vue` has a scoped style for `h1`, but the component contains no `h1`, so that style does nothing.
- `<MyButton> </MyButton>` is written with opening and closing tags, but `MyButton` has no `<slot />`, so anything you put between the tags would be ignored. It always shows "I am a button".
- `content-page.vue` says "Ende **Contact** Page", but it's a general layout and not specific to the contact page.
- `index.js` in the project root is a leftover and isn't used by Nuxt.

---

## Part 2: The Pokémon Example

**Goal:** show a list of Pokémon. Clicking a Pokémon adds it to your team (max. 3). Clicking a Pokémon in your team removes it. A search field filters the list.

### How the pieces fit together

```
data/pokemon.js ──import──▶ pages/pokemon.vue (parent)
                                │
                                │  props:  :pokemonArray="team"         / "filteredPokemon"
                                ▼
                         components/PokemonCard.vue (child)
                                │
                                │  emit:   'selectPokemon' (with the clicked pokemon)
                                ▼
                         pages/pokemon.vue runs removeFromTeam / addToTeam
```

`pokemon.vue` uses `<PokemonCard>` **twice**:

1. For the **team**: clicking a card calls `removeFromTeam`
2. For the **available Pokémon**: clicking a card calls `addToTeam`

Same component, different data and a different reaction to the click. That's the point of components.

### The data: `data/pokemon.js`

A plain array of objects. Each Pokémon has `id`, `name`, `type`, `hp` and `image`:

```js
{ id: 25, name: 'Pikachu', type: 'electric', hp: 35, image: 'https://...25.png' }
```

It's imported at the top of `pokemon.vue`:

```js
import allPokemon from '~/data/pokemon.js'
```

`allPokemon` is **not** reactive. It never changes, so it doesn't need to be.

---

## Vue concepts we learned

### 1. `ref()`: reactive state

A `ref` is a variable that Vue watches. When its value changes, the page updates automatically.

```js
const team = ref([])     // the Pokémon in our team
const search = ref('')   // the text in the search field
```

- In `<script>` you access the value with **`.value`**: `team.value.push(pokemon)`
- In `<template>` you **don't** need `.value`: `{{ team.length }}`

> `ref`, `computed` etc. don't need to be imported in Nuxt. They're auto-imported.

### 2. `v-model`: form bindings

`v-model` connects an input field to a `ref` in **both directions**: typing updates the variable, and changing the variable updates the input.

```vue
<input v-model="search" type="text" placeholder="Pokemon suchen ...">
```

Every keystroke updates `search`, which makes `filteredPokemon` recalculate (see `computed` below), so the list filters while you type.

### 3. Event listeners

`@click` (short for `v-on:click`) runs code when something happens. In `PokemonCard.vue`:

```vue
<div @click="$emit('selectPokemon', pokemon)" class="card" ...>
```

When a card is clicked, it doesn't do anything itself. It just sends an event to the parent (see Emits).

### 4. Props: Parent → Child

Props are how a parent **passes data down** to a child component.

In the child (`PokemonCard.vue`), we declare which props it accepts:

```js
defineProps({
  pokemonArray: Object,
})
```

In the parent (`pokemon.vue`), we pass data with `:` (short for `v-bind:`):

```vue
<PokemonCard :pokemonArray="team" ... />
<PokemonCard :pokemonArray="filteredPokemon" ... />
```

The `:` means "this is JavaScript, not a string". Without it, Vue would pass the literal text `"team"`.

### 5. Emits: Child → Parent

A child **can't** change the parent's data directly. Instead it **emits an event**, and the parent decides what to do.

In the child (`PokemonCard.vue`):

```js
defineEmits(['selectPokemon']);
```

```vue
<div @click="$emit('selectPokemon', pokemon)">
```

In the parent (`pokemon.vue`), we listen to that event like a normal click:

```vue
<PokemonCard :pokemonArray="team"            @selectPokemon="removeFromTeam" />
<PokemonCard :pokemonArray="filteredPokemon" @selectPokemon="addToTeam" />
```

The `pokemon` sent with `$emit` automatically becomes the argument of `addToTeam(pokemon)` / `removeFromTeam(pokemon)`.

**Remember:** data goes **down** via props, events go **up** via emits.

### 6. `v-for`: list rendering

`v-for` repeats an element once for every item in an array:

```vue
<div
    class="card"
    v-for="pokemon in pokemonArray"
    :key="pokemon.id">
  <img :src="pokemon.image" :alt="pokemon.name + 'Pokemon'">
  <h2>{{ pokemon.name }}</h2>
</div>
```

- `pokemon` is the current item in each repetition.
- `:key` must be **unique** (here: the `id`). Vue uses it to keep track of which element is which.
- `:src` and `:alt` are bound with `:`, so they use the values of the current Pokémon.

### 7. `v-if` / `v-else`: conditional rendering

Show one thing **or** another depending on a condition:

```vue
<p v-if="team.length == 0"> Füge ein Pokemon in dein Team ein!</p>

<div v-else>
  <!-- show the team -->
</div>
```

`v-else` must come **directly after** the element with `v-if`.

### 8. `computed`: derived values

A `computed` value is calculated from other reactive values and **updates automatically** when they change. Use it when a value depends on other values. Don't store it in its own `ref` and update it by hand.

```js
const teamCount   = computed(() => team.value.length);
const isTeamFull  = computed(() => team.value.length >= 3);

const filteredPokemon = computed(() => {
  return allPokemon.filter((pokemon) =>
    !team.value.includes(pokemon) &&
    pokemon.name.toLowerCase().includes(search.value.toLowerCase())
  );
});
```

`filteredPokemon` shows every Pokémon that:

1. is **not** already in the team, **and**
2. contains the search text (case-insensitive, thanks to `toLowerCase()`)

So adding a Pokémon to the team automatically removes it from the list, and removing it brings it back. We never move it between lists by hand.

Like `ref`, you read a computed with `.value` in the script (`isTeamFull.value`) and without `.value` in the template (`{{ teamCount }}`).

### 9. Class & style bindings

`:class` adds a CSS class **only when a condition is true**:

```vue
<h2 :class="{ red: isTeamFull }"> Dein Team hat {{ teamCount }} Pokemon:</h2>
```

```css
.red { color: red; }
```

→ When `isTeamFull` is `true` (3 Pokémon), the heading turns red. This works well with a `computed` value as the condition.

The same works for inline styles with `:style` (not used in this project, just for reference):

```vue
<h2 :style="{ color: isTeamFull ? 'red' : 'black' }">...</h2>
```

---

## The team logic in `pokemon.vue`

```js
function addToTeam(pokemon){
  if (!isTeamFull.value){
    team.value.push(pokemon);      // add to the array
  } else {
    alert('Team is full!')         // max. 3 Pokémon
  }
}

function removeFromTeam(pokemon){
  // keep every pokemon EXCEPT the clicked one
  team.value = team.value.filter((teamPokemon) => teamPokemon !== pokemon)
}
```

**The whole flow when you click Pikachu in the list:**

1. `PokemonCard` catches the `@click` and emits `selectPokemon` with Pikachu
2. `pokemon.vue` receives it and calls `addToTeam(Pikachu)`
3. Pikachu is pushed into `team` (a `ref`, so Vue notices)
4. `teamCount`, `isTeamFull` and `filteredPokemon` recalculate (they're `computed`)
5. The page updates: Pikachu shows up in the team, disappears from the list, the counter goes up, and `v-if`/`v-else` switches from the hint text to the team grid

---

## Messy bits in Part 2

Some things work but aren't how you'd usually do it. Watch out for these in your own projects:

- **`PokemonCard` isn't really a "card".** It receives the *whole array* and runs the `v-for` itself, so it renders a list of cards. Usually a `PokemonCard` gets **one** Pokémon as a prop, and the `v-for` sits in the parent:
  ```vue
  <PokemonCard
      v-for="pokemon in team"
      :key="pokemon.id"
      :pokemon="pokemon"
      @selectPokemon="removeFromTeam" />
  ```
- **The prop type is wrong.** `pokemonArray: Object` should be `pokemonArray: Array`. It still works because Vue only shows a warning in the console for type mismatches.
- **Styles aren't `scoped`.** In `pokemon.vue` and `PokemonCard.vue`, `<style>` has no `scoped`, so `.grid`, `.card`, `.red` and **every `input`** are styled globally across the whole app.
- **`alert()`** is used when the team is full. Fine for testing, but in a real app you'd show a message on the page (e.g. with `v-if`).
- **`console.log`s** are still in the code from debugging.
- **`team.length == 0`** in the template: `===` is the safer comparison in JavaScript.
- **`:alt="pokemon.name + 'Pokemon'"`** is missing a space, so the alt text becomes "PikachuPokemon".
- **No navigation** on the Pokémon page (see Part 1).
