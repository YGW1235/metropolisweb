import type { ReactNode } from "react";

import { PopularOpinionsAside } from "@/components/PopularOpinionsAside";
import { TopicTagAside } from "@/components/TopicTagAside";

export async function PublicShell({
  activeTagSlug,
  children,
}: {
  activeTagSlug?: string;
  children: ReactNode;
}) {
  return (
    <section className="mx-auto grid w-full max-w-[1760px] gap-5 px-3 py-6 pb-28 sm:px-6 lg:grid-cols-[210px_minmax(0,1fr)_260px] lg:gap-6 lg:px-8 lg:pb-10 xl:grid-cols-[220px_minmax(0,1fr)_280px]">
      <div className="min-w-0 lg:order-2">{children}</div>

      <aside className="min-w-0 lg:order-1">
        <TopicTagAside activeTagSlug={activeTagSlug} />
      </aside>

      <aside className="min-w-0 lg:order-3">
        <PopularOpinionsAside />
      </aside>
    </section>
  );
}
