// POST /api/team → add one Pokémon to the team
// The body looks like this: { id: 25, name: "Pikachu", image: "https://..." }

import { supabase } from "~~/server/utils/supabase.js";

export default defineEventHandler(async (event) => {
  const pokemon = await readBody(event);

  const { error } = await supabase
    .from("team")
    .insert({ id: pokemon.id, name: pokemon.name, image: pokemon.image });

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message });
  }

  return { ok: true };
});
