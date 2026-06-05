import { createReport } from "@/app/actions/reports";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";

import {
  createDebateComment,
  createDebatePost,
} from "@/app/actions/posts";

type DebatePageProps = {
  params: Promise<{
    topicId: string;
  }>;
  searchParams: Promise<{
    message?: string;
    side?: string;
  }>;
};

function sideLabel(side: string) {
  if (side === "pro") return "찬성";
  if (side === "con") return "반대";
  return "미배정";
}

function sideBadgeClass(side: string) {
  if (side === "pro") {
    return "border-blue-500/40 bg-blue-500/10 text-blue-200";
  }

  if (side === "con") {
    return "border-red-500/40 bg-red-500/10 text-red-200";
  }

  return "border-gray-500/40 bg-gray-500/10 text-gray-200";
}

function sideFilterLabel(side: string) {
  if (side === "pro") return "찬성 글";
  if (side === "con") return "반대 글";
  return "전체 글";
}

function filterButtonClass(isActive: boolean) {
  return isActive
    ? "rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white"
    : "rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800";
}

export default async function DebatePage({
  params,
  searchParams,
}: DebatePageProps) {
  const { topicId } = await params;
  const query = await searchParams;

  const activeSide =
    query.side === "pro" || query.side === "con" ? query.side : "all";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?message=${encodeURIComponent("로그인 후 이용할 수 있습니다.")}`);
  }

  const { data: topic, error: topicError } = await supabase
    .from("topics")
    .select("id, title, description, status")
    .eq("id", topicId)
    .single();

  if (topicError || !topic) {
    notFound();
  }

  const { data: participation } = await supabase
    .from("topic_participants")
    .select("assigned_side, side_index, joined_at")
    .eq("topic_id", topic.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!participation) {
    redirect(
      `/topics/${topic.id}?message=${encodeURIComponent(
        "먼저 주제에 참가해야 합니다.",
      )}`,
    );
  }

  const { count: proCount } = await supabase
    .from("topic_participants")
    .select("*", { count: "exact", head: true })
    .eq("topic_id", topic.id)
    .eq("assigned_side", "pro");

  const { count: conCount } = await supabase
    .from("topic_participants")
    .select("*", { count: "exact", head: true })
    .eq("topic_id", topic.id)
    .eq("assigned_side", "con");

  let postsQuery = supabase
    .from("debate_posts")
    .select("id, title, content, side, created_at, author_id")
    .eq("topic_id", topic.id)
    .eq("status", "visible")
    .order("created_at", { ascending: false });

  if (activeSide !== "all") {
    postsQuery = postsQuery.eq("side", activeSide);
  }

  const { data: posts, error: postsError } = await postsQuery;

  const { data: comments, error: commentsError } = await supabase
    .from("debate_comments")
    .select("id, post_id, content, side, created_at, author_id")
    .eq("topic_id", topic.id)
    .eq("status", "visible")
    .order("created_at", { ascending: true });

  const commentsByPostId = new Map<
    string,
    {
        id: string;
        post_id: string;
        content: string;
        side: string | null;
        created_at: string;
        author_id: string;
    }[]
    >();

    for (const comment of comments ?? []) {
    const current = commentsByPostId.get(comment.post_id) ?? [];
    current.push(comment);
    commentsByPostId.set(comment.post_id, current);
    }
  
  const { data: participants } = await supabase
    .from("topic_participants")
    .select("user_id, assigned_side, side_index")
    .eq("topic_id", topic.id);

  const authorLabels = new Map<string, string>();

  for (const participant of participants ?? []) {
    const sideName =
      participant.assigned_side === "pro"
        ? "찬성"
        : participant.assigned_side === "con"
          ? "반대"
          : "미배정";

    authorLabels.set(
      participant.user_id,
      `${sideName} 익명 ${participant.side_index}`,
    );
  }

  function authorLabel(userId: string) {
    return authorLabels.get(userId) ?? "익명 참가자";
  }
  
  const canWrite = topic.status === "open" || topic.status === "active";

  function writeDisabledMessage(status: string) {
    if (status === "closed") {
      return "종료된 토론입니다. 더 이상 글이나 댓글을 작성할 수 없습니다.";
    }

    if (status === "archived") {
      return "보관 처리된 토론입니다.";
    }

    if (status === "draft") {
      return "아직 공개되지 않은 토론입니다.";
    }

    return "현재 이 주제에는 글을 작성할 수 없습니다.";
  }

  return (
    <main className="min-h-screen bg-gray-950 px-4 py-10 text-white sm:px-6 sm:py-16">
      <section className="mx-auto max-w-5xl">
        <a
          href={`/topics/${topic.id}`}
          className="text-sm text-blue-400 hover:underline"
        >
          ← 주제 상세로 돌아가기
        </a>

        {query.message ? (
          <div className="mt-6 rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
            {query.message}
          </div>
        ) : null}

        <div className="mt-8 rounded-lg border border-gray-700 bg-gray-900 p-5 sm:p-8">
          <p className="text-sm text-blue-400">{topic.status}</p>

          <h1 className="mt-3 text-3xl font-bold">{topic.title}</h1>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-gray-950 p-5">
              <p className="text-sm text-gray-400">내 역할</p>
              <p className="mt-2 text-2xl font-bold">
                {sideLabel(participation.assigned_side)} 익명 {participation.side_index}
              </p>
            </div>

            <div className="rounded-lg bg-gray-950 p-5">
              <p className="text-sm text-gray-400">찬성 참가자</p>
              <p className="mt-2 text-2xl font-bold">{proCount ?? 0}명</p>
            </div>

            <div className="rounded-lg bg-gray-950 p-5">
              <p className="text-sm text-gray-400">반대 참가자</p>
              <p className="mt-2 text-2xl font-bold">{conCount ?? 0}명</p>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-lg border border-gray-700 bg-gray-900 p-8">
          <h2 className="text-2xl font-bold">글 작성</h2>

          {canWrite ? (
            <form action={createDebatePost} className="mt-6 space-y-5">
              <input type="hidden" name="topic_id" value={topic.id} />

              <div>
                <label className="block text-sm font-medium text-gray-200">
                  내 역할
                </label>
                <div
                  className={`mt-2 inline-flex rounded-full border px-3 py-1 text-sm font-medium ${sideBadgeClass(
                    participation.assigned_side,
                  )}`}
                >
                  {sideLabel(participation.assigned_side)}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200">
                  제목
                </label>
                <input
                  name="title"
                  required
                  minLength={2}
                  className="mt-2 w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 text-white outline-none focus:border-blue-500"
                  placeholder="주장을 한 문장으로 작성하세요."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200">
                  내용
                </label>
                <textarea
                  name="content"
                  required
                  minLength={5}
                  rows={6}
                  className="mt-2 w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 text-white outline-none focus:border-blue-500"
                  placeholder="배정받은 역할에 맞게 근거를 작성하세요."
                />
              </div>

              <button className="w-full rounded-lg bg-blue-500 px-5 py-3 font-medium text-white hover:bg-blue-400">
                글 작성
              </button>
            </form>
          ) : (
            <div className="mt-6 rounded-lg border border-gray-700 bg-gray-950 p-5 text-gray-300">
              {writeDisabledMessage(topic.status)}
            </div>
          )}
        </div>

        <div className="mt-8 rounded-lg border border-gray-700 bg-gray-900 p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">
                토론 게시판 · {sideFilterLabel(activeSide)}
              </h2>
              <p className="mt-2 text-gray-300">
                참가자들이 배정받은 역할에 따라 작성한 글입니다.
              </p>
            </div>

            <span className="rounded-full bg-gray-800 px-3 py-1 text-sm text-gray-300">
              {posts?.length ?? 0}개
            </span>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={`/topics/${topic.id}/debate`}
              className={filterButtonClass(activeSide === "all")}
            >
              전체 글
            </a>

            <a
              href={`/topics/${topic.id}/debate?side=pro`}
              className={filterButtonClass(activeSide === "pro")}
            >
              찬성 글
            </a>

            <a
              href={`/topics/${topic.id}/debate?side=con`}
              className={filterButtonClass(activeSide === "con")}
            >
              반대 글
            </a>
          </div>

          {postsError ? (
            <div className="mt-6 rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
              게시글을 불러오지 못했습니다: {postsError.message}
            </div>
          ) : null}

          {commentsError ? (
            <div className="mt-6 rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
                댓글을 불러오지 못했습니다: {commentsError.message}
            </div>
          ) : null}

          <div className="mt-6 space-y-4">
            {posts?.length ? (
              posts.map((post) => (
                <article
                  id={`post-${post.id}`}
                  key={post.id}
                  className="rounded-lg border border-gray-700 bg-gray-950 p-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-sm font-medium ${sideBadgeClass(
                          post.side,
                        )}`}
                      >
                        {sideLabel(post.side)}
                      </span>

                      <h3 className="mt-4 text-xl font-bold">{post.title}</h3>
                    </div>

                    <time className="text-sm text-gray-400">
                      {new Date(post.created_at).toLocaleString("ko-KR", {
                        timeZone: "Asia/Seoul",
                      })}
                    </time>
                  </div>

                  <p className="mt-4 whitespace-pre-wrap text-gray-300">
                    {post.content}
                  </p>

                  <p className="mt-5 break-all text-xs text-gray-500">
                    작성자: {authorLabel(post.author_id)}
                  </p>
                  <details className="mt-5 rounded-lg border border-gray-800 bg-gray-900 p-4">
                    <summary className="cursor-pointer text-sm font-medium text-gray-300">
                        게시글 신고
                    </summary>

                    <form action={createReport} className="mt-4 space-y-3">
                        <input type="hidden" name="topic_id" value={topic.id} />
                        <input type="hidden" name="target_type" value="post" />
                        <input type="hidden" name="target_id" value={post.id} />
                        <input type="hidden" name="anchor" value={`post-${post.id}`} />

                        <select
                        name="reason"
                        required
                        className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                        >
                        <option value="">신고 사유 선택</option>
                        <option value="abuse">욕설 / 비방</option>
                        <option value="spam">도배 / 스팸</option>
                        <option value="off_topic">주제와 무관함</option>
                        <option value="role_break">배정 역할에 맞지 않는 주장</option>
                        <option value="other">기타</option>
                        </select>

                        <textarea
                        name="detail"
                        rows={3}
                        className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                        placeholder="상세 내용을 입력하세요. 선택 사항입니다."
                        />

                        <button className="w-full rounded-lg border border-red-500/50 px-4 py-2 text-sm font-medium text-red-200 hover:bg-red-500/10 sm:w-auto">
                          신고 접수
                        </button>
                    </form>
                  </details>

                  <div className="mt-6 border-t border-gray-800 pt-6">
                  <h4 className="font-semibold">
                      댓글 {commentsByPostId.get(post.id)?.length ?? 0}개
                  </h4>

                  <div className="mt-4 space-y-3">
                      {commentsByPostId.get(post.id)?.length ? (
                      commentsByPostId.get(post.id)?.map((comment) => (
                          <div
                          key={comment.id}
                          className="rounded-lg border border-gray-800 bg-gray-900 p-4"
                          >
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                                className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${sideBadgeClass(
                                comment.side ?? "",
                                )}`}
                            >
                                {sideLabel(comment.side ?? "")}
                            </span>

                            <time className="text-xs text-gray-500">
                                {new Date(comment.created_at).toLocaleString("ko-KR", {
                                timeZone: "Asia/Seoul",
                                })}
                            </time>
                          </div>

                          <p className="mt-3 whitespace-pre-wrap text-sm text-gray-300">
                            {comment.content}
                          </p>

                          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
                              작성자: {authorLabel(comment.author_id)}
                          </div>
                          <details className="mt-3 rounded-lg border border-gray-800 bg-gray-950 p-3">
                            <summary className="cursor-pointer text-xs font-medium text-gray-400">
                                댓글 신고
                            </summary>

                            <form action={createReport} className="mt-3 space-y-3">
                                <input type="hidden" name="topic_id" value={topic.id} />
                                <input type="hidden" name="target_type" value="comment" />
                                <input type="hidden" name="target_id" value={comment.id} />
                                <input type="hidden" name="anchor" value={`post-${post.id}`} />

                                <select
                                name="reason"
                                required
                                className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                                >
                                <option value="">신고 사유 선택</option>
                                <option value="abuse">욕설 / 비방</option>
                                <option value="spam">도배 / 스팸</option>
                                <option value="off_topic">주제와 무관함</option>
                                <option value="role_break">배정 역할에 맞지 않는 발언</option>
                                <option value="other">기타</option>
                                </select>

                                <textarea
                                name="detail"
                                rows={2}
                                className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                                placeholder="상세 내용. 선택 사항입니다."
                                />

                                <button className="w-full rounded-lg border border-red-500/50 px-3 py-2 text-xs font-medium text-red-200 hover:bg-red-500/10 sm:w-auto">
                                  신고 접수
                                </button>
                            </form>
                          </details>

                          </div>
                      ))
                      ) : (
                      <p className="text-sm text-gray-500">
                          아직 댓글이 없습니다.
                      </p>
                      )}
                  </div>

                  {canWrite ? (
                      <form action={createDebateComment} className="mt-4 flex flex-col gap-2 sm:flex-row">
                      <input type="hidden" name="topic_id" value={topic.id} />
                      <input type="hidden" name="post_id" value={post.id} />

                      <input
                          name="content"
                          required
                          minLength={2}
                          className="min-w-0 flex-1 rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                          placeholder="댓글을 입력하세요."
                      />

                      <button className="w-full rounded-lg bg-blue-500 px-4 py-3 text-sm font-medium text-white hover:bg-blue-400 sm:w-auto">
                          등록
                      </button>
                      </form>
                  ) : null}
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-lg bg-gray-950 p-6 text-center text-gray-400">
                {activeSide === "all"
                  ? "아직 작성된 글이 없습니다."
                  : `${sideFilterLabel(activeSide)}이 아직 없습니다.`}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}