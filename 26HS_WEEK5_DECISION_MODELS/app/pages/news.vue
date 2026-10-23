<script setup>
import { ARTICLES, TOPICS } from '~/data/articles'

const text = ref(ARTICLES[0].text)
// the topics are just a comma-separated text: change them during class!
const topicsText = ref(TOPICS.join(', '))

const result = ref(null) // response from /api/news
const error = ref('')
const isLoading = ref(false)

const topics = computed(() =>
  topicsText.value.split(',').map((topic) => topic.trim()).filter((topic) => topic !== '')
)

const topicAnswer = computed(() => result.value?.nimble.answers.topic)
const opinionAnswer = computed(() => result.value?.nimble.answers.opinion)

const embeddingWinner = computed(() => {
  if (!result.value) return ''
  const entries = Object.entries(result.value.embedding.similarities)
  return entries.sort((a, b) => b[1] - a[1])[0][0]
})

function pickArticle(article) {
  text.value = article.text
  result.value = null
}

async function classify() {
  isLoading.value = true
  error.value = ''

  try {
    result.value = await $fetch('/api/news', {
      method: 'POST',
      body: { text: text.value, topics: topics.value },
    })
  } catch (e) {
    error.value = 'Das Modell hat nicht geantwortet. Läuft Ollama? (' + e.message + ')'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <h1>Worum geht es in diesem Artikel?</h1>

  <div class="examples">
    <button v-for="article in ARTICLES" :key="article.title" class="example" @click="pickArticle(article)">
      {{ article.title }}
    </button>
  </div>

  <textarea v-model="text" rows="7" placeholder="Artikel hier einfügen …" />

  <label>
    Themen (mit Komma getrennt)
    <input v-model="topicsText" type="text">
  </label>

  <button class="main" :disabled="isLoading || topics.length < 2" @click="classify">
    {{ isLoading ? 'Modelle denken …' : 'Klassifizieren' }}
  </button>

  <p v-if="error" class="error">{{ error }}</p>

  <div v-if="result" class="results">
    <section>
      <h2>Nimble: {{ topicAnswer.choice }}</h2>
      <p class="small">
        Entscheidungsmodell · Konfidenz {{ Math.round(topicAnswer.confidence * 100) }} % ·
        {{ result.nimble.ms }} ms
      </p>
      <ProbabilityBars :values="topicAnswer.probabilities" />

      <h3>Meinung oder Bericht?</h3>
      <ProbabilityBars :values="{ Meinung: opinionAnswer.noul, Bericht: 1 - opinionAnswer.noul }" />

      <details>
        <summary>Was wurde ans Modell geschickt?</summary>
        <pre>{{ result.nimble.questions }}</pre>
      </details>
      <details>
        <summary>Was kam zurück?</summary>
        <pre>{{ result.nimble.answers }}</pre>
      </details>
    </section>

    <section>
      <h2>EmbeddingGemma 2: {{ embeddingWinner }}</h2>
      <p class="small">
        Embedding-Modell · Ähnlichkeit (Kosinus), keine Wahrscheinlichkeit ·
        Balken: tiefster bis höchster Wert ·
        {{ result.embedding.ms }} ms
      </p>
      <ProbabilityBars :values="result.embedding.similarities" format="number" />
    </section>
  </div>
</template>

<style scoped>
.examples {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

button {
  border: 2px solid black;
  border-radius: 10px;
  cursor: pointer;
}

.example {
  padding: 8px 12px;
  background-color: white;
}

.main {
  padding: 16px;
  font-size: 1rem;
}

textarea,
input {
  width: 100%;
  box-sizing: border-box;
  padding: 12px;
  border: 2px solid black;
  border-radius: 10px;
  font: inherit;
}

label {
  display: block;
  margin: 12px 0;
}

.results {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 24px;
  margin-top: 24px;
}

section {
  background-color: white;
  border: 2px solid black;
  border-radius: 10px;
  padding: 16px;
}

.small {
  color: #666;
}

.error {
  color: red;
}

pre {
  font-size: 0.8rem;
  overflow-x: auto;
}
</style>
