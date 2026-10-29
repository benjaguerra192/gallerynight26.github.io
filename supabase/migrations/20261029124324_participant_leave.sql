begin;

create function public.gn_leave(confirmation text) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Iniciá una sesión para salir.' using errcode='28000'; end if;
  if confirmation is distinct from 'SALIR' then raise exception 'Confirmá el borrado de tu participante.' using errcode='22023'; end if;
  perform 1 from public.gn_event where id=true for share;
  delete from public.gn_participants where id=auth.uid();
  return jsonb_build_object('participant',null,'event',public.gn_status(),'server_now',now());
end;
$$;
revoke all on function public.gn_leave(text) from public,anon,authenticated;
grant execute on function public.gn_leave(text) to authenticated;

commit;
