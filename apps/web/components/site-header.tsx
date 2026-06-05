import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export async function SiteHeader() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: {
    role: string;
    status: string;
    display_name: string | null;
  } | null = null;

  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("role, status, display_name")
      .eq("id", user.id)
      .single();

    profile = data;
  }

  const isAdmin = profile?.role === "admin" && profile?.status === "active";

  return (
    <header className="border-b border-gray-800 bg-gray-950 text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Link href="/" className="text-lg font-bold tracking-tight">
            Metropolis
        </Link>

        <nav className="flex flex-wrap items-center gap-2 text-sm sm:gap-4">
            <Link
            href="/topics"
            className="rounded-lg px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-white"
            >
            토론 주제
            </Link>

            {isAdmin ? (
            <Link
                href="/admin"
                className="rounded-lg px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-white"
            >
                관리자
            </Link>
            ) : null}

            {user ? (
            <Link
                href="/me"
                className="rounded-lg border border-gray-700 px-3 py-2 text-gray-200 hover:bg-gray-800"
            >
                내 계정
            </Link>
            ) : (
            <Link
                href="/login"
                className="rounded-lg bg-blue-500 px-3 py-2 font-medium text-white hover:bg-blue-400"
            >
                로그인
            </Link>
            )}
        </nav>
        </div>
    </header>
  );
}