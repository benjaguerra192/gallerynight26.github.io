begin;

-- Intentionally public, read-only projection: no auth IDs, email or unlock timestamps.
create function public.gn_leaderboard() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('server_now',now(),'participants',coalesce((
    select jsonb_agg(jsonb_build_object(
      'name',person->'name', 'is_test',person->'is_test',
      'completed_at',person->'completed_at', 'elapsed_ms',person->'elapsed_ms',
      'unlocks',coalesce((select jsonb_agg(jsonb_build_object('song_id',u->'song_id'))
        from jsonb_array_elements(person->'unlocks') u),'[]'::jsonb)
    ) order by p.registered_at,p.id)
    from public.gn_participants p
    cross join lateral (select gn_private.gn_participant_json(p.id) person) data
  ),'[]'::jsonb));
$$;
revoke all on function public.gn_leaderboard() from public,anon,authenticated;
grant execute on function public.gn_leaderboard() to anon,authenticated;

commit;
