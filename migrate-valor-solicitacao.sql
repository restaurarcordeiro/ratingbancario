-- Adiciona campo valor_servico em solicitacoes e profiles
ALTER TABLE solicitacoes ADD COLUMN IF NOT EXISTS valor_servico NUMERIC(10,2) DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS valor_servico NUMERIC(10,2) DEFAULT 0;
