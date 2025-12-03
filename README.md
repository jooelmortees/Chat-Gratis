# 🤖 Super Chat GPT

Un chat de inteligencia artificial moderno y potente utilizando OpenRouter con múltiples modelos gratuitos.

## ✨ Características

- 🎨 **Interfaz moderna** - Diseño oscuro y elegante estilo ChatGPT
- 🚀 **Streaming en tiempo real** - Respuestas que aparecen mientras se generan
- 🔄 **Múltiples modelos IA** - Elige entre 5 modelos gratuitos diferentes
- 💾 **Historial de chats** - Guarda y recupera conversaciones anteriores
- 📝 **Soporte Markdown** - Formato de texto enriquecido en las respuestas
- 🖥️ **Resaltado de código** - Sintaxis coloreada para bloques de código
- 📋 **Copiar código** - Botón para copiar código fácilmente
- 📱 **Responsive** - Funciona en móviles y escritorio

## 🚀 Instalación

### 1. Obtener API Key de OpenRouter

1. Ve a [OpenRouter](https://openrouter.ai/)
2. Crea una cuenta o inicia sesión
3. Ve a [API Keys](https://openrouter.ai/keys)
4. Crea una nueva API Key

### 2. Configurar el proyecto

```bash
# Navegar a la carpeta del proyecto
cd super-chat-gpt

# Instalar dependencias
npm install

# Configurar la API Key
# Edita el archivo .env y reemplaza 'tu_api_key_aqui' con tu API Key real
```

### 3. Iniciar el servidor

```bash
npm start
```

### 4. Abrir en el navegador

Visita: [http://localhost:3000](http://localhost:3000)

## 🤖 Modelos Disponibles

| Modelo | Descripción |
|--------|-------------|
| 🐬 Dolphin Mistral | Modelo versátil y sin censura |
| 🦙 Llama 3.3 70B | Meta's latest large language model |
| 🔮 Qwen 2.5 72B | Alibaba's powerful multilingual model |
| ⚡ Gemini Flash 2.0 | Google's fast experimental model |
| 🔍 DeepSeek Chat | Excellent for coding and reasoning |

## 📁 Estructura del Proyecto

```
super-chat-gpt/
├── server.js           # Servidor Express con API
├── package.json        # Dependencias del proyecto
├── .env               # Variables de entorno (API Key)
└── public/
    ├── index.html     # Página principal
    ├── styles.css     # Estilos CSS
    └── app.js         # Lógica del frontend
```

## 🛠️ Tecnologías

- **Backend**: Node.js, Express
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **AI**: OpenRouter SDK
- **Librerías**: Marked.js, Highlight.js

## 📝 Uso

1. Escribe tu mensaje en el campo de texto
2. Presiona Enter o haz clic en el botón de enviar
3. Espera la respuesta de la IA (se muestra en tiempo real)
4. Usa las sugerencias rápidas para empezar
5. Cambia de modelo en cualquier momento desde el selector

## ⚙️ Variables de Entorno

| Variable | Descripción |
|----------|-------------|
| `OPENROUTER_API_KEY` | Tu API Key de OpenRouter |
| `PORT` | Puerto del servidor (default: 3000) |

## 🔒 Seguridad

- La API Key se almacena solo en el servidor
- Las conversaciones se guardan localmente en el navegador
- No se envían datos a terceros (solo a OpenRouter)

## 📄 Licencia

MIT License - Úsalo libremente para tus proyectos.

---

Creado con ❤️ usando OpenRouter AI
