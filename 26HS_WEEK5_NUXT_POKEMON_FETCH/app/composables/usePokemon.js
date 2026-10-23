// Composable: loads the first 151 Pokémon from the PokéAPI.
// Docs: https://pokeapi.co/docs/v2#pokemon

const API_URL = "https://pokeapi.co/api/v2/pokemon";
const SPRITE_URL =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";

export function usePokemon() {
  return useFetch(API_URL, {
    query: { limit: 151 },
    default: () => [],
    transform: (response) => response.results.map(toPokemon),
  });
}

// The API only gives us a name and a URL like ".../pokemon/25/".
// We turn that into the same shape our old data file had.
function toPokemon(result) {
  // console.log(result);
  const id = Number(result.url.split("/").at(-2));
  // console.log(id);

  return {
    id,
    name: capitalize(result.name),
    image: `${SPRITE_URL}/${id}.png`,
  };
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
