-- =============================================
-- RATING BANCÁRIO PRO — MIGRAÇÃO AFILIADOS
-- Execute este SQL no Supabase SQL Editor
-- =============================================

-- 1. Adiciona colunas na tabela profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS afiliado_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- 2. Atualiza role para incluir 'afiliado'
-- (o campo já é TEXT, basta usar 'afiliado' como valor)

-- 3. Função auxiliar sem recursão
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_my_afiliado_id()
RETURNS UUID AS $$
  SELECT afiliado_id FROM profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- 4. Remove policies antigas de profiles que causam recursão
DROP POLICY IF EXISTS "Admin vê todos os perfis" ON profiles;
DROP POLICY IF EXISTS "Usuário vê seu próprio perfil" ON profiles;
DROP POLICY IF EXISTS "Usuário atualiza seu perfil" ON profiles;
DROP POLICY IF EXISTS "Admin insere perfis" ON profiles;

-- 5. Recria policies de profiles sem recursão
CREATE POLICY "profiles_self" ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_admin_afiliado_select" ON profiles FOR SELECT USING (
  get_my_role() IN ('admin', 'administrador', 'afiliado')
);

CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (true);

CREATE POLICY "profiles_update_self" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_admin_update" ON profiles FOR UPDATE USING (
  get_my_role() IN ('admin', 'administrador', 'afiliado')
);

-- 6. Policies para solicitacoes — afiliado vê as suas
DROP POLICY IF EXISTS "Admin vê todas as solicitações" ON solicitacoes;
DROP POLICY IF EXISTS "Admin atualiza solicitações" ON solicitacoes;

CREATE POLICY "solicitacoes_admin_select" ON solicitacoes FOR SELECT USING (
  get_my_role() IN ('admin', 'administrador', 'afiliado')
);

CREATE POLICY "solicitacoes_admin_update" ON solicitacoes FOR UPDATE USING (
  get_my_role() IN ('admin', 'administrador', 'afiliado')
);

-- 7. Adiciona coluna afiliado_slug em solicitacoes para rastrear indicação
ALTER TABLE solicitacoes ADD COLUMN IF NOT EXISTS afiliado_slug TEXT;
ALTER TABLE solicitacoes ADD COLUMN IF NOT EXISTS afiliado_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
