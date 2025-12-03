class Chat {
    constructor() {
        this.messages = [];
        this.history = JSON.parse(localStorage.getItem('chatHistory')) || [];
        this.currentId = null;
        this.loading = false;

        this.dom = {
            messages: document.getElementById('messages'),
            input: document.getElementById('userInput'),
            send: document.getElementById('sendBtn'),
            newChat: document.getElementById('newChat'),
            model: document.getElementById('modelSelect'),
            conversations: document.getElementById('conversations'),
            emptyState: document.getElementById('emptyState')
        };

        this.init();
    }

    init() {
        this.dom.send.addEventListener('click', () => this.send());
        this.dom.newChat.addEventListener('click', () => this.newChat());

        this.dom.input.addEventListener('input', () => {
            this.dom.input.style.height = 'auto';
            this.dom.input.style.height = Math.min(this.dom.input.scrollHeight, 120) + 'px';
            this.dom.send.disabled = !this.dom.input.value.trim() || this.loading;
        });

        this.dom.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.send();
            }
        });

        document.querySelectorAll('.suggestion').forEach(btn => {
            btn.addEventListener('click', () => {
                this.dom.input.value = btn.dataset.text;
                this.dom.send.disabled = false;
                this.send();
            });
        });

        this.renderHistory();
    }

    async send() {
        const text = this.dom.input.value.trim();
        if (!text || this.loading) return;

        if (!this.currentId) {
            this.currentId = Date.now().toString();
            this.messages = [];
        }

        const emptyState = document.getElementById('emptyState');
        if (emptyState) {
            emptyState.remove();
        }

        this.messages.push({ role: 'user', content: text });
        this.addMessage('user', text);

        this.dom.input.value = '';
        this.dom.input.style.height = 'auto';
        this.dom.send.disabled = true;
        this.loading = true;

        const loader = this.addLoader();

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: this.messages,
                    model: this.dom.model.value
                })
            });

            loader.remove();

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Error del servidor');
            }

            const data = await res.json();
            const responseText = data.text || 'Sin respuesta';

            this.addMessage('assistant', responseText);
            this.messages.push({ role: 'assistant', content: responseText });
            this.saveChat();

        } catch (err) {
            loader.remove();
            this.addMessage('assistant', 'Error: ' + err.message);
        }

        this.loading = false;
        this.dom.send.disabled = !this.dom.input.value.trim();
    }

    addMessage(role, text) {
        const div = document.createElement('div');
        div.className = `message ${role}`;

        const icon = role === 'user' ? '→' : 'N';

        div.innerHTML = `
            <div class="avatar">${icon}</div>
            <div class="message-content">
                <div class="msg-text">${this.format(text)}</div>
            </div>
        `;

        this.dom.messages.appendChild(div);
        this.scroll();
        return div;
    }

    addLoader() {
        const div = document.createElement('div');
        div.className = 'message assistant';
        div.id = 'loader';
        div.innerHTML = `
            <div class="avatar">N</div>
            <div class="message-content">
                <div class="typing"><span></span><span></span><span></span></div>
            </div>
        `;
        this.dom.messages.appendChild(div);
        this.scroll();
        return div;
    }

    format(text) {
        if (!text) return '';

        // Code blocks
        text = text.replace(/```(\w*)\n?([\s\S]*?)```/g, '<pre><code>$2</code></pre>');
        
        // Inline code
        text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        // Bold
        text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        
        // Italic
        text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
        
        // Lists
        text = text.replace(/^\s*[-*]\s+(.+)$/gm, '<li>$1</li>');
        text = text.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
        
        // Paragraphs
        text = text.split('\n\n').map(p => {
            if (p.startsWith('<pre>') || p.startsWith('<ul>') || p.startsWith('<li>')) {
                return p;
            }
            return `<p>${p.replace(/\n/g, '<br>')}</p>`;
        }).join('');

        return text;
    }

    scroll() {
        this.dom.messages.scrollTop = this.dom.messages.scrollHeight;
    }

    newChat() {
        this.currentId = null;
        this.messages = [];
        this.dom.messages.innerHTML = `
            <div class="empty-state" id="emptyState">
                <h1>Nova</h1>
                <p>¿En qué puedo ayudarte hoy?</p>
                <div class="suggestions">
                    <button class="suggestion" data-text="Explícame cómo funciona la recursividad en programación">
                        Explicar recursividad
                    </button>
                    <button class="suggestion" data-text="Escribe una función en JavaScript para ordenar un array">
                        Código JavaScript
                    </button>
                    <button class="suggestion" data-text="¿Cuáles son las mejores prácticas de CSS moderno?">
                        CSS moderno
                    </button>
                    <button class="suggestion" data-text="Dame ideas para un proyecto de portfolio web">
                        Ideas portfolio
                    </button>
                </div>
            </div>
        `;

        document.querySelectorAll('.suggestion').forEach(btn => {
            btn.addEventListener('click', () => {
                this.dom.input.value = btn.dataset.text;
                this.dom.send.disabled = false;
                this.send();
            });
        });

        this.renderHistory();
    }

    saveChat() {
        if (!this.currentId || this.messages.length < 2) return;

        const title = this.messages[0].content.slice(0, 40);
        const idx = this.history.findIndex(c => c.id === this.currentId);

        const chat = {
            id: this.currentId,
            title,
            messages: this.messages
        };

        if (idx >= 0) {
            this.history[idx] = chat;
        } else {
            this.history.unshift(chat);
        }

        if (this.history.length > 15) {
            this.history = this.history.slice(0, 15);
        }

        localStorage.setItem('chatHistory', JSON.stringify(this.history));
        this.renderHistory();
    }

    renderHistory() {
        this.dom.conversations.innerHTML = '';

        this.history.forEach(chat => {
            const div = document.createElement('div');
            div.className = `conv-item ${chat.id === this.currentId ? 'active' : ''}`;
            div.textContent = chat.title;
            div.addEventListener('click', () => this.loadChat(chat.id));
            this.dom.conversations.appendChild(div);
        });
    }

    loadChat(id) {
        const chat = this.history.find(c => c.id === id);
        if (!chat) return;

        this.currentId = id;
        this.messages = [...chat.messages];
        this.dom.messages.innerHTML = '';

        this.messages.forEach(m => this.addMessage(m.role, m.content));
        this.renderHistory();
    }
}

document.addEventListener('DOMContentLoaded', () => new Chat());
