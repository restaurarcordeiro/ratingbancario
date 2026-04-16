-- =============================================
-- RATING BANCÁRIO PRO — SETUP SUPABASE
-- Execute este SQL no Supabase SQL Editor
-- =============================================

-- 1. TABELA DE PERFIS DE USUÁRIOS
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  nome text,
  telefone text,
  role text default 'aluno', -- 'aluno' ou 'admin'
  created_at timestamptz default now()
);

-- 2. TABELA DE PROGRESSO DAS TAREFAS
create table if not exists progresso (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  task_id text not null,
  created_at timestamptz default now(),
  unique(user_id, task_id)
);

-- 3. TABELA DE MENSAGENS DO CHAT
create table if not exists mensagens_chat (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  pergunta text,
  resposta text,
  created_at timestamptz default now()
);

-- 4. ROW LEVEL SECURITY (RLS)
alter table profiles enable row level security;
alter table progresso enable row level security;
alter table mensagens_chat enable row level security;

-- Políticas profiles
create policy "Usuário vê seu próprio perfil"
  on profiles for select using (auth.uid() = id);

create policy "Admin vê todos os perfis"
  on profiles for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Usuário atualiza seu perfil"
  on profiles for update using (auth.uid() = id);

create policy "Admin insere perfis"
  on profiles for insert with check (true);

-- Políticas progresso
create policy "Usuário vê seu progresso"
  on progresso for select using (auth.uid() = user_id);

create policy "Admin vê todo progresso"
  on progresso for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Usuário insere seu progresso"
  on progresso for insert with check (auth.uid() = user_id);

create policy "Usuário deleta seu progresso"
  on progresso for delete using (auth.uid() = user_id);

-- Políticas mensagens
create policy "Usuário vê suas mensagens"
  on mensagens_chat for select using (auth.uid() = user_id);

create policy "Admin vê todas mensagens"
  on mensagens_chat for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Usuário insere suas mensagens"
  on mensagens_chat for insert with check (auth.uid() = user_id);

-- 5. TRIGGER: criar perfil automaticamente após signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, nome, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
    'aluno'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 6. TABELA DE SOLICITAÇÕES DE ACESSO
create table if not exists solicitacoes (
  id uuid default gen_random_uuid() primary key,
  nome text not null,
  email text not null,
  telefone text,
  senha_temp text not null,
  status text default 'pendente', -- 'pendente', 'aprovado', 'rejeitado'
  created_at timestamptz default now()
);

alter table solicitacoes enable row level security;

-- Qualquer pessoa pode inserir (cadastro público)
create policy "Qualquer pessoa pode solicitar acesso"
  on solicitacoes for insert with check (true);

-- Somente admin lê, atualiza e deleta
create policy "Admin vê todas as solicitações"
  on solicitacoes for select using (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin','administrador'))
  );

create policy "Admin atualiza solicitações"
  on solicitacoes for update using (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin','administrador'))
  );

-- 7. CRIAR USUÁRIO ADMIN (execute após criar o usuário admin pelo painel Auth)
-- Substitua 'SEU_USER_ID_AQUI' pelo ID do usuário admin criado
-- update profiles set role = 'admin' where email = 'seu@email.com';
