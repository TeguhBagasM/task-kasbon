import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Dashboard } from "@/components/Dashboard";

// Server Component tipis: ambil email user, render dashboard client.
// Suspense membungkus useSearchParams di Dashboard.
export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return (
    <Suspense>
      <Dashboard email={user?.email ?? null} />
    </Suspense>
  );
}
