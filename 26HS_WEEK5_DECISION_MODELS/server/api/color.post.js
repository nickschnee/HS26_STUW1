// POST /api/color  { r: 200, g: 30, b: 40 }
// Nimble can't see images. The browser measures the average color of the
// camera picture and sends the numbers. Nimble decides which name fits best.

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
  const { r, g, b } = await readBody(event);

  // We give the model the same color in three notations.
  // HSL (hue, saturation, lightness) makes it easier to tell e.g. gray from blue.
  const state = {
    rgb: `rgb(${r}, ${g}, ${b})`,
    hex: toHex(r, g, b),
    hsl: toHsl(r, g, b),
  };

  const questions = {
    color: {
      type: "choice",
      instructions: "Which color name best describes this color value?",
      criteria: Object.fromEntries(COLOR_NAMES.map((name) => [name, null])),
    },
  };

  const start = Date.now();
  const answers = await askNimble(state, questions);

  return { state, questions, answers, ms: Date.now() - start };
});

function toHex(r, g, b) {
  return "#" + [r, g, b].map((value) => value.toString(16).padStart(2, "0")).join("");
}

function toHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;
  const delta = max - min;

  let hue = 0;
  let saturation = 0;

  if (delta !== 0) {
    saturation = delta / (1 - Math.abs(2 * lightness - 1));

    if (max === r) hue = ((g - b) / delta) % 6;
    else if (max === g) hue = (b - r) / delta + 2;
    else hue = (r - g) / delta + 4;

    hue = Math.round(hue * 60);
    if (hue < 0) hue += 360;
  }

  return `hsl(${hue}, ${Math.round(saturation * 100)}%, ${Math.round(lightness * 100)}%)`;
}
