// Route middleware: runs before a page opens.
// Pages with definePageMeta({ middleware: "auth" }) are only for logged-in users.
// This only protects the UI. What the data is protected by are the RLS policies in Supabase.

export default defineNuxtRouteMiddleware(async () => {
  const { user, loadUser } = useAuth();

  await loadUser();

  if (!user.value) {
    return navigateTo("/login");
  }
});
