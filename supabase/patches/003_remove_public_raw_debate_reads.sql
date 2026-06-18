-- 003_remove_public_raw_debate_reads.sql
-- Remove overly broad raw table read policies.
-- Public debate reading should go through anonymous RPCs.

begin;

-- ------------------------------------------------------------
-- topic_participants
-- Remove public raw access to participant user_id rows.
-- ------------------------------------------------------------

drop policy if exists "public can read topic participants"
on public.topic_participants;

-- ------------------------------------------------------------
-- debate_posts
-- Remove public raw access to author_id rows.
-- Public post reads should use get_public_debate_posts()
-- and get_public_debate_post().
-- ------------------------------------------------------------

drop policy if exists "public can read visible debate posts"
on public.debate_posts;

-- ------------------------------------------------------------
-- debate_comments
-- Remove public raw access to author_id rows.
-- Public comment reads should use get_public_debate_comments()
-- and get_public_debate_comments_by_post().
-- ------------------------------------------------------------

drop policy if exists "public can read visible debate comments"
on public.debate_comments;

commit;