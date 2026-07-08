import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { SiteHeader } from "@/components/SiteHeader";

export const dynamic = "force-dynamic";

function formatCount(value: number | null | undefined) {
  return new Intl.NumberFormat("ko-KR").format(value ?? 0);
}

function formatDate(value: string | null | undefined) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getStatusLabel(status: string) {
  if (status === "draft") return "초안";
  if (status === "active") return "활성";
  if (status === "closed") return "종료";
  if (status === "archived") return "보관";
  if (status === "open") return "대기";
  if (status === "resolved") return "처리완료";
  if (status === "dismissed") return "기각";
  return status;
}

function getReasonLabel(reason: string) {
  if (reason === "abuse") return "욕설/비방";
  if (reason === "spam") return "스팸/도배";
  if (reason === "harassment") return "괴롭힘/공격적 표현";
  if (reason === "personal_info") return "개인정보 노출";
  if (reason === "off_topic") return "주제와 무관한 내용";
  if (reason === "other") return "기타";
  return reason;
}

function getPercent(value: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((value / total) * 100);
}

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?message=로그인이 필요합니다.&type=error");
  }

  const { data: isAdmin } = await supabase.rpc("is_casual_admin");

  if (!isAdmin) {
    redirect("/?message=관리자 권한이 필요합니다.&type=error");
  }

  const [
    totalTopicsResult,
    activeTopicsResult,
    draftTopicsResult,
    closedTopicsResult,
    archivedTopicsResult,
    openReportsResult,
    totalReportsResult,
    visibleOpinionsResult,
    visibleCommentsResult,
  ] = await Promise.all([
    supabase.from("casual_topics").select("id", { count: "exact", head: true }),
    supabase
      .from("casual_topics")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("casual_topics")
      .select("id", { count: "exact", head: true })
      .eq("status", "draft"),
    supabase
      .from("casual_topics")
      .select("id", { count: "exact", head: true })
      .eq("status", "closed"),
    supabase
      .from("casual_topics")
      .select("id", { count: "exact", head: true })
      .eq("status", "archived"),
    supabase
      .from("casual_reports")
      .select("id", { count: "exact", head: true })
      .eq("status", "open"),
    supabase.from("casual_reports").select("id", { count: "exact", head: true }),
    supabase
      .from("casual_opinions")
      .select("id", { count: "exact", head: true })
      .eq("is_hidden", false),
    supabase
      .from("casual_comments")
      .select("id", { count: "exact", head: true })
      .eq("is_hidden", false),
  ]);

  const { data: todayTopic } = await supabase
    .from("casual_topics")
    .select(
      "id, title, description, option_a, option_b, vote_a_count, vote_b_count, opinion_count, comment_count, view_count, hot_score, status, is_today",
    )
    .eq("is_today", true)
    .maybeSingle();

  const { data: hotTopics } = await supabase
    .from("active_casual_topics_with_scores")
    .select(
      "id, title, status, is_today, option_a, option_b, vote_a_count, vote_b_count, opinion_count, comment_count, view_count, hot_score, trending_score, created_at, last_activity_at",
    )
    .order("trending_score", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(6);

  const { data: recentOpinionsData } = await supabase
    .from("casual_opinions")
    .select(
      "id, topic_id, user_id, choice, body, like_count, dislike_count, score, is_hidden, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(8);

  const { data: recentReports } = await supabase
    .from("casual_reports")
    .select(
      "id, reporter_id, target_type, target_id, reason, status, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(6);

  const recentOpinions = recentOpinionsData ?? [];

  const opinionUserIds = Array.from(
    new Set(recentOpinions.map((opinion) => opinion.user_id)),
  );

  const opinionTopicIds = Array.from(
    new Set(recentOpinions.map((opinion) => opinion.topic_id)),
  );

  const { data: opinionProfilesData } =
    opinionUserIds.length > 0
      ? await supabase
          .from("casual_profiles")
          .select("user_id, nickname")
          .in("user_id", opinionUserIds)
      : { data: [] };

  const { data: opinionTopicsData } =
    opinionTopicIds.length > 0
      ? await supabase
          .from("casual_topics")
          .select("id, title, option_a, option_b")
          .in("id", opinionTopicIds)
      : { data: [] };

  const profileByUserId = new Map(
    (opinionProfilesData ?? []).map((profile) => [profile.user_id, profile]),
  );

  const topicById = new Map(
    (opinionTopicsData ?? []).map((topic) => [topic.id, topic]),
  );

  const todayTotalVotes = todayTopic
    ? todayTopic.vote_a_count + todayTopic.vote_b_count
    : 0;

  const todayAPercent = todayTopic
    ? getPercent(todayTopic.vote_a_count, todayTotalVotes)
    : 0;

  const todayBPercent = todayTopic
    ? getPercent(todayTopic.vote_b_count, todayTotalVotes)
    : 0;

  const statCards = [
    {
      label: "전체 주제",
      value: totalTopicsResult.count ?? 0,
      href: "/admin/topics",
    },
    {
      label: "활성 주제",
      value: activeTopicsResult.count ?? 0,
      href: "/admin/topics",
    },
    {
      label: "신고 대기",
      value: openReportsResult.count ?? 0,
      href: "/admin/reports",
      danger: true,
    },
    {
      label: "전체 신고",
      value: totalReportsResult.count ?? 0,
      href: "/admin/reports",
    },
    {
      label: "공개 의견",
      value: visibleOpinionsResult.count ?? 0,
      href: "/topics",
    },
    {
      label: "공개 댓글",
      value: visibleCommentsResult.count ?? 0,
      href: "/topics",
    },
  ];

  return (
    <main className="min-h-screen bg-[#fff7ed] text-[#2f2118]">
      <SiteHeader />
      <section className="mx-auto max-w-6xl">
        <section className="mt-8 rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-bold tracking-[0.3em] text-orange-700">
                ADMIN
              </p>
              <h1 className="mt-2 text-3xl font-black">관리자 대시보드</h1>
              <p className="mt-3 text-sm leading-6 text-stone-600">
                캐주얼 사이트 운영 상태와 출시 전 점검 항목을 확인합니다.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/admin/qa"
                className="rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-black text-orange-800 transition hover:bg-orange-100"
              >
                QA 체크리스트
              </Link>
              <Link
                href="/admin/logs"
                className="rounded-full border border-stone-200 px-4 py-2 text-sm font-bold text-stone-700 transition hover:bg-stone-50"
              >
                관리자 로그
              </Link>
              <Link
                href="/admin/announcements"
                className="rounded-full border border-stone-200 px-4 py-2 text-sm font-bold text-stone-700 transition hover:bg-stone-50"
              >
                공지 관리
              </Link>
              <Link
                href="/admin/topics"
                className="rounded-full border border-stone-200 px-4 py-2 text-sm font-bold text-stone-700 transition hover:bg-stone-50"
              >
                주제 관리
              </Link>
              <Link
                href="/admin/users"
                className="rounded-full border border-stone-200 px-4 py-2 text-sm font-bold text-stone-700 transition hover:bg-stone-50"
              >
                유저 관리
              </Link>
              <Link
                href="/admin/reports"
                className="rounded-full bg-stone-950 px-4 py-2 text-sm font-black text-white transition hover:-translate-y-0.5"
              >
                신고 관리
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          {statCards.map((card) => (
            <Link
              key={card.label}
              href={card.href}
              className={`rounded-3xl border p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${
                card.danger
                  ? "border-red-100 bg-red-50"
                  : "border-orange-100 bg-white"
              }`}
            >
              <p
                className={`text-sm font-black ${
                  card.danger ? "text-red-700" : "text-orange-700"
                }`}
              >
                {card.label}
              </p>
              <p className="mt-3 text-3xl font-black">
                {formatCount(card.value)}
              </p>
            </Link>
          ))}
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr]">
          <article className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold tracking-[0.3em] text-orange-700">
                  TODAY
                </p>
                <h2 className="mt-2 text-2xl font-black">오늘의 논쟁</h2>
              </div>

              <Link
                href="/admin/topics"
                className="text-sm font-black text-stone-500 underline underline-offset-4"
              >
                변경
              </Link>
            </div>

            {todayTopic ? (
              <div className="mt-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-orange-800">
                    오늘의 논쟁
                  </span>
                  <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-black text-stone-600">
                    {getStatusLabel(todayTopic.status)}
                  </span>
                </div>

                <h3 className="mt-4 text-2xl font-black">
                  {todayTopic.title}
                </h3>

                <p className="mt-3 line-clamp-3 text-sm leading-6 text-stone-600">
                  {todayTopic.description}
                </p>

                <div className="mt-5 space-y-3">
                  <div>
                    <div className="flex justify-between text-sm font-black text-stone-700">
                      <span>{todayTopic.option_a}</span>
                      <span>
                        {todayAPercent}% · {formatCount(todayTopic.vote_a_count)}
                        표
                      </span>
                    </div>
                    <div className="mt-2 h-3 overflow-hidden rounded-full bg-stone-100">
                      <div
                        className="h-full rounded-full bg-orange-500"
                        style={{ width: `${todayAPercent}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm font-black text-stone-700">
                      <span>{todayTopic.option_b}</span>
                      <span>
                        {todayBPercent}% · {formatCount(todayTopic.vote_b_count)}
                        표
                      </span>
                    </div>
                    <div className="mt-2 h-3 overflow-hidden rounded-full bg-stone-100">
                      <div
                        className="h-full rounded-full bg-stone-950"
                        style={{ width: `${todayBPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold text-stone-500">
                  <span>투표 {formatCount(todayTotalVotes)}</span>
                  <span>·</span>
                  <span>의견 {formatCount(todayTopic.opinion_count)}</span>
                  <span>·</span>
                  <span>댓글 {formatCount(todayTopic.comment_count)}</span>
                  <span>·</span>
                  <span>조회 {formatCount(todayTopic.view_count)}</span>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <Link
                    href={`/topics/${todayTopic.id}`}
                    className="rounded-full border border-stone-200 px-4 py-2 text-sm font-bold text-stone-700 transition hover:bg-stone-50"
                  >
                    사용자 화면
                  </Link>
                  <Link
                    href={`/admin/topics/${todayTopic.id}/edit`}
                    className="rounded-full bg-stone-950 px-4 py-2 text-sm font-black text-white transition hover:-translate-y-0.5"
                  >
                    수정
                  </Link>
                </div>
              </div>
            ) : (
              <div className="mt-5 rounded-3xl bg-stone-50 p-6 text-center">
                <h3 className="text-xl font-black">
                  오늘의 논쟁이 지정되지 않았습니다.
                </h3>
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  주제 관리에서 active 주제 하나를 오늘의 논쟁으로 지정하세요.
                </p>
                <Link
                  href="/admin/topics"
                  className="mt-5 inline-flex rounded-full bg-stone-950 px-5 py-3 text-sm font-black text-white"
                >
                  주제 관리로 이동
                </Link>
              </div>
            )}
          </article>

          <article className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
            <p className="text-sm font-bold tracking-[0.3em] text-orange-700">
              STATUS
            </p>
            <h2 className="mt-2 text-2xl font-black">주제 상태</h2>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-green-50 p-4">
                <p className="text-sm font-black text-green-700">활성</p>
                <p className="mt-2 text-3xl font-black">
                  {formatCount(activeTopicsResult.count)}
                </p>
              </div>

              <div className="rounded-2xl bg-stone-100 p-4">
                <p className="text-sm font-black text-stone-700">초안</p>
                <p className="mt-2 text-3xl font-black">
                  {formatCount(draftTopicsResult.count)}
                </p>
              </div>

              <div className="rounded-2xl bg-yellow-50 p-4">
                <p className="text-sm font-black text-yellow-700">종료</p>
                <p className="mt-2 text-3xl font-black">
                  {formatCount(closedTopicsResult.count)}
                </p>
              </div>

              <div className="rounded-2xl bg-red-50 p-4">
                <p className="text-sm font-black text-red-700">보관</p>
                <p className="mt-2 text-3xl font-black">
                  {formatCount(archivedTopicsResult.count)}
                </p>
              </div>
            </div>
          </article>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-bold tracking-[0.3em] text-orange-700">
                  HOT TOPICS
                </p>
                <h2 className="mt-2 text-2xl font-black">인기 주제</h2>
              </div>

              <Link
                href="/admin/topics"
                className="text-sm font-black text-stone-500 underline underline-offset-4"
              >
                전체 보기
              </Link>
            </div>

            <div className="mt-5 space-y-3">
              {(hotTopics ?? []).map((topic, index) => {
                const totalVotes = topic.vote_a_count + topic.vote_b_count;

                return (
                  <div
                    key={topic.id}
                    className="rounded-2xl border border-stone-100 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-black text-orange-700">
                          #{index + 1} · {getStatusLabel(topic.status)}
                        </p>
                        <h3 className="mt-1 line-clamp-1 font-black">
                          {topic.title}
                        </h3>
                      </div>

                      <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-black text-stone-600">
                        급상승 {Number(topic.trending_score ?? 0).toFixed(1)}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-stone-500">
                      <span>투표 {formatCount(totalVotes)}</span>
                      <span>·</span>
                      <span>의견 {formatCount(topic.opinion_count)}</span>
                      <span>·</span>
                      <span>댓글 {formatCount(topic.comment_count)}</span>
                      <span>·</span>
                      <span>조회 {formatCount(topic.view_count)}</span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link
                        href={`/topics/${topic.id}`}
                        className="text-xs font-black text-stone-500 underline underline-offset-4"
                      >
                        보기
                      </Link>
                      <Link
                        href={`/admin/topics/${topic.id}/edit`}
                        className="text-xs font-black text-orange-700 underline underline-offset-4"
                      >
                        수정
                      </Link>
                    </div>
                  </div>
                );
              })}

              {(hotTopics ?? []).length === 0 && (
                <div className="rounded-2xl bg-stone-50 p-6 text-center text-sm font-bold text-stone-500">
                  아직 주제가 없습니다.
                </div>
              )}
            </div>
          </article>

          <article className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-bold tracking-[0.3em] text-orange-700">
                  REPORTS
                </p>
                <h2 className="mt-2 text-2xl font-black">최근 신고</h2>
              </div>

              <Link
                href="/admin/reports"
                className="text-sm font-black text-red-600 underline underline-offset-4"
              >
                신고 관리
              </Link>
            </div>

            <div className="mt-5 space-y-3">
              {(recentReports ?? []).map((report) => (
                <Link
                  key={report.id}
                  href="/admin/reports"
                  className="block rounded-2xl border border-stone-100 p-4 transition hover:bg-stone-50"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black ${
                        report.status === "open"
                          ? "bg-red-50 text-red-700"
                          : report.status === "resolved"
                            ? "bg-green-50 text-green-700"
                            : "bg-stone-100 text-stone-700"
                      }`}
                    >
                      {getStatusLabel(report.status)}
                    </span>

                    <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-orange-800">
                      {getReasonLabel(report.reason)}
                    </span>

                    <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-black text-stone-600">
                      {report.target_type}
                    </span>
                  </div>

                  <p className="mt-3 text-xs font-bold text-stone-500">
                    {formatDate(report.created_at)}
                  </p>
                </Link>
              ))}

              {(recentReports ?? []).length === 0 && (
                <div className="rounded-2xl bg-stone-50 p-6 text-center text-sm font-bold text-stone-500">
                  아직 신고가 없습니다.
                </div>
              )}
            </div>
          </article>
        </section>

        <section className="mt-8 rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold tracking-[0.3em] text-orange-700">
                RECENT OPINIONS
              </p>
              <h2 className="mt-2 text-2xl font-black">최근 의견</h2>
            </div>

            <Link
              href="/topics"
              className="text-sm font-black text-stone-500 underline underline-offset-4"
            >
              사용자 화면
            </Link>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {recentOpinions.map((opinion) => {
              const opinionProfile = profileByUserId.get(opinion.user_id);
              const opinionTopic = topicById.get(opinion.topic_id);

              const sideName =
                opinion.choice === "a"
                  ? opinionTopic?.option_a
                  : opinionTopic?.option_b;

              return (
                <Link
                  key={opinion.id}
                  href={`/topics/${opinion.topic_id}`}
                  className={`rounded-3xl border p-5 transition hover:-translate-y-1 hover:shadow-lg ${
                    opinion.is_hidden
                      ? "border-red-100 bg-red-50"
                      : "border-stone-100 bg-white"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-black text-stone-700">
                      {opinionProfile?.nickname ?? "알 수 없음"}
                    </span>

                    <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-orange-800">
                      {sideName ?? "선택"} 측
                    </span>

                    {opinion.is_hidden && (
                      <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-700">
                        숨김
                      </span>
                    )}
                  </div>

                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-stone-700">
                    {opinion.body}
                  </p>

                  <div className="mt-4 rounded-2xl bg-stone-50 p-3">
                    <p className="line-clamp-1 text-xs font-bold text-stone-500">
                      {opinionTopic?.title ?? "주제"}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2 text-xs font-black text-stone-600">
                      <span>공감 {formatCount(opinion.like_count)}</span>
                      <span>·</span>
                      <span>비공감 {formatCount(opinion.dislike_count)}</span>
                      <span>·</span>
                      <span>점수 {formatCount(opinion.score)}</span>
                      <span>·</span>
                      <span>{formatDate(opinion.created_at)}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {recentOpinions.length === 0 && (
            <div className="mt-5 rounded-2xl bg-stone-50 p-6 text-center text-sm font-bold text-stone-500">
              아직 의견이 없습니다.
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
