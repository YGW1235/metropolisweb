import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import {
  changeTopicStatus,
  createTopic,
  setTodayTopic,
} from "@/app/admin/topics/actions";
import { createClient } from "@/lib/supabase/server";
import {
  buildTagsByTopicId,
  type TopicTag,
  type TopicTagLink,
} from "@/lib/casual-tags";

import { SiteHeader } from "@/components/SiteHeader";
import { SubmitButton } from "@/components/SubmitButton";
import { TopicTagBadges } from "@/components/TopicTagBadges";
import { TopicTagCheckboxes } from "@/components/TopicTagCheckboxes";

export const metadata: Metadata = {
  title: "주제 관리",
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

function formatCount(value: number) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

function getStatusLabel(status: string) {
  if (status === "draft") return "초안";
  if (status === "active") return "활성";
  if (status === "closed") return "종료";
  if (status === "archived") return "보관";
  return status;
}

function getStatusClass(status: string) {
  if (status === "active") return "bg-green-50 text-green-700";
  if (status === "draft") return "bg-stone-100 text-stone-700";
  if (status === "closed") return "bg-yellow-50 text-yellow-700";
  if (status === "archived") return "bg-red-50 text-red-700";
  return "bg-stone-100 text-stone-700";
}

export default async function AdminTopicsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?message=로그인이 필요합니다.&type=error");
  }

  const { data: isAdmin } = await supabase.rpc("is_casual_admin");

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-red-50 px-6 py-10 text-red-900">
        <section className="mx-auto max-w-2xl rounded-3xl bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-black">관리자 권한이 필요합니다.</h1>
          <p className="mt-3 text-sm leading-6">
            현재 계정은 캐주얼 사이트 관리자로 등록되어 있지 않습니다.
            Supabase의 `casual_admins` 테이블에 이 계정의 user_id를 추가해 주세요.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex rounded-full bg-stone-950 px-5 py-3 text-sm font-black text-white"
          >
            홈으로 돌아가기
          </Link>
        </section>
      </main>
    );
  }

  const { data: topics, error } = await supabase
    .from("casual_topics")
    .select(
      "id, title, description, option_a, option_b, status, is_today, vote_a_count, vote_b_count, opinion_count, comment_count, view_count, hot_score, created_at",
    )
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main className="min-h-screen bg-red-50 p-8 text-red-900">
        <h1 className="text-2xl font-black">관리자 주제를 불러오지 못했습니다.</h1>
        <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-white p-4 text-sm">
          {error.message}
        </pre>
      </main>
    );
  }

  const { data: allTagsData, error: tagsError } = await supabase
    .from("casual_topic_tags")
    .select("id, name, slug")
    .order("name", { ascending: true });

  if (tagsError) {
    return (
      <main className="min-h-screen bg-red-50 p-8 text-red-900">
        <h1 className="text-2xl font-black">태그 목록을 불러오지 못했습니다.</h1>
        <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-white p-4 text-sm">
          {tagsError.message}
        </pre>
      </main>
    );
  }

  const allTags = (allTagsData ?? []) as TopicTag[];
  const topicIds = (topics ?? []).map((topic) => topic.id);
  const { data: topicTagLinksData } =
    topicIds.length > 0
      ? await supabase
          .from("casual_topic_tag_links")
          .select("topic_id, tag_id")
          .in("topic_id", topicIds)
      : { data: [] };

  const tagsByTopicId = buildTagsByTopicId(
    topicIds,
    allTags,
    (topicTagLinksData ?? []) as TopicTagLink[],
  );

  return (
    <main className="casual-page-bg min-h-screen text-[#2f2118]">
      <SiteHeader />
      <section className="mx-auto max-w-6xl">
        <section className="mt-8 rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-bold tracking-[0.3em] text-orange-700">
                ADMIN TOPICS
              </p>
              <h1 className="mt-2 text-3xl font-black">주제 관리</h1>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/admin"
                className="rounded-full border border-stone-200 px-4 py-2 text-sm font-bold text-stone-700 transition hover:bg-stone-50"
              >
                대시보드
              </Link>
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
                href="/admin/tags"
                className="rounded-full border border-stone-200 px-4 py-2 text-sm font-bold text-stone-700 transition hover:bg-stone-50"
              >
                태그 관리
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

        {params.message && (
          <div
            className={`mt-6 rounded-2xl p-4 text-sm font-bold ${
              params.type === "error"
                ? "bg-red-50 text-red-700"
                : "bg-green-50 text-green-700"
            }`}
          >
            {params.message}
          </div>
        )}

        <section className="mt-8 rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
          <p className="text-sm font-bold tracking-[0.3em] text-orange-700">
            CREATE TOPIC
          </p>
          <h2 className="mt-2 text-2xl font-black">새 주제 만들기</h2>

          <form action={createTopic} className="mt-6 grid gap-4">
            <div>
              <label className="text-sm font-bold text-stone-700">제목</label>
              <input
                name="title"
                required
                maxLength={80}
                className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 outline-none focus:border-orange-400"
                placeholder="예: 읽씹은 무례한가?"
              />
            </div>

            <div>
              <label className="text-sm font-bold text-stone-700">설명</label>
              <textarea
                name="description"
                maxLength={500}
                className="mt-2 min-h-28 w-full resize-none rounded-2xl border border-stone-200 px-4 py-3 outline-none focus:border-orange-400"
                placeholder="주제에 대한 짧은 설명을 입력하세요."
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-bold text-stone-700">
                  A 선택지
                </label>
                <input
                  name="optionA"
                  required
                  maxLength={40}
                  className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 outline-none focus:border-orange-400"
                  placeholder="예: 무례하다"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-stone-700">
                  B 선택지
                </label>
                <input
                  name="optionB"
                  required
                  maxLength={40}
                  className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 outline-none focus:border-orange-400"
                  placeholder="예: 그럴 수 있다"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[1fr_auto]">
              <div>
                <label className="text-sm font-bold text-stone-700">상태</label>
                <select
                  name="status"
                  defaultValue="active"
                  className="mt-2 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none focus:border-orange-400"
                >
                  <option value="draft">초안</option>
                  <option value="active">활성</option>
                  <option value="closed">종료</option>
                  <option value="archived">보관</option>
                </select>
              </div>

              <label className="mt-8 flex items-center gap-3 rounded-2xl bg-orange-50 px-4 py-3 text-sm font-black text-orange-900">
                <input name="isToday" type="checkbox" className="h-4 w-4" />
                오늘의 논쟁으로 지정
              </label>
            </div>

            <div>
              <label className="text-sm font-bold text-stone-700">태그</label>
              <div className="mt-2">
                <TopicTagCheckboxes tags={allTags} />
              </div>
            </div>

            <div className="flex justify-end">
              <SubmitButton
                className="rounded-full bg-stone-950 px-6 py-3 text-sm font-black text-white transition hover:-translate-y-0.5"
                pendingText="주제 생성 중..."
              >
                주제 생성
              </SubmitButton>
            </div>
          </form>
        </section>

        <section className="mt-8">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-orange-700">TOPICS</p>
              <h2 className="mt-1 text-2xl font-black">전체 주제</h2>
            </div>

            <p className="text-sm font-bold text-stone-500">
              총 {formatCount(topics?.length ?? 0)}개
            </p>
          </div>

          <div className="space-y-4">
            {(topics ?? []).map((topic) => {
              const totalVotes = topic.vote_a_count + topic.vote_b_count;

              return (
                <article
                  key={topic.id}
                  className="rounded-3xl border border-orange-100 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-black ${getStatusClass(
                            topic.status,
                          )}`}
                        >
                          {getStatusLabel(topic.status)}
                        </span>

                        {topic.is_today && (
                          <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-orange-800">
                            오늘의 논쟁
                          </span>
                        )}

                        <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-black text-stone-600">
                          점수 {Math.round(Number(topic.hot_score ?? 0))}
                        </span>
                      </div>

                      <h3 className="mt-3 text-xl font-black">{topic.title}</h3>

                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-stone-600">
                        {topic.description || "설명 없음"}
                      </p>

                      <TopicTagBadges
                        className="mt-3"
                        tags={tagsByTopicId.get(topic.id) ?? []}
                      />

                      <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-stone-500">
                        <span>
                          A: {topic.option_a} {formatCount(topic.vote_a_count)}
                          표
                        </span>
                        <span>·</span>
                        <span>
                          B: {topic.option_b} {formatCount(topic.vote_b_count)}
                          표
                        </span>
                        <span>·</span>
                        <span>투표 {formatCount(totalVotes)}</span>
                        <span>·</span>
                        <span>의견 {formatCount(topic.opinion_count)}</span>
                        <span>·</span>
                        <span>댓글 {formatCount(topic.comment_count)}</span>
                        <span>·</span>
                        <span>조회 {formatCount(topic.view_count)}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap justify-end gap-2">
                      <Link
                        href={`/topics/${topic.id}`}
                        className="rounded-full border border-stone-200 px-4 py-2 text-sm font-bold text-stone-700 transition hover:bg-stone-50"
                      >
                        보기
                      </Link>

                      <Link
                        href={`/admin/topics/${topic.id}/edit`}
                        className="rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-bold text-orange-800 transition hover:bg-orange-100"
                      >
                        수정
                      </Link>

                      {!topic.is_today && topic.status === "active" && (
                        <form action={setTodayTopic}>
                          <input type="hidden" name="topicId" value={topic.id} />
                          <SubmitButton
                            className="rounded-full bg-orange-500 px-4 py-2 text-sm font-black text-white transition hover:-translate-y-0.5"
                            pendingText="처리 중..."
                          >
                            오늘의 논쟁
                          </SubmitButton>
                        </form>
                      )}

                      {topic.status !== "active" && (
                        <form action={changeTopicStatus}>
                          <input type="hidden" name="topicId" value={topic.id} />
                          <input type="hidden" name="status" value="active" />
                          <SubmitButton
                            className="rounded-full bg-green-600 px-4 py-2 text-sm font-black text-white transition hover:-translate-y-0.5"
                            pendingText="처리 중..."
                          >
                            활성화
                          </SubmitButton>
                        </form>
                      )}

                      {topic.status !== "closed" && (
                        <form action={changeTopicStatus}>
                          <input type="hidden" name="topicId" value={topic.id} />
                          <input type="hidden" name="status" value="closed" />
                          <SubmitButton
                            className="rounded-full bg-yellow-100 px-4 py-2 text-sm font-black text-yellow-800 transition hover:bg-yellow-200"
                            pendingText="처리 중..."
                          >
                            종료
                          </SubmitButton>
                        </form>
                      )}

                      {topic.status !== "archived" && (
                        <form action={changeTopicStatus}>
                          <input type="hidden" name="topicId" value={topic.id} />
                          <input
                            type="hidden"
                            name="status"
                            value="archived"
                          />
                          <SubmitButton
                            className="rounded-full bg-red-50 px-4 py-2 text-sm font-black text-red-700 transition hover:bg-red-100"
                            pendingText="처리 중..."
                          >
                            보관
                          </SubmitButton>
                        </form>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {(topics ?? []).length === 0 && (
            <div className="rounded-3xl border border-orange-100 bg-white p-8 text-center">
              <h3 className="text-xl font-black">아직 주제가 없습니다.</h3>
              <p className="mt-2 text-sm text-stone-600">
                위 폼에서 첫 번째 주제를 생성해보세요.
              </p>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
