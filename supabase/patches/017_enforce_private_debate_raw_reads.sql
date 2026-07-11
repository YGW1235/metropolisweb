-- 017_enforce_private_debate_raw_reads.sql
-- Ensures anonymous users cannot directly read raw debate participant/post/comment tables.
-- Public debate viewing should go through dedicated RPC functions.
-- Topics remain publicly readable only when not deleted and in a public status.

begin;

drop policy if exists "public can read topics" on public.topics;
drop policy if exists "Anyone can read public topics" on public.topics;

create policy "Anyone can read public topics"
on public.topics
for select
to anon, authenticated
using (
  deleted_at is null
  and status = any (
    array[
      'open'::text,
      'active'::text,
      'closed'::text
    ]
  )
);

drop policy if exists "public can read topic participants"
on public.topic_participants;

drop policy if exists "public can read visible debate posts"
on public.debate_posts;

drop policy if exists "public can read visible debate comments"
on public.debate_comments;

grant execute on function public.get_public_topic_participant_counts(uuid)
to anon, authenticated;

grant execute on function public.get_public_debate_posts(uuid, text)
to anon, authenticated;

grant execute on function public.get_public_debate_post(uuid)
to anon, authenticated;

grant execute on function public.get_public_debate_comments(uuid)
to anon, authenticated;

grant execute on function public.get_public_debate_comments_by_post(uuid)
to anon, authenticated;

commit;

notify pgrst, 'reload schema';
