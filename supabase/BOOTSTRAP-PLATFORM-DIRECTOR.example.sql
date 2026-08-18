-- Run this only after supabase/schema.sql and after the account exists in Supabase Auth.
-- Replace the example email before execution.
select public.bootstrap_practicora_platform_owner('direction@example.com');
