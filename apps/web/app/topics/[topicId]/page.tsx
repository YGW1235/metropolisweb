import { joinTopic } from "@/app/actions/participants";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

type TopicDetailPageProps = {
  params: Promise<{
    topicId: string;
  }>;
  searchParams: Promise<{
    message?: string;
  }>;
};

function sideLabel(side: string | null | undefined) {
  if (side === "pro") return "찬성";
  if (side === "con") return "반대";
  return "미배정";
}

function topicStatusLabel(status: string) {
  if (status === "draft") return "준비 중";
  if (status === "open") return "참가 가능";
  if (status === "active") return "토론 진행 중";
  if (status === "closed") return "종료됨";
  if (status === "archived") return "보관됨";
  return status;
}

function topicStatusDescription(status: string) {
  if (status === "draft") {
    return "아직 공개되지 않은 주제입니다.";
  }

  if (status === "open") {
    return "현재 참가할 수 있는 주제입니다. 참가하면 찬성 또는 반대 역할이 자동으로 배정됩니다.";
  }

  if (status === "active") {
    return "현재 토론이 진행 중입니다. 이미 참가한 유저만 토론방에 입장할 수 있습니다.";
  }

  if (status === "closed") {
    return "종료된 토론입니다. 더 이상 참가하거나 글을 작성할 수 없습니다.";
  }

  if (status === "archived") {
    return "보관 처리된 주제입니다.";
  }

  return "";
}

export default async function TopicDetailPage({
  params,
  searchParams,
}: TopicDetailPageProps) {
  const { topicId } = await params;
  const query = await searchParams;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: topic, error } = await supabase
    .from("topics")
    .select("id, title, description, status, starts_at, ends_at, created_at")
    .eq("id", topicId)
    .single();

  if (error || !topic) {
    notFound();
  }

  let participation: {
    assigned_side: string;
    side_index: number;
    joined_at: string;
  } | null = null;

  if (user) {
    const { data } = await supabase
      .from("topic_participants")
      .select("assigned_side, side_index, joined_at")
      .eq("topic_id", topic.id)
      .eq("user_id", user.id)
      .maybeSingle();

    participation = data;
  }

  const canJoin = topic.status === "open" && !participation;

  return (
    <main className="min-h-screen bg-gray-950 px-4 py-10 text-white sm:px-6 sm:py-16">
      <section className="mx-auto max-w-3xl">
        <a href="/topics" className="text-sm text-blue-400 hover:underline">
          ← 주제 목록으로 돌아가기
        </a>

        {query.message ? (
          <div className="mt-6 rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
            {query.message}
          </div>
        ) : null}

        <div className="mt-8 rounded-lg border border-gray-700 bg-gray-900 p-5 sm:p-8">
          <p className="text-sm text-blue-400">
            {topicStatusLabel(topic.status)}
          </p>

          <h1 className="mt-3 text-3xl font-bold">{topic.title}</h1>

          <p className="mt-6 whitespace-pre-wrap text-gray-300">
            {topic.description}
          </p>

          <div className="mt-6 rounded-lg border border-gray-700 bg-gray-950 p-4 text-sm text-gray-300">
            {topicStatusDescription(topic.status)}
          </div>

          <div className="mt-8 rounded-lg bg-gray-950 p-4 text-sm text-gray-300">
            <p>
              생성일:{" "}
              {new Date(topic.created_at).toLocaleString("ko-KR", {
                timeZone: "Asia/Seoul",
              })}
            </p>

            {topic.starts_at ? (
              <p className="mt-2">
                시작:{" "}
                {new Date(topic.starts_at).toLocaleString("ko-KR", {
                  timeZone: "Asia/Seoul",
                })}
              </p>
            ) : null}

            {topic.ends_at ? (
              <p className="mt-2">
                종료:{" "}
                {new Date(topic.ends_at).toLocaleString("ko-KR", {
                  timeZone: "Asia/Seoul",
                })}
              </p>
            ) : null}
          </div>

          {participation ? (
            <div className="mt-8 rounded-lg border border-green-500/40 bg-green-500/10 p-5">
              <p className="text-sm text-green-300">이미 참가한 주제입니다.</p>
              <p className="mt-2 text-xl font-bold">
                내 역할: {sideLabel(participation.assigned_side)} 익명 {participation.side_index}
              </p>

              {topic.status === "open" || topic.status === "active" ? (
                <a
                  href={`/topics/${topic.id}/debate`}
                  className="mt-5 inline-block rounded-lg bg-blue-500 px-5 py-3 font-medium text-white hover:bg-blue-400"
                >
                  토론방 입장
                </a>
              ) : (
                <div className="mt-5 rounded-lg border border-gray-700 bg-gray-950 p-4 text-sm text-gray-300">
                  이 토론은 종료되어 더 이상 글이나 댓글을 작성할 수 없습니다.
                </div>
              )}
            </div>
          ) : topic.status === "open" ? (
            <form action={joinTopic} className="mt-8">
              <input type="hidden" name="topic_id" value={topic.id} />

              <button className="w-full rounded-lg bg-blue-500 px-5 py-3 font-medium text-white hover:bg-blue-400">
                참가하기
              </button>

              <p className="mt-3 text-center text-sm text-gray-400">
                참가하면 찬성 또는 반대 역할이 자동으로 배정됩니다.
              </p>
            </form>
          ) : topic.status === "active" ? (
            <div className="mt-8 rounded-lg border border-yellow-500/40 bg-yellow-500/10 p-5 text-yellow-100">
              현재 토론이 이미 진행 중입니다. 신규 참가자는 받을 수 없습니다.
            </div>
          ) : topic.status === "closed" ? (
            <div className="mt-8 rounded-lg border border-gray-700 bg-gray-950 p-5 text-gray-300">
              종료된 토론입니다. 더 이상 참가할 수 없습니다.
            </div>
          ) : (
            <div className="mt-8 rounded-lg border border-gray-700 bg-gray-950 p-5 text-gray-300">
              현재 참가할 수 없는 주제입니다.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}