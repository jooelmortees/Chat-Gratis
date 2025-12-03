import express from 'express';
import cors from 'cors';
import { OpenRouter } from '@openrouter/sdk';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(join(__dirname, 'public')));

// Inicializar OpenRouter
const openrouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY
});

// Modelos disponibles (gratuitos y de pago)
const MODELS = {
  'dolphin-mistral': 'cognitivecomputations/dolphin-mistral-24b-venice-edition:free',
  'llama-3.3': 'meta-llama/llama-3.3-70b-instruct:free',
  'qwen-2.5': 'qwen/qwen-2.5-72b-instruct:free',
  'gemini-flash': 'google/gemini-2.0-flash-exp:free',
  'deepseek-chat': 'deepseek/deepseek-chat:free'
};

// Endpoint para chat con streaming
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, model = 'dolphin-mistral' } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // Configurar headers para streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const selectedModel = MODELS[model] || MODELS['dolphin-mistral'];

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
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para obtener modelos disponibles
app.get('/api/models', (req, res) => {
  res.json(Object.keys(MODELS));
});

// Servir la página principal
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Super Chat GPT corriendo en http://localhost:${PORT}`);
  console.log(`📡 API disponible en http://localhost:${PORT}/api/chat`);
});
