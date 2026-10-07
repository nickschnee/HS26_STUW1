# Week 3: Nuxt Concepts & Pokémon (Cleaned Up)

This is the same code as [`26HS_WEEK3_NUXT_CONCEPTS_POKEMON`](../26HS_WEEK3_NUXT_CONCEPTS_POKEMON/README.md), just tidied up. The app looks and behaves exactly the same. Nothing was restructured or added.

All the concepts (pages, layouts, components, ref, v-model, props, emits, v-for, v-if, computed, class bindings) are explained in the [original project's README](../26HS_WEEK3_NUXT_CONCEPTS_POKEMON/README.md).

## Running the project

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`. The routes are `/`, `/about`, `/contact` and `/pokemon`.

## What was cleaned up

**Everywhere**
- Consistent formatting: 2-space indentation, no extra blank lines, `<script>` before `<template>`
- `<style scoped>` everywhere, so styles only apply inside their own component. The app still looks the same.
- `<nuxt-link>` written as `<NuxtLink>` (same component, standard spelling)

**`pages/pokemon.vue`**
- Removed the `console.log`s and the commented-out `alert`
- `team.length == 0` → `team.length === 0`
- Merged `<div v-else>` and the `<div class="grid">` inside it into one `<div v-else class="grid">`

**`components/PokemonCard.vue`**
- Prop type fixed: `pokemonArray: Object` → `pokemonArray: Array`
- Alt text fixed: `pokemon.name + 'Pokemon'` → `pokemon.name + ' Pokemon'` (missing space)

**`pages/index.vue` / `app.vue`**
- Removed the manual `import Navigation from ...` (Nuxt auto-imports components)
- Removed the empty `<script setup lang="ts">` blocks
- `<MyButton> </MyButton>` → `<MyButton />`

**`components/MyButton.vue`**
- Removed the `h1` style, because the component has no `h1`

**Removed files**
- `index.js` (leftover, not used by Nuxt)

## What was intentionally left as it is

These things are still the way we wrote them in class. The original README explains how you could improve them:

- `PokemonCard` still receives the whole array and runs the `v-for` itself
- `alert('Team is full!')` when the team is full
- The navigation is still placed in `index.vue` and `about.vue` and not in the layout
- All texts on the pages (in German) are unchanged
