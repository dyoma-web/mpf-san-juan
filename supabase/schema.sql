-- =====================================================================
-- MPF San Juan · Sistema de comentarios de revisión
-- Ejecutar una vez en Supabase › SQL Editor.
-- Las tablas quedan cerradas (RLS sin políticas): todo el acceso pasa
-- por funciones SECURITY DEFINER que validan el código de sesión.
-- =====================================================================
create extension if not exists pgcrypto;

create table if not exists public.review_config (key text primary key, value text not null);

create table if not exists public.review_comments (
  id uuid primary key default gen_random_uuid(),
  num bigint generated always as identity,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  page text not null, page_title text, selector text, rel_x real, rel_y real, snippet text, viewport_w int,
  kind text not null check (kind in ('corregir','agregar','eliminar','idea','pregunta','redaccion')),
  status text not null default 'abierto' check (status in ('abierto','en_curso','resuelto')),
  body text not null default '', quote text, proposal text,
  author_id text not null, author_name text not null, author_color text,
  version text, resolved_ref text, resolved_at timestamptz
);
create index if not exists review_comments_page_idx on public.review_comments(page);

create table if not exists public.review_replies (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.review_comments(id) on delete cascade,
  created_at timestamptz not null default now(),
  body text not null, author_id text not null, author_name text not null, author_color text
);
create index if not exists review_replies_comment_idx on public.review_replies(comment_id);

create table if not exists public.review_votes (
  comment_id uuid not null references public.review_comments(id) on delete cascade,
  author_id text not null, author_name text,
  created_at timestamptz not null default now(),
  primary key (comment_id, author_id)
);

alter table public.review_config enable row level security;
alter table public.review_comments enable row level security;
alter table public.review_replies enable row level security;
alter table public.review_votes enable row level security;

create or replace function public.review_assert(p_code text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_code is null or not exists (select 1 from review_config where key = 'session_code' and value = p_code) then
    raise exception 'codigo_invalido' using errcode = '28000';
  end if;
end $$;

create or replace function public.review_check(p_code text)
returns boolean language sql security definer set search_path = public as $$
  select exists (select 1 from review_config where key = 'session_code' and value = p_code);
$$;

create or replace function public.review_list(p_code text)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  perform review_assert(p_code);
  return coalesce((
    select jsonb_agg(to_jsonb(c) || jsonb_build_object(
      'replies', coalesce((select jsonb_agg(to_jsonb(r) order by r.created_at) from review_replies r where r.comment_id = c.id), '[]'::jsonb),
      'voters', coalesce((select jsonb_agg(jsonb_build_object('id', v.author_id, 'name', v.author_name)) from review_votes v where v.comment_id = c.id), '[]'::jsonb)
    ) order by c.num)
    from review_comments c
  ), '[]'::jsonb);
end $$;

create or replace function public.review_add_comment(p_code text, p jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r review_comments;
begin
  perform review_assert(p_code);
  insert into review_comments (page, page_title, selector, rel_x, rel_y, snippet, viewport_w, kind, body, quote, proposal, author_id, author_name, author_color, version)
  values (left(p->>'page', 300), left(p->>'page_title', 300), left(p->>'selector', 2000), (p->>'rel_x')::real, (p->>'rel_y')::real,
          left(p->>'snippet', 300), (p->>'viewport_w')::int, p->>'kind', left(coalesce(p->>'body', ''), 5000),
          left(p->>'quote', 3000), left(p->>'proposal', 5000), left(p->>'author_id', 80), left(p->>'author_name', 80),
          left(p->>'author_color', 20), left(p->>'version', 80))
  returning * into r;
  return to_jsonb(r);
end $$;

create or replace function public.review_update_comment(p_code text, p_id uuid, p_author text, p jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r review_comments;
begin
  perform review_assert(p_code);
  select * into r from review_comments where id = p_id;
  if not found then raise exception 'no_existe'; end if;
  -- Cualquier participante puede cambiar el estado; el contenido solo quien lo escribió.
  if p ? 'status' then
    update review_comments set status = p->>'status', updated_at = now(),
      resolved_at = case when p->>'status' = 'resuelto' then now() else null end,
      resolved_ref = case when p->>'status' = 'resuelto' then coalesce(left(p->>'resolved_ref', 200), resolved_ref) else null end
    where id = p_id;
  end if;
  if (p ? 'body' or p ? 'proposal' or p ? 'kind') then
    if r.author_id <> p_author then raise exception 'solo_autor'; end if;
    update review_comments set body = coalesce(left(p->>'body', 5000), body), proposal = coalesce(left(p->>'proposal', 5000), proposal),
      kind = coalesce(p->>'kind', kind), updated_at = now()
    where id = p_id;
  end if;
  select * into r from review_comments where id = p_id;
  return to_jsonb(r);
end $$;

create or replace function public.review_delete_comment(p_code text, p_id uuid, p_author text)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  perform review_assert(p_code);
  delete from review_comments where id = p_id and author_id = p_author;
  return found;
end $$;

create or replace function public.review_add_reply(p_code text, p jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r review_replies;
begin
  perform review_assert(p_code);
  insert into review_replies (comment_id, body, author_id, author_name, author_color)
  values ((p->>'comment_id')::uuid, left(p->>'body', 5000), left(p->>'author_id', 80), left(p->>'author_name', 80), left(p->>'author_color', 20))
  returning * into r;
  return to_jsonb(r);
end $$;

create or replace function public.review_toggle_vote(p_code text, p_id uuid, p_author text, p_name text)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  perform review_assert(p_code);
  delete from review_votes where comment_id = p_id and author_id = p_author;
  if found then return false; end if;
  insert into review_votes (comment_id, author_id, author_name) values (p_id, left(p_author, 80), left(p_name, 80));
  return true;
end $$;

revoke all on function public.review_assert(text) from public, anon, authenticated;
revoke all on function public.review_check(text), public.review_list(text), public.review_add_comment(text, jsonb),
  public.review_update_comment(text, uuid, text, jsonb), public.review_delete_comment(text, uuid, text),
  public.review_add_reply(text, jsonb), public.review_toggle_vote(text, uuid, text, text) from public;
grant execute on function public.review_check(text), public.review_list(text), public.review_add_comment(text, jsonb),
  public.review_update_comment(text, uuid, text, jsonb), public.review_delete_comment(text, uuid, text),
  public.review_add_reply(text, jsonb), public.review_toggle_vote(text, uuid, text, text) to anon, authenticated;

-- Código de sesión: cambialo por uno propio y compartilo solo con quienes participan.
-- insert into public.review_config (key, value) values ('session_code', 'TU-CODIGO')
--   on conflict (key) do update set value = excluded.value;
