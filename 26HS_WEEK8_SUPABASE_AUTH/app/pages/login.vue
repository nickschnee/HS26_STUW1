<script setup>
// Login page: e-mail and password, sent to Supabase Auth via useAuth()
const { user, signIn, signUp } = useAuth()

const email = ref('')
const password = ref('')
const message = ref('')

async function login() {
  message.value = ''
  try {
    await signIn(email.value, password.value)
    await navigateTo('/pokemon')
  } catch (error) {
    message.value = error.message
  }
}

async function register() {
  message.value = ''
  try {
    await signUp(email.value, password.value)
    if (user.value) {
      await navigateTo('/pokemon')
    } else {
      message.value = 'Fast geschafft: Bestätige deine E-Mail-Adresse über den Link in der E-Mail.'
    }
  } catch (error) {
    message.value = error.message
  }
}
</script>

<template>
  <h1>Login</h1>

  <form @submit.prevent="login">
    <input v-model="email" type="email" placeholder="E-Mail" required>
    <input v-model="password" type="password" placeholder="Passwort (min. 6 Zeichen)" required>

    <div class="buttons">
      <button type="submit">Einloggen</button>
      <button type="button" @click="register">Registrieren</button>
    </div>
  </form>

  <p v-if="message">{{ message }}</p>
</template>

<style scoped>
form {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 280px;
}

input,
button {
  padding: 16px;
  border: 2px solid black;
  border-radius: 10px;
}

.buttons {
  display: flex;
  gap: 8px;
}

button {
  flex: 1;
  cursor: pointer;
  background-color: bisque;
}
</style>
