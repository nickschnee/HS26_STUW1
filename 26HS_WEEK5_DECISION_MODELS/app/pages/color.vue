<script setup>
// CSS color for each name Nimble can choose, used to color the page
const COLORS = {
  red: '#e53935',
  orange: '#fb8c00',
  yellow: '#fdd835',
  green: '#43a047',
  blue: '#1e88e5',
  purple: '#8e24aa',
  pink: '#ec407a',
  brown: '#795548',
  black: '#212121',
  white: '#ffffff',
  gray: '#9e9e9e',
}

const video = ref(null)
const canvas = ref(null)

const cameraError = ref('')
const measured = ref(null) // { r, g, b }
const result = ref(null) // response from /api/color
const imageResult = ref(null) // response from /api/color-image
const error = ref('')
const isLoading = ref(false)
const auto = ref(false)

let stream = null
let timer = null
let isMounted = false

const measuredCss = computed(() => {
  if (!measured.value) return 'transparent'
  const { r, g, b } = measured.value
  return `rgb(${r}, ${g}, ${b})`
})

const answer = computed(() => result.value?.answers.color)

const imageWinner = computed(() => {
  if (!imageResult.value) return ''
  const entries = Object.entries(imageResult.value.similarities)
  return entries.sort((a, b) => b[1] - a[1])[0][0]
})

onMounted(async () => {
  isMounted = true
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true })
    video.value.srcObject = stream
  } catch (e) {
    cameraError.value = 'Kein Zugriff auf die Kamera: ' + e.message
  }
})

onUnmounted(() => {
  isMounted = false
  stream?.getTracks().forEach((track) => track.stop())
  clearInterval(timer)
  document.body.style.backgroundColor = ''
})

// Draws the current camera picture into the canvas and averages
// the pixels in the middle of the picture.
function measureColor() {
  const width = 160
  const height = 120
  const context = canvas.value.getContext('2d', { willReadFrequently: true })
  context.drawImage(video.value, 0, 0, width, height)

  // only the center half of the picture, the edges are usually background
  const pixels = context.getImageData(width / 4, height / 4, width / 2, height / 2).data

  let r = 0
  let g = 0
  let b = 0
  const count = pixels.length / 4

  // pixels is one long list: r, g, b, a, r, g, b, a, ...
  for (let i = 0; i < pixels.length; i += 4) {
    r += pixels[i]
    g += pixels[i + 1]
    b += pixels[i + 2]
  }

  return {
    r: Math.round(r / count),
    g: Math.round(g / count),
    b: Math.round(b / count),
  }
}

// Cuts the middle of the camera picture out as a JPEG for EmbeddingGemma.
// Returns only the base64 part, without "data:image/jpeg;base64,".
function grabCenterImage() {
  const size = 224
  const crop = document.createElement('canvas')
  crop.width = size
  crop.height = size

  const { videoWidth, videoHeight } = video.value
  crop.getContext('2d').drawImage(
    video.value,
    videoWidth / 4, videoHeight / 4, videoWidth / 2, videoHeight / 2, // from: middle of the video
    0, 0, size, size // to: the whole crop canvas
  )

  return crop.toDataURL('image/jpeg', 0.8).split(',')[1]
}

async function detect() {
  if (isLoading.value || !stream) return

  isLoading.value = true
  error.value = ''
  measured.value = measureColor()

  try {
    // ask both models at the same time
    const [colorResponse, imageResponse] = await Promise.all([
      $fetch('/api/color', { method: 'POST', body: measured.value }),
      $fetch('/api/color-image', { method: 'POST', body: { image: grabCenterImage() } }),
    ])
    // the user may have left the page while the models were thinking
    if (!isMounted) return

    result.value = colorResponse
    imageResult.value = imageResponse
    document.body.style.backgroundColor = COLORS[answer.value.choice]
  } catch (e) {
    error.value = 'Das Modell hat nicht geantwortet. Läuft Ollama? (' + e.message + ')'
  } finally {
    isLoading.value = false
  }
}

watch(auto, (isOn) => {
  clearInterval(timer)
  if (isOn) timer = setInterval(detect, 1500)
})
</script>

<template>
  <h1>Welche Farbe halte ich in die Kamera?</h1>

  <p v-if="cameraError" class="error">{{ cameraError }}</p>

  <div class="layout">
    <div class="camera">
      <video ref="video" autoplay playsinline muted />
      <div class="target" />
      <canvas ref="canvas" width="160" height="120" />
    </div>

    <div class="panel">
      <button :disabled="isLoading" @click="detect">
        {{ isLoading ? 'Modell denkt …' : 'Farbe erkennen' }}
      </button>

      <label>
        <input v-model="auto" type="checkbox">
        automatisch alle 1,5 Sekunden
      </label>

      <p v-if="error" class="error">{{ error }}</p>

      <div v-if="measured" class="measured">
        <div class="swatch" :style="{ backgroundColor: measuredCss }" />
        <div>
          <div>Gemessen: <code>{{ measuredCss }}</code></div>
          <div v-if="result">HSL: <code>{{ result.state.hsl }}</code></div>
        </div>
      </div>

      <template v-if="answer">
        <h2>Nimble sagt: {{ answer.choice }}</h2>
        <p class="small">
          Konfidenz {{ Math.round(answer.confidence * 100) }} % · {{ result.ms }} ms
        </p>
        <ProbabilityBars :values="answer.probabilities" :colors="COLORS" />

        <details>
          <summary>Was wurde ans Modell geschickt?</summary>
          <pre>{{ { state: result.state, questions: result.questions } }}</pre>
        </details>
        <details>
          <summary>Was kam zurück?</summary>
          <pre>{{ result.answers }}</pre>
        </details>
      </template>

      <template v-if="imageResult">
        <h2>EmbeddingGemma 2 sieht: {{ imageWinner }}</h2>
        <p class="small">
          Schaut das Bild selbst an · Ähnlichkeit (Kosinus), keine Wahrscheinlichkeit ·
          Balken: tiefster bis höchster Wert · {{ imageResult.ms }} ms
        </p>
        <ProbabilityBars :values="imageResult.similarities" format="number" :colors="COLORS" />
      </template>
    </div>
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  align-items: flex-start;
}

.camera {
  position: relative;
  width: 400px;
  max-width: 100%;
}

video {
  width: 100%;
  border-radius: 10px;
  transform: scaleX(-1); /* mirror, feels more natural */
  background-color: black;
}

/* shows which part of the picture is measured */
.target {
  position: absolute;
  inset: 25%;
  border: 3px dashed white;
  border-radius: 6px;
  pointer-events: none;
}

canvas {
  display: none;
}

.panel {
  flex: 1;
  min-width: 280px;
  background-color: white;
  padding: 16px;
  border-radius: 10px;
}

button {
  padding: 16px;
  border: 2px solid black;
  border-radius: 10px;
  font-size: 1rem;
  cursor: pointer;
}

label {
  display: block;
  margin: 12px 0;
}

.measured {
  display: flex;
  gap: 12px;
  align-items: center;
}

.swatch {
  width: 60px;
  height: 60px;
  border: 2px solid black;
  border-radius: 10px;
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
