# Supabase SQL 감사 보고서

점검일: 2026-07-11

이 문서는 `supabase/migrations`, `supabase/patches`, `supabase/README.md`에 있는 repo 파일만 기준으로 점검한 결과입니다. 실제 운영 Supabase DB에는 이미 수동 보정되었거나 더 최신 정의가 적용되어 있을 수 있습니다. 점검과 후속 정리 과정에서 DB에 접속하지 않았고, SQL을 실행하지 않았습니다.

## 후속 조치 기록

- 2026-07-11: `supabase/migrations/005_reports_moderation.sql`, `supabase/migrations/007_olive.sql`의 Markdown 코드펜스 제거 완료.
- 2026-07-11: `supabase/migrations/003_participants.sql`, `supabase/patches/005_user_suspension.sql`의 구버전 `join_topic(p_topic_id uuid)` 정의를 canonical `join_topic(p_topic_id uuid, p_join_side text default 'auto')` 정의로 교체 완료.
- 2026-07-11: 운영 DB에 남아 있을 수 있는 legacy `join_topic(uuid)` overload 제거를 위해 `supabase/patches/016_drop_legacy_join_topic_overload.sql` 추가. 이 patch는 repo에 추가된 것이며, 운영 DB에 자동 적용된 것은 아닙니다.
- 실제 운영 DB 적용 전에는 Supabase Dashboard에서 현재 함수 정의와 정책 상태를 다시 확인해야 합니다.

## 요약

- `join_topic` 정의는 repo 기준으로 `p_join_side`, advisory lock, unique 충돌 재시도 로직을 포함하는 canonical 형태로 정리되었습니다.
- `migrations/005_reports_moderation.sql`, `migrations/007_olive.sql` 안에 남아 있던 Markdown 코드펜스는 제거되었습니다.
- 공개 토론 글/댓글 raw table read 정책은 migration에서 생성되고 `patches/003_remove_public_raw_debate_reads.sql`에서 제거됩니다. 전체 patch 순서가 지켜져야 현재 anonymous RPC 구조와 맞습니다.
- 운영 기능 컬럼과 테이블은 대부분 patch에 반영되어 있습니다. 다만 base migrations만으로는 현재 운영 스키마가 재현되지 않습니다.
- Storage의 `debate-images` bucket 및 public read/authenticated upload/author delete 정책은 repo SQL에 남아 있으며, 현재 이미지 업로드 의도와 대체로 일치합니다.

## 주요 조치 및 남은 확인

| 위험도 | 항목 | 발견 내용 | 추천 조치 |
| --- | --- | --- | --- |
| 낮음 | SQL 구문 오류 가능성 | `supabase/migrations/005_reports_moderation.sql`, `supabase/migrations/007_olive.sql`의 Markdown 코드펜스는 제거되었습니다. | 운영 DB 적용 전 SQL Editor 또는 별도 검증 환경에서 최종 구문 확인을 권장합니다. |
| 낮음 | `join_topic` 구버전 정의 잔존 | `migrations/003_participants.sql`과 `patches/005_user_suspension.sql`의 구버전 `join_topic(p_topic_id uuid)` 정의는 canonical 정의로 교체되었습니다. 운영 DB 잔존 overload 제거용 `016_drop_legacy_join_topic_overload.sql`도 추가되었습니다. | 운영 DB에서 현재 `join_topic` signature가 `join_topic(uuid, text)`인지, `join_topic(uuid)`가 제거되었는지 Supabase Dashboard에서 확인한 뒤 patch를 적용합니다. |
| 중간 | 공개 raw read 정책 순서 의존 | `migrations/004_posts_comments.sql`은 `public can read visible debate posts/comments` 정책을 생성합니다. `patches/003_remove_public_raw_debate_reads.sql`이 이를 제거해야 anonymous RPC 중심 구조가 됩니다. | 신규 DB 구성 시 `patches/002_public_anonymous_read_rpc.sql` 적용 후 `patches/003_remove_public_raw_debate_reads.sql`까지 반드시 적용합니다. 운영 DB에서는 정책 목록에서 raw table 공개 read가 남아 있지 않은지 확인합니다. |

## 나중에 정리 가능

| 위험도 | 항목 | 발견 내용 | 추천 조치 |
| --- | --- | --- | --- |
| 중간 | 최신 스키마가 patch에 분산 | `reports` 감사 컬럼, `profiles` 상태 변경 메타데이터, `admin_activity_logs`, `contact_inquiries`, `account_deletion_requests`, `notices.view_count`가 patch로 분산되어 있습니다. | 운영 DB가 안정된 뒤 current schema snapshot 또는 consolidated baseline migration을 따로 만들어 신규 환경 재현성을 높입니다. |
| 중간 | 함수 중복 정의 | `moderate_report`, `admin_set_user_status`, `get_admin_topic_stats`, `get_admin_security_status`가 여러 patch에서 재정의됩니다. 번호 순서가 맞으면 최신 정의가 남지만, 파일만 보면 canonical source가 분산되어 있습니다. | `supabase/README.md`나 별도 문서에 최신 함수 정의 파일을 명시합니다. 향후에는 오래된 patch를 건드리지 않고 새 patch로만 정정합니다. |
| 낮음 | `profiles` 상태 메타데이터 반복 추가 | `patches/005_user_suspension.sql`과 `patches/013_account_deletion_request.sql`이 `status_reason`, `status_changed_by`, `status_changed_at`를 모두 `add column if not exists`로 추가합니다. | 충돌은 낮지만, consolidated baseline 작성 시 한 곳으로 정리합니다. |
| 낮음 | anon select grant 잔존 | `migrations/004_posts_comments.sql`에는 `debate_posts`, `debate_comments`에 대한 anon select grant가 있습니다. RLS 정책이 제거되면 row는 노출되지 않지만, grant 자체는 남습니다. | 원본 테이블 공개 접근을 더 엄격히 하려면 향후 patch에서 anon select revoke 여부를 검토합니다. |
| 낮음 | topic view 관련 SQL 부재 | repo SQL에서 `topic_views`, topic `view_count` 같은 주제 조회수 전용 테이블/컬럼/함수는 확인되지 않았습니다. `get_admin_topic_stats`는 참여/글/댓글/신고 통계입니다. | 앱이 주제 조회수를 실제로 요구하게 되면 별도 schema와 RPC를 추가합니다. 현재 기능 요구가 없다면 그대로 둡니다. |

## `join_topic` 점검

### 정리된 정의

- `supabase/migrations/003_participants.sql`
  - `join_topic(p_topic_id uuid, p_join_side text default 'auto')` 정의로 정리되었습니다.
  - `topic_participants_topic_side_index_unique` 제약은 `(topic_id, assigned_side, side_index)` unique입니다.
  - `side_index`는 `max(side_index) + 1`로 계산하고, unique 충돌 시 제한된 횟수만 재시도합니다.
- `supabase/patches/005_user_suspension.sql`
  - 정지 유저 참가 방지 로직을 포함한 canonical `join_topic(p_topic_id uuid, p_join_side text default 'auto')` 정의로 정리되었습니다.
  - advisory lock과 unique 충돌 재시도 로직을 포함합니다.

### 최신으로 보이는 정의

- `supabase/patches/008_fix_join_topic_side_index.sql`
  - `drop function if exists public.join_topic(uuid);`
  - `drop function if exists public.join_topic(uuid, text);`
  - `join_topic(p_topic_id uuid, p_join_side text default 'auto')`
  - `p_join_side` 값으로 `auto`, `pro`, `con`을 처리합니다.
  - `pg_advisory_xact_lock(hashtext(p_topic_id::text))`로 topic 단위 transaction lock을 잡습니다.
  - `max(side_index) + 1` 계산과 `unique_violation` 재시도 루프가 있습니다.

### 위험 판단

repo 파일 기준으로는 구버전 `join_topic(p_topic_id uuid)` 정의를 정리했습니다. 다만 실제 운영 DB에는 예전 함수가 남아 있을 수 있으므로, SQL 적용 전 Supabase Dashboard에서 `join_topic(uuid)`와 `join_topic(uuid, text)` 상태를 확인해야 합니다.

## RLS 정책 점검

### 공개 read 정책

- `topics`
  - `migrations/002_topics.sql`과 `patches/001_harden_rls.sql`은 `Anyone can read public topics`를 유지합니다.
  - 공개 주제 목록/상세 조회가 필요한 구조라면 의도된 정책으로 보입니다.
- `topic_participants`
  - 현재 repo 기준으로 `public can read topic participants`를 새로 생성하는 SQL은 확인되지 않았습니다.
  - `migrations/003_participants.sql`, `patches/003_remove_public_raw_debate_reads.sql`에는 해당 정책을 제거하는 구문이 있습니다.
- `debate_posts`, `debate_comments`
  - `migrations/004_posts_comments.sql`에서 `public can read visible debate posts/comments`를 생성합니다.
  - `patches/002_public_anonymous_read_rpc.sql`이 공개용 익명 RPC를 추가합니다.
  - `patches/003_remove_public_raw_debate_reads.sql`이 raw table public read 정책을 제거합니다.

### anonymous RPC 구조와의 정합성

전체 patch 순서를 적용했다는 전제에서는 공개 토론 글/댓글 조회가 `get_public_debate_posts`, `get_public_debate_post`, `get_public_debate_comments`, `get_public_debate_comments_by_post`를 통해 익명 author label로 제공되는 구조와 맞습니다. 반대로 migration만 적용하거나 patch 003이 누락되면 raw table 공개 read 정책이 남아 `author_id` 같은 원본 컬럼 노출 위험이 있습니다.

## 함수 중복 정의

| 함수 | 정의 파일 | 최신으로 보이는 파일 | 메모 |
| --- | --- | --- | --- |
| `join_topic` | `migrations/003_participants.sql`, `patches/005_user_suspension.sql`, `patches/008_fix_join_topic_side_index.sql` | `patches/008_fix_join_topic_side_index.sql` | 최신은 `p_join_side`와 advisory lock 포함 |
| `create_debate_post` | `migrations/004_posts_comments.sql` | 동일 | 중복 정의는 확인되지 않음 |
| `create_debate_comment` | `migrations/004_posts_comments.sql` | 동일 | 중복 정의는 확인되지 않음 |
| `create_report` | `migrations/005_reports_moderation.sql` | 동일 | 코드펜스 제거 완료. SQL 실행 검증은 미수행 |
| `moderate_report` | `migrations/005_reports_moderation.sql`, `patches/004_report_moderation_audit.sql`, `patches/007_admin_activity_logs.sql` | `patches/007_admin_activity_logs.sql` | 최신은 moderation audit 컬럼과 admin activity log 기록 포함 |
| `admin_set_user_status` | `patches/005_user_suspension.sql`, `patches/007_admin_activity_logs.sql` | `patches/007_admin_activity_logs.sql` | 최신은 `user_moderation_logs`와 `admin_activity_logs` 모두 기록 |
| `get_admin_security_status` | `patches/014_admin_account_security.sql`, `patches/015_fix_admin_security_status_return_type.sql` | `patches/015_fix_admin_security_status_return_type.sql` | return type 정정용 최신 패치로 보임 |
| `get_public_debate_posts` | `patches/002_public_anonymous_read_rpc.sql` | 동일 | 익명 author label 제공 |
| `get_public_debate_comments` | `patches/002_public_anonymous_read_rpc.sql` | 동일 | topic 단위 댓글 조회 |
| `get_public_debate_comments_by_post` | `patches/002_public_anonymous_read_rpc.sql` | 동일 | post 단위 댓글 조회 |
| `get_admin_topic_stats` | `patches/009_admin_topic_stats.sql`, `patches/010_fix_admin_topic_stats_ambiguous_columns.sql` | `patches/010_fix_admin_topic_stats_ambiguous_columns.sql` | ambiguous column 수정용 최신 패치로 보임 |

## 테이블/컬럼 drift 점검

| 항목 | repo 반영 상태 | 판단 |
| --- | --- | --- |
| `reports.moderation_note` | `patches/004_report_moderation_audit.sql`에서 추가 | 반영됨. base migration에는 없음 |
| `reports.moderated_by` | `patches/004_report_moderation_audit.sql`에서 추가 | 반영됨. base migration에는 없음 |
| `reports.moderated_at` | `patches/004_report_moderation_audit.sql`에서 추가 | 반영됨. base migration에는 없음 |
| `profiles.status_reason` | `patches/005_user_suspension.sql`, `patches/013_account_deletion_request.sql`에서 추가 | 반영됨. 중복이지만 `if not exists`라 충돌 낮음 |
| `profiles.status_changed_by` | `patches/005_user_suspension.sql`, `patches/013_account_deletion_request.sql`에서 추가 | 반영됨 |
| `profiles.status_changed_at` | `patches/005_user_suspension.sql`, `patches/013_account_deletion_request.sql`에서 추가 | 반영됨 |
| `admin_activity_logs` | `patches/007_admin_activity_logs.sql`에서 생성 | 반영됨 |
| `contact_inquiries` | `patches/012_contact_inquiries.sql`에서 생성 | 반영됨. `admin_update_contact_inquiry`는 `log_admin_activity`에 의존하므로 patch 007 이후 적용 필요 |
| `account_deletion_requests` | `patches/013_account_deletion_request.sql`에서 생성 | 반영됨 |
| topic view 관련 | `topic_views`, topic 조회수 전용 컬럼/함수는 확인되지 않음 | 현재 repo 기준 미구현 또는 불필요 상태 |
| `notices.view_count` | `patches/011_notice_view_count.sql`에서 추가 | 반영됨. base migration에는 없음 |

## Storage 점검

`supabase/migrations/008_storage.sql`은 `debate-images` bucket을 생성/갱신합니다.

- bucket public: `true`
- file size limit: `5242880`
- allowed mime types: `image/jpeg`, `image/png`, `image/webp`
- `storage.objects` 정책:
  - `public can read debate images`: anon/authenticated select
  - `authenticated users can upload debate images`: authenticated insert
  - `authors can delete own debate images`: authenticated delete

업로드/삭제 정책은 `(storage.foldername(name))[2] = auth.uid()::text` 조건에 의존합니다. 앱의 실제 object path가 두 번째 경로 segment에 user id를 두는 규칙과 맞아야 합니다. 이 규칙이 바뀌면 Storage policy도 함께 수정해야 합니다.

## 추천 조치

### 실제 DB 적용 전 확인

Supabase Dashboard 또는 SQL Editor에서 실제 운영 DB를 확인한 뒤에만 SQL을 적용합니다. 최소 확인 항목:

- 현재 `public.join_topic` signature와 body
- `public.join_topic(uuid)`가 남아 있는지 여부
- `supabase/patches/016_drop_legacy_join_topic_overload.sql` 적용 필요 여부
- `topic_participants_topic_side_index_unique` 제약 존재 여부
- `debate_posts`, `debate_comments`, `topic_participants`의 public raw read policy 존재 여부
- `reports` moderation audit 컬럼 존재 여부
- `profiles` 상태 변경 메타데이터 컬럼 존재 여부
- `admin_activity_logs`, `contact_inquiries`, `account_deletion_requests` 존재 여부
- `notices.view_count` 존재 여부
- `debate-images` bucket과 `storage.objects` 정책

### 다음 SQL 정리 후보

1. `supabase/migrations/005_reports_moderation.sql`
   - 코드펜스 제거 완료. `create_report`, `moderate_report` 구문 검증은 별도 확인 필요
2. `supabase/migrations/007_olive.sql`
   - 코드펜스 제거 완료. `water_olive()` 구문 검증은 별도 확인 필요
3. `supabase/patches/008_fix_join_topic_side_index.sql`
   - 최신 canonical `join_topic`로 표시
4. `supabase/migrations/004_posts_comments.sql`와 `supabase/patches/003_remove_public_raw_debate_reads.sql`
   - raw public read 정책 생성/제거 흐름을 README에 더 명확히 기록
5. `supabase/patches/007_admin_activity_logs.sql`, `010_fix_admin_topic_stats_ambiguous_columns.sql`, `015_fix_admin_security_status_return_type.sql`
   - 최신 canonical 함수 정의 파일로 문서화

## 결론

repo 기준으로는 최신 운영 기능을 위한 patch들이 대체로 존재하며, Markdown 코드펜스와 구버전 `join_topic` 정의는 정리되었습니다. 여전히 RLS/관리자 함수는 patch 순서에 영향을 받습니다. 실제 운영 DB가 이미 정상일 수 있으므로, SQL을 재적용하기 전에는 Supabase Dashboard에서 현재 함수와 정책 상태를 먼저 확인해야 합니다.
