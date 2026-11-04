// DELETE /api/team/25 → remove Pokémon 25 from the team

import { supabase } from "~~/server/utils/supabase.js";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");

  const { error } = await supabase.from("team").delete().eq("id", id);

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message });
  }

  return { ok: true };
});
