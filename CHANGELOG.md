# Changelog

## v0.2.0

### Added

* 공지사항 기능 추가

  * 공지 목록 페이지 추가
  * 공지 상세 페이지 추가
  * 관리자 공지 작성 페이지 추가
  * 관리자 공지 수정 페이지 추가
  * 관리자 공지 관리 기능 추가
  * 공지 고정 기능 추가
  * 공지 상태 `draft`, `published` 지원

* 올리브 가지 기능 추가

  * 로그인 유저의 일일 물주기 기능 추가
  * 총 물주기 횟수 기록
  * 연속 물주기 일수 기록
  * 최고 연속 기록 저장
  * 오늘 물주기 완료 여부 표시

* 게시글 이미지 첨부 기능 추가

  * JPG, PNG, WEBP 이미지 업로드 지원
  * 최대 5MB 이미지 제한
  * Supabase Storage `debate-images` 버킷 사용
  * 게시글 상세 페이지에서 이미지 표시
  * 게시글 삭제 시 첨부 이미지 제거 처리

* 게시글 상세 페이지 추가

  * `/topics/[topicId]/debate/[postId]` 라우트 추가
  * 게시글 목록과 상세 화면 분리
  * 댓글 작성 흐름 개선
  * 신고 기능 위치 개선

* 게시글 작성 페이지 추가

  * `/topics/[topicId]/debate/new` 라우트 추가
  * 글쓰기 화면 분리
  * 이미지 업로드 미리보기 흐름 추가

* 게시글 / 댓글 삭제 기능 추가

  * 본인 게시글 삭제 기능 추가
  * 본인 댓글 삭제 기능 추가
  * 게시글 삭제 시 상태를 `deleted`로 변경
  * 댓글 삭제용 `delete_my_debate_comment` RPC 사용

* 관리자 주제 삭제 처리 기능 추가

  * 주제 삭제 시 `deleted_at`, `deleted_by` 기록
  * 실제 삭제 대신 소프트 삭제 방식 사용

* 스타일 실험 페이지 추가

  * `/style-preview`
  * `/style-previews`
  * `/style-athena-poseidon`
  * `/style-country-themes`
  * `/style-experimental-layouts`
  * `/style-gazette-variations`
  * `/style-agora-record`

### Changed

* 토론방 UI 개선
* 모바일 화면 대응 강화
* 주제 목록 / 상세 / 토론방 사용자 흐름 개선
* 관리자 화면 이동 흐름 개선
* 게시글 작성 흐름을 토론방 내부 작성에서 별도 작성 페이지로 분리
* 게시글 목록 중심 구조에서 게시글 상세 중심 구조로 개선
* 이미지 업로드 실패 시 게시글 작성 결과와 에러 메시지를 분리해서 처리
* Supabase Storage 기반 이미지 처리 구조 추가
* Vercel 빌드 안정화를 위해 pnpm build dependency 설정 추가

### Fixed

* 배포 환경 안정화
* Vercel Root Directory 설정 문제 해결
* Supabase Auth URL 설정 반영
* 접근 권한 관련 문제 수정
* RLS 정책 관련 참여자 조회 문제 수정
* 로그인 redirect 메시지 인코딩 문제 수정
* 게시글/댓글 신고 처리 흐름 개선
* 게시글 삭제 시 이미지 파일이 남는 문제 방지

### Notes

* 현재 루트 README는 v0.2.0 기준으로 업데이트 필요
* `apps/web/README.md`는 기본 Next.js README 상태이므로 정리 필요
* `apps/web/package.json`의 version은 아직 `0.1.0`이므로 `0.2.0`으로 맞추는 것을 권장
* 실제 유저 테스트 전 `/supabase-test`와 스타일 실험 라우트 정리 필요
* Supabase SQL migration 파일 정리가 필요

## v0.1.0

### Added

* Next.js 프로젝트 초기 구성
* Supabase 클라이언트 구성
* 이메일 기반 회원가입 / 로그인 / 로그아웃
* 프로필 테이블 구성
* 프로필 자동 생성 트리거 구성
* 관리자 권한 구조 구성
* 관리자 페이지 접근 제한
* 토론 주제 생성 기능
* 토론 주제 수정 기능
* 토론 주제 상태 변경 기능
* 토론 주제 보관 처리 기능
* 일반 유저 주제 목록 조회
* 주제 상세 페이지
* 주제 참가 기능
* 찬성 / 반대 역할 자동 배정
* 참가자 익명 번호 부여
* 토론방 페이지
* 게시글 작성 기능
* 댓글 작성 기능
* 게시글 / 댓글 신고 기능
* 관리자 신고 목록 페이지
* 관리자 신고 처리 기능
* 게시글 / 댓글 숨김 처리
* 찬성 / 반대 / 전체 글 필터
* 닉네임 수정 페이지
* 공통 헤더 / 네비게이션
* 모바일 기본 대응
* Vercel Production 배포
