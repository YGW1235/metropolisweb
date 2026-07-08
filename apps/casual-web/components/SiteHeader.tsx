import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

import { MobileBottomNav } from "@/components/MobileBottomNav";

export async function SiteHeader() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: { nickname: string } | null = null;
  let isAdmin = false;

  if (user) {
    await supabase.rpc("ensure_casual_profile");

    const { data: profileData } = await supabase
      .from("casual_profiles")
      .select("nickname")
      .eq("user_id", user.id)
      .maybeSingle();

    profile = profileData;

    const { data: adminData } = await supabase.rpc("is_casual_admin");

    isAdmin = Boolean(adminData);
  }


  return (
    <>
        <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-6 text-[#2f2118]">
        <Link href="/" className="group shrink-0">
            <p className="text-xs font-semibold tracking-[0.3em] text-orange-700">
            SYMPOSION
            </p>
            <h1 className="mt-1 text-2xl font-black group-hover:text-orange-700">
            심포지온
            </h1>
        </Link>

        <nav className="hidden items-center gap-4 text-sm font-bold text-stone-600 md:flex">
            <Link href="/topics" className="hover:text-stone-950">
            주제
            </Link>

            <Link href="/#today" className="hover:text-stone-950">
            오늘의 논쟁
            </Link>

            <Link href="/#opinions" className="hover:text-stone-950">
            인기 의견
            </Link>

            {isAdmin && (
            <Link href="/admin" className="text-orange-700 hover:text-orange-900">
                관리자
            </Link>
            )}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
            {user ? (
            <Link
            href="/me"
            className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-bold text-stone-700 transition hover:bg-stone-50"
            >
            {profile?.nickname ?? "내 활동"}
            </Link>
            ) : (
            <>
                <Link
                href="/login"
                className="rounded-full border border-stone-200 bg-white px-3 py-2 text-sm font-bold text-stone-700 transition hover:bg-stone-50"
                >
                로그인
                </Link>

                <Link
                href="/signup"
                className="rounded-full bg-stone-950 px-4 py-2 text-sm font-bold text-white transition hover:-translate-y-0.5"
                >
                가입
                </Link>
            </>
            )}
        </div>
        </header>

        <MobileBottomNav
        isLoggedIn={Boolean(user)}
        isAdmin={isAdmin}
        nickname={profile?.nickname ?? null}
        />
    </>
  );
}