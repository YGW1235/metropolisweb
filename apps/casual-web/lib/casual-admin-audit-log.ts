import type { createClient } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

type AuditMetadata = Record<string, unknown>;

type CreateAdminAuditLogParams = {
  action: string;
  targetType: string;
  targetId?: string | null;
  targetUserId?: string | null;
  message: string;
  metadata?: AuditMetadata;
};

export async function createAdminAuditLog(
  supabase: SupabaseClient,
  {
    action,
    targetId = null,
    targetType,
    targetUserId = null,
    message,
    metadata = {},
  }: CreateAdminAuditLogParams,
) {
  try {
    const { error } = await supabase.rpc("create_casual_admin_audit_log", {
      p_action: action,
      p_target_type: targetType,
      p_target_id: targetId,
      p_target_user_id: targetUserId,
      p_message: message,
      p_metadata: metadata,
    });

    if (error) {
      console.error("Failed to create casual admin audit log:", error.message);
    }
  } catch (error) {
    console.error("Failed to create casual admin audit log:", error);
  }
}
