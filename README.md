# VibeCodingPrc

로또 생성 결과를 Supabase에 기록하는 정적 사이트입니다.

## 환경변수

Vercel에 아래 값을 등록하세요.

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_TABLE` (선택, 기본값 `lotto_draw_logs`)

`SUPABASE_SERVICE_ROLE_KEY`는 클라이언트에 노출하지 말고, Vercel 서버리스 함수에서만 사용합니다.

## Supabase 테이블

`supabase/schema.sql`을 Supabase SQL Editor에서 실행해 테이블을 만드세요.

## 동작

1. 사용자가 로또 생성 버튼을 누릅니다.
2. 브라우저가 생성된 번호 배열을 `/api/log-draw`로 전송합니다.
3. Vercel 함수가 요청 IP와 번호를 Supabase에 저장합니다.