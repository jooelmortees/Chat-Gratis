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
        'HTTP-Referer': 'https://nova-ai.vercel.app',
        'X-Title': 'Nova AI'
      },
      body: JSON.stringify({
        model: models[model] || models['mistral'],
        messages: messages,
        stream: true
      })
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(500).json({ error: 'Service unavailable' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

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
              res.write(`data: ${JSON.stringify({ text: content })}\n\n`);
            }
          } catch (e) {}
        }
      }
    }

    res.end();
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({ error: 'Connection failed' });
    } else {
      res.end();
    }
  }
}

export const config = {
  maxDuration: 60
};
