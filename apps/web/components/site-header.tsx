import Link from "next/link";
import type { ReactNode } from "react";

import { signOut } from "@/app/actions/auth";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { createClient } from "@/lib/supabase/server";

function getKoreaTodayString() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

function TempleIcon() {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border border-[var(--theme-line)] bg-[var(--header-logo-bg)] text-[var(--theme-gold)] shadow-[var(--header-logo-shadow)] transition-[background-color,box-shadow,color,border-color] duration-300 sm:h-9 sm:w-9">
      <svg
        viewBox="0 0 32 32"
        className="h-5 w-5 sm:h-6 sm:w-6"
        aria-hidden="true"
        fill="none"
      >
        <path
          d="M4 12h24L16 5 4 12Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M7 14v9M12 14v9M17 14v9M22 14v9M25 14v9"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M5 25h22M3 28h26"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

function NavLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex shrink-0 items-center rounded-full px-2.5 py-1.5 text-xs font-bold text-[var(--theme-muted)] transition duration-300 hover:bg-[var(--theme-surface-hover)] hover:text-[var(--theme-text)] sm:px-3 sm:py-2 sm:text-sm"
    >
      {children}
    </Link>
  );
}

function OliveHeaderLink({ canWater }: { canWater: boolean }) {
  if (canWater) {
    return (
      <Link
        href="/olive"
        className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--theme-gold)] bg-[var(--athena-surface-soft)] px-2.5 py-1.5 text-xs font-black text-[var(--theme-gold)] shadow-[var(--header-button-shadow)] transition duration-300 hover:bg-[var(--theme-gold)] hover:text-[var(--theme-bg)] sm:gap-2 sm:px-3 sm:py-2 sm:text-sm"
      >
        <span>🌿</span>
        <span>올리브</span>
        <span className="hidden rounded-full bg-[var(--theme-gold)] px-2 py-0.5 text-[10px] font-black text-[var(--theme-bg)] transition duration-300 sm:inline-flex">
          오늘 가능
        </span>
      </Link>
    );
  }

  return (
    <Link
      href="/olive"
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--theme-line)] bg-[var(--theme-surface)] px-2.5 py-1.5 text-xs font-black text-[var(--theme-muted)] transition duration-300 hover:bg-[var(--theme-surface-hover)] hover:text-[var(--theme-text)] sm:gap-2 sm:px-3 sm:py-2 sm:text-sm"
    >
      <span>🌿</span>
      <span>올리브</span>
    </Link>
  );
}

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

  let canWaterOlive = false;

  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("role, status, display_name")
      .eq("id", user.id)
      .single();

    profile = data;

    const { data: oliveTree } = await supabase
      .from("olive_trees")
      .select("last_watered_on")
      .eq("user_id", user.id)
      .maybeSingle();

    const today = getKoreaTodayString();
    canWaterOlive = oliveTree?.last_watered_on !== today;
  }

  const isAdmin = profile?.role === "admin" && profile?.status === "active";
  const displayName = profile?.display_name?.trim() || "내 계정";

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--theme-line)] bg-[var(--header-bg)] text-[var(--theme-text)] shadow-[var(--header-shadow)] backdrop-blur-xl transition-[background-color,box-shadow,border-color,color] duration-300">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-3 py-2 sm:px-6 sm:py-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center justify-between gap-2 lg:shrink-0">
          <Link href="/" className="group flex min-w-0 items-center gap-2 sm:gap-3">
            <TempleIcon />

            <div className="min-w-0">
              <p className="truncate font-serif text-base font-black tracking-[0.18em] text-[var(--theme-text)] transition duration-300 group-hover:text-[var(--theme-gold)] sm:text-xl sm:tracking-[0.22em]">
                METROPOLIS
              </p>
              <p className="mt-0.5 hidden text-[10px] font-black uppercase tracking-[0.28em] text-[var(--theme-soft)] transition-colors duration-300 sm:block">
                Athena · Poseidon · Agora
              </p>
            </div>
          </Link>

          <div className="flex shrink-0 items-center gap-2 lg:hidden">
            <ThemeToggle />

            {user ? (
              <Link
                href="/me"
                aria-label={`내 계정: ${displayName}`}
                title={`내 계정: ${displayName}`}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--theme-blue)] bg-[var(--poseidon-surface-soft)] text-xs font-black text-[var(--poseidon-text)] shadow-[var(--header-button-shadow)] transition duration-300 hover:bg-[var(--theme-blue)] hover:text-[var(--theme-bg)]"
              >
                <span aria-hidden="true">Ψ</span>
                <span className="sr-only">내 계정</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="inline-flex h-8 shrink-0 items-center justify-center rounded-full border border-[var(--theme-gold)] bg-[var(--theme-gold)] px-3 text-xs font-black text-[var(--theme-bg)] shadow-[var(--header-button-shadow)] transition duration-300 hover:opacity-85"
              >
                로그인
              </Link>
            )}
          </div>
        </div>

        <nav
          aria-label="주요 메뉴"
          className="flex min-w-0 flex-nowrap items-center gap-1.5 overflow-x-auto whitespace-nowrap pb-0.5 lg:flex-wrap lg:justify-end lg:gap-2 lg:overflow-visible lg:pb-0"
        >
          <NavLink href="/topics">토론</NavLink>
          <NavLink href="/notices">공지</NavLink>
          <NavLink href="/me">기록</NavLink>
          <NavLink href="/contact">문의</NavLink>

          {user ? <OliveHeaderLink canWater={canWaterOlive} /> : null}

          {isAdmin ? (
            <Link
              href="/admin"
              className="inline-flex shrink-0 items-center rounded-full border border-[var(--theme-gold)] bg-[var(--athena-surface-soft)] px-2.5 py-1.5 text-xs font-black text-[var(--theme-gold)] shadow-[var(--header-button-shadow)] transition duration-300 hover:bg-[var(--theme-gold)] hover:text-[var(--theme-bg)] sm:px-3 sm:py-2 sm:text-sm"
            >
              관리자
            </Link>
          ) : null}

          <div className="hidden h-6 w-px bg-[var(--theme-line)] lg:block" />

          <div className="hidden lg:block">
            <ThemeToggle />
          </div>

          {user ? (
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <Link
                href="/me"
                className="hidden items-center gap-2 rounded-full border border-[var(--theme-blue)] bg-[var(--poseidon-surface-soft)] px-3 py-2 text-sm font-bold text-[var(--poseidon-text)] shadow-[var(--header-button-shadow)] transition duration-300 hover:bg-[var(--theme-blue)] hover:text-[var(--theme-bg)] lg:inline-flex"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--theme-blue)] bg-[var(--poseidon-surface)] text-xs font-black text-[var(--poseidon-text)] transition duration-300">
                  Ψ
                </span>
                <span className="max-w-[140px] truncate">{displayName}</span>
              </Link>

              <form action={signOut}>
                <PendingSubmitButton
                  pendingText="로그아웃 중..."
                  className="inline-flex h-8 shrink-0 items-center justify-center rounded-full border border-[var(--theme-line)] bg-[var(--theme-surface)] px-2.5 text-xs font-black text-[var(--theme-muted)] transition duration-300 hover:bg-[var(--theme-surface-hover)] hover:text-[var(--theme-text)] sm:h-auto sm:px-3 sm:py-2 sm:text-sm"
                >
                  로그아웃
                </PendingSubmitButton>
              </form>
            </div>
          ) : (
            <Link
              href="/login"
              className="hidden rounded-full border border-[var(--theme-gold)] bg-[var(--theme-gold)] px-4 py-2 text-sm font-black text-[var(--theme-bg)] shadow-[var(--header-button-shadow)] transition duration-300 hover:opacity-85 lg:inline-flex"
            >
              로그인
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
