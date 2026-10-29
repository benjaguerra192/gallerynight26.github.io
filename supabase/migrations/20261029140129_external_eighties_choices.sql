begin;
create or replace function public.gn_challenge(track text) returns jsonb
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
 select track id union all select id from (select id from unnest(array['Africa','Everybody Wants to Rule the World','Never Gonna Give You Up','Girls Just Want to Have Fun','Wake Me Up Before You Go-Go','Livin’ on a Prayer','Eye of the Tiger','Footloose']) id order by random() limit 2) distractors
 ) shuffled;
 insert into public.gn_attempts(participant_id,song_id,choices) values(current_id,track,options);
 else options:=attempt.choices;
 end if;
 return public.gn_me()||jsonb_build_object('challenge',jsonb_build_object('track',track,'choices',options));
end; $$;

-- Refresh only unanswered challenges. Saved answers and earned songs are unchanged.
do $$
declare pending record; options text[];
begin
 for pending in select participant_id,song_id from public.gn_attempts where answered_at is null for update loop
  select array_agg(id order by random()) into options from (
   select pending.song_id id union all select id from (select id from unnest(array['Africa','Everybody Wants to Rule the World','Never Gonna Give You Up','Girls Just Want to Have Fun','Wake Me Up Before You Go-Go','Livin’ on a Prayer','Eye of the Tiger','Footloose']) id order by random() limit 2) distractors
  ) shuffled;
  update public.gn_attempts set choices=options where participant_id=pending.participant_id and song_id=pending.song_id and answered_at is null;
 end loop;
end; $$;

commit;
