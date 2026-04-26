-- 예약(bookings) 테이블 생성
CREATE TABLE bookings (
  id bigint PRIMARY KEY,
  date text,
  times jsonb,
  type text,
  name text,
  note text,
  status text,
  createdAt text
);

-- 바쁜 날짜(단일) 테이블 생성
CREATE TABLE busy_dates (
  date text PRIMARY KEY,
  label text
);

-- 휴가/연속 바쁜 날짜 테이블 생성
CREATE TABLE busy_ranges (
  id text PRIMARY KEY,
  start_date text,
  end_date text,
  label text
);

-- 누구나 읽고 쓸 수 있도록 RLS(Row Level Security) 비활성화 (포트폴리오 호환 목적)
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE busy_dates DISABLE ROW LEVEL SECURITY;
ALTER TABLE busy_ranges DISABLE ROW LEVEL SECURITY;
