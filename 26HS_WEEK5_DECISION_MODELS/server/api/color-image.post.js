// POST /api/color-image  { image: "<base64 JPEG without data: prefix>" }
// Unlike Nimble, EmbeddingGemma 2 can look at the picture itself.
// It turns the picture and a sentence for each color into vectors,
// then we check which sentence is closest to the picture.

const COLOR_NAMES = [
  "red",
  "orange",
  "yellow",
  "green",
  "blue",
  "purple",
  "pink",
  "brown",
  "black",
  "white",
  "gray",
];

export default defineEventHandler(async (event) => {
  const { image } = await readBody(event);

  // the prefix tells EmbeddingGemma this is a search query (images get no prefix)
  const sentences = COLOR_NAMES.map((name) => `task: search result | query: a photo of something ${name}`);

  const start = Date.now();
  // images are sent as { image: "..." }, text as a normal string
  const [imageVector, ...colorVectors] = await embed([{ image }, ...sentences]);

  const similarities = Object.fromEntries(
    COLOR_NAMES.map((name, i) => [name, cosineSimilarity(imageVector, colorVectors[i])])
  );

  return { sentences, similarities, ms: Date.now() - start };
});
