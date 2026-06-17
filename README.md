# Metropolis Web

역할 기반 토론 플랫폼 MVP입니다.

운영자가 토론 주제를 만들고, 유저는 주제에 참가하면 찬성 또는 반대 역할을 자동으로 배정받습니다. 유저는 자신에게 배정된 역할에 맞춰 게시글과 댓글을 작성하며, 부적절한 게시글이나 댓글은 신고할 수 있습니다. 관리자는 주제와 신고를 관리할 수 있습니다.

## 배포 주소

```txt
https://metropolisweb.vercel.app
```

## 주요 기능

### 사용자 기능

* 이메일 기반 회원가입 / 로그인 / 로그아웃
* 프로필 확인
* 닉네임 수정
* 토론 주제 목록 확인
* 토론 주제 상세 확인
* 주제 참가
* 찬성 / 반대 역할 자동 배정
* 역할 기반 게시글 작성
* 댓글 작성
* 게시글 / 댓글 신고
* 찬성 / 반대 / 전체 글 필터
* 모바일 화면 대응

### 관리자 기능

* 관리자 페이지 접근 제한
* 토론 주제 생성
* 토론 주제 수정
* 토론 주제 상태 변경
* 토론 주제 보관 처리
* 신고 목록 확인
* 신고 상태 변경
* 게시글 / 댓글 숨김 처리
* 신고 기각 처리

## 기술 스택

* Next.js
* React
* TypeScript
* Tailwind CSS
* Supabase Auth
* Supabase Postgres
* Supabase Row Level Security
* Vercel
* pnpm

## 프로젝트 구조

```txt
metropolisweb/
├─ apps/
│  └─ web/
│     ├─ app/
│     │  ├─ actions/
│     │  ├─ admin/
│     │  ├─ login/
│     │  ├─ me/
│     │  ├─ settings/
│     │  ├─ topics/
│     │  ├─ layout.tsx
│     │  └─ page.tsx
│     ├─ components/
│     ├─ lib/
│     │  ├─ supabase/
│     │  ├─ auth.ts
│     │  └─ datetime.ts
│     ├─ public/
│     ├─ .env.local
│     ├─ package.json
│     └─ next.config.ts
├─ README.md
└─ CHANGELOG.md
```

## 로컬 실행 방법

### 1. 저장소 클론

```bash
git clone https://github.com/본인아이디/metropolisweb.git
cd metropolisweb
```

### 2. 의존성 설치

```bash
cd apps/web
pnpm install
```

### 3. 환경변수 설정

`apps/web/.env.local` 파일을 생성합니다.

```env
NEXT_PUBLIC_SUPABASE_URL=본인_SUPABASE_PROJECT_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=본인_SUPABASE_PUBLISHABLE_KEY
```

주의: 아래 키는 절대 넣지 않습니다.

```env
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_SECRET_KEY=
```

현재 프로젝트는 Supabase RLS와 DB 함수 기반으로 동작하므로 service role key가 필요하지 않습니다.

### 4. 개발 서버 실행

```bash
pnpm dev
```

브라우저에서 접속합니다.

```txt
http://localhost:3000
```

## 빌드 확인

배포 전 로컬에서 production build를 확인합니다.

```bash
cd apps/web
pnpm build
pnpm start
```

브라우저에서 접속합니다.

```txt
http://localhost:3000
```

## Supabase 설정

이 프로젝트는 Supabase를 사용합니다.

필요한 주요 테이블은 다음과 같습니다.

```txt
profiles
topics
topic_participants
debate_posts
debate_comments
reports
```

주요 DB 함수는 다음과 같습니다.

```txt
handle_new_user
join_topic
create_debate_post
create_debate_comment
create_report
moderate_report
update_my_profile
is_admin
is_topic_participant
```

## Supabase Auth URL 설정

Supabase Dashboard에서 아래 경로로 이동합니다.

```txt
Authentication
→ URL Configuration
```

Site URL:

```txt
https://metropolisweb.vercel.app
```

Redirect URLs:

```txt
https://metropolisweb.vercel.app/**
http://localhost:3000/**
```

## 관리자 계정 설정

회원가입 후 Supabase SQL Editor에서 특정 계정을 admin으로 변경합니다.

```sql
update public.profiles
set role = 'admin'
where email = '관리자이메일@example.com';
```

관리자 계정 확인:

```sql
select id, email, display_name, role, status
from public.profiles
order by created_at desc;
```

## 주제 상태

토론 주제는 다음 상태를 가집니다.

```txt
draft
- 관리자 준비 상태
- 일반 유저에게 보이지 않음
- 참가 불가

open
- 일반 유저에게 보임
- 신규 참가 가능
- 글 / 댓글 작성 가능

active
- 일반 유저에게 보임
- 신규 참가 불가
- 기존 참가자만 토론 가능
- 글 / 댓글 작성 가능

closed
- 일반 유저에게 보임
- 신규 참가 불가
- 글 / 댓글 작성 불가
- 읽기용 상태

archived
- 관리자 보관 상태
- 일반 유저에게 보이지 않음
- 참가 / 작성 불가
```

## Vercel 배포

Vercel에서 GitHub 저장소를 Import합니다.

설정값:

```txt
Framework Preset:
Next.js

Root Directory:
apps/web

Install Command:
pnpm install

Build Command:
pnpm build

Output Directory:
비워두기
```

환경변수:

```env
NEXT_PUBLIC_SUPABASE_URL=본인_SUPABASE_PROJECT_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=본인_SUPABASE_PUBLISHABLE_KEY
```

Environment는 Production에 추가합니다. Preview 배포에서도 테스트하려면 Preview에도 같은 환경변수를 추가합니다.

## 배포 업데이트 방법

로컬에서 수정 후 빌드 확인:

```bash
cd apps/web
pnpm build
```

문제가 없으면 커밋 후 push합니다.

```bash
cd ../..
git add .
git commit -m "Update project"
git push
```

GitHub에 push하면 Vercel이 자동으로 Production 배포를 진행합니다.

## 기본 테스트 체크리스트

배포 후 아래 기능을 확인합니다.

```txt
[ ] 홈 접속
[ ] 회원가입
[ ] 로그인
[ ] 로그아웃
[ ] 내 계정 확인
[ ] 프로필 수정
[ ] 관리자 페이지 접근 제한
[ ] 관리자 주제 생성
[ ] 관리자 주제 수정
[ ] 관리자 주제 상태 변경
[ ] 일반 유저 주제 목록 확인
[ ] 일반 유저 주제 참가
[ ] 찬성 / 반대 역할 자동 배정
[ ] 토론방 입장
[ ] 게시글 작성
[ ] 댓글 작성
[ ] 찬성 / 반대 필터
[ ] 게시글 신고
[ ] 댓글 신고
[ ] 관리자 신고 확인
[ ] 관리자 숨김 처리
[ ] 모바일 화면 확인
```

## 보안 메모

* `.env.local`은 Git에 올리지 않습니다.
* Supabase secret key 또는 service role key를 프론트엔드 프로젝트에 넣지 않습니다.
* 일반 유저는 `role`, `status`를 직접 수정할 수 없습니다.
* 관리자 페이지는 서버에서 admin 권한을 확인합니다.
* 주요 데이터 변경은 Server Action과 Supabase DB 함수를 통해 처리합니다.
* 공개 테이블에는 RLS를 적용합니다.

## 현재 버전

```txt
v0.2.0
```

## 향후 개선 예정

* Supabase SQL migration 파일 정리
* 관리자 운영 문서 작성
* 유저 제재 기능 강화
* 신고 처리 이력 관리
* 토론 품질 개선 기능
* 실제 유저 테스트
* 커스텀 도메인 연결
* PWA 검토
