<template>
  <h1>Entscheidungsmodelle lokal ausprobieren</h1>

  <p>
    Ein <strong>Entscheidungsmodell</strong> schreibt keinen Text. Es bekommt eine Eingabe und
    eine Frage mit festen Antwortmöglichkeiten. Zurück kommt die Antwort und
    <strong>wie sicher</strong> sich das Modell ist (Wahrscheinlichkeiten).
  </p>

  <p>Beide Modelle laufen mit Ollama auf diesem Laptop. Es geht nichts ins Internet.</p>

  <ul>
    <li>
      <NuxtLink to="/color">Farbe erkennen</NuxtLink>: Die Kamera misst die Hauptfarbe, Nimble gibt ihr einen Namen,
      die Seite färbt sich ein. Zum Vergleich schaut EmbeddingGemma 2 das Bild selbst an.
    </li>
    <li>
      <NuxtLink to="/news">News klassifizieren</NuxtLink>: Nimble ordnet einen Artikel einem Thema zu.
      Zum Vergleich misst EmbeddingGemma 2, wie ähnlich der Artikel jedem Thema ist.
    </li>
  </ul>
</template>
