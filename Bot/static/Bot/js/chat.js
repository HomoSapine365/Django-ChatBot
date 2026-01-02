const chatBox = document.getElementById('chat-box');
const msgInput = document.getElementById('msg-input');
const sendBtn = document.getElementById('send-btn');
const micBtn = document.getElementById('mic-btn');
const saveBtn = document.getElementById('save-btn');
const downloadBtn = document.getElementById('download-btn');
const newChatBtn = document.getElementById('new-chat-btn');
const deleteAllBtn = document.getElementById('delete-all-btn');
const historyList = document.getElementById('history-list');
const typingIndicator = document.getElementById('typing-indicator');
const themeSelect = document.getElementById('theme-select');
const imageInput = document.getElementById('image-input');
const imageBtn = document.getElementById('image-btn');
const imagePreview = document.getElementById('image-preview');
const previewImg = document.getElementById('preview-img');

const IS_AUTH = document.body.dataset.auth === "1";

/* ================= STATE ================= */
let conversations = [];
let currentId = null;

/* ================= THEME ================= */
(function () {
    let t = localStorage.getItem('chat_theme');
    if (!t) {
        const m = document.cookie.match(/chat_theme=(dark|light)/);
        t = m ? m[1] : 'light';
    }
    document.body.classList.remove('theme-dark', 'theme-light');
    document.body.classList.add('theme-' + t);
    localStorage.setItem('chat_theme', t);
    document.cookie = `chat_theme=${t};path=/`;
    if (themeSelect) themeSelect.value = t;
})();

if (themeSelect) {
    themeSelect.onchange = () => {
        const t = themeSelect.value;
        document.body.classList.remove('theme-dark', 'theme-light');
        document.body.classList.add('theme-' + t);
        localStorage.setItem('chat_theme', t);
        document.cookie = `chat_theme=${t};path=/`;
    };
}

/* ================= STORAGE ================= */
function saveState() {
    localStorage.setItem('conversations', JSON.stringify(conversations));
    localStorage.setItem('currentId', currentId || '');
}

function loadState() {
    try {
        conversations = JSON.parse(localStorage.getItem('conversations')) || [];
        currentId = localStorage.getItem('currentId');
    } catch {
        conversations = [];
        currentId = null;
    }
}

function currentConv() {
    return conversations.find(c => c.id === currentId);
}

/* ================= UI ================= */
function renderSidebar() {
    if (!historyList) return;
    historyList.innerHTML = '';

    conversations.slice().reverse().forEach(c => {
        const row = document.createElement('div');
        row.className = 'd-flex align-items-center justify-content-between mb-1';

        const btn = document.createElement('button');
        btn.className = 'history-item flex-grow-1';
        if (c.id === currentId) btn.classList.add('active-conv');
        btn.textContent = c.title || 'New chat';
        btn.onclick = () => switchConversation(c.id);

        const del = document.createElement('button');
        del.className = 'btn btn-sm btn-outline-danger ms-2';
        del.textContent = '✖';
        del.onclick = () => deleteConversation(c.id);

        row.appendChild(btn);
        row.appendChild(del);
        historyList.appendChild(row);
    });
}

/* ================= MESSAGE ================= */
function appendMessage(text, sender, save = true, imageUrl = null) {
    if (!chatBox) return;

    const row = document.createElement('div');
    row.className = `d-flex message-row ${sender === 'user' ? 'justify-content-end' : ''}`;

    const bubble = document.createElement('div');
    bubble.className = `msg ${sender === 'user' ? 'msg-user' : 'msg-bot'}`;

    if (imageUrl) {
        const img = document.createElement('img');
        img.src = imageUrl;
        img.style.maxWidth = '220px';
        img.style.borderRadius = '10px';
        img.style.display = 'block';
        img.style.marginBottom = '6px';
        bubble.appendChild(img);
    }

    if (text) {
        const div = document.createElement('div');
        div.innerHTML = formatMessage(text);
        bubble.appendChild(div);
    }

    row.appendChild(bubble);
    chatBox.appendChild(row);
    chatBox.scrollTop = chatBox.scrollHeight;

    if (save) {
        let c = currentConv();
        if (!c) {
            c = { id: Date.now().toString(), title: 'New chat', messages: [] };
            conversations.push(c);
            currentId = c.id;
        }
        c.messages.push({ sender, text });
        if (sender === 'user' && c.title === 'New chat' && text) {
            c.title = text.slice(0, 40);
        }
        saveState();
        renderSidebar();
    }
}


function formatMessage(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>")
        .replace(/`([^`]+)`/g, "<code>$1</code>")
        .split("\n\n")
        .map(p => `<p>${p.replace(/\n/g, "<br>")}</p>`)
        .join("");
}

/* ================= TYPING ================= */
function showTyping() {
    if (typingIndicator) typingIndicator.style.display = 'flex';
}
function hideTyping() {
    if (typingIndicator) typingIndicator.style.display = 'none';
}

/* ================= SEND ================= */
async function sendMessage() {
    const text = msgInput.value.trim();
    const image = imageInput?.files?.[0];

    if (!text && !image) return;

    msgInput.value = '';

    let previewUrl = null;
    if (image) previewUrl = URL.createObjectURL(image);

    appendMessage(text || '', 'user', true, previewUrl);
    showTyping();

    const formData = new FormData();
    formData.append('message', text);
    if (image) formData.append('image', image);

    try {
        const r = await fetch('/message/', { method: 'POST', body: formData });
        const d = await r.json();
        hideTyping();
        appendMessage(d.reply || 'Error', 'bot');
    } catch {
        hideTyping();
        appendMessage('Server busy', 'bot');
    }

    imageInput.value = '';
    previewImg.src = '';
    if (imagePreview) imagePreview.style.display = 'none';
}

/* ================= CAMERA ================= */
if (imageBtn && imageInput) imageBtn.onclick = () => imageInput.click();
if (imageInput) {
    imageInput.onchange = () => {
        const file = imageInput.files[0];
        if (!file) return;
        previewImg.src = URL.createObjectURL(file);
        imagePreview.style.display = 'block';
    };
}

document.addEventListener('click', (e) => {
    if (e.target && e.target.id === 'remove-image') {
        imageInput.value = '';
        previewImg.src = '';
        imagePreview.style.display = 'none';
    }
});



/* ================= MIC ================= */
if ('webkitSpeechRecognition' in window && micBtn) {
    const rec = new webkitSpeechRecognition();
    rec.lang = 'en-IN';
    rec.onresult = e => msgInput.value = e.results[0][0].transcript;
    micBtn.onclick = () => rec.start();
}

/* ================= SAVE ================= */
if (saveBtn) {
    saveBtn.onclick = async () => {
        const c = currentConv();
        if (!c || !c.messages.length) return alert("No messages");
        if (c.db_id) return alert("Already saved");

        const r = await fetch('/save-conversation/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({ messages: c.messages })
        });

        if (!r.ok) return alert("Save failed");

        const d = await r.json();
        c.db_id = d.id;
        saveState();
        updateDownloadButton();
        alert("Chat saved");
    };
}

/* ================= PDF ================= */
function updateDownloadButton() {
    if (!downloadBtn) return;
    const c = currentConv();
    if (c && c.db_id) {
        downloadBtn.disabled = false;
        downloadBtn.onclick = () => window.location.href = `/download-pdf/${c.db_id}/`;
    } else {
        downloadBtn.disabled = true;
        downloadBtn.onclick = null;
    }
}

/* ================= NAV ================= */
function startNewChat() {
    const c = { id: Date.now().toString(), title: 'New chat', messages: [] };
    conversations.push(c);
    currentId = c.id;
    chatBox.innerHTML = '';
    saveState();
    renderSidebar();
    updateDownloadButton();
}

function switchConversation(id) {
    currentId = id;
    chatBox.innerHTML = '';
    const c = currentConv();
    if (c) c.messages.forEach(m => appendMessage(m.text, m.sender, false, m.image));
    updateDownloadButton();
}

function deleteConversation(id) {
    conversations = conversations.filter(c => c.id !== id);
    if (!conversations.length) return startNewChat();
    currentId = conversations[conversations.length - 1].id;
    saveState();
    renderSidebar();
    switchConversation(currentId);
}

/* ================= INIT ================= */

if (!IS_AUTH) {
    localStorage.clear();
}


loadState();
if (IS_AUTH && !conversations.length) startNewChat();
renderSidebar();
if (currentId) switchConversation(currentId);

/* ================= EVENTS ================= */
if (sendBtn) sendBtn.onclick = sendMessage;
if (newChatBtn) newChatBtn.onclick = startNewChat;
if (deleteAllBtn) deleteAllBtn.onclick = () => {
    if (!confirm('Delete all chats?')) return;
    conversations = [];
    startNewChat();
};

if (msgInput) {
    msgInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendMessage();
        }
    });
}

/* ================= COOKIE ================= */
function getCookie(name) {
    const m = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
    return m ? decodeURIComponent(m.pop()) : '';
}

/* ================= SAVED CHAT ACTIONS ================= */
async function promptRename(convId) {
    const title = prompt("Enter new title");
    if (!title) return;

    await fetch(`/saved/${convId}/rename/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCookie("csrftoken")
        },
        credentials: "same-origin",
        body: JSON.stringify({ title })
    });

    location.reload();
}

async function confirmDelete(convId) {
    if (!confirm("Delete this chat?")) return;

    await fetch(`/saved/${convId}/delete/`, {
        method: "POST",
        headers: { "X-CSRFToken": getCookie("csrftoken") },
        credentials: "same-origin"
    });

    location.reload();
}

/* ===== MOBILE SIDEBAR TOGGLE ===== */
document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.querySelector('.sidebar');
    const toggleBtn = document.getElementById('sidebar-toggle');

    if (!sidebar || !toggleBtn) return;

    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    document.body.appendChild(overlay);

    toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('show');
        overlay.classList.toggle('show');
    });

    overlay.addEventListener('click', () => {
        sidebar.classList.remove('show');
        overlay.classList.remove('show');
    });
});

