import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-gray-900 bg-gray-950/80 px-4 py-8 text-gray-400 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p>© 2026 Metropolis. All rights reserved.</p>

        <nav className="flex flex-wrap gap-4">
          <Link href="/terms" className="hover:text-gray-100">
            이용약관
          </Link>
          <Link href="/privacy" className="hover:text-gray-100">
            개인정보처리방침
          </Link>
          <Link href="/contact" className="hover:text-gray-100">
            문의하기
          </Link>
        </nav>
      </div>
    </footer>
  );
}