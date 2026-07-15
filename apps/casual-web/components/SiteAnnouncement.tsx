import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

type AnnouncementTone = "info" | "warning" | "success";

type Announcement = {
  title: string;
  body: string | null;
  tone: string | null;
  link_label: string | null;
  link_url: string | null;
};

function getToneClass(tone: AnnouncementTone) {
  if (tone === "warning") {
    return {
      box: "border-yellow-200 bg-yellow-50 text-yellow-950",
      badge: "bg-yellow-100 text-yellow-800",
      button:
        "border-yellow-200 bg-white text-yellow-900 hover:bg-yellow-100",
    };
  }

  if (tone === "success") {
    return {
      box: "border-green-200 bg-green-50 text-green-950",
      badge: "bg-green-100 text-green-800",
      button: "border-green-200 bg-white text-green-900 hover:bg-green-100",
    };
  }

  return {
    box: "border-orange-200 bg-orange-50 text-orange-950",
    badge: "bg-orange-100 text-orange-800",
    button: "border-orange-200 bg-white text-orange-900 hover:bg-orange-100",
  };
}

function getTone(value: string | null): AnnouncementTone {
  if (value === "warning" || value === "success") {
    return value;
  }

  return "info";
}

function getSafeLink(url: string | null) {
  if (!url) {
    return null;
  }

  if (url.startsWith("/")) {
    return { href: url, isExternal: false };
  }

  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:") {
      return { href: parsedUrl.toString(), isExternal: true };
    }
  } catch {
    return null;
  }

  return null;
}

export async function SiteAnnouncement() {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data: announcement } = await supabase
    .from("casual_announcements")
    .select("title, body, tone, link_label, link_url")
    .eq("status", "active")
    .or(`starts_at.is.null,starts_at.lte.${now}`)
    .or(`ends_at.is.null,ends_at.gt.${now}`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!announcement) {
    return null;
  }

  const { body, link_label: linkLabel, link_url: linkUrl, title } =
    announcement as Announcement;
  const tone = getTone(announcement.tone);
  const toneClass = getToneClass(tone);
  const safeLink = getSafeLink(linkUrl);
  const linkText = linkLabel?.trim() ?? "";
  const hasCompleteLink = Boolean(linkText && safeLink);

  return (
    <section className="bg-[#fff7ed] px-4 py-3 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1400px]">
        <div
          className={`rounded-2xl border px-4 py-3 shadow-[0_4px_14px_rgba(120,53,15,0.035)] sm:rounded-3xl sm:px-5 sm:py-4 ${toneClass.box}`}
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-black ${toneClass.badge}`}
                >
                  공지
                </span>
                <h2 className="text-base font-black">{title}</h2>
              </div>

              {body && (
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 opacity-80">
                  {body}
                </p>
              )}
            </div>

            {hasCompleteLink && safeLink && (
              safeLink.isExternal ? (
                <a
                  href={safeLink.href}
                  target="_blank"
                  rel="noreferrer"
                  className={`inline-flex shrink-0 justify-center rounded-full border px-4 py-2 text-sm font-black transition ${toneClass.button}`}
                >
                  {linkText}
                </a>
              ) : (
                <Link
                  href={safeLink.href}
                  className={`inline-flex shrink-0 justify-center rounded-full border px-4 py-2 text-sm font-black transition ${toneClass.button}`}
                >
                  {linkText}
                </Link>
              )
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
