# 메트로폴리스 아고라 관리자 운영 가이드

메트로폴리스 아고라 운영자가 관리자 메뉴에서 확인하고 처리해야 할 일을 정리한 문서입니다. 기준 운영 주소는 `https://www.metropolisagora.com`이고, 대상 앱은 `apps/web`입니다.

이 저장소에 함께 있는 SymposionTalk(`apps/casual-web`)와는 별도 브랜드/앱으로 관리합니다. 이 문서의 관리자 메뉴와 운영 절차는 메트로폴리스 아고라에만 적용합니다.

## 1. 관리자 접속

관리자 계정으로 로그인한 뒤 아래 주소로 접속합니다.

```txt
https://www.metropolisagora.com/admin
```

관리자 권한 조건:

```txt
profiles.role = admin
profiles.status = active
```

관리자 role은 공개 UI에서 부여하지 않습니다. 필요한 경우 Supabase SQL Editor에서 직접 처리합니다.

```sql
update public.profiles
set role = 'admin'
where email = '관리자이메일@example.com';
```

## 2. 관리자 대시보드

`/admin`은 주요 운영 메뉴로 이동하는 출발점입니다.

주요 이동 메뉴:

- 주제 관리
- 공지 작성/관리
- 신고 관리
- 유저 관리
- 문의 관리
- 활동 로그
- 주제별 통계
- 관리자 보안 점검

운영자는 배포 후 먼저 `/admin` 접근 여부를 확인하고, 본인 계정이 active 관리자 상태인지 확인합니다.

## 3. 주제 관리

관리 경로:

```txt
/admin/topics
/admin/topics/new
/admin/topics/[topicId]/edit
```

운영자가 할 일:

- 새 토론 주제 생성
- 제목, 설명, 아테나 측 입장, 포세이돈 측 입장 작성
- 시작/종료 예정 시간 설정
- 공개 상태 변경
- 오래되었거나 잘못 만든 주제 삭제 처리

주제 상태:

| 상태 | 의미 | 사용자 노출 | 참여/작성 |
| --- | --- | --- | --- |
| `draft` | 작성/검토 중 | 노출 안 됨 | 불가 |
| `open` | 공개 및 참여 모집 | 노출 | 신규 참여, 글/댓글 가능 |
| `active` | 진행 중 | 노출 | 기존 참여자 글/댓글 가능 |
| `closed` | 종료 | 노출 | 읽기만 가능 |
| `archived` | 보관 | 노출 안 됨 | 불가 |

권장 흐름:

```txt
draft -> open -> active -> closed -> archived
```

주의:

- 주제 설명과 양측 입장은 줄바꿈이 화면에 반영됩니다.
- 삭제 처리는 실제 row 삭제가 아니라 `deleted_at`, `deleted_by`를 기록하는 소프트 삭제 방식입니다.
- 공개 전에는 일반 사용자 화면에서 `/topics`와 상세 페이지 노출을 확인합니다.

## 4. 공지 관리

관리 경로:

```txt
/admin/notices
/admin/notices/new
/admin/notices/[noticeId]/edit
```

운영자가 할 일:

- 서비스 안내, 점검, 정책 변경 공지 작성
- `draft` 또는 `published` 상태 설정
- 필요한 공지는 고정 처리
- 오래된 공지 수정 또는 삭제

공지 상태:

| 상태 | 의미 |
| --- | --- |
| `draft` | 작성 중. 일반 사용자에게 보이지 않음 |
| `published` | 공지 목록과 상세 페이지에 공개 |

공지 작성 시 확인할 것:

- 제목이 실제 내용과 맞는지
- 점검 시간은 한국 시간 기준으로 명확한지
- 사용자 행동이 필요한 경우 안내가 충분한지
- 공개 후 `/notices`와 공지 상세 페이지에서 정상 표시되는지

## 5. 신고 관리

관리 경로:

```txt
/admin/reports
```

신고 대상:

- 게시글
- 댓글

신고 상태:

| 상태 | 의미 |
| --- | --- |
| `pending` | 신규 신고 |
| `reviewing` | 검토 중 |
| `resolved` | 신고를 받아들여 처리 |
| `dismissed` | 신고 기각 |

운영자가 할 일:

- 신고 사유와 대상 내용을 확인
- 토론 맥락상 허용 가능한 표현인지 판단
- 명백한 위반이면 게시글/댓글 숨김 처리
- 신고 대상 작성자 정지 또는 복구가 필요한지 판단
- 처리 메모를 남김

숨김 처리 권장 기준:

- 개인정보 노출
- 욕설, 인신공격, 혐오 표현
- 도배 또는 광고
- 주제와 무관한 반복 게시
- 서비스 운영 방해 목적의 콘텐츠
- 성적 또는 폭력적 콘텐츠

기각을 고려할 수 있는 경우:

- 단순 의견 차이
- 반대 의견
- 토론 맥락 안의 강한 비판
- 불편하지만 규칙 위반은 아닌 표현

주의:

- 단순히 의견이 마음에 들지 않는다는 이유만으로 숨김 처리하지 않습니다.
- 숨김 처리 후 일반 사용자 토론방에서 대상이 보이지 않는지 확인합니다.
- 작성자 제재를 함께 처리한 경우 `/admin/activity`에서 로그를 확인합니다.

## 6. 유저 관리

관리 경로:

```txt
/admin/users
```

운영자가 할 일:

- 유저 이메일, role, status 확인
- 신고 누적 또는 운영 위반 유저 정지
- 정지 사유 기록
- 오처리 또는 해소된 건은 active로 복구
- 최근 제재 이력 확인

사용자 상태:

| 상태 | 의미 |
| --- | --- |
| `active` | 정상 이용 가능 |
| `suspended` | 참여, 글 작성, 댓글 작성 제한 |
| `deleted` | 탈퇴 처리된 계정 |

주의:

- 관리자 계정을 실수로 정지/탈퇴 처리하지 않습니다.
- 유저 정지/복구 후 신고 처리 화면과 활동 로그를 함께 확인합니다.
- 정지 사유에는 개인정보나 민감 정보를 과하게 적지 않습니다.

## 7. 문의 관리

관리 경로:

```txt
/admin/inquiries
```

사용자는 `/contact`에서 문의를 남깁니다. 문의 접수 시 `CONTACT_EMAIL_FROM`, `CONTACT_NOTIFY_TO`, `RESEND_API_KEY`가 설정되어 있으면 운영자에게 알림 메일을 보냅니다.

운영자가 할 일:

- 신규 문의 확인
- 문의 유형과 답변 이메일 확인
- 상태 변경
- 관리자 메모 기록
- 필요한 경우 사용자가 남긴 이메일로 별도 답변

권장 상태 운영:

- 신규 접수: 확인 전
- 처리 중: 답변 준비 또는 내부 확인 중
- 완료: 답변 또는 조치 완료

주의:

- 문의 내용에는 개인정보가 포함될 수 있으므로 외부에 복사하지 않습니다.
- 답변이 필요한 문의는 `CONTACT_NOTIFY_TO` 수신함과 관리자 페이지 상태를 함께 관리합니다.

## 8. 활동 로그 확인

관리 경로:

```txt
/admin/activity
```

활동 로그는 관리자 작업 이력을 확인하는 페이지입니다.

확인할 항목:

- 신고 처리
- 유저 정지/복구
- 문의 상태 변경
- 작업자
- 대상 ID
- 처리 시간
- 메타데이터

운영 기준:

- 배포 직후나 신고 처리 후 로그가 남는지 확인합니다.
- 이상한 관리자 작업이 보이면 해당 관리자 계정 상태를 점검합니다.
- DB를 직접 수정한 경우 별도 운영 기록도 남기는 것을 권장합니다.

## 9. 주제별 통계

관리 경로:

```txt
/admin/stats
```

확인 가능한 항목:

- 전체 주제 수
- 참가자 수
- 게시글 수
- 댓글 수
- 신고 수
- 대기 중 신고 수
- 최근 게시글/댓글 시간

운영자가 할 일:

- 활발한 주제와 방치된 주제를 확인
- 신고가 많은 주제를 우선 검토
- 종료 시점이 지난 주제는 `closed` 또는 `archived`로 변경
- 참가자가 적은 주제는 공지나 안내로 보완할지 판단

## 10. 보안 점검

관리 경로:

```txt
/admin/security
```

확인 가능한 항목:

- 전체 관리자 수
- active 관리자 수
- 이메일 미인증 관리자 수
- 정지/탈퇴 관리자 수
- 현재 관리자 계정 상태
- 예비 관리자 계정 여부

운영자가 할 일:

- active 관리자 계정이 최소 1개 이상인지 확인
- 가능하면 예비 관리자 계정 1개를 유지
- 관리자 이메일 인증 상태 확인
- 정지/탈퇴 상태의 관리자 계정이 없는지 확인

주의:

- 관리자 role 변경은 Supabase SQL Editor에서만 처리하는 것을 권장합니다.
- 관리자 계정은 개인 계정과 분리해 운영하는 것이 좋습니다.

## 11. 배포 전 체크

배포 전 확인:

- GitHub Actions Web CI가 통과했는지
- 로컬 또는 CI에서 `apps/web` 빌드가 성공했는지
- Vercel Root Directory가 `apps/web`인지
- Vercel 환경변수가 설정되어 있는지
- Supabase Auth Site URL이 `https://www.metropolisagora.com`인지
- Supabase Redirect URLs가 운영/WWW/Vercel/localhost를 포함하는지
- Resend SMTP가 Supabase Auth에 연결되어 있는지
- Email Templates 문구와 링크가 운영 도메인 기준인지
- `debate-images` 버킷과 Storage 정책이 유지되는지

배포 후 확인:

- `https://www.metropolisagora.com` 접속
- `https://metropolisagora.com`이 `www` 주소로 리디렉션되는지 확인
- 회원가입과 이메일 인증
- 로그인/로그아웃
- 비밀번호 재설정
- 주제 목록/상세/토론방
- 발언/댓글/이미지 업로드
- 신고와 관리자 처리
- 문의 접수와 관리자 문의 목록
- 다크모드/일반모드
- 모바일 화면

## 12. Supabase 운영 주의사항

운영 DB에서 직접 SQL을 실행할 때는 특히 주의합니다.

주의할 작업:

- `drop policy`
- `drop function`
- `alter table`
- `delete`
- 조건 없는 `update`
- Storage policy 변경

권장 방식:

```txt
1. 변경 SQL을 supabase/patches에 먼저 기록
2. 내용을 검토
3. Supabase SQL Editor에서 실행
4. 사이트 기능 테스트
5. Git commit
```

## 13. 장애 대응 기준

### 로그인이 안 되는 경우

확인:

- Supabase Auth URL Configuration
- Supabase Redirect URLs
- Vercel `NEXT_PUBLIC_SUPABASE_URL`
- Vercel `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- 이메일 인증 상태

### 인증/비밀번호 메일이 안 오는 경우

확인:

- Supabase Auth SMTP 설정
- Resend SMTP 발신 도메인 상태
- Supabase Email Templates
- 스팸함
- Redirect URL 허용 목록

### 주제나 토론방이 안 보이는 경우

확인:

- `topics.status`가 `open`, `active`, `closed` 중 하나인지
- `topics.deleted_at`이 null인지
- 공개 조회 RPC/RLS 정책

### 발언/댓글 작성이 안 되는 경우

확인:

- 로그인 상태
- 계정 상태가 `active`인지
- 주제 참가 여부
- 주제 상태가 `open` 또는 `active`인지
- `create_debate_post`, `create_debate_comment` RPC

### 이미지 업로드가 안 되는 경우

확인:

- `debate-images` bucket 존재 여부
- 파일 타입이 JPG/PNG/WEBP인지
- 파일 크기가 5MB 이하인지
- Storage policy
- 업로드 후 `image_url`, `image_path` 저장 여부

### 관리자 페이지 접근이 안 되는 경우

확인:

- 로그인 계정
- `profiles.role = admin`
- `profiles.status = active`
- 서버 권한 확인 함수

## 14. 운영 원칙

- 실제 계정 정보를 공개 화면에 노출하지 않습니다.
- 의견 차이와 규칙 위반을 구분합니다.
- 신고 처리는 일관된 기준으로 합니다.
- 관리자 권한은 최소 인원에게만 부여합니다.
- DB 변경은 기록을 남깁니다.
- 배포 전후 체크리스트를 생략하지 않습니다.
- secret 값은 문서나 Git에 기록하지 않습니다.
