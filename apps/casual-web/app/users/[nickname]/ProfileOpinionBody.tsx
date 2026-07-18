"use client";

import { useMemo, useState } from "react";

function getPreviewBody(body: string, previewLength: number) {
  if (body.length <= previewLength) {
    return body;
  }

  const sliced = body.slice(0, previewLength);
  const lastWhitespaceIndex = Math.max(
    sliced.lastIndexOf(" "),
    sliced.lastIndexOf("\n"),
  );
  const cutIndex =
    lastWhitespaceIndex > Math.floor(previewLength * 0.75)
      ? lastWhitespaceIndex
      : previewLength;

  return sliced.slice(0, cutIndex).trimEnd();
}

export function ProfileOpinionBody({
  body,
  previewLength = 350,
}: {
  body: string;
  previewLength?: number;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldTruncate = body.length > previewLength;
  const previewBody = useMemo(
    () => getPreviewBody(body, previewLength),
    [body, previewLength],
  );
  const displayBody =
    shouldTruncate && !isExpanded ? `${previewBody}...` : body;

  return (
    <div className="mt-3 min-w-0">
      <p className="min-w-0 whitespace-pre-wrap break-words text-sm leading-6 text-stone-700 [overflow-wrap:anywhere]">
        {displayBody}
      </p>

      {shouldTruncate && (
        <button
          className="mt-2 rounded-full bg-orange-50 px-3 py-1.5 text-xs font-black text-orange-700 ring-1 ring-orange-100 transition hover:bg-orange-100"
          onClick={() => setIsExpanded((current) => !current)}
          type="button"
        >
          {isExpanded ? "접기" : "더보기"}
        </button>
      )}
    </div>
  );
}
