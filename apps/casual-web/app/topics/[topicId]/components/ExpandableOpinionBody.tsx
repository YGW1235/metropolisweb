import { ExpandableTextByLines } from "@/components/ExpandableTextByLines";
import { CASUAL_OPINION_BODY_COLLAPSED_LINES } from "@/lib/casual-opinion-constraints";

export function ExpandableOpinionBody({
  body,
  maxLines = CASUAL_OPINION_BODY_COLLAPSED_LINES,
}: {
  body: string;
  maxLines?: number;
}) {
  return <ExpandableTextByLines body={body} maxLines={maxLines} />;
}
