// Composable: the team that is saved in the database.
// It talks to Supabase directly from the browser. There is no API of our own in between.

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
    const { error } = await supabase
      .from("team")
      .insert({ id: pokemon.id, name: pokemon.name, image: pokemon.image });

    if (error) throw error;
    await refresh();
  }

  async function removePokemon(pokemon) {
    const { error } = await supabase
      .from("team")
      .delete()
      .eq("id", pokemon.id);

    if (error) throw error;
    await refresh();
  }

  return { team, error, addPokemon, removePokemon };
}
