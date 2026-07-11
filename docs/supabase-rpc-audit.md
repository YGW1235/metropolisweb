# Supabase RPC Signature/Grant 감사

점검일: 2026-07-11

이 문서는 `apps/web`, `supabase/migrations`, `supabase/patches`에 있는 repo 파일만 기준으로 점검한 결과입니다. 운영 Supabase DB에는 수동 적용된 변경이나 더 최신 함수 정의가 있을 수 있습니다. 이번 점검에서는 앱 코드와 SQL 파일을 수정하지 않았고, DB에 접속하거나 SQL을 실행하지 않았습니다.

## 요약

- `apps/web`에서 발견한 `.rpc(...)` 호출: 21건, 고유 RPC 20개
- `supabase/migrations`, `supabase/patches`에서 발견한 `create or replace function public.*` 정의: 34건
- `grant execute on function public.*` 구문: 37건
- repo 기준으로 앱에서 호출하는 RPC 중 SQL 정의가 없는 함수는 발견되지 않았습니다.
- repo 기준으로 앱에서 호출하는 RPC 중 grant가 없는 함수는 발견되지 않았습니다.
- 높은 위험도 불일치는 발견되지 않았습니다.
- 별도 확인 필요: public 화면 일부가 아직 `topic_participants`를 직접 조회합니다. 이는 RPC signature 문제는 아니지만, `017_enforce_private_debate_raw_reads.sql` 적용 후 anonymous participant count 화면에 영향을 줄 수 있습니다.

## 앱 RPC 호출 목록

| RPC | 호출 위치 | 넘기는 인자 | 타입 추정 | 반환값 사용 |
| --- | --- | --- | --- | --- |
| `request_account_deletion` | `apps/web/app/actions/account.ts:53` | `p_reason` | `text \| null` | `error`만 확인 후 sign out |
| `create_contact_inquiry` | `apps/web/app/actions/contact.ts:63` | `p_email`, `p_category`, `p_title`, `p_content` | `text` | 반환 row를 문의 알림 메일 payload에 사용 |
| `admin_update_contact_inquiry` | `apps/web/app/actions/contact.ts:110` | `p_inquiry_id`, `p_status`, `p_admin_note` | `uuid`, `text`, `text \| null` | `error`만 확인 |
| `moderate_report` | `apps/web/app/actions/moderation.ts:35` | `p_report_id`, `p_action`, `p_note` | `uuid`, `text`, `text \| null` | `error`만 확인 |
| `water_olive` | `apps/web/app/actions/olive.ts:64` | 없음 | 없음 | table 결과 첫 row 사용 |
| `join_topic` | `apps/web/app/actions/participants.ts:30` | `p_topic_id` | `uuid` | `error`만 확인. `p_join_side`는 default 사용 |
| `create_debate_post` | `apps/web/app/actions/posts.ts:167` | `p_topic_id`, `p_title`, `p_content` | `uuid`, `text`, `text` | 반환 row의 `id`를 이미지 업로드/redirect에 사용 |
| `create_debate_comment` | `apps/web/app/actions/posts.ts:264` | `p_post_id`, `p_content` | `uuid`, `text` | `error`만 확인 |
| `delete_my_debate_comment` | `apps/web/app/actions/posts.ts:384` | `p_comment_id` | `uuid` | `error`만 확인 |
| `create_report` | `apps/web/app/actions/reports.ts:45` | `p_target_type`, `p_target_id`, `p_reason`, `p_detail` | `text`, `uuid`, `text`, `text \| null` | `error`만 확인 |
| `join_topic` | `apps/web/app/actions/topics.ts:147` | `p_topic_id`, `p_join_side` | `uuid`, `'auto' \| 'pro' \| 'con'` | 반환 row의 `assigned_side` 사용 |
| `admin_set_report_target_author_status` | `apps/web/app/actions/user-moderation.ts:56` | `p_report_id`, `p_status`, `p_reason` | `uuid`, `text`, `text \| null` | `error`만 확인 |
| `admin_set_user_status` | `apps/web/app/actions/user-moderation.ts:93` | `p_user_id`, `p_status`, `p_reason` | `uuid`, `text`, `text \| null` | `error`만 확인 |
| `get_admin_security_status` | `apps/web/app/admin/security/page.tsx:67` | 없음 | 없음 | table/single object 첫 row를 관리자 보안 카드에 사용 |
| `get_admin_topic_stats` | `apps/web/app/admin/stats/page.tsx:59` | 없음 | 없음 | table rows를 통계 카드/목록에 사용 |
| `get_public_notice` | `apps/web/app/notices/[noticeId]/page.tsx:66` | `p_notice_id` | `uuid` | table 첫 row를 공지 상세에 사용 |
| `get_public_topic_participant_counts` | `apps/web/app/topics/[topicId]/debate/page.tsx:396` | `p_topic_id` | `uuid` | table 첫 row의 `pro_count`, `con_count` 사용 |
| `get_public_debate_posts` | `apps/web/app/topics/[topicId]/debate/page.tsx:410` | `p_topic_id`, `p_side` | `uuid`, `text \| null` | rows를 토론 글 목록/페이지네이션에 사용 |
| `get_public_debate_post` | `apps/web/app/topics/[topicId]/debate/[postId]/page.tsx:459` | `p_post_id` | `uuid` | table 첫 row를 글 상세에 사용 |
| `get_public_debate_comments_by_post` | `apps/web/app/topics/[topicId]/debate/[postId]/page.tsx:474` | `p_post_id` | `uuid` | rows를 댓글 목록에 사용 |
| `log_admin_activity` | `apps/web/lib/admin-log.ts:32` | `p_action`, `p_target_type`, `p_target_id`, `p_summary`, `p_metadata` | `text`, `text`, `uuid \| null`, `text \| null`, `jsonb` | 실패 시 console error만 기록 |

## SQL 함수 정의 목록

아래 목록은 repo 안 정의 occurrence 기준입니다. 같은 함수가 migration/patch에서 여러 번 재정의되는 경우도 각각 포함했습니다.

| 함수 | 위치 | 인자 | 반환 |
| --- | --- | --- | --- |
| `set_updated_at` | `supabase/migrations/001_profiles.sql:22` | 없음 | `trigger` |
| `handle_new_user` | `supabase/migrations/001_profiles.sql:39` | 없음 | `trigger` |
| `is_admin` | `supabase/migrations/001_profiles.sql:67` | 없음 | `boolean` |
| `update_my_profile` | `supabase/migrations/001_profiles.sql:83` | `p_display_name text` | `public.profiles` |
| `is_topic_participant` | `supabase/migrations/003_participants.sql:33` | `p_topic_id uuid` | `boolean` |
| `join_topic` | `supabase/migrations/003_participants.sql:51` | `p_topic_id uuid`, `p_join_side text default 'auto'` | `public.topic_participants` |
| `create_debate_post` | `supabase/migrations/004_posts_comments.sql:80` | `p_topic_id uuid`, `p_title text`, `p_content text` | `public.debate_posts` |
| `create_debate_comment` | `supabase/migrations/004_posts_comments.sql:163` | `p_post_id uuid`, `p_content text` | `public.debate_comments` |
| `delete_my_debate_comment` | `supabase/migrations/004_posts_comments.sql:252` | `p_comment_id uuid` | `public.debate_comments` |
| `create_report` | `supabase/migrations/005_reports_moderation.sql:57` | `p_target_type text`, `p_target_id uuid`, `p_reason text`, `p_detail text default null` | `public.reports` |
| `moderate_report` | `supabase/migrations/005_reports_moderation.sql:177` | `p_report_id uuid`, `p_action text`, `p_note text default null` | `public.reports` |
| `water_olive` | `supabase/migrations/007_olive.sql:42` | 없음 | table: olive counters |
| `get_public_topic_participant_counts` | `supabase/patches/002_public_anonymous_read_rpc.sql:14` | `p_topic_id uuid` | table: counts |
| `get_public_debate_posts` | `supabase/patches/002_public_anonymous_read_rpc.sql:50` | `p_topic_id uuid`, `p_side text default null` | table: public post rows |
| `get_public_debate_post` | `supabase/patches/002_public_anonymous_read_rpc.sql:113` | `p_post_id uuid` | table: public post row |
| `get_public_debate_comments` | `supabase/patches/002_public_anonymous_read_rpc.sql:169` | `p_topic_id uuid` | table: public comment rows |
| `get_public_debate_comments_by_post` | `supabase/patches/002_public_anonymous_read_rpc.sql:226` | `p_post_id uuid` | table: public comment rows |
| `moderate_report` | `supabase/patches/004_report_moderation_audit.sql:18` | `p_report_id uuid`, `p_action text`, `p_note text default null` | `public.reports` |
| `admin_set_user_status` | `supabase/patches/005_user_suspension.sql:76` | `p_user_id uuid`, `p_status text`, `p_reason text default null` | `public.profiles` |
| `admin_set_report_target_author_status` | `supabase/patches/005_user_suspension.sql:170` | `p_report_id uuid`, `p_status text`, `p_reason text default null` | `public.profiles` |
| `join_topic` | `supabase/patches/005_user_suspension.sql:236` | `p_topic_id uuid`, `p_join_side text default 'auto'` | `public.topic_participants` |
| `log_admin_activity` | `supabase/patches/007_admin_activity_logs.sql:48` | `p_action text`, `p_target_type text`, `p_target_id uuid default null`, `p_summary text default null`, `p_metadata jsonb default '{}'::jsonb` | `public.admin_activity_logs` |
| `moderate_report` | `supabase/patches/007_admin_activity_logs.sql:103` | `p_report_id uuid`, `p_action text`, `p_note text default null` | `public.reports` |
| `admin_set_user_status` | `supabase/patches/007_admin_activity_logs.sql:231` | `p_user_id uuid`, `p_status text`, `p_reason text default null` | `public.profiles` |
| `join_topic` | `supabase/patches/008_fix_join_topic_side_index.sql:4` | `p_topic_id uuid`, `p_join_side text default 'auto'` | `public.topic_participants` |
| `get_admin_topic_stats` | `supabase/patches/009_admin_topic_stats.sql:6` | 없음 | table: topic stats |
| `get_admin_topic_stats` | `supabase/patches/010_fix_admin_topic_stats_ambiguous_columns.sql:1` | 없음 | table: topic stats |
| `get_public_notice` | `supabase/patches/011_notice_view_count.sql:12` | `p_notice_id uuid` | table: notice detail |
| `create_contact_inquiry` | `supabase/patches/012_contact_inquiries.sql:109` | `p_email text`, `p_category text`, `p_title text`, `p_content text` | `public.contact_inquiries` |
| `admin_update_contact_inquiry` | `supabase/patches/012_contact_inquiries.sql:192` | `p_inquiry_id uuid`, `p_status text`, `p_admin_note text default null` | `public.contact_inquiries` |
| `request_account_deletion` | `supabase/patches/013_account_deletion_request.sql:64` | `p_reason text default null` | `public.profiles` |
| `get_admin_security_status` | `supabase/patches/014_admin_account_security.sql:6` | 없음 | table: admin security status |
| `get_admin_security_status` | `supabase/patches/015_fix_admin_security_status_return_type.sql:1` | 없음 | table: admin security status |
| `join_topic` | `supabase/patches/016_drop_legacy_join_topic_overload.sql:10` | `p_topic_id uuid`, `p_join_side text default 'auto'` | `public.topic_participants` |

## Grant Execute 목록

| 함수 | 위치 | signature | role |
| --- | --- | --- | --- |
| `is_admin` | `supabase/migrations/001_profiles.sql:127` | `()` | `authenticated` |
| `update_my_profile` | `supabase/migrations/001_profiles.sql:128` | `(text)` | `authenticated` |
| `is_topic_participant` | `supabase/migrations/003_participants.sql:223` | `(uuid)` | `authenticated` |
| `join_topic` | `supabase/migrations/003_participants.sql:224` | `(uuid, text)` | `authenticated` |
| `create_debate_post` | `supabase/migrations/004_posts_comments.sql:401` | `(uuid, text, text)` | `authenticated` |
| `create_debate_comment` | `supabase/migrations/004_posts_comments.sql:402` | `(uuid, text)` | `authenticated` |
| `delete_my_debate_comment` | `supabase/migrations/004_posts_comments.sql:403` | `(uuid)` | `authenticated` |
| `create_report` | `supabase/migrations/005_reports_moderation.sql:295` | `(text, uuid, text, text)` | `authenticated` |
| `moderate_report` | `supabase/migrations/005_reports_moderation.sql:296` | `(uuid, text, text)` | `authenticated` |
| `water_olive` | `supabase/migrations/007_olive.sql:139` | `()` | `authenticated` |
| `get_public_topic_participant_counts` | `supabase/patches/002_public_anonymous_read_rpc.sql:277` | `(uuid)` | `anon, authenticated` |
| `get_public_debate_posts` | `supabase/patches/002_public_anonymous_read_rpc.sql:278` | `(uuid, text)` | `anon, authenticated` |
| `get_public_debate_post` | `supabase/patches/002_public_anonymous_read_rpc.sql:279` | `(uuid)` | `anon, authenticated` |
| `get_public_debate_comments` | `supabase/patches/002_public_anonymous_read_rpc.sql:280` | `(uuid)` | `anon, authenticated` |
| `get_public_debate_comments_by_post` | `supabase/patches/002_public_anonymous_read_rpc.sql:281` | `(uuid)` | `anon, authenticated` |
| `moderate_report` | `supabase/patches/004_report_moderation_audit.sql:114` | `(uuid, text, text)` | `authenticated` |
| `admin_set_user_status` | `supabase/patches/005_user_suspension.sql:369` | `(uuid, text, text)` | `authenticated` |
| `admin_set_report_target_author_status` | `supabase/patches/005_user_suspension.sql:372` | `(uuid, text, text)` | `authenticated` |
| `join_topic` | `supabase/patches/005_user_suspension.sql:375` | `(uuid, text)` | `authenticated` |
| `log_admin_activity` | `supabase/patches/007_admin_activity_logs.sql:96` | `(text, text, uuid, text, jsonb)` | `authenticated` |
| `moderate_report` | `supabase/patches/007_admin_activity_logs.sql:224` | `(uuid, text, text)` | `authenticated` |
| `admin_set_user_status` | `supabase/patches/007_admin_activity_logs.sql:347` | `(uuid, text, text)` | `authenticated` |
| `join_topic` | `supabase/patches/008_fix_join_topic_side_index.sql:135` | `(uuid, text)` | `authenticated` |
| `get_admin_topic_stats` | `supabase/patches/009_admin_topic_stats.sql:98` | `()` | `authenticated` |
| `get_admin_topic_stats` | `supabase/patches/010_fix_admin_topic_stats_ambiguous_columns.sql:93` | `()` | `authenticated` |
| `get_public_notice` | `supabase/patches/011_notice_view_count.sql:49` | `(uuid)` | `anon, authenticated` |
| `create_contact_inquiry` | `supabase/patches/012_contact_inquiries.sql:250` | `(text, text, text, text)` | `anon, authenticated` |
| `admin_update_contact_inquiry` | `supabase/patches/012_contact_inquiries.sql:252` | `(uuid, text, text)` | `authenticated` |
| `request_account_deletion` | `supabase/patches/013_account_deletion_request.sql:130` | `(text)` | `authenticated` |
| `get_admin_security_status` | `supabase/patches/014_admin_account_security.sql:99` | `()` | `authenticated` |
| `get_admin_security_status` | `supabase/patches/015_fix_admin_security_status_return_type.sql:94` | `()` | `authenticated` |
| `join_topic` | `supabase/patches/016_drop_legacy_join_topic_overload.sql:141` | `(uuid, text)` | `authenticated` |
| `get_public_topic_participant_counts` | `supabase/patches/017_enforce_private_debate_raw_reads.sql:35` | `(uuid)` | `anon, authenticated` |
| `get_public_debate_posts` | `supabase/patches/017_enforce_private_debate_raw_reads.sql:38` | `(uuid, text)` | `anon, authenticated` |
| `get_public_debate_post` | `supabase/patches/017_enforce_private_debate_raw_reads.sql:41` | `(uuid)` | `anon, authenticated` |
| `get_public_debate_comments` | `supabase/patches/017_enforce_private_debate_raw_reads.sql:44` | `(uuid)` | `anon, authenticated` |
| `get_public_debate_comments_by_post` | `supabase/patches/017_enforce_private_debate_raw_reads.sql:47` | `(uuid)` | `anon, authenticated` |

## 불일치/확인 필요 항목

| 위험도 | 항목 | 내용 | 추천 조치 |
| --- | --- | --- | --- |
| 높음 | 없음 | 앱에서 호출하는 RPC 기준으로 definition/grant/signature 불일치는 repo에서 발견되지 않았습니다. | 운영 DB에서 동일하게 적용되어 있는지 Dashboard에서 확인합니다. |
| 중간 | public 화면의 raw participant count 조회 | `apps/web/app/page.tsx`와 `apps/web/app/topics/[topicId]/page.tsx`는 `topic_participants`를 직접 조회해 participant count를 계산합니다. 이는 RPC mismatch는 아니지만, `017_enforce_private_debate_raw_reads.sql` 적용 후 anon raw read가 막히면 공개 화면 count가 비거나 실패할 수 있습니다. | 별도 앱/SQL 작업에서 `get_public_topic_participant_counts` 재사용 또는 여러 topic count를 반환하는 공개 RPC 도입을 검토합니다. |
| 중간 | 중복 함수 정의의 patch 순서 의존 | `join_topic`, `moderate_report`, `admin_set_user_status`, `get_admin_topic_stats`, `get_admin_security_status`는 여러 파일에서 재정의됩니다. signature는 맞지만 최신 정의는 patch 순서에 의존합니다. | 운영 DB의 실제 함수 body와 signature를 Dashboard에서 확인합니다. fresh setup은 patch 번호 순서 적용을 유지합니다. |
| 낮음 | `join_topic` default 인자 사용 | `apps/web/app/actions/participants.ts`는 `p_join_side` 없이 `p_topic_id`만 전달합니다. SQL은 `p_join_side text default 'auto'`라 repo 기준 정상입니다. | 운영 DB에서 `join_topic(uuid, text)`만 남아 있고 default가 유지되는지 확인합니다. |
| 낮음 | 사용되지 않는 공개 RPC | `get_public_debate_comments(p_topic_id uuid)`는 정의/grant되어 있지만 현재 `apps/web`에서는 `get_public_debate_comments_by_post`만 사용합니다. | 유지해도 무방합니다. 필요 없으면 후속 정리에서 사용처와 호환성을 확인한 뒤 제거 여부를 검토합니다. |

## 역할별 Grant 판단

- anonymous/public 화면에서 쓰는 RPC는 `anon, authenticated` grant가 있습니다.
  - `get_public_notice`
  - `get_public_topic_participant_counts`
  - `get_public_debate_posts`
  - `get_public_debate_post`
  - `get_public_debate_comments`
  - `get_public_debate_comments_by_post`
  - `create_contact_inquiry`
- 로그인 유저 기능 RPC는 `authenticated` grant입니다.
  - `join_topic`, `create_debate_post`, `create_debate_comment`, `delete_my_debate_comment`, `create_report`, `request_account_deletion`, `water_olive`
- 관리자 RPC는 `authenticated` grant이고 함수 내부 또는 호출 경로에서 admin 확인이 들어갑니다.
  - `moderate_report`, `admin_set_user_status`, `admin_set_report_target_author_status`, `admin_update_contact_inquiry`, `get_admin_topic_stats`, `get_admin_security_status`, `log_admin_activity`

## 운영 DB 적용 전 확인 체크리스트

- Supabase Dashboard에서 앱 호출 RPC 20개가 모두 존재하는지 확인합니다.
- `public.join_topic(uuid)` legacy overload가 남아 있지 않은지 확인합니다.
- `public.join_topic(uuid, text)`의 `p_join_side` default가 `auto`인지 확인합니다.
- `grant execute` signature가 실제 함수 signature와 일치하는지 확인합니다.
- public RPC가 `anon, authenticated`에 열려 있는지 확인합니다.
- 관리자 RPC가 `anon`에 열려 있지 않은지 확인합니다.
- `017_enforce_private_debate_raw_reads.sql` 적용 후 공개 화면의 participant count가 필요한 경로에서 계속 정상인지 확인합니다.
- PostgREST schema cache가 갱신되었는지 확인합니다.

## 결론

repo 기준으로 `apps/web`에서 호출하는 RPC와 Supabase SQL의 function signature/grant는 대체로 일치합니다. 높은 위험도 mismatch는 발견되지 않았습니다. 다만 운영 DB가 repo와 다를 수 있으므로, SQL patch 적용 전에는 Supabase Dashboard에서 실제 함수 signature, grant, RLS 정책을 반드시 확인해야 합니다.
