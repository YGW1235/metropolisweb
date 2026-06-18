import { requireAdmin } from "@/lib/auth";

export async function requireDevOrAdmin() {
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  await requireAdmin();
}