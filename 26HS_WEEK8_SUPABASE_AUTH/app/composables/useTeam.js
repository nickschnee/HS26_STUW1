// Composable: the team of the logged-in user.
// The queries are the same as in week 7. We don't filter by user here:
// the RLS policies in Supabase only return and change the rows of the logged-in user.

export async function useTeam() {
  const supabase = useSupabase();

  // server: false → the query runs in the browser, so you can see it in the Network tab
  const { data: team, error, refresh } = await useAsyncData("team", async () => {
    const { data, error } = await supabase
      .from("team")
      .select("id, name, image")
      .order("created_at");

    if (error) throw error;
    return data;
  }, { server: false, default: () => [] });

  async function addPokemon(pokemon) {
    // no user_id here: the column has the default auth.uid(), Supabase fills it in
    const { error } = await supabase
      .from("team")
      .insert({ id: pokemon.id, name: pokemon.name, image: pokemon.image });

    if (error) throw error;
    await refresh();
  }

  async function removePokemon(pokemon) {
    // RLS adds "and user_id = auth.uid()", so you can only delete your own Pokémon
    const { error } = await supabase
      .from("team")
      .delete()
      .eq("id", pokemon.id);

    if (error) throw error;
    await refresh();
  }

  return { team, error, addPokemon, removePokemon };
}
