# VibeCodingPrc

로또 번호 생성 결과를 Supabase에 저장하는 정적 사이트입니다.

## Vercel 환경 변수

다음 값만 등록하면 됩니다.

- `SUPABASE_URL`: Supabase Project Settings -> API -> Project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase Project Settings -> API -> service_role key
- `SUPABASE_SCHEMA`: `public` 권장, 기본값도 `public`
- `SUPABASE_TABLE`: `lotto_draw_logs`

주의:

- `SUPABASE_TABLE`에는 `public.lotto_draw_logs`가 아니라 테이블명만 넣는 것이 가장 안전합니다.
- 위 API는 `public.lotto_draw_logs`처럼 schema가 붙어 들어와도 테이블명만 뽑아서 처리합니다.
- `SUPABASE_SERVICE_ROLE_KEY`는 브라우저에 노출하면 안 되고, Vercel 서버 환경 변수로만 써야 합니다.

## Supabase 테이블

`supabase/schema.sql`을 Supabase SQL Editor에서 실행하면 `public.lotto_draw_logs` 테이블이 생성됩니다.

## 확인 방법

1. Vercel에 환경 변수를 저장합니다.
2. Supabase SQL Editor에서 스키마를 실행합니다.
3. Vercel에서 다시 배포합니다.
4. 사이트에서 생성 버튼을 누른 뒤 `public.lotto_draw_logs`에 행이 들어갔는지 Supabase Table Editor에서 확인합니다.