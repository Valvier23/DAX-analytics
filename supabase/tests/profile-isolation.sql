-- Run in SQL Editor on the migrated project. All temporary rows are rolled back.
begin;
insert into auth.users (id, raw_user_meta_data) values
  ('bb8be5c1-f29f-4c48-a185-5f680defae01', '{"full_name":"Isolation test A"}'),
  ('bb8be5c1-f29f-4c48-a185-5f680defae02', '{"full_name":"Isolation test B"}');
set local role authenticated;
select set_config('request.jwt.claim.sub','bb8be5c1-f29f-4c48-a185-5f680defae01',true);
select count(*) = 1 as only_own_profile,
       bool_and(id = 'bb8be5c1-f29f-4c48-a185-5f680defae01') as no_other_user,
       bool_and(full_name = 'Isolation test A') as trigger_correct
from public.profiles;
reset role;
rollback;
-- Expected: true / true / true. No permanent accounts or credentials created.
