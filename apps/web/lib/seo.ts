export const SITE_URL = "https://metropolisagora.com";
export const SITE_NAME = "메트로폴리스 아고라";
export const SITE_DESCRIPTION =
  "아테나와 포세이돈의 관점으로 나뉘어 사회적 의제를 토론하는 공개 토론 플랫폼";
export const DEFAULT_OG_IMAGE = "/images/1.png";

export function getAbsoluteUrl(path = "/") {
  return new URL(path, SITE_URL).toString();
}

export function getSeoDescription(
  value: string | null | undefined,
  fallback = SITE_DESCRIPTION,
  maxLength = 155,
) {
  const normalized = value?.replace(/\s+/g, " ").trim() || fallback;

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 3).trimEnd()}...`;
}
