import { signIn, signUp } from "@/app/actions/auth";

type LoginPageProps = {
  searchParams: Promise<{
    message?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <main className="min-h-screen bg-gray-950 px-6 py-16 text-white">
      <section className="mx-auto max-w-md">
        <h1 className="text-3xl font-bold">로그인</h1>
        <p className="mt-3 text-gray-300">
          이메일과 비밀번호로 회원가입하거나 로그인하세요.
        </p>

        {params.message ? (
          <div className="mt-6 rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
            {params.message}
          </div>
        ) : null}

        <form className="mt-8 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-200">
              이메일
            </label>
            <input
              name="email"
              type="email"
              required
              className="mt-2 w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-white outline-none focus:border-blue-500"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200">
              비밀번호
            </label>
            <input
              name="password"
              type="password"
              required
              minLength={6}
              className="mt-2 w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-white outline-none focus:border-blue-500"
              placeholder="6자 이상"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              formAction={signIn}
              className="rounded-lg bg-blue-500 px-4 py-3 font-medium text-white hover:bg-blue-400"
            >
              로그인
            </button>

            <button
              formAction={signUp}
              className="rounded-lg border border-gray-600 px-4 py-3 font-medium text-gray-200 hover:bg-gray-800"
            >
              회원가입
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}