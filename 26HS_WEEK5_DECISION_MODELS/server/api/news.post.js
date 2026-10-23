// POST /api/news  { text: "...", topics: ["Politik", "Sport", ...] }
// Classifies a news article in two ways so we can compare them:
//   1. Nimble (decision model) picks a topic and says whether it's an opinion piece
//   2. EmbeddingGemma 2 (embedding model) compares the article with each topic

export default defineEventHandler(async (event) => {
  const { text, topics } = await readBody(event);

  const questions = {
    topic: {
      type: "choice",
      instructions: "Which topic is this news article mainly about?",
      // null = the topic name describes itself
      criteria: Object.fromEntries(topics.map((topic) => [topic, null])),
    },
    opinion: {
      type: "noul",
      instructions: "Is this article an opinion piece or commentary?",
      criteria: {
        true: "The author gives a personal opinion or argues for something.",
        false: "The article neutrally reports facts and events.",
      },
    },
  };

  const nimbleStart = Date.now();
  const answers = await askNimble(text, questions);
  const nimbleMs = Date.now() - nimbleStart;

  const embeddingStart = Date.now();
  const similarities = await compareWithTopics(text, topics);
  const embeddingMs = Date.now() - embeddingStart;

  return {
    nimble: { questions, answers, ms: nimbleMs },
    embedding: { similarities, ms: embeddingMs },
  };
});

// Embeds the article and every topic, then measures how close
// the article is to each topic: { Politik: 0.41, Sport: 0.12, ... }
//
// EmbeddingGemma was trained with these prefixes. We treat it like a search:
// "which article would you find when searching for Sport?"
// Without the prefixes, all topics get almost the same score.
async function compareWithTopics(text, topics) {
  const document = `title: none | text: ${text}`;
  const queries = topics.map((topic) => `task: search result | query: Ein Zeitungsartikel über ${topic}`);
  const [article, ...topicVectors] = await embed([document, ...queries]);

  return Object.fromEntries(
    topics.map((topic, i) => [topic, cosineSimilarity(article, topicVectors[i])])
  );
}
