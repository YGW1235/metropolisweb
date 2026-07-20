# Metropolis 런칭 점검 문서

기준일: 2026-07-10

운영 주소: `https://metropolisagora.com`

대상 앱: `apps/web`

이 문서는 배포 전후 수동 점검 결과를 기록하기 위한 문서입니다. GitHub Actions나 Vercel 배포 결과처럼 외부 서비스에서 확인해야 하는 항목은 해당 서비스 화면의 최신 상태를 기준으로 확인합니다.

## 1. 환경 및 배포

| 항목 | 확인 내용 | 상태 |
| --- | --- | --- |
| GitHub Actions build | `Web CI` workflow가 main push 또는 PR에서 실행되는지 확인 | 확인 필요 |
| 의존성 설치 | CI에서 repo 루트 `pnpm install --frozen-lockfile` 실행 | 설정됨 |
| 앱 빌드 | CI에서 `apps/web` 기준 `pnpm build` 실행 | 설정됨 |
| Vercel 배포 | Vercel 프로젝트 Root Directory가 `apps/web`인지 확인 | 확인 필요 |
| 운영 도메인 | `https://metropolisagora.com` 접속 확인 | 확인 필요 |
| WWW 도메인 | `https://www.metropolisagora.com` 리다이렉트 또는 접속 정책 확인 | 확인 필요 |
| 환경변수 | Vercel Production env 설정 확인 | 확인 필요 |

필수 환경변수:

```txt
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
NEXT_PUBLIC_SITE_URL
RESEND_API_KEY
CONTACT_EMAIL_FROM
CONTACT_NOTIFY_TO
```

secret 값은 이 문서에 기록하지 않습니다.

## 2. Supabase 설정

| 항목 | 확인 내용 | 상태 |
| --- | --- | --- |
| Auth Site URL | `https://metropolisagora.com` | 확인 필요 |
| Redirect URL | `https://metropolisagora.com/**` | 확인 필요 |
| Redirect URL | `https://www.metropolisagora.com/**` | 확인 필요 |
| Redirect URL | `https://metropolisweb.vercel.app/**` | 확인 필요 |
| Redirect URL | `http://localhost:3000/**` | 확인 필요 |
| Email Templates | Supabase Dashboard에서 문구와 링크 확인 | 확인 필요 |
| SMTP | Supabase Auth SMTP가 Resend SMTP로 설정되어 있는지 확인 | 확인 필요 |
| Storage | `debate-images` bucket 존재 및 정책 확인 | 확인 필요 |

## 3. 회원가입/이메일 인증

점검 절차:

1. `/login`에서 새 이메일로 회원가입
2. 약관/개인정보처리방침 동의 체크
3. 인증 메일 수신 확인
4. 인증 링크 클릭
5. `/auth/callback` 이후 로그인 또는 `/me` 이동 흐름 확인

확인할 것:

- 인증 링크가 `metropolisagora.com` 기준으로 동작하는지
- 인증 완료 전/후 메시지가 자연스러운지
- 인증 메일 재발송 폼이 동작하는지

상태: 확인 필요

## 4. 로그인/로그아웃

점검 절차:

1. 인증된 계정으로 로그인
2. 헤더에 내 계정 링크가 표시되는지 확인
3. `/me` 접근 확인
4. 로그아웃 실행
5. 로그아웃 후 보호 기능 접근이 막히는지 확인

상태: 확인 필요

## 5. 비밀번호 재설정/변경

점검 절차:

1. `/forgot-password`에서 재설정 메일 요청
2. 메일 링크로 `/reset-password` 진입
3. 새 비밀번호 설정
4. 새 비밀번호로 로그인
5. 로그인 상태에서 `/me/password`로 내 비밀번호 변경

확인할 것:

- 재설정 링크가 운영 도메인으로 열리는지
- 8자 미만 비밀번호 검증 메시지가 표시되는지
- 현재 비밀번호 확인 후 변경되는지

상태: 확인 필요

## 6. 주제 목록/상세/참여

점검 절차:

1. `/topics`에서 공개 주제 목록 확인
2. 주제 상세 페이지 진입
3. 비로그인 상태에서 관전 가능 여부 확인
4. 로그인 후 아테나/포세이돈/자동 배정 참여
5. 참여 후 토론방 이동

확인할 것:

- `draft`, `archived`, 삭제 처리된 주제가 일반 목록에 노출되지 않는지
- `open`, `active`, `closed` 상태 표시가 맞는지
- 주제 설명 줄바꿈과 긴 텍스트가 깨지지 않는지

상태: 확인 필요

## 7. 글/댓글/이미지

점검 절차:

1. 참여 계정으로 `/topics/[topicId]/debate/new` 진입
2. 발언 작성
3. JPG/PNG/WEBP 이미지 첨부
4. 5MB 초과 또는 허용되지 않는 파일 타입 검증 확인
5. 게시글 상세 페이지에서 이미지와 본문 확인
6. 댓글 작성
7. 내 댓글 삭제
8. 내 발언 삭제

확인할 것:

- 발언 본문과 댓글 본문 줄바꿈이 표시되는지
- 긴 URL/긴 단어가 레이아웃을 깨지 않는지
- 삭제된 발언의 이미지가 Storage에서 제거되는지
- 비참여자는 작성할 수 없고 관전만 가능한지

상태: 확인 필요

## 8. 신고/관리자 처리

점검 절차:

1. 일반 계정으로 게시글 신고
2. 일반 계정으로 댓글 신고
3. 관리자 계정으로 `/admin/reports` 확인
4. 신고 상태 변경
5. 대상 게시글 또는 댓글 숨김 처리
6. 신고 대상 작성자 정지/복구
7. 일반 사용자 화면에서 숨김 결과 확인

확인할 것:

- 단순 의견 차이와 운영 위반을 구분해 처리하는지
- 처리 후 `/admin/activity`에 로그가 남는지
- 정지된 유저가 참여/작성 제한을 받는지

상태: 확인 필요

## 9. 문의

점검 절차:

1. `/contact`에서 문의 작성
2. 개인정보 수집 동의 없이 제출 시 검증 확인
3. 문의 접수 후 성공 메시지 확인
4. 운영자 알림 메일 수신 확인
5. `/admin/inquiries`에서 문의 조회
6. 상태와 관리자 메모 변경

확인할 것:

- `CONTACT_EMAIL_FROM`, `CONTACT_NOTIFY_TO`, `RESEND_API_KEY` 설정 여부
- 문의 내용 줄바꿈 표시
- 처리 후 활동 로그가 남는지

상태: 확인 필요

## 10. 공지사항

점검 절차:

1. 관리자에서 공지 작성
2. `draft` 상태가 일반 사용자에게 보이지 않는지 확인
3. `published` 상태로 변경
4. `/notices` 목록과 상세 페이지 확인
5. 고정 공지 노출 확인
6. 공지 수정/삭제 확인

상태: 확인 필요

## 11. 다크/라이트 모드

점검 절차:

1. 헤더의 테마 토글 클릭
2. 다크모드에서 “일반모드로 전환” 문구 확인
3. 일반모드에서 “다크모드로 전환” 문구 확인
4. 새로고침 후 선택한 테마 유지 확인
5. 주요 페이지에서 텍스트 대비 확인

확인할 페이지:

- `/`
- `/topics`
- `/topics/[topicId]`
- `/topics/[topicId]/debate`
- `/topics/[topicId]/debate/[postId]`
- `/login`
- `/contact`
- `/me`
- `/admin`

상태: 확인 필요

## 12. 모바일 확인

점검 절차:

1. 모바일 폭에서 홈과 헤더 확인
2. 토론방 목록과 상세 페이지 확인
3. 글쓰기 폼과 이미지 첨부 확인
4. 댓글 작성 폼 확인
5. 관리자 주요 목록 화면 확인
6. 테마 토글 버튼이 깨지지 않는지 확인

상태: 확인 필요

## 13. Production Smoke Test

운영 사이트 공개 페이지가 정상 렌더링되는지 확인하기 위한 수동 실행 workflow가 추가되었습니다.

- workflow: `Production Smoke Test`
- workflow 파일: `.github/workflows/prod-smoke.yml`
- 운영 주소: `https://metropolisagora.com`
- 수동 실행 방식: GitHub Actions -> `Production Smoke Test` -> `Run workflow`
- 실행 결과: `16 passed`

테스트 구조:

- `Desktop Chrome`: 데스크톱 크롬 환경에서 공개 경로 8개 확인
- `Mobile Chrome`: Pixel 5 기반 모바일 크롬 환경에서 동일한 공개 경로 8개 확인
- 모바일 뷰포트 기준: `390 x 844`

테스트 대상:

- `/`
- `/topics`
- `/login`
- `/contact`
- `/notices`
- `/terms`
- `/privacy`
- `/this-page-should-not-exist` - 404 화면 확인

실패 시 확인할 항목:

- GitHub Secrets
- 운영 도메인 접속 상태
- Supabase 환경변수
- Playwright `E2E_BASE_URL`
- Vercel 배포 상태
- Desktop/Mobile project 중 어느 쪽에서 실패했는지

404/error 화면 점검:

- 전역 404 화면이 추가되어 없는 주소 접근 시 “페이지를 찾을 수 없습니다” 안내가 표시됩니다.
- 전역 오류 화면이 추가되어 일반 오류 상황에서 raw error 메시지를 노출하지 않고 “문제가 발생했습니다” 안내와 다시 시도 버튼을 표시합니다.

상태: 운영 사이트 기준 기대 결과 `16 passed`

## 14. 최종 런칭 체크

런칭 전 최소 확인 목록:

```txt
[ ] Web CI 성공
[ ] Production Smoke Test 성공(Desktop/Mobile 총 16 passed)
[ ] Vercel Production Ready
[ ] https://metropolisagora.com 접속
[ ] Supabase Auth URL 설정
[ ] Resend SMTP 설정
[ ] 회원가입/이메일 인증
[ ] 로그인/로그아웃
[ ] 비밀번호 재설정
[ ] 주제 참여/관전
[ ] 발언/댓글/이미지
[ ] 신고/관리자 처리
[ ] 문의 접수/관리자 처리
[ ] 공지 조회
[ ] 다크/라이트 모드
[ ] 404/error 화면
[ ] 모바일 smoke test
[ ] 모바일 수동 화면
```

## 15. 기록란

수동 테스트를 실행한 뒤 아래에 결과를 기록합니다.

```txt
테스트 일시:
테스트한 배포 URL:
테스터:
GitHub Actions run:
Vercel deployment:
Supabase project:

특이사항:
-

후속 조치:
-
```
