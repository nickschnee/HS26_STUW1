// GET /api/team → all Pokémon in the team

import { supabase } from "~~/server/utils/supabase.js";

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
