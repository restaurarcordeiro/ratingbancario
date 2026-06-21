const SUPABASE_URL = 'https://spunbkuphwhtdsmgbjce.supabase.co';
const SERVICE_KEY = (process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwdW5ia3VwaHdodGRzbWdiamNlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTk4MDEwNSwiZXhwIjoyMDkxNTU2MTA1fQ.B8PNsTkHDSTgqQsqHaEcbbb0R48Q19NcV4Dot9P1Ejo').replace(/[\r\n\s]/g, '');

export default async function handler(req, res) {
  // PUT — trocar senha
  if (req.method === 'PUT') {
    const { user_id, nova_senha } = req.body;
    if (!user_id || !nova_senha) return res.status(400).json({ ok: false, error: 'user_id e nova_senha obrigatórios' });
    if (nova_senha.length < 6) return res.status(400).json({ ok: false, error: 'Senha deve ter no mínimo 6 caracteres' });

    const r = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${user_id}`, {
      method: 'PUT',
      headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: nova_senha }),
    });
    if (!r.ok) { const txt = await r.text(); return res.status(500).json({ ok: false, error: 'Erro ao trocar senha', detail: txt }); }
    return res.status(200).json({ ok: true });
  }

  // POST — criar usuário
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  const { nome, email, senha, telefone, afiliado_id } = req.body;
  if (!nome || !email || !senha) return res.status(400).json({ ok: false, error: 'nome, email e senha obrigatórios' });
  if (senha.length < 6) return res.status(400).json({ ok: false, error: 'Senha deve ter no mínimo 6 caracteres' });

  // Cria usuário no Auth
  const rAuth = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: senha, email_confirm: true, user_metadata: { nome } }),
  });

  if (!rAuth.ok) {
    const txt = await rAuth.text();
    let msg = 'Erro ao criar usuário';
    try { const j = JSON.parse(txt); msg = j.msg || j.message || msg; } catch(e) {}
    return res.status(500).json({ ok: false, error: msg });
  }

  const authData = await rAuth.json();
  const userId = authData.id;

  // Atualiza profile com nome, telefone e afiliado_id
  const profileBody = { nome, telefone: telefone || null, role: 'aluno' };
  if (afiliado_id) profileBody.afiliado_id = afiliado_id;

  await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
    method: 'PATCH',
    headers: {
      'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json', 'Prefer': 'return=minimal'
    },
    body: JSON.stringify(profileBody),
  });

  return res.status(200).json({ ok: true, user_id: userId });
}
