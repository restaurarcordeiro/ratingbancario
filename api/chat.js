export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Mensagens inválidas' });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Você é o Assistente Rating Pro, especialista em rating bancário e crédito no Brasil.
Ajude o usuário a melhorar seu perfil de crédito com dicas práticas e objetivas.
Seja direto, use linguagem simples e sempre incentive o usuário a completar as tarefas do plano de ação.
Responda sempre em português brasileiro.`
          },
          ...messages
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('OpenAI error:', JSON.stringify(data));
      return res.status(500).json({ error: 'OpenAI error: ' + (data?.error?.message || response.status) });
    }

    const resposta = data.choices[0]?.message?.content || 'Desculpe, não consegui processar sua mensagem.';
    res.status(200).json({ resposta });
  } catch (e) {
    console.error('Catch error:', e.message);
    res.status(500).json({ error: e.message });
  }
}
