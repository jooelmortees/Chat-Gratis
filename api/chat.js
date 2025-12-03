export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages, model } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid request' });
  }

  const models = {
    'mistral': 'cognitivecomputations/dolphin-mistral-24b-venice-edition:free',
    'llama': 'meta-llama/llama-3.3-70b-instruct:free',
    'qwen': 'qwen/qwen-2.5-72b-instruct:free',
    'gemini': 'google/gemini-2.0-flash-exp:free',
    'deepseek': 'deepseek/deepseek-chat:free'
  };

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer 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',
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://chat-gratis.vercel.app',
        'X-Title': 'Nova'
      },
      body: JSON.stringify({
        model: models[model] || models['gemini'],
        messages: messages
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter error:', errorText);
      return res.status(500).json({ error: 'API error', details: errorText });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || 'Sin respuesta';
    
    return res.status(200).json({ text: content });

  } catch (error) {
    console.error('Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}

export const config = {
  maxDuration: 60
};
