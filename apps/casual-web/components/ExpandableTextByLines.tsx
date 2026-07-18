"use client";

import {
  type CSSProperties,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

import { CASUAL_OPINION_BODY_COLLAPSED_LINES } from "@/lib/casual-opinion-constraints";

const baseTextClassName =
  "whitespace-pre-wrap break-words text-sm leading-6 text-stone-700 [overflow-wrap:anywhere]";

function getClampedStyle(maxLines: number): CSSProperties {
  return {
    display: "-webkit-box",
    overflow: "hidden",
    overflowWrap: "anywhere",
    WebkitBoxOrient: "vertical",
    WebkitLineClamp: maxLines,
  };
}

export function ExpandableTextByLines({
  body,
  buttonClassName = "mt-2 rounded-full bg-white/80 px-3 py-1.5 text-xs font-black text-orange-700 ring-1 ring-orange-100 transition hover:bg-orange-100",
  containerClassName = "mt-4",
  maxLines = CASUAL_OPINION_BODY_COLLAPSED_LINES,
  textClassName = baseTextClassName,
}: {
  body: string;
  buttonClassName?: string;
  containerClassName?: string;
  maxLines?: number;
  textClassName?: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);
  const contentId = useId();
  const measureRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const measureElement = measureRef.current;

    if (!measureElement) {
      return;
    }

    let animationFrameId: number | null = null;

    const measure = () => {
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
      }

      animationFrameId = window.requestAnimationFrame(() => {
        setCanExpand(
          measureElement.scrollHeight > measureElement.clientHeight + 1,
        );
      });
    };

    measure();

    window.addEventListener("resize", measure);

    return () => {
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
      }
      window.removeEventListener("resize", measure);
    };
  }, [body, maxLines]);

  useEffect(() => {
    setIsExpanded(false);
  }, [body, maxLines]);

  return (
    <div className={`${containerClassName} relative min-w-0`}>
      <p
        id={contentId}
        className={textClassName}
        style={isExpanded ? { overflowWrap: "anywhere" } : getClampedStyle(maxLines)}
      >
        {body}
      </p>

      <p
        aria-hidden="true"
        className={`${textClassName} pointer-events-none invisible absolute inset-x-0 top-0 -z-10`}
        ref={measureRef}
        style={getClampedStyle(maxLines)}
      >
        {body}
      </p>

      {canExpand && (
        <button
          aria-controls={contentId}
          aria-expanded={isExpanded}
          className={buttonClassName}
          onClick={() => setIsExpanded((current) => !current)}
          type="button"
        >
          {isExpanded ? "접기" : "더보기"}
        </button>
      )}
    </div>
  );
}
