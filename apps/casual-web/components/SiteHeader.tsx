import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

import { MobileBottomNav } from "@/components/MobileBottomNav";
import { SiteAnnouncement } from "@/components/SiteAnnouncement";

export async function SiteHeader() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: { nickname: string } | null = null;
  let isAdmin = false;
  let unreadNotificationCount = 0;

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

    const { count } = await supabase
      .from("casual_notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    unreadNotificationCount = count ?? 0;
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-orange-100 bg-white/95 text-[#2f2118] shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/85">
        <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
          <Link href="/" className="group shrink-0">
            <p className="text-[11px] font-semibold tracking-[0.28em] text-orange-700 sm:text-xs sm:tracking-[0.3em]">
              SYMPOSION
            </p>
            <h1 className="mt-0.5 text-xl font-black group-hover:text-orange-700 sm:mt-1 sm:text-2xl">
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

            <Link href="/contact" className="hover:text-stone-950">
              문의
            </Link>

            {user && (
              <Link href="/notifications" className="hover:text-stone-950">
                알림
                {unreadNotificationCount > 0
                  ? ` ${unreadNotificationCount}`
                  : ""}
              </Link>
            )}

            {isAdmin && (
              <Link
                href="/admin"
                className="text-orange-700 hover:text-orange-900"
              >
                관리자
              </Link>
            )}
          </nav>

          <div className="flex min-w-0 shrink-0 items-center gap-2">
            {user ? (
              <Link
                href="/me"
                className="max-w-[10rem] truncate rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-bold text-stone-700 transition hover:bg-stone-50 sm:max-w-none"
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
        </div>
      </header>

      <SiteAnnouncement />

      <MobileBottomNav
        isLoggedIn={Boolean(user)}
        isAdmin={isAdmin}
        nickname={profile?.nickname ?? null}
        unreadNotificationCount={unreadNotificationCount}
      />
    </>
  );
}
