import { createClient } from "@/lib/supabase/server";

export default async function SupabaseTestPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen bg-gray-950 p-8 text-white">
      <h1 className="text-3xl font-bold">Supabase 연결 테스트</h1>

      <div className="mt-6 rounded-lg border border-gray-700 bg-gray-900 p-6">
        <p className="text-gray-300">연결 상태:</p>

        <p className="mt-2 text-lg font-semibold text-green-400">
          Supabase 클라이언트 생성 성공
        </p>

        <p className="mt-6 text-gray-300">현재 로그인 사용자:</p>

        <pre className="mt-2 overflow-auto rounded bg-black p-4 text-sm text-gray-200">
          {JSON.stringify({ user: data.user, error: error?.message }, null, 2)}
        </pre>
      </div>
    </main>
  );
}