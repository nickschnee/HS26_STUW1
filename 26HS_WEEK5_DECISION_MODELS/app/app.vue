<template>
  <div>
    <NuxtRouteAnnouncer />
    <Navigation />
    <main>
      <NuxtPage />
    </main>
  </div>
</template>

<style>
body {
  margin: 0;
  font-family: system-ui, sans-serif;
  background-color: white;
  transition: background-color 0.6s;
}

main {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}
</style>
