# Metropolis Web

역할 기반 토론 플랫폼 **Metropolis**의 웹 애플리케이션입니다. 사용자는 공개된 주제에 참여하거나 관전할 수 있고, 참여자는 아테나/포세이돈 진영 중 하나로 배정되어 발언과 댓글을 남깁니다. 운영자는 주제, 공지, 신고, 유저 상태, 문의, 운영 로그를 관리합니다.

## 운영 주소

```txt
https://metropolisagora.com
```

Vercel 기본 도메인은 운영 보조 주소로 유지합니다.

```txt
https://metropolisweb.vercel.app
```

## 현재 문서 기준

```txt
v0.3.0 후보
```

`apps/web/package.json`의 앱 버전은 현재 `0.2.0`입니다. 이 문서는 2026-07-10 기준 운영 기능과 설정을 정리합니다.

## 주요 기능

### 사용자 기능

- 이메일 회원가입, 로그인, 로그아웃
- Supabase Auth 이메일 인증
- 인증 메일 재발송
- 비밀번호 재설정
- 내 비밀번호 변경
- 내 계정 탈퇴 요청 및 처리
- 내 기록/프로필 확인
- 프로필 표시 이름 수정
- 주제 목록 조회
- 주제 상세 조회
- 토론방 입장
- 아테나/포세이돈 진영 참여
- 비참여 관전
- 발언 작성, 상세 조회, 삭제
- 댓글 작성, 삭제
- 게시글 이미지 첨부 및 상세 이미지 보기
- 게시글/댓글 신고
- 공지사항 목록 및 상세 조회
- 문의하기
- 이용약관/개인정보처리방침 페이지
- 다크모드/일반모드 전환
- 모바일 화면 대응

현재 일반 사용자용 발언 수정 화면은 문서화하지 않습니다. 확인된 구현은 발언 작성, 상세 조회, 삭제, 이미지 첨부입니다.

### 관리자 기능

- 관리자 대시보드
- 주제 생성, 수정, 상태 관리, 삭제 처리
- 공지 생성, 수정, 상태 관리, 삭제
- 신고 조회 및 처리
- 신고 대상 게시글/댓글 숨김 처리
- 신고 대상 작성자 정지/복구
- 유저 목록 조회 및 정지/복구
- 문의 조회 및 상태/메모 처리
- 관리자 활동 로그 확인
- 주제별 참가자/게시글/댓글/신고 통계
- 관리자 계정 보안 점검

### 운영 기능

- Next.js App Router 기반 웹 앱
- Tailwind CSS v4 기반 UI
- Supabase Auth, Postgres, Storage, RLS 사용
- `debate-images` 버킷 기반 이미지 업로드
- Vercel 배포
- Cloudflare 커스텀 도메인 연결
- Resend SMTP를 통한 Supabase Auth 메일 발송
- Resend API를 통한 문의 알림 메일 발송
- GitHub Actions Web CI
- pnpm monorepo
- `apps/web`가 메인 웹 앱

## 기술 스택

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS v4
- Supabase Auth/Postgres/Storage/RLS
- Resend
- Vercel
- Cloudflare
- GitHub Actions
- pnpm

## 프로젝트 구조

```txt
metropolisweb/
├─ .github/
│  └─ workflows/
│     └─ web-ci.yml
├─ apps/
│  └─ web/
│     ├─ app/
│     │  ├─ actions/
│     │  ├─ admin/
│     │  ├─ contact/
│     │  ├─ forgot-password/
│     │  ├─ login/
│     │  ├─ me/
│     │  ├─ notices/
│     │  ├─ reset-password/
│     │  ├─ settings/
│     │  ├─ topics/
│     │  ├─ globals.css
│     │  ├─ layout.tsx
│     │  └─ page.tsx
│     ├─ components/
│     ├─ lib/
│     ├─ public/
│     ├─ package.json
│     └─ next.config.ts
├─ docs/
├─ supabase/
├─ pnpm-lock.yaml
├─ pnpm-workspace.yaml
├─ README.md
└─ CHANGELOG.md
```

## 로컬 실행

### 1. 저장소 클론

```bash
git clone https://github.com/YGW1235/metropolisweb.git
cd metropolisweb
```

### 2. 의존성 설치

repo 루트에서 설치합니다.

```bash
pnpm install --frozen-lockfile
```

### 3. 환경변수 설정

`apps/web/.env.local` 파일에 필요한 값을 설정합니다. secret 값은 문서나 Git에 기록하지 않습니다.

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SITE_URL=
RESEND_API_KEY=
CONTACT_EMAIL_FROM=
CONTACT_NOTIFY_TO=
```

| 변수 | 설명 |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key |
| `NEXT_PUBLIC_SITE_URL` | 운영 도메인. 운영 환경은 `https://metropolisagora.com` |
| `RESEND_API_KEY` | 문의 알림 메일 발송용 Resend API key |
| `CONTACT_EMAIL_FROM` | 문의 알림 메일 발신 주소 |
| `CONTACT_NOTIFY_TO` | 문의 알림을 받을 운영자 주소 |

프론트엔드 앱에는 Supabase service role key를 넣지 않습니다.

### 4. 개발 서버 실행

```bash
cd apps/web
pnpm dev
```

로컬 접속 주소:

```txt
http://localhost:3000
```

## 빌드 확인

```bash
cd apps/web
pnpm build
```

## GitHub Actions

`.github/workflows/web-ci.yml`은 다음 상황에서 실행됩니다.

- `main` 브랜치 push
- pull request

CI는 Node.js 22와 pnpm을 사용합니다. 의존성 설치는 repo 루트에서 `pnpm install --frozen-lockfile`로 실행하고, 빌드는 `apps/web`에서 `pnpm build`로 실행합니다.

Build step에는 다음 GitHub Secrets가 필요합니다.

```txt
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
NEXT_PUBLIC_SITE_URL
```

## Supabase 운영 설정

### Auth URL

Supabase Dashboard의 `Authentication -> URL Configuration`에서 설정합니다.

Site URL:

```txt
https://metropolisagora.com
```

Redirect URLs:

```txt
https://metropolisagora.com/**
https://www.metropolisagora.com/**
https://metropolisweb.vercel.app/**
http://localhost:3000/**
```

### Email

- Email Templates는 Supabase Dashboard에서 수정합니다.
- Supabase Auth 메일은 Resend SMTP를 사용합니다.
- 비밀번호 재설정과 이메일 인증 링크는 `NEXT_PUBLIC_SITE_URL`과 Supabase Redirect URL 설정을 함께 확인합니다.

### Storage

게시글 이미지 업로드에는 Supabase Storage 버킷을 사용합니다.

```txt
debate-images
```

현재 앱의 이미지 제한:

```txt
허용 형식: JPG, PNG, WEBP
최대 크기: 5MB
```

## 주요 Supabase 리소스

주요 테이블:

- `profiles`
- `topics`
- `topic_participants`
- `debate_posts`
- `debate_comments`
- `reports`
- `notices`
- `olive_trees`
- `olive_watering_logs`
- `user_moderation_logs`
- `admin_activity_logs`
- `contact_inquiries`
- `account_deletion_requests`

주요 RPC:

- `join_topic`
- `create_debate_post`
- `create_debate_comment`
- `delete_my_debate_comment`
- `create_report`
- `moderate_report`
- `admin_set_user_status`
- `admin_set_report_target_author_status`
- `get_admin_topic_stats`
- `get_admin_security_status`
- `create_contact_inquiry`
- `admin_update_contact_inquiry`
- `request_account_deletion`
- `water_olive`

## Vercel 배포

Vercel 프로젝트 설정:

```txt
Framework Preset: Next.js
Root Directory: apps/web
Install Command: pnpm install
Build Command: pnpm build
Output Directory: 비워두기
```

Vercel 환경변수에는 README의 환경변수 목록을 Production 기준으로 설정합니다. Preview 배포를 사용할 경우 Preview 환경에도 동일한 공개 키와 사이트 URL 정책을 맞춥니다.

Cloudflare에서는 `metropolisagora.com`과 필요한 경우 `www.metropolisagora.com`이 Vercel 도메인으로 연결되도록 DNS를 관리합니다.

## 관리자 계정 설정

회원가입과 이메일 인증 후 Supabase SQL Editor에서 특정 계정을 관리자 role로 변경합니다.

```sql
update public.profiles
set role = 'admin'
where email = '관리자이메일@example.com';
```

관리자 계정은 `profiles.status = 'active'` 상태여야 합니다.

## 운영 체크리스트

- GitHub Actions Web CI 성공 확인
- Vercel 배포 상태 `Ready` 확인
- `https://metropolisagora.com` 접속 확인
- Supabase Auth Site URL과 Redirect URLs 확인
- Resend SMTP 설정 확인
- Vercel 환경변수 확인
- 회원가입/이메일 인증/로그인 확인
- 비밀번호 재설정 확인
- 주제 참여/관전/발언/댓글/이미지 확인
- 신고와 관리자 숨김 처리 확인
- 문의 접수와 관리자 처리 확인
- 다크모드/일반모드 확인
- 모바일 화면 확인

자세한 운영 절차는 `docs/admin-guide.md`, 런칭 점검 항목은 `docs/launch-test-result.md`를 참고합니다.

## 보안 메모

- `.env.local`은 Git에 올리지 않습니다.
- secret 값은 문서, 이슈, PR, 커밋 메시지에 적지 않습니다.
- Supabase service role key는 프론트엔드 앱 환경변수로 사용하지 않습니다.
- 관리자 페이지는 서버에서 admin 권한과 active 상태를 확인합니다.
- 주요 데이터 변경은 Server Action과 Supabase RLS/RPC를 통해 처리합니다.
- 신고 처리와 유저 정지/복구는 관리자 활동 로그를 함께 확인합니다.
