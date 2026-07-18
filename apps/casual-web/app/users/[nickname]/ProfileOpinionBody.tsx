import { ExpandableTextByLines } from "@/components/ExpandableTextByLines";
import { CASUAL_OPINION_BODY_COLLAPSED_LINES } from "@/lib/casual-opinion-constraints";

export function ProfileOpinionBody({
  body,
  maxLines = CASUAL_OPINION_BODY_COLLAPSED_LINES,
}: {
  body: string;
  maxLines?: number;
}) {
  return (
    <ExpandableTextByLines
      body={body}
      buttonClassName="mt-2 rounded-full bg-orange-50 px-3 py-1.5 text-xs font-black text-orange-700 ring-1 ring-orange-100 transition hover:bg-orange-100"
      containerClassName="mt-3 w-full min-w-0 max-w-full overflow-hidden"
      maxLines={maxLines}
      textClassName="w-full min-w-0 max-w-full overflow-hidden whitespace-pre-wrap break-words text-sm leading-6 text-stone-700 [overflow-wrap:anywhere] [word-break:break-word]"
    />
  );
}
