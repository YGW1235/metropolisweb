import { updateMyProfile } from "@/app/actions/profile";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

type ProfileSettingsPageProps = {
  searchParams: Promise<{
    message?: string;
  }>;
};

export default async function ProfileSettingsPage({
  searchParams,
}: ProfileSettingsPageProps) {
  const params = await searchParams;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, email, display_name, role, status, created_at")
    .eq("id", user.id)
    .single();

  if (error) {
    return (
      <main className="min-h-screen bg-gray-950 px-6 py-16 text-white">
        <section className="mx-auto max-w-2xl">
          <h1 className="text-3xl font-bold">프로필 설정</h1>

          <div className="mt-6 rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
            프로필을 불러오지 못했습니다: {error.message}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 px-6 py-16 text-white">
      <section className="mx-auto max-w-2xl">
        <a href="/me" className="text-sm text-blue-400 hover:underline">
          ← 내 계정으로 돌아가기
        </a>

        <h1 className="mt-6 text-3xl font-bold">프로필 설정</h1>
        <p className="mt-3 text-gray-300">
          계정에서 사용할 닉네임을 수정합니다.
        </p>

        {params.message ? (
          <div className="mt-6 rounded-lg border border-green-500/40 bg-green-500/10 p-4 text-sm text-green-200">
            {params.message}
          </div>
        ) : null}

        <form action={updateMyProfile} className="mt-8 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-200">
              닉네임
            </label>

            <input
              name="display_name"
              required
              minLength={2}
              maxLength={20}
              defaultValue={profile?.display_name ?? ""}
              className="mt-2 w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-white outline-none focus:border-blue-500"
              placeholder="2~20자 닉네임"
            />

            <p className="mt-2 text-sm text-gray-500">
              토론방에서는 닉네임 대신 찬성 익명 N / 반대 익명 N으로 표시됩니다.
            </p>
          </div>

          <div className="rounded-lg border border-gray-700 bg-gray-900 p-5">
            <p className="text-sm text-gray-400">이메일</p>
            <p className="mt-2 font-semibold">{profile?.email ?? user.email}</p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg bg-gray-950 p-4">
                <p className="text-sm text-gray-400">권한</p>
                <p className="mt-2 font-semibold">{profile?.role}</p>
              </div>

              <div className="rounded-lg bg-gray-950 p-4">
                <p className="text-sm text-gray-400">상태</p>
                <p className="mt-2 font-semibold">{profile?.status}</p>
              </div>
            </div>
          </div>

          <button className="w-full rounded-lg bg-blue-500 px-5 py-3 font-medium text-white hover:bg-blue-400">
            프로필 저장
          </button>
        </form>
      </section>
    </main>
  );
}