// Small helpers for talking to Ollama on this computer.
// Nuxt auto-imports everything in server/utils/, so the API routes
// can call askNimble() and embed() without an import.

const OLLAMA_URL = "http://localhost:11434";

// Asks the decision model Nimble one or more questions about `state`.
// Docs: https://ollama.com/library/nimble
export async function askNimble(state, questions) {
  const response = await $fetch(`${OLLAMA_URL}/v1/systemone`, {
    method: "POST",
    body: {
      model: "nimble",
      state,
      questions,
      keep_alive: "60m",
    },
  });

  return response.answers;
}

// Turns text into vectors (lists of 768 numbers) with EmbeddingGemma 2.
// Docs: https://ollama.com/library/embeddinggemma-2
export async function embed(input) {
  const response = await $fetch(`${OLLAMA_URL}/api/embed`, {
    method: "POST",
    body: {
      model: "embeddinggemma-2",
      input,
      keep_alive: "60m",
    },
  });

  return response.embeddings;
}

// How similar are two vectors? 1 = same direction, 0 = unrelated.
export function cosineSimilarity(a, b) {
  let dot = 0;
  let lengthA = 0;
  let lengthB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    lengthA += a[i] * a[i];
    lengthB += b[i] * b[i];
  }

  return dot / (Math.sqrt(lengthA) * Math.sqrt(lengthB));
}
