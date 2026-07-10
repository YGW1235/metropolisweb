# Changelog

## v0.3.0 후보 - 2026-07-10

### Added

- GitHub Actions `Web CI` workflow 추가
  - `main` push와 pull request에서 실행
  - Node.js 22, pnpm, pnpm cache 사용
  - repo 루트에서 `pnpm install --frozen-lockfile` 실행
  - `apps/web`에서 `pnpm build` 실행
- 문의하기 기능 추가 및 운영 알림 메일 연동
  - 문의 접수 페이지
  - 관리자 문의 조회/상태 변경/메모 처리
  - Resend API 기반 문의 알림 메일
- 계정 운영 기능 보강
  - 비밀번호 재설정
  - 내 비밀번호 변경
  - 계정 탈퇴 요청/처리
- 관리자 운영 기능 보강
  - 유저 정지/복구
  - 신고 대상 작성자 정지/복구
  - 관리자 활동 로그
  - 주제별 통계
  - 관리자 보안 점검 페이지

### Changed

- 운영 도메인을 `https://metropolisagora.com` 기준으로 문서화
- Supabase Auth Site URL과 Redirect URL 운영 설정 정리
- Resend SMTP를 통한 Supabase Auth 메일 발송 기준 정리
- 다크모드/일반모드 전환 구조 개선
  - `metropolis-theme` 저장값 기반 테마 유지
  - 초기 로딩 시 `html[data-theme]` 적용 보강
  - ThemeToggle 접근성 문구와 포커스 스타일 개선
- 긴 텍스트 UI 보강
  - 주제 설명 줄바꿈 표시
  - 발언/댓글 본문 줄바꿈 표시
  - 긴 URL/긴 단어 레이아웃 깨짐 방지
- 관리자/문의/로그인/푸터 일부 화면의 일반모드 색상 안정화
- 운영 문서 최신화
  - README
  - 관리자 가이드
  - 런칭 점검 문서
  - Supabase 운영 메모

### Notes

- 커스텀 도메인은 Cloudflare DNS와 Vercel 도메인 연결을 함께 관리합니다.
- GitHub Actions 실행에는 GitHub Secrets 설정이 필요합니다.
- 실제 운영 secret 값은 문서에 기록하지 않습니다.
- 일반 사용자용 발언 수정 화면은 현재 문서화 대상에 포함하지 않았습니다.

## v0.2.0

### Added

- 공지사항 기능 추가
  - 공지 목록 페이지
  - 공지 상세 페이지
  - 관리자 공지 작성 페이지
  - 관리자 공지 수정 페이지
  - 관리자 공지 관리 기능
  - 공지 고정 기능
  - 공지 상태 `draft`, `published` 지원
- 올리브 가지 기능 추가
  - 로그인 유저의 일일 물주기
  - 총 물주기 횟수 기록
  - 연속 물주기 일수 기록
  - 최고 연속 기록 저장
  - 오늘 물주기 완료 여부 표시
- 게시글 이미지 첨부 기능 추가
  - JPG, PNG, WEBP 이미지 업로드 지원
  - 최대 5MB 이미지 제한
  - Supabase Storage `debate-images` 버킷 사용
  - 게시글 상세 페이지에서 이미지 표시
  - 게시글 삭제 시 첨부 이미지 제거 처리
- 게시글 상세 페이지 추가
  - `/topics/[topicId]/debate/[postId]` 라우트
  - 게시글 목록과 상세 화면 분리
  - 댓글 작성 흐름 개선
  - 신고 기능 위치 개선
- 게시글 작성 페이지 추가
  - `/topics/[topicId]/debate/new` 라우트
  - 글쓰기 화면 분리
  - 이미지 업로드 미리보기 흐름 추가
- 게시글/댓글 삭제 기능 추가
  - 본인 게시글 삭제
  - 본인 댓글 삭제
  - 게시글 삭제 시 상태를 `deleted`로 변경
  - 댓글 삭제용 `delete_my_debate_comment` RPC 사용
- 관리자 주제 삭제 처리 기능 추가
  - 주제 삭제 시 `deleted_at`, `deleted_by` 기록
  - 실제 삭제 대신 소프트 삭제 방식 사용
- 스타일 실험 페이지 추가
  - `/style-preview`
  - `/style-previews`
  - `/style-athena-poseidon`
  - `/style-country-themes`
  - `/style-experimental-layouts`
  - `/style-gazette-variations`
  - `/style-agora-record`

### Changed

- 토론방 UI 개선
- 모바일 화면 대응 강화
- 주제 목록/상세/토론방 사용자 흐름 개선
- 관리자 화면 이동 흐름 개선
- 게시글 작성 흐름을 토론방 내부 작성에서 별도 작성 페이지로 분리
- 게시글 목록 중심 구조에서 게시글 상세 중심 구조로 개선
- 이미지 업로드 실패 시 게시글 작성 결과와 에러 메시지를 분리해서 처리
- Supabase Storage 기반 이미지 처리 구조 추가
- Vercel 빌드 안정화를 위해 pnpm build dependency 설정 추가

### Fixed

- 배포 환경 안정화
- Vercel Root Directory 설정 문제 해결
- Supabase Auth URL 설정 반영
- 접근 권한 관련 문제 수정
- RLS 정책 관련 참여자 조회 문제 수정
- 로그인 redirect 메시지 인코딩 문제 수정
- 게시글/댓글 신고 처리 흐름 개선
- 게시글 삭제 시 이미지 파일이 남는 문제 방지

## v0.1.0

### Added

- Next.js 프로젝트 초기 구성
- Supabase 클라이언트 구성
- 이메일 기반 회원가입/로그인/로그아웃
- 프로필 테이블 구성
- 프로필 자동 생성 트리거 구성
- 관리자 권한 구조 구성
- 관리자 페이지 접근 제한
- 토론 주제 생성 기능
- 토론 주제 수정 기능
- 토론 주제 상태 변경 기능
- 토론 주제 보관 처리 기능
- 일반 유저 주제 목록 조회
- 주제 상세 페이지
- 주제 참가 기능
- 찬성/반대 역할 자동 배정
- 참가자 익명 번호 부여
- 토론방 페이지
- 게시글 작성 기능
- 댓글 작성 기능
- 게시글/댓글 신고 기능
- 관리자 신고 목록 페이지
- 관리자 신고 처리 기능
- 게시글/댓글 숨김 처리
- 찬성/반대/전체 글 필터
- 닉네임 수정 페이지
- 공통 헤더/네비게이션
- 모바일 기본 대응
- Vercel Production 배포
