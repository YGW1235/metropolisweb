# Supabase Schema Notes

이 폴더는 Metropolis Web 프로젝트의 Supabase DB 구조, RLS 정책, RPC 함수, Storage 설정을 기록합니다.

## 목적

- 수동으로 만든 Supabase SQL을 파일로 보관
- 새 Supabase 프로젝트 생성 시 DB 구조 재현
- RLS 정책과 RPC 함수 변경 이력 관리
- 배포 전 DB 변경사항 확인

## 적용 순서

아래 순서대로 SQL을 실행합니다.

1. `001_profiles.sql`
2. `002_topics.sql`
3. `003_participants.sql`
4. `004_posts_comments.sql`
5. `005_reports_moderation.sql`
6. `006_notices.sql`
7. `007_olive.sql`
8. `008_storage.sql`

## 주의사항

- 운영 DB에 다시 실행하기 전에는 반드시 내용을 확인합니다.
- `drop policy`, `drop function`, `alter table` 구문은 기존 데이터에 영향을 줄 수 있습니다.
- 새 Supabase 프로젝트에 적용할 때는 순서대로 실행합니다.
- 기존 운영 DB에는 이미 적용된 SQL을 중복 실행하지 않는 것이 안전합니다.

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

## 현재 사용하는 주요 RPC 함수

- `is_admin`
- `is_topic_participant`
- `join_topic`
- `create_debate_post`
- `create_debate_comment`
- `delete_my_debate_comment`
- `create_report`
- `moderate_report`
- `update_my_profile`
- `water_olive`