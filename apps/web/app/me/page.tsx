import { signOut } from "@/app/actions/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function MePage() {
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

  return (
    <main className="min-h-screen bg-gray-950 px-6 py-16 text-white">
      <section className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold">내 계정</h1>

        {error ? (
          <div className="mt-6 rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
            프로필을 불러오지 못했습니다: {error.message}
          </div>
        ) : null}

        <div className="mt-8 rounded-lg border border-gray-700 bg-gray-900 p-6">
          <p className="text-sm text-gray-400">닉네임</p>
          <p className="mt-2 text-lg font-semibold">
            {profile?.display_name ?? "없음"}
          </p>

          <p className="mt-6 text-sm text-gray-400">이메일</p>
          <p className="mt-2 text-lg font-semibold">
            {profile?.email ?? user.email}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-gray-950 p-4">
              <p className="text-sm text-gray-400">권한</p>
              <p className="mt-2 font-semibold">{profile?.role}</p>
            </div>

            <div className="rounded-lg bg-gray-950 p-4">
              <p className="text-sm text-gray-400">상태</p>
              <p className="mt-2 font-semibold">{profile?.status}</p>
            </div>
          </div>

          <p className="mt-6 text-sm text-gray-400">User ID</p>
          <p className="mt-2 break-all rounded bg-black p-3 text-sm text-gray-200">
            {user.id}
          </p>
        </div>

        <a
          href="/settings/profile"
          className="mt-6 inline-block rounded-lg bg-blue-500 px-5 py-3 font-medium text-white hover:bg-blue-400"
        >
          프로필 수정
        </a>

        <form action={signOut} className="mt-6">
          <button className="rounded-lg border border-gray-600 px-5 py-3 font-medium text-gray-200 hover:bg-gray-800">
            로그아웃
          </button>
        </form>
      </section>
    </main>
  );
}