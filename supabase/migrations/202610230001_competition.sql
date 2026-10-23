begin;

create schema if not exists gn_private;
revoke all on schema gn_private from public, anon, authenticated;

create table public.gn_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
create table public.gn_event (
  id boolean primary key default true check (id),
  mode text not null default 'open' check (mode in ('open','closed','closed_until','scheduled')),
  opens_at timestamptz,
  closes_at timestamptz,
  check (mode <> 'closed_until' or opens_at is not null),
  check (mode <> 'scheduled' or (opens_at is not null and closes_at > opens_at))
);
insert into public.gn_event(id) values (true);
create table public.gn_participants (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  registered_at timestamptz not null default clock_timestamp(),
  is_test boolean not null default false
);
create table public.gn_unlocks (
  participant_id uuid not null references public.gn_participants(id) on delete cascade,
  song_id text not null check (song_id in ('billie-jean','take-on-me','with-or-without-you','sweet-dreams','every-breath-you-take','bohemian-rhapsody','sweet-child','la-isla-bonita')),
  unlocked_at timestamptz not null default clock_timestamp(),
  primary key (participant_id, song_id)
);

alter table public.gn_admins enable row level security;
alter table public.gn_event enable row level security;
alter table public.gn_participants enable row level security;
alter table public.gn_unlocks enable row level security;
-- All reads and writes go through the authenticated, narrowly scoped functions below.
revoke all on public.gn_admins, public.gn_event, public.gn_participants, public.gn_unlocks from public, anon, authenticated;

create function public.gn_status() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'mode', mode, 'opens_at', opens_at, 'closes_at', closes_at,
    'is_open', case mode
      when 'open' then true
      when 'closed' then false
      when 'closed_until' then now() >= opens_at
      when 'scheduled' then now() >= opens_at and now() < closes_at
      else false end,
    'server_now', now()
  ) from public.gn_event where id = true;
$$;

create function gn_private.gn_participant_json(target uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('id', p.id, 'name', p.name, 'registered_at', p.registered_at,
    'is_test', p.is_test, 'unlocks', coalesce(u.unlocks, '[]'::jsonb),
    'completed_at', case when u.count = 8 then u.finished end,
    'elapsed_ms', greatest(0, floor(extract(epoch from
      (case when u.count = 8 then u.finished else now() end - p.registered_at)) * 1000)))
  from public.gn_participants p
  left join lateral (
    select jsonb_agg(jsonb_build_object('song_id', song_id, 'unlocked_at', unlocked_at) order by unlocked_at, song_id) unlocks,
      count(*) count, max(unlocked_at) finished
    from public.gn_unlocks where participant_id = p.id
  ) u on true where p.id = target;
$$;

create function public.gn_me() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('participant', gn_private.gn_participant_json(auth.uid()),
    'event', public.gn_status(), 'server_now', now());
$$;

create function public.gn_register(participant_name text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare clean_name text; current_id uuid := auth.uid();
begin
  if current_id is null then raise exception 'Iniciá una sesión para registrarte.' using errcode='28000'; end if;
  clean_name := trim(regexp_replace(participant_name, '\s+', ' ', 'g'));
  if clean_name is null or char_length(clean_name) not between 1 and 40 then
    raise exception 'Escribí un nombre de hasta 40 caracteres.' using errcode='22023';
  end if;
  perform 1 from public.gn_event where id = true for share;
  if exists(select 1 from public.gn_participants where id = current_id) then
    update public.gn_participants set name=clean_name where id=current_id;
  else
    if not (public.gn_status()->>'is_open')::boolean then raise exception 'El recorrido está cerrado.' using errcode='P0001'; end if;
    insert into public.gn_participants(id,name) values(current_id,clean_name)
      on conflict (id) do update set name=excluded.name;
  end if;
  return public.gn_me();
end;
$$;

create function public.gn_unlock(track text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare current_id uuid := auth.uid();
begin
  if current_id is null then raise exception 'Primero registrá tu familia.' using errcode='28000'; end if;
  perform 1 from public.gn_event where id = true for share;
  perform 1 from public.gn_participants where id=current_id for update;
  if not found then raise exception 'Primero registrá tu familia.' using errcode='P0001'; end if;
  if exists(select 1 from public.gn_unlocks where participant_id=current_id and song_id=track) then
    return public.gn_me();
  end if;
  if not (public.gn_status()->>'is_open')::boolean then raise exception 'El recorrido está cerrado. Podés escuchar lo que ya conseguiste.' using errcode='P0001'; end if;
  insert into public.gn_unlocks(participant_id,song_id) values(current_id,track)
    on conflict (participant_id,song_id) do nothing;
  return public.gn_me();
end;
$$;

create function gn_private.gn_require_admin() returns void
language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null or not exists(select 1 from public.gn_admins where user_id=auth.uid()) then
    raise exception 'Acceso de organización requerido.' using errcode='42501';
  end if;
end;
$$;

create function public.gn_admin_snapshot() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  perform gn_private.gn_require_admin();
  return jsonb_build_object('event',public.gn_status(),'server_now',now(),
    'participants',coalesce((select jsonb_agg(gn_private.gn_participant_json(id) order by registered_at,id)
      from public.gn_participants),'[]'::jsonb));
end;
$$;

create function public.gn_admin_event(event_mode text, open_time timestamptz default null, close_time timestamptz default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  perform gn_private.gn_require_admin();
  if event_mode not in ('open','closed','closed_until','scheduled') or event_mode is null then
    raise exception 'Estado inválido.' using errcode='22023';
  end if;
  if event_mode='closed_until' and (open_time is null or open_time <= now()) then
    raise exception 'Elegí una hora futura para reabrir.' using errcode='22023';
  end if;
  if event_mode='scheduled' and (open_time is null or close_time is null or close_time <= open_time) then
    raise exception 'El cierre debe ser posterior a la apertura.' using errcode='22023';
  end if;
  update public.gn_event set mode=event_mode,
    opens_at=case when event_mode in ('closed_until','scheduled') then open_time end,
    closes_at=case when event_mode='scheduled' then close_time end where id=true;
  return public.gn_admin_snapshot();
end;
$$;

create function public.gn_admin_action(action text, target uuid default null, track text default null, confirmation text default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  perform gn_private.gn_require_admin();
  if action <> 'unlock_all' and confirmation is distinct from 'BORRAR' then
    raise exception 'Confirmá el borrado.' using errcode='22023';
  end if;
  perform 1 from public.gn_event where id = true for update;
  if action='delete_all' then
    delete from public.gn_participants;
    return public.gn_admin_snapshot();
  end if;
  perform 1 from public.gn_participants where id=target for update;
  if not found then raise exception 'Ese participante ya no existe.' using errcode='P0001'; end if;
  case action
    when 'delete_unlock' then
      delete from public.gn_unlocks where participant_id=target and song_id=track;
    when 'clear_unlocks' then
      delete from public.gn_unlocks where participant_id=target;
    when 'restart' then
      delete from public.gn_unlocks where participant_id=target;
      update public.gn_participants set registered_at=clock_timestamp(),is_test=false where id=target;
    when 'delete_participant' then
      delete from public.gn_participants where id=target;
    when 'unlock_all' then
      update public.gn_participants set is_test=true where id=target;
      insert into public.gn_unlocks(participant_id,song_id)
        select target,unnest(array['billie-jean','take-on-me','with-or-without-you','sweet-dreams','every-breath-you-take','bohemian-rhapsody','sweet-child','la-isla-bonita'])
        on conflict (participant_id,song_id) do nothing;
    else raise exception 'Acción inválida.' using errcode='22023';
  end case;
  return public.gn_admin_snapshot();
end;
$$;

revoke all on function public.gn_status(), gn_private.gn_participant_json(uuid), public.gn_me(), public.gn_register(text), public.gn_unlock(text), gn_private.gn_require_admin(), public.gn_admin_snapshot(), public.gn_admin_event(text,timestamptz,timestamptz), public.gn_admin_action(text,uuid,text,text) from public,anon,authenticated;
grant execute on function public.gn_status() to anon,authenticated;
grant execute on function public.gn_me(),public.gn_register(text),public.gn_unlock(text),public.gn_admin_snapshot(),public.gn_admin_event(text,timestamptz,timestamptz),public.gn_admin_action(text,uuid,text,text) to authenticated;

commit;
