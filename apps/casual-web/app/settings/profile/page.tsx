import Link from "next/link";
import { redirect } from "next/navigation";

import { updateProfile } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";

import { SiteHeader } from "@/components/SiteHeader";

type SearchParams = Promise<{
  message?: string;
  type?: "success" | "error";
}>;

export default async function ProfileSettingsPage({
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

  await supabase.rpc("ensure_casual_profile");

  const { data: profile, error } = await supabase
    .from("casual_profiles")
    .select(
      "id, user_id, nickname, bio, avatar_url, opinion_count, received_like_count, created_at",
    )
    .eq("user_id", user.id)
    .single();

  if (error || !profile) {
    return (
      <main className="min-h-screen bg-red-50 p-8 text-red-900">
        <h1 className="text-2xl font-black">프로필을 불러오지 못했습니다.</h1>
        <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-white p-4 text-sm">
          {error?.message ?? "프로필이 없습니다."}
        </pre>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fff7ed] text-[#2f2118]">

      <SiteHeader />
      <section className="mx-auto max-w-2xl">

        <div className="mt-8 rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
          <div>
            <div>
              <p className="text-sm font-bold tracking-[0.3em] text-orange-700">
                PROFILE
              </p>
              <h1 className="mt-2 text-3xl font-black">내 프로필</h1>
              <p className="mt-3 text-sm leading-6 text-stone-600">
                의견과 댓글에는 이메일 대신 닉네임이 표시됩니다.
              </p>
            </div>
          </div>

          {params.message && (
            <div
              className={`mt-5 rounded-2xl p-4 text-sm font-bold ${
                params.type === "error"
                  ? "bg-red-50 text-red-700"
                  : "bg-green-50 text-green-700"
              }`}
            >
              {params.message}
            </div>
          )}

          <div className="mt-6 rounded-3xl bg-orange-50 p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-200 text-2xl font-black text-orange-900">
                {profile.nickname.slice(0, 1)}
              </div>

              <div>
                <p className="text-xl font-black">{profile.nickname}</p>
                <p className="mt-1 text-sm text-stone-600">
                  작성 의견 {profile.opinion_count}개 · 받은 공감{" "}
                  {profile.received_like_count}개
                </p>
                <Link
                  href={`/users/${encodeURIComponent(profile.nickname)}`}
                  className="mt-4 inline-flex rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-black text-orange-700 transition hover:bg-orange-50"
                >
                  공개 프로필 보기
                </Link>

                <Link
                  href="/me"
                  className="mt-4 inline-flex rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-black text-stone-700 transition hover:bg-stone-50"
                >
                  내 활동 보기
                </Link>
              </div>
            </div>
          </div>

          <form action={updateProfile} className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-bold text-stone-700">
                닉네임
              </label>
              <input
                name="nickname"
                required
                minLength={2}
                maxLength={16}
                defaultValue={profile.nickname}
                className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 outline-none focus:border-orange-400"
                placeholder="2~16자"
              />
              <p className="mt-2 text-xs text-stone-500">
                닉네임은 2자 이상 16자 이하입니다. 다른 유저와 중복될 수
                없습니다.
              </p>
            </div>

            <div>
              <label className="text-sm font-bold text-stone-700">
                한 줄 소개
              </label>
              <textarea
                name="bio"
                maxLength={120}
                defaultValue={profile.bio}
                className="mt-2 min-h-28 w-full resize-none rounded-2xl border border-stone-200 px-4 py-3 outline-none focus:border-orange-400"
                placeholder="나를 간단히 소개해보세요."
              />
              <p className="mt-2 text-xs text-stone-500">
                최대 120자까지 입력할 수 있습니다.
              </p>
            </div>

            <button className="w-full rounded-2xl bg-stone-950 px-5 py-3 font-black text-white transition hover:-translate-y-0.5">
              프로필 저장
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
