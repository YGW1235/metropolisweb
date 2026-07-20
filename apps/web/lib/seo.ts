export const SITE_URL = "https://metropolisagora.com";
export const SITE_NAME = "Metropolis";
export const SITE_DESCRIPTION =
  "토론 주제에 참여하고 다양한 관점을 나누는 공개 토론 플랫폼";
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
