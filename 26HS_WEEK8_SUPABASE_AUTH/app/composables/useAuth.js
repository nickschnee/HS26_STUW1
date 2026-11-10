// Composable: who is logged in? Sign up, log in and log out.
// Supabase Auth checks the password and gives the browser a session with an access token.
// Docs: https://supabase.com/docs/reference/javascript/auth-signinwithpassword

export function useAuth() {
  const supabase = useSupabase();

  // useState: the same "user" for every page and component
  const user = useState("user", () => null);

  // reads the saved session from localStorage (no request if it is still valid)
  async function loadUser() {
    const { data } = await supabase.auth.getSession();
    user.value = data.session?.user ?? null;
  }

  async function signUp(email, password) {
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) throw error;
    // data.session is null if "Confirm email" is turned on in Supabase:
    // the user has to click the link in the email first
    user.value = data.session?.user ?? null;
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) throw error;
    user.value = data.user;
  }

  async function signOut() {
    await supabase.auth.signOut();
    user.value = null;
    // forget the team of this user, so the next user doesn't see it for a moment
    clearNuxtData("team");
  }

  return { user, loadUser, signUp, signIn, signOut };
}
