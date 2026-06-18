import type { ReactNode } from "react";

import { requireDevOrAdmin } from "@/lib/dev-guard";

export default async function DevOnlyLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireDevOrAdmin();

  return <>{children}</>;
}