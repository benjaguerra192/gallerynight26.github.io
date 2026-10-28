-- Explicit WHERE is required by the hosted safe-update guard.
begin;

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

commit;
