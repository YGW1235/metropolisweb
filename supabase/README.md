# Supabase 운영 메모

이 폴더는 Metropolis Web 프로젝트의 Supabase DB 구조, RLS 정책, RPC 함수, Storage 설정, 운영 패치를 기록합니다.

## 목적

- 수동으로 만든 Supabase SQL 보관
- 새 Supabase 프로젝트 생성 시 DB 구조 재현
- RLS 정책과 RPC 함수 변경 이력 관리
- 배포 전 DB 변경사항 확인
- 운영 중 실행한 패치 추적

## 적용 순서

새 Supabase 프로젝트를 구성할 때는 `migrations`를 순서대로 적용한 뒤, 필요한 `patches`를 번호 순서대로 적용합니다. 기존 운영 DB에는 이미 적용된 SQL을 중복 실행하지 않습니다.

### migrations

1. `001_profiles.sql`
2. `002_topics.sql`
3. `003_participants.sql`
4. `004_posts_comments.sql`
5. `005_reports_moderation.sql`
6. `006_notices.sql`
7. `007_olive.sql`
8. `008_storage.sql`

### patches

현재 운영 기능 보강에 사용한 패치:

- `001_harden_rls.sql`
- `002_public_anonymous_read_rpc.sql`
- `003_remove_public_raw_debate_reads.sql`
- `004_report_moderation_audit.sql`
- `005_user_suspension.sql`
- `006_admin_users_read_policy.sql`
- `007_admin_activity_logs.sql`
- `008_fix_join_topic_side_index.sql`
- `009_admin_topic_stats.sql`
- `010_fix_admin_topic_stats_ambiguous_columns.sql`
- `011_notice_view_count.sql`
- `012_contact_inquiries.sql`
- `013_account_deletion_request.sql`
- `014_admin_account_security.sql`
- `015_fix_admin_security_status_return_type.sql`

## 현재 사용하는 주요 테이블

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

## 현재 사용하는 주요 RPC 함수

- `handle_new_user`
- `is_admin`
- `is_topic_participant`
- `join_topic`
- `get_public_topic_participant_counts`
- `get_public_debate_posts`
- `get_public_debate_post`
- `get_public_debate_comments_by_post`
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
- `update_my_profile`
- `water_olive`
- `log_admin_activity`

## Auth 운영 설정

Supabase Dashboard에서 아래 경로를 확인합니다.

```txt
Authentication -> URL Configuration
```

Site URL:

```txt
https://www.metropolisagora.com
```

Redirect URLs:

```txt
https://www.metropolisagora.com/**
https://metropolisagora.com/**
https://metropolisweb.vercel.app/**
http://localhost:3000/**
```

주의:

- 운영 도메인을 바꾸면 `NEXT_PUBLIC_SITE_URL`, Supabase Site URL, Redirect URLs를 함께 확인합니다.
- 이메일 인증과 비밀번호 재설정 링크는 Redirect URL 허용 목록에 영향을 받습니다.

## Email Templates와 SMTP

- Supabase Auth Email Templates는 Supabase Dashboard에서 수정합니다.
- 회원가입 인증, 비밀번호 재설정, 이메일 변경 등 Auth 메일 템플릿은 운영 도메인 기준 문구로 관리합니다.
- Supabase Auth SMTP는 Resend SMTP를 사용합니다.
- Resend 발신 도메인 인증 상태를 주기적으로 확인합니다.

앱의 문의 알림 메일은 Supabase Auth SMTP와 별개로 Resend API를 사용합니다. 관련 환경변수:

```txt
RESEND_API_KEY
CONTACT_EMAIL_FROM
CONTACT_NOTIFY_TO
```

secret 값은 이 문서에 기록하지 않습니다.

## Storage 설정

게시글 이미지 업로드에는 아래 버킷을 사용합니다.

```txt
debate-images
```

현재 앱 제한:

```txt
허용 형식: JPG, PNG, WEBP
최대 크기: 5MB
```

`008_storage.sql`은 다음 정책을 포함합니다.

- 공개 이미지 읽기
- 인증 사용자 이미지 업로드
- 작성자 본인 이미지 삭제

앱은 게시글 생성 후 이미지 업로드에 성공하면 `debate_posts.image_url`, `debate_posts.image_path`에 값을 저장합니다. 게시글 삭제 시 연결된 이미지를 Storage에서 제거합니다.

## RLS 운영 원칙

- 공개 화면은 공개용 RPC와 제한된 read policy를 사용합니다.
- 일반 유저는 본인 프로필과 본인 참여/신고/문의 범위만 조회합니다.
- 토론 게시글/댓글 원본 테이블의 공개 raw read는 제한합니다.
- 관리자 기능은 `is_admin()` 또는 서버의 관리자 확인 로직과 함께 사용합니다.
- service role key는 프론트엔드 앱 환경변수로 사용하지 않습니다.

## 운영 중 SQL 실행 주의사항

운영 DB에 다시 실행하기 전에는 반드시 내용을 확인합니다.

특히 주의할 구문:

- `drop policy`
- `drop function`
- `alter table`
- `delete`
- 조건 없는 `update`
- Storage policy 변경

권장 절차:

```txt
1. SQL을 supabase/patches에 기록
2. 코드와 SQL 내용을 함께 검토
3. Supabase SQL Editor에서 실행
4. 주요 기능을 수동 테스트
5. Git commit
```

## 배포 전 Supabase 체크

- Auth Site URL이 `https://www.metropolisagora.com`인지
- Redirect URLs가 운영/WWW/Vercel/localhost를 포함하는지
- Email Templates 문구가 운영 도메인 기준인지
- Resend SMTP 연결이 정상인지
- `debate-images` bucket이 존재하는지
- RLS policy가 임의로 비활성화되지 않았는지
- 관리자 계정이 `role = admin`, `status = active`인지
- active 관리자 계정이 최소 1개 이상인지
