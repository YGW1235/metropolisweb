import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/app/notifications/actions";
import { SiteHeader } from "@/components/SiteHeader";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "알림",
  description: "심포지온에서 내 의견에 달린 댓글 알림을 확인합니다.",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  message?: string;
  type?: "success" | "error";
}>;

type CasualNotification = {
  id: string;
  type: "opinion_comment" | "opinion_like" | "opinion_dislike" | string;
  actor_user_id: string | null;
  topic_id: string | null;
  opinion_id: string | null;
  comment_id: string | null;
  is_read: boolean;
  created_at: string;
};

function getNotificationLabel(type: string) {
  if (type === "opinion_comment") {
    return "내 의견에 댓글이 달렸습니다.";
  }

  if (type === "opinion_like") {
    return "이전 반응 알림입니다.";
  }

  if (type === "opinion_dislike") {
    return "이전 반응 알림입니다.";
  }

  return "새 알림이 있습니다.";
}

function formatDate(value: string | null | undefined) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const query = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?message=로그인이 필요합니다.&type=error");
  }

  const { data: notificationsData, error } = await supabase
    .from("casual_notifications")
    .select(
      "id, type, actor_user_id, topic_id, opinion_id, comment_id, is_read, created_at",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return (
      <main className="min-h-screen bg-red-50 p-8 text-red-900">
        <h1 className="text-2xl font-black">알림을 불러오지 못했습니다.</h1>
        <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-white p-4 text-sm">
          {error.message}
        </pre>
      </main>
    );
  }

  const notifications = (notificationsData ?? []) as CasualNotification[];
  const actorUserIds = Array.from(
    new Set(
      notifications
        .map((notification) => notification.actor_user_id)
        .filter((actorUserId): actorUserId is string => Boolean(actorUserId)),
    ),
  );
  const topicIds = Array.from(
    new Set(
      notifications
        .map((notification) => notification.topic_id)
        .filter((topicId): topicId is string => Boolean(topicId)),
    ),
  );

  const { data: actorProfilesData } =
    actorUserIds.length > 0
      ? await supabase
          .from("casual_profiles")
          .select("user_id, nickname")
          .in("user_id", actorUserIds)
      : { data: [] };

  const { data: topicsData } =
    topicIds.length > 0
      ? await supabase
          .from("casual_topics")
          .select("id, title")
          .in("id", topicIds)
      : { data: [] };

  const actorProfileByUserId = new Map(
    (actorProfilesData ?? []).map((profile) => [profile.user_id, profile]),
  );
  const topicById = new Map((topicsData ?? []).map((topic) => [topic.id, topic]));
  const unreadCount = notifications.filter(
    (notification) => !notification.is_read,
  ).length;

  return (
    <main className="min-h-screen bg-[#fff7ed] text-[#2f2118]">
      <SiteHeader />

      <section className="mx-auto max-w-4xl px-6 py-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold tracking-[0.3em] text-orange-700">
              NOTIFICATIONS
            </p>
            <h1 className="mt-2 text-4xl font-black">알림</h1>
            <p className="mt-3 text-sm leading-6 text-stone-600">
              내 의견에 달린 댓글 알림을 확인합니다.
            </p>
          </div>

          <form action={markAllNotificationsRead}>
            <button
              className="rounded-full bg-stone-950 px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:hover:translate-y-0"
              disabled={unreadCount === 0}
            >
              모두 읽음 처리
            </button>
          </form>
        </header>

        {query.message && (
          <div
            className={`mt-6 rounded-2xl p-4 text-sm font-bold ${
              query.type === "error"
                ? "bg-red-50 text-red-700"
                : "bg-green-50 text-green-700"
            }`}
          >
            {query.message}
          </div>
        )}

        <div className="mt-6 rounded-3xl border border-orange-100 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-black text-stone-700">
              최근 알림 {notifications.length}개
            </p>
            <span className="rounded-full bg-orange-50 px-4 py-2 text-xs font-black text-orange-700">
              안 읽음 {unreadCount}개
            </span>
          </div>

          <div className="mt-5 space-y-3">
            {notifications.map((notification) => {
              const actorProfile = notification.actor_user_id
                ? actorProfileByUserId.get(notification.actor_user_id)
                : null;
              const topic = notification.topic_id
                ? topicById.get(notification.topic_id)
                : null;

              return (
                <article
                  key={notification.id}
                  className={`rounded-3xl border p-4 ${
                    notification.is_read
                      ? "border-stone-100 bg-white"
                      : "border-orange-100 bg-orange-50/70"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-black ${
                            notification.is_read
                              ? "bg-stone-100 text-stone-600"
                              : "bg-orange-500 text-white"
                          }`}
                        >
                          {notification.is_read ? "읽음" : "안 읽음"}
                        </span>
                        <span className="text-xs font-bold text-stone-500">
                          {formatDate(notification.created_at)}
                        </span>
                      </div>

                      <h2 className="mt-3 text-lg font-black">
                        {getNotificationLabel(notification.type)}
                      </h2>

                      <p className="mt-2 text-sm leading-6 text-stone-600">
                        {actorProfile?.nickname ?? "알 수 없음"} 님이 남긴 알림
                      </p>

                      <p className="mt-3 rounded-2xl bg-white/80 p-3 text-sm font-bold text-stone-700">
                        {topic?.title ?? "주제를 찾을 수 없습니다."}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-wrap justify-end gap-2">
                      {notification.topic_id && (
                        <Link
                          href={`/topics/${notification.topic_id}`}
                          className="rounded-full border border-stone-200 bg-white px-4 py-2 text-xs font-black text-stone-700 transition hover:bg-stone-50"
                        >
                          주제로 이동
                        </Link>
                      )}

                      {!notification.is_read && (
                        <form action={markNotificationRead}>
                          <input
                            type="hidden"
                            name="notificationId"
                            value={notification.id}
                          />
                          <button className="rounded-full bg-stone-950 px-4 py-2 text-xs font-black text-white transition hover:-translate-y-0.5">
                            읽음 처리
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {notifications.length === 0 && (
            <div className="mt-5 rounded-3xl bg-stone-50 p-8 text-center">
              <h2 className="text-xl font-black">아직 알림이 없습니다.</h2>
              <p className="mt-2 text-sm text-stone-600">
                내 의견에 댓글이 달리면 이곳에 표시됩니다.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
