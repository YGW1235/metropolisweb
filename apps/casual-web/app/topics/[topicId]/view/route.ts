import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

type RouteParams = Promise<{
  topicId: string;
}>;

function createSessionId() {
  return crypto.randomUUID();
}

export async function POST(
  _request: NextRequest,
  { params }: { params: RouteParams },
) {
  const { topicId } = await params;
  const cookieStore = await cookies();

  let sessionId = cookieStore.get("casual_session_id")?.value;

  if (!sessionId) {
    sessionId = createSessionId();
  }

  const supabase = await createClient();

  const { error } = await supabase.rpc("record_casual_topic_view", {
    p_topic_id: topicId,
    p_session_id: sessionId,
  });

  const response = NextResponse.json({
    ok: !error,
    error: error?.message ?? null,
  });

  response.cookies.set("casual_session_id", sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  return response;
}