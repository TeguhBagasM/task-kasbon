import { createClient } from "@/lib/supabase/server";
import { Dashboard } from "@/components/Dashboard";

// Server Component tipis: ambil email user, render dashboard client.
export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return <Dashboard email={user?.email ?? null} />;
}
