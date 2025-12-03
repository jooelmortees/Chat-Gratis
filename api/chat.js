const MODELS = {
  'dolphin-mistral': 'cognitivecomputations/dolphin-mistral-24b-venice-edition:free',
  'llama-3.3': 'meta-llama/llama-3.3-70b-instruct:free',
  'qwen-2.5': 'qwen/qwen-2.5-72b-instruct:free',
  'gemini-flash': 'google/gemini-2.0-flash-exp:free',
  'deepseek-chat': 'deepseek/deepseek-chat:free'
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages, model = 'dolphin-mistral' } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const selectedModel = MODELS[model] || MODELS['dolphin-mistral'];
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    // Llamada a OpenRouter API directamente con fetch
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': req.headers.referer || 'https://chat-gratis.vercel.app',
        'X-Title': 'Super Chat GPT'
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: messages,
        stream: true
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenRouter Error:', errorData);
      return res.status(response.status).json({ error: `API Error: ${response.status}` });
    }

    // Configurar headers para streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            res.write('data: [DONE]\n\n');
            continue;
          }
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              res.write(`data: ${JSON.stringify({ content })}\n\n`);
            }
          } catch (e) {
            // Ignorar errores de parsing
          }
        }
      }
    }

    res.end();

  } catch (error) {
    console.error('Error en chat:', error);
    
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    } else {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  }
}

export const config = {
  maxDuration: 60,
};
