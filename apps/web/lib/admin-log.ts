type RpcResult = {
  error: {
    message?: string;
  } | null;
};

type RpcClient = {
  rpc: (
    fn: string,
    args: Record<string, unknown>,
  ) => PromiseLike<RpcResult>;
};

type LogAdminActivityArgs = {
  action: string;
  targetType: string;
  targetId?: string | null;
  summary?: string | null;
  metadata?: Record<string, unknown>;
};

export async function logAdminActivity(
  supabase: RpcClient,
  {
    action,
    targetType,
    targetId = null,
    summary = null,
    metadata = {},
  }: LogAdminActivityArgs,
) {
  const { error } = await supabase.rpc("log_admin_activity", {
    p_action: action,
    p_target_type: targetType,
    p_target_id: targetId,
    p_summary: summary,
    p_metadata: metadata,
  });

  if (error) {
    console.error("[admin activity log failed]", error.message);
  }
}