# Week 5: Decision models running locally

Two small demos that use AI models running on your own laptop with [Ollama](https://ollama.com). Nothing is sent to the internet.

- **`/color`**: the camera measures the main color in the middle of the picture. The decision model names it, and the page turns that color. For comparison, an embedding model looks at the picture itself.
- **`/news`**: paste a news article. The decision model picks a topic and says whether it's opinion or reporting. For comparison, an embedding model measures how close the article is to each topic.

## Slides

`slides/index.html` explains what decision models and embeddings are, using the results from these demos. Open it in a browser (it needs internet for reveal.js and the fonts). Press `S` for the speaker notes.

`slides/security.html` is a short extra deck about two security releases from 21 October 2026: PHP2Shell (PHP) and the Brotli bug in Node.js, with how to update PHP (Homebrew) and Node.js (nvm).

## The two models

| Model | Type | What it does |
| ----- | ---- | ------------ |
| [Nimble](https://ollama.com/library/nimble) (9B, ~9.5 GB) | Decision model | Gets some text (the "state") and questions with fixed answers. It returns the answer and a probability for each option. It doesn't write text. |
| [EmbeddingGemma 2](https://ollama.com/library/embeddinggemma-2) (740M, 1.3 GB) | Embedding model | Turns text or a picture into a list of 768 numbers (a vector). Things with similar meaning get similar vectors. |

## Setup

```bash
ollama pull nimble
ollama pull embeddinggemma-2
npm install
npm run dev
```

Then open `http://localhost:3000`. Ollama must be running (the Ollama app, or `ollama serve`).

The first request after starting takes a few seconds, because Ollama has to load the model into memory. After that, it stays loaded for 60 minutes (`keep_alive: "60m"`). **Before class**, click through both demos once.

## How it's built

```
app/
  pages/color.vue           camera, measures the color, calls /api/color
  pages/news.vue            text field, calls /api/news
  components/ProbabilityBars.vue
  data/articles.js          made-up example articles and the topic list
server/
  api/color.post.js         asks Nimble for a color name
  api/color-image.post.js   asks EmbeddingGemma which color sentence matches the picture
  api/news.post.js          asks Nimble for the topic, asks EmbeddingGemma for similarities
  utils/ollama.js           askNimble(), embed(), cosineSimilarity()
```

The browser never talks to Ollama directly. It calls our own Nuxt server routes (`/api/...`), and those call Ollama at `http://localhost:11434`. Everything in `server/utils/` is auto-imported in the server routes, just like composables in `app/composables/` are auto-imported in pages.

### Asking a decision model

Nimble has its own endpoint, `/v1/systemone`. You send the text and named questions:

```js
await $fetch('http://localhost:11434/v1/systemone', {
  method: 'POST',
  body: {
    model: 'nimble',
    state: 'In der 93. Minute traf der Stürmer zum 2:1 ...',
    questions: {
      topic: {
        type: 'choice',
        instructions: 'Which topic is this news article mainly about?',
        criteria: { Politik: null, Sport: null, Wirtschaft: null },
      },
      opinion: {
        type: 'noul',
        instructions: 'Is this article an opinion piece or commentary?',
      },
    },
  },
})
```

Question types:

- **`choice`**: pick one of 2–26 options. `null` means the option name explains itself, or you can write a description.
- **`noul`**: yes/no. The answer is the probability that it's true.
- **`score`**: a level on a scale, for example urgency 0–3.

The answer for the color `rgb(200, 30, 40)` looks like this (shortened, all 11 colors come back):

```json
{
  "color": {
    "type": "choice",
    "choice": "red",
    "probabilities": { "red": 0.950, "pink": 0.025, "orange": 0.014, "brown": 0.009, "...": "..." },
    "confidence": 0.891
  }
}
```

`confidence` says how much the probabilities are concentrated on one answer. It is **not** the chance that the answer is correct.

### The color demo

Nimble can only read text, not images. So the browser does the "seeing":

1. Draw the current camera picture into a hidden `<canvas>`
2. Read the pixels in the middle of the picture with `getImageData`
3. Average the red, green and blue values
4. Send `{ r, g, b }` to `/api/color`

The server also converts the color to hex and HSL before asking Nimble. HSL (hue, saturation, lightness) makes it easier to tell gray from a dull blue, for example.

Results from a test run:

| Color sent | Nimble says |
| ---------- | ----------- |
| `rgb(200, 30, 40)` | red 95 % |
| `rgb(0, 128, 128)` (teal) | green 91 %, blue 8 % |
| `rgb(60, 60, 70)` (dark gray) | gray 55 %, blue 23 %, purple 16 % |
| `rgb(120, 80, 40)` | brown 93 %, orange 7 % |

Good questions for class: why is the model unsure about dark gray? What happens in a dark room, where every color is measured as dark?

#### EmbeddingGemma 2 looks at the picture itself

The color page also sends the middle of the camera picture as a JPEG to `/api/color-image`. EmbeddingGemma 2 turns the picture into a vector, and the sentences "a photo of something red", "a photo of something blue", … too (with the search prefix, see below). The closest sentence wins.

Ollama's docs don't describe how to send an image to `/api/embed` yet. This format works:

```js
input: [{ image: '<base64 without data: prefix>' }, 'task: search result | query: a photo of something red', ...]
```

So the class sees two ways of solving the same task: measure the numbers yourself and let a decision model name them, or let a model look at the picture.

### Decision model vs. embedding model

On the news page, both models answer the same question in different ways:

- **Nimble** returns **probabilities**. They add up to 100 %.
- **EmbeddingGemma 2** returns a **similarity** between the article and the sentence "A news article about Sport" (cosine similarity). These are not percentages and don't add up to anything. Only the order matters.

Results from a test run:

| Article | Nimble | EmbeddingGemma 2 (top 2) |
| ------- | ------ | ------------------------ |
| Parlament stimmt neuem Budget zu | Politik 99 % | Politik 0.676, Wirtschaft 0.638 |
| Last-Minute-Sieg im Derby | Sport 100 % | Sport 0.699, Wirtschaft 0.637 |
| Bäckereikette schliesst zwölf Filialen | Wirtschaft 99 % | Wirtschaft 0.669, Umwelt 0.622 |
| Kommentar: Wir brauchen mehr Velowege | Umwelt 58 %, Politik 27 %, opinion 100 % | Umwelt 0.694, Politik 0.686 |
| Schwierig: Fussballclub geht an die Börse | Sport 94 %, Wirtschaft 4 % | Sport 0.622, Wirtschaft 0.616 |
| Schwierig: App erkennt Hautkrebs | Technologie 87 %, Gesundheit 10 % | **Gesundheit** 0.673, Technologie 0.668 |

Things to notice:

- Nimble is very sure on clear articles. EmbeddingGemma's scores are all between about 0.55 and 0.72, even for clear articles. That's normal for embeddings: two German texts always have *something* in common. Only the order matters. That's why the bars go from the lowest score (empty) to the highest (full).
- On the "Schwierig" articles, EmbeddingGemma's top two are almost tied. Nimble still picks one with high confidence. Which behavior is more honest?
- Nimble takes about 1 second per article, EmbeddingGemma about 0.1 seconds.

#### The prefixes matter

EmbeddingGemma was trained with short prefixes that say what the text is for ([model card](https://huggingface.co/google/embeddinggemma-2)). We use the search format: the topic is the query, the article is the document.

```js
'title: none | text: <article>'
'task: search result | query: Ein Zeitungsartikel über Sport'
```

How far "Sport" leads the second-best topic for the Derby article:

| Query | Lead over 2nd place |
| ----- | ------------------- |
| `A news article about Sport` (English, no prefix) | 0.019 |
| `Ein Zeitungsartikel über Sport` (German, no prefix) | 0.044 |
| German + prefix | 0.062 |

Asking in the article's language helps the most. The prefix helps a bit more on top. A bigger lead only means the model is more decisive, not that the answer is correct.

You can change the topic list in the text field. The models were never trained on these topics. That's called **zero-shot classification**.

## Ideas to try next

- Add a `score` question to the news page, for example "How urgent is this news?" with four levels
- Change the color names to German and see if the answers change
- Write descriptions for the topics instead of `null`, for example `Umwelt: "Klima, Natur, Energie, Verschmutzung"`
