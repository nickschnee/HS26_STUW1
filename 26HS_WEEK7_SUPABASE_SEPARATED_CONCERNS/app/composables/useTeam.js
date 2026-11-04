// Composable: the team that is saved in the database.
// It only talks to our own API (/api/team). It doesn't know that Supabase exists.

export async function useTeam() {
  const { data: team, error, refresh } = await useFetch("/api/team", {
    default: () => [],
  });

  async function addPokemon(pokemon) {
    await $fetch("/api/team", { method: "POST", body: pokemon });
    await refresh();
  }

  async function removePokemon(pokemon) {
    await $fetch(`/api/team/${pokemon.id}`, { method: "DELETE" });
    await refresh();
  }

  return { team, error, addPokemon, removePokemon };
}
