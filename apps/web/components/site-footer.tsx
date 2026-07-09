import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--theme-line)] bg-[var(--theme-panel)] px-4 py-8 text-[var(--theme-muted)] transition-colors duration-300 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p>© 2026 Metropolis. All rights reserved.</p>

        <nav className="flex flex-wrap gap-4">
          <Link href="/terms" className="transition hover:text-[var(--theme-text)]">
            이용약관
          </Link>
          <Link href="/privacy" className="transition hover:text-[var(--theme-text)]">
            개인정보처리방침
          </Link>
          <Link href="/contact" className="transition hover:text-[var(--theme-text)]">
            문의하기
          </Link>
        </nav>
      </div>
    </footer>
  );
}
