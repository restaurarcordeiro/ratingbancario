const SUPABASE_URL = 'https://spunbkuphwhtdsmgbjce.supabase.co';
const SERVICE_KEY = (process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwdW5ia3VwaHdodGRzbWdiamNlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTk4MDEwNSwiZXhwIjoyMDkxNTU2MTA1fQ.B8PNsTkHDSTgqQsqHaEcbbb0R48Q19NcV4Dot9P1Ejo').replace(/[\r\n\s]/g, '');

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { aluno_id, nova_senha } = req.body;
  if (!aluno_id || !nova_senha) return res.status(400).json({ error: 'aluno_id e nova_senha obrigatórios' });
  if (nova_senha.length < 6) return res.status(400).json({ error: 'Senha deve ter no mínimo 6 caracteres' });

  const r = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${aluno_id}`, {
    method: 'PUT',
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ password: nova_senha }),
  });

  if (!r.ok) {
    const txt = await r.text();
    return res.status(500).json({ error: 'Erro ao trocar senha', detail: txt });
  }

  return res.status(200).json({ ok: true });
}
