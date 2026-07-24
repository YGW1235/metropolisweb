export async function withPerfLog<T>(
  label: string,
  action: () => Promise<T>,
): Promise<T> {
  if (process.env.NODE_ENV === "production") {
    return action();
  }

  const startedAt = Date.now();

  try {
    return await action();
  } finally {
    const elapsedMs = Date.now() - startedAt;
    console.log(`[perf] ${label}: ${elapsedMs}ms`);
  }
}
