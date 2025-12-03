// Super Chat GPT - Frontend Application
class SuperChatGPT {
    constructor() {
        this.messages = [];
        this.chatHistory = this.loadChatHistory();
        this.currentChatId = null;
        this.isStreaming = false;
        
        this.initElements();
        this.initEventListeners();
        this.renderChatHistory();
    }

    initElements() {
        this.chatMessages = document.getElementById('chat-messages');
        this.messageInput = document.getElementById('message-input');
        this.sendBtn = document.getElementById('send-btn');
        this.newChatBtn = document.getElementById('new-chat');
        this.clearChatBtn = document.getElementById('clear-chat');
        this.modelSelect = document.getElementById('model-select');
        this.historyList = document.getElementById('history-list');
        this.statusText = document.getElementById('status-text');
    }

    initEventListeners() {
        // Send message
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        
        // Input handling
        this.messageInput.addEventListener('input', () => {
            this.autoResizeTextarea();
            this.updateSendButton();
        });

        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // New chat
        this.newChatBtn.addEventListener('click', () => this.startNewChat());

        // Clear chat
        this.clearChatBtn.addEventListener('click', () => this.clearCurrentChat());

        // Suggestions
        document.querySelectorAll('.suggestion').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const prompt = e.target.dataset.prompt;
                this.messageInput.value = prompt;
                this.updateSendButton();
                this.sendMessage();
            });
        });
    }

    autoResizeTextarea() {
        this.messageInput.style.height = 'auto';
        this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 150) + 'px';
    }

    updateSendButton() {
        const hasText = this.messageInput.value.trim().length > 0;
        this.sendBtn.disabled = !hasText || this.isStreaming;
    }

    async sendMessage() {
        const content = this.messageInput.value.trim();
        if (!content || this.isStreaming) return;

        // Si es un chat nuevo, crearlo
        if (!this.currentChatId) {
            this.currentChatId = Date.now().toString();
            this.messages = [];
        }

        // Ocultar mensaje de bienvenida
        const welcomeMessage = this.chatMessages.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.remove();
        }

        // Agregar mensaje del usuario
        this.messages.push({ role: 'user', content });
        this.renderMessage('user', content);

        // Limpiar input
        this.messageInput.value = '';
        this.autoResizeTextarea();
        this.updateSendButton();

        // Mostrar indicador de escritura
        this.showTypingIndicator();
        this.isStreaming = true;
        this.updateStatus('Generando respuesta...');

        try {
            const response = await this.streamChat();
            this.messages.push({ role: 'assistant', content: response });
            this.saveChatToHistory();
        } catch (error) {
            console.error('Error:', error);
            this.showError('Error al comunicarse con la IA. Verifica tu API key.');
        } finally {
            this.isStreaming = false;
            this.updateSendButton();
            this.updateStatus('Conectado');
        }
    }

    async streamChat() {
        const model = this.modelSelect.value;
        
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: this.messages,
                model: model
            })
        });

        if (!response.ok) {
            throw new Error('Error en la respuesta del servidor');
        }

        // Remover indicador de escritura
        this.removeTypingIndicator();

        // Crear mensaje de respuesta vacío
        const messageElement = this.createMessageElement('assistant', '');
        this.chatMessages.appendChild(messageElement);
        const contentElement = messageElement.querySelector('.message-text');

        let fullContent = '';
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') continue;

                    try {
                        const parsed = JSON.parse(data);
                        if (parsed.content) {
                            fullContent += parsed.content;
                            contentElement.innerHTML = this.formatMessage(fullContent);
                            this.highlightCode(contentElement);
                            this.scrollToBottom();
                        }
                    } catch (e) {
                        // Ignorar errores de parsing
                    }
                }
            }
        }

        return fullContent;
    }

    createMessageElement(role, content) {
        const div = document.createElement('div');
        div.className = `message ${role}`;
        
        const avatar = role === 'user' ? '👤' : '🤖';
        
        div.innerHTML = `
            <div class="message-avatar">${avatar}</div>
            <div class="message-content">
                <div class="message-text">${this.formatMessage(content)}</div>
            </div>
        `;
        
        return div;
    }

    renderMessage(role, content) {
        const messageElement = this.createMessageElement(role, content);
        this.chatMessages.appendChild(messageElement);
        this.highlightCode(messageElement);
        this.scrollToBottom();
    }

    formatMessage(content) {
        // Usar marked para convertir Markdown a HTML
        if (typeof marked !== 'undefined') {
            marked.setOptions({
                breaks: true,
                gfm: true,
                highlight: function(code, lang) {
                    if (typeof hljs !== 'undefined' && lang && hljs.getLanguage(lang)) {
                        return hljs.highlight(code, { language: lang }).value;
                    }
                    return code;
                }
            });
            return marked.parse(content);
        }
        return content.replace(/\n/g, '<br>');
    }

    highlightCode(element) {
        if (typeof hljs !== 'undefined') {
            element.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightElement(block);
                this.addCopyButton(block.parentElement);
            });
        }
    }

    addCopyButton(preElement) {
        if (preElement.querySelector('.copy-btn')) return;
        
        const wrapper = document.createElement('div');
        wrapper.className = 'code-block-wrapper';
        preElement.parentNode.insertBefore(wrapper, preElement);
        wrapper.appendChild(preElement);

        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-btn';
        copyBtn.textContent = '📋 Copiar';
        copyBtn.addEventListener('click', async () => {
            const code = preElement.querySelector('code').textContent;
            await navigator.clipboard.writeText(code);
            copyBtn.textContent = '✅ Copiado!';
            setTimeout(() => {
                copyBtn.textContent = '📋 Copiar';
            }, 2000);
        });
        wrapper.appendChild(copyBtn);
    }

    showTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'message assistant loading-message';
        indicator.id = 'typing-indicator';
        indicator.innerHTML = `
            <div class="message-avatar">🤖</div>
            <div class="message-content">
                <div class="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        this.chatMessages.appendChild(indicator);
        this.scrollToBottom();
    }

    removeTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    showError(message) {
        this.removeTypingIndicator();
        const errorDiv = document.createElement('div');
        errorDiv.className = 'message assistant';
        errorDiv.innerHTML = `
            <div class="message-avatar">⚠️</div>
            <div class="message-content" style="background: rgba(248, 81, 73, 0.2); border-color: var(--error-color);">
                <div class="message-text">${message}</div>
            </div>
        `;
        this.chatMessages.appendChild(errorDiv);
        this.scrollToBottom();
    }

    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    updateStatus(text) {
        this.statusText.textContent = text;
    }

    startNewChat() {
        this.currentChatId = null;
        this.messages = [];
        this.chatMessages.innerHTML = `
            <div class="welcome-message">
                <div class="welcome-icon">🤖</div>
                <h2>¡Bienvenido a Super Chat GPT!</h2>
                <p>Soy tu asistente de IA potenciado por múltiples modelos avanzados.</p>
                <div class="suggestions">
                    <button class="suggestion" data-prompt="Explícame qué es la inteligencia artificial">
                        💡 ¿Qué es la IA?
                    </button>
                    <button class="suggestion" data-prompt="Escribe un poema sobre el futuro de la tecnología">
                        ✍️ Escribe un poema
                    </button>
                    <button class="suggestion" data-prompt="Dame 5 ideas para proyectos de programación">
                        💻 Ideas de proyectos
                    </button>
                    <button class="suggestion" data-prompt="Explica cómo funciona el machine learning de forma sencilla">
                        🧠 Explica Machine Learning
                    </button>
                </div>
            </div>
        `;
        
        // Re-attach suggestion listeners
        document.querySelectorAll('.suggestion').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const prompt = e.target.dataset.prompt;
                this.messageInput.value = prompt;
                this.updateSendButton();
                this.sendMessage();
            });
        });

        this.renderChatHistory();
    }

    clearCurrentChat() {
        if (this.currentChatId) {
            this.chatHistory = this.chatHistory.filter(chat => chat.id !== this.currentChatId);
            this.saveChatHistory();
        }
        this.startNewChat();
    }

    saveChatToHistory() {
        if (!this.currentChatId || this.messages.length === 0) return;

        const title = this.messages[0].content.substring(0, 50) + (this.messages[0].content.length > 50 ? '...' : '');
        
        const existingIndex = this.chatHistory.findIndex(chat => chat.id === this.currentChatId);
        const chatData = {
            id: this.currentChatId,
            title: title,
            messages: this.messages,
            date: new Date().toLocaleDateString('es-ES'),
            model: this.modelSelect.value
        };

        if (existingIndex >= 0) {
            this.chatHistory[existingIndex] = chatData;
        } else {
            this.chatHistory.unshift(chatData);
        }

        // Limitar a 20 conversaciones
        if (this.chatHistory.length > 20) {
            this.chatHistory = this.chatHistory.slice(0, 20);
        }

        this.saveChatHistory();
        this.renderChatHistory();
    }

    loadChatHistory() {
        try {
            return JSON.parse(localStorage.getItem('superChatHistory')) || [];
        } catch {
            return [];
        }
    }

    saveChatHistory() {
        localStorage.setItem('superChatHistory', JSON.stringify(this.chatHistory));
    }

    renderChatHistory() {
        this.historyList.innerHTML = '';
        
        if (this.chatHistory.length === 0) {
            this.historyList.innerHTML = '<p style="color: var(--text-secondary); font-size: 0.85rem;">No hay conversaciones guardadas</p>';
            return;
        }

        this.chatHistory.forEach(chat => {
            const item = document.createElement('div');
            item.className = `history-item ${chat.id === this.currentChatId ? 'active' : ''}`;
            item.innerHTML = `
                <div class="history-item-title">${chat.title}</div>
                <div class="history-item-date">${chat.date}</div>
            `;
            item.addEventListener('click', () => this.loadChat(chat.id));
            this.historyList.appendChild(item);
        });
    }

    loadChat(chatId) {
        const chat = this.chatHistory.find(c => c.id === chatId);
        if (!chat) return;

        this.currentChatId = chatId;
        this.messages = [...chat.messages];
        this.modelSelect.value = chat.model || 'dolphin-mistral';

        // Renderizar mensajes
        this.chatMessages.innerHTML = '';
        this.messages.forEach(msg => {
            this.renderMessage(msg.role, msg.content);
        });

        this.renderChatHistory();
    }
}

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', () => {
    window.superChat = new SuperChatGPT();
});
