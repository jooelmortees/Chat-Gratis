import { OpenRouter } from '@openrouter/sdk';

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

    const openrouter = new OpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY
    });

    const selectedModel = MODELS[model] || MODELS['dolphin-mistral'];

    // Configurar headers para streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    const stream = await openrouter.chat.send({
      model: selectedModel,
      messages: messages,
      stream: true
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();

  } catch (error) {
    console.error('Error en chat:', error);
    
    // Si ya empezamos a escribir, no podemos cambiar el status
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
