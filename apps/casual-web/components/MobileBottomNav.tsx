"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type MobileBottomNavProps = {
  isLoggedIn: boolean;
  isAdmin: boolean;
  nickname: string | null;
  unreadNotificationCount: number;
};

function isActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavItem({
  href,
  label,
  subLabel,
}: {
  href: string;
  label: string;
  subLabel?: string;
}) {
  const pathname = usePathname();
  const active = isActive(pathname, href);

  return (
    <Link
      href={href}
      className={`flex min-w-0 flex-1 flex-col items-center justify-center rounded-2xl px-2 py-2 text-center transition ${
        active
          ? "bg-orange-100 text-orange-800"
          : "text-stone-500 hover:bg-stone-100 hover:text-stone-900"
      }`}
    >
      <span className="text-sm font-black">{label}</span>
      {subLabel && (
        <span className="mt-0.5 max-w-full truncate text-[10px] font-bold opacity-80">
          {subLabel}
        </span>
      )}
    </Link>
  );
}

export function MobileBottomNav({
  isLoggedIn,
  isAdmin,
  nickname,
  unreadNotificationCount,
}: MobileBottomNavProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-orange-100 bg-white/95 px-3 py-2 shadow-[0_-10px_30px_rgba(0,0,0,0.06)] backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-md gap-2">
        <NavItem href="/" label="홈" />
        <NavItem href="/topics" label="주제" />

        {isLoggedIn ? (
          <>
            <NavItem
              href="/notifications"
              label="알림"
              subLabel={
                unreadNotificationCount > 0
                  ? `${unreadNotificationCount}`
                  : undefined
              }
            />
            <NavItem href="/me" label="내 활동" subLabel={nickname ?? undefined} />
          </>
        ) : (
          <NavItem href="/login" label="로그인" />
        )}

        {isAdmin && <NavItem href="/admin" label="관리자" />}
      </div>
    </nav>
  );
}
