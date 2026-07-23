export const SITE_NAME = "심포지온";

export const DEFAULT_TITLE = "심포지온";

export const DEFAULT_DESCRIPTION =
  "일상의 찬반 주제를 가볍게 고르고, 짧은 의견을 나누는 캐주얼 논쟁 공간입니다. 내 선택이 주류인지 비주류인지 확인해보세요.";

const FALLBACK_SITE_URL = "http://localhost:3001";

export function getSiteUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (!configuredUrl) {
    return FALLBACK_SITE_URL;
  }

  const urlWithProtocol = /^https?:\/\//i.test(configuredUrl)
    ? configuredUrl
    : `https://${configuredUrl}`;

  try {
    return new URL(urlWithProtocol).origin;
  } catch {
    return FALLBACK_SITE_URL;
  }
}

export function getMetadataBase() {
  return new URL(getSiteUrl());
}

export function getAbsoluteUrl(path: string) {
  return new URL(path, getSiteUrl()).toString();
}

export function truncateDescription(value: string | null | undefined) {
  const text = value?.trim() || DEFAULT_DESCRIPTION;

  if (text.length <= 155) {
    return text;
  }

  return `${text.slice(0, 152).trimEnd()}...`;
}
