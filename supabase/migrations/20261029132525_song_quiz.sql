begin;
create table public.gn_attempts (
 participant_id uuid not null references public.gn_participants(id) on delete cascade,
 song_id text not null check(song_id = any(array['billie-jean','take-on-me','with-or-without-you','sweet-dreams','every-breath-you-take','bohemian-rhapsody','sweet-child','la-isla-bonita'])),
 choices text[] not null,
 selected text,
 answered_at timestamptz,
 correct boolean,
 primary key(participant_id,song_id),
 check ((answered_at is null and selected is null and correct is null) or
        (answered_at is not null and selected is not null and correct is not null))
);
alter table public.gn_attempts enable row level security;
revoke all on public.gn_attempts from public,anon,authenticated;
-- Preserve songs already earned before the quiz existed.
insert into public.gn_attempts(participant_id,song_id,choices,selected,answered_at,correct)
 select participant_id,song_id,array[song_id],song_id,unlocked_at,true from public.gn_unlocks;

create or replace function gn_private.gn_participant_json(target uuid) returns jsonb
language sql stable security definer set search_path='' as $$
 select jsonb_build_object('id',p.id,'name',p.name,'registered_at',p.registered_at,'is_test',p.is_test,
 'unlocks',coalesce((select jsonb_agg(jsonb_build_object('song_id',song_id,'unlocked_at',unlocked_at) order by unlocked_at,song_id)
 from public.gn_unlocks where participant_id=p.id),'[]'::jsonb),
 'attempts',coalesce(a.attempts,'[]'::jsonb),
 'completed_at',case when a.count=8 then a.finished end,
 'elapsed_ms',greatest(0,floor(extract(epoch from (case when a.count=8 then a.finished else now() end-p.registered_at))*1000)))
 from public.gn_participants p left join lateral (
 select jsonb_agg(jsonb_build_object('song_id',song_id,'correct',correct,'selected',selected,'answered_at',answered_at) order by answered_at,song_id) attempts,
 count(*) count,max(answered_at) finished from public.gn_attempts where participant_id=p.id and answered_at is not null
 ) a on true where p.id=target;
$$;

create function public.gn_challenge(track text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare current_id uuid:=auth.uid(); options text[]; attempt public.gn_attempts;
begin
 if current_id is null then raise exception 'Primero registrá tu familia.' using errcode='28000'; end if;
 if track is null or not(track=any(array['billie-jean','take-on-me','with-or-without-you','sweet-dreams','every-breath-you-take','bohemian-rhapsody','sweet-child','la-isla-bonita'])) then raise exception 'NFC inválido.' using errcode='22023'; end if;
 perform 1 from public.gn_event where id=true for share;
 perform 1 from public.gn_participants where id=current_id for update;
 if not found then raise exception 'Primero registrá tu familia.'; end if;
 select * into attempt from public.gn_attempts where participant_id=current_id and song_id=track;
 if attempt.answered_at is not null then return public.gn_me()||jsonb_build_object('challenge',null); end if;
 if not(public.gn_status()->>'is_open')::boolean then raise exception 'El recorrido está cerrado.'; end if;
 if attempt.song_id is null then
 -- Always include the correct answer and two distinct distractors.
 select array_agg(id order by random()) into options from (
 select track id union all select id from (select id from unnest(array['billie-jean','take-on-me','with-or-without-you','sweet-dreams','every-breath-you-take','bohemian-rhapsody','sweet-child','la-isla-bonita']) id where id<>track order by random() limit 2) distractors
 ) shuffled;
 insert into public.gn_attempts(participant_id,song_id,choices) values(current_id,track,options);
 else options:=attempt.choices;
 end if;
 return public.gn_me()||jsonb_build_object('challenge',jsonb_build_object('track',track,'choices',options));
end; $$;

create function public.gn_answer(track text,choice text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare current_id uuid:=auth.uid(); attempt public.gn_attempts;
begin
 if current_id is null then raise exception 'Primero registrá tu familia.' using errcode='28000'; end if;
 perform 1 from public.gn_event where id=true for share;
 perform 1 from public.gn_participants where id=current_id for update;
 if not found then raise exception 'Primero registrá tu familia.'; end if;
 select * into attempt from public.gn_attempts where participant_id=current_id and song_id=track;
 if not found then raise exception 'Escaneá el NFC antes de responder.'; end if;
 -- Retries after a lost response must return the original result.
 if attempt.answered_at is not null then return public.gn_me(); end if;
 if not(public.gn_status()->>'is_open')::boolean then raise exception 'El recorrido está cerrado.'; end if;
 if choice is null or not(choice=any(attempt.choices)) then raise exception 'Elegí una de las tres opciones.' using errcode='22023'; end if;
 update public.gn_attempts set selected=choice,correct=(choice=track),answered_at=clock_timestamp()
 where participant_id=current_id and song_id=track;
 if choice=track then insert into public.gn_unlocks(participant_id,song_id) values(current_id,track) on conflict do nothing; end if;
 return public.gn_me();
end; $$;

-- Old clients may replay an earned song, but cannot bypass the quiz.
create or replace function public.gn_unlock(track text) returns jsonb
language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Primero registrá tu familia.' using errcode='28000'; end if;
 if not exists(select 1 from public.gn_unlocks where participant_id=auth.uid() and song_id=track) then
 raise exception 'Primero escuchá y respondé las tres opciones.';
 end if;
 return public.gn_me();
end; $$;
create or replace function public.gn_admin_action(action text, target uuid default null, track text default null, confirmation text default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  perform gn_private.gn_require_admin();
  if action <> 'unlock_all' and confirmation is distinct from 'BORRAR' then
    raise exception 'Confirmá el borrado.' using errcode='22023';
  end if;
  perform 1 from public.gn_event where id = true for update;
  if action='delete_all' then
    delete from public.gn_participants where true;
    return public.gn_admin_snapshot();
  end if;
  perform 1 from public.gn_participants where id=target for update;
  if not found then raise exception 'Ese participante ya no existe.' using errcode='P0001'; end if;
  case action
    when 'delete_unlock' then
      delete from public.gn_attempts where participant_id=target and song_id=track;
      delete from public.gn_unlocks where participant_id=target and song_id=track;
    when 'clear_unlocks' then
      delete from public.gn_attempts where participant_id=target;
      delete from public.gn_unlocks where participant_id=target;
    when 'restart' then
      delete from public.gn_attempts where participant_id=target;
      delete from public.gn_unlocks where participant_id=target;
      update public.gn_participants set registered_at=clock_timestamp(),is_test=false where id=target;
    when 'delete_participant' then
      delete from public.gn_participants where id=target;
    when 'unlock_all' then
      update public.gn_participants set is_test=true where id=target;
      insert into public.gn_attempts(participant_id,song_id,choices,selected,answered_at,correct)
        select target,id,array[id],id,clock_timestamp(),true from unnest(array['billie-jean','take-on-me','with-or-without-you','sweet-dreams','every-breath-you-take','bohemian-rhapsody','sweet-child','la-isla-bonita']) id
        on conflict(participant_id,song_id) do update set selected=excluded.selected,answered_at=excluded.answered_at,correct=true;
      insert into public.gn_unlocks(participant_id,song_id)
        select target,unnest(array['billie-jean','take-on-me','with-or-without-you','sweet-dreams','every-breath-you-take','bohemian-rhapsody','sweet-child','la-isla-bonita'])
        on conflict (participant_id,song_id) do nothing;
    else raise exception 'Acción inválida.' using errcode='22023';
  end case;
  return public.gn_admin_snapshot();
end;
$$;

create or replace function public.gn_leaderboard() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('server_now',now(),'participants',coalesce((
    select jsonb_agg(jsonb_build_object(
      'attempts',coalesce((select jsonb_agg(jsonb_build_object('song_id',a->'song_id','correct',a->'correct')) from jsonb_array_elements(person->'attempts') a),'[]'::jsonb),
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

revoke all on function public.gn_challenge(text),public.gn_answer(text,text) from public,anon,authenticated;
grant execute on function public.gn_challenge(text),public.gn_answer(text,text) to authenticated;
commit;
