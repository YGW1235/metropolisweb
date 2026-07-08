import type { createClient } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export type CasualUserStatus = "active" | "limited" | "suspended";
export type CasualUserPermission = "participation" | "interaction";

export type CasualUserStatusResult = {
  status: CasualUserStatus;
  errorMessage: string | null;
};

function isCasualUserStatus(value: unknown): value is CasualUserStatus {
  return value === "active" || value === "limited" || value === "suspended";
}

function getStatusValue(data: unknown): unknown {
  if (Array.isArray(data)) {
    return getStatusValue(data[0]);
  }

  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    return record.status ?? record.user_status ?? record.get_casual_user_status;
  }

  return data;
}

export function normalizeCasualUserStatus(data: unknown): CasualUserStatus {
  const value = getStatusValue(data);
  return isCasualUserStatus(value) ? value : "active";
}

export async function getCasualUserStatus(
  supabase: SupabaseClient,
  userId: string | null = null,
): Promise<CasualUserStatusResult> {
  const { data, error } = await supabase.rpc("get_casual_user_status", {
    p_user_id: userId,
  });

  return {
    status: normalizeCasualUserStatus(data),
    errorMessage: error?.message ?? null,
  };
}

export function getCasualUserRestrictionMessage(
  status: CasualUserStatus,
  permission: CasualUserPermission,
) {
  if (status === "suspended") {
    return "현재 계정은 이용이 정지되어 있습니다.";
  }

  if (status === "limited" && permission === "participation") {
    return "현재 계정은 참여가 제한되어 있습니다.";
  }

  return null;
}

export function getCasualUserStatusLabel(status: CasualUserStatus) {
  if (status === "limited") return "참여 제한";
  if (status === "suspended") return "이용 정지";
  return "활성";
}
