const SUPABASE_URL = 'https://spunbkuphwhtdsmgbjce.supabase.co';
const SERVICE_KEY = (process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwdW5ia3VwaHdodGRzbWdiamNlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTk4MDEwNSwiZXhwIjoyMDkxNTU2MTA1fQ.B8PNsTkHDSTgqQsqHaEcbbb0R48Q19NcV4Dot9P1Ejo').replace(/[\r\n\s]/g, '');

async function sbDelete(table, userId) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?user_id=eq.${userId}`, {
    method: 'DELETE',
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
  });
  return r;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { aluno_id } = req.body;
  if (!aluno_id) return res.status(400).json({ error: 'aluno_id obrigatório' });

  // Deleta progresso e mensagens (user_id)
  await sbDelete('progresso', aluno_id);
  await sbDelete('mensagens_chat', aluno_id);

  // Deleta profile (id)
  const rProfile = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${aluno_id}`, {
    method: 'DELETE',
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  if (!rProfile.ok) {
    const txt = await rProfile.text();
    return res.status(500).json({ error: 'Erro ao excluir profile', detail: txt });
  }

  // Deleta usuário Auth (permanente)
  const rAuth = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${aluno_id}`, {
    method: 'DELETE',
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
    },
  });

  return res.status(200).json({ ok: true });
}
