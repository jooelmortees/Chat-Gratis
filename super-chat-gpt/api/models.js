export default function handler(req, res) {
  const models = [
    'dolphin-mistral',
    'llama-3.3',
    'qwen-2.5',
    'gemini-flash',
    'deepseek-chat'
  ];
  
  res.status(200).json(models);
}
