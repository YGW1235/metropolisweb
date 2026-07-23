# 심포지온 / Symposion

심포지온은 일상의 찬반 주제를 가볍게 고르고, 짧은 의견을 나누는 캐주얼 논쟁 공간입니다.

- 운영 도메인: https://symposiontalk.com
- 앱 위치: `apps/casual-web`

## 주요 기능

- 찬반 주제 투표
- 의견/댓글 작성
- 의견 이미지 첨부
- 공감/비공감
- 선택 성향 카드
- 주제 저장
- 알림
- 문의
- 관리자 moderation

## 개발

```bash
pnpm --filter casual-web dev
```

## 빌드

```bash
pnpm --filter casual-web build
```

## 주요 환경변수

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=https://symposiontalk.com
```

## 배포 전 확인

- `/sitemap.xml` 공개 접근 확인
- `/robots.txt` 공개 접근 확인
- `/og-image.png` 공유 이미지 접근 확인
- Supabase Auth Site URL과 Redirect URL 확인
- Vercel 환경변수 확인
- Google Search Console 등록과 sitemap 제출
