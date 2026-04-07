let socket;
let typingTimeout;

function initChat() {
  if (!window.currentUser) return;

  document.getElementById('current-username').textContent = window.currentUser.username;
  document.getElementById('user-rank').textContent = window.currentUser.rank.toUpperCase();
  document.getElementById('user-points').textContent = `${window.currentUser.points} pts`;

  socket = io('http://localhost:5000', {
    auth: { token: getCookie('token') }
  });

  socket.on('connect', () => {
    addSystemMessage('Connection established. Welcome to the grid.');
  });

  socket.on('recent_messages', (messages) => {
    messages.forEach(msg => addMessage(msg));
  });

  socket.on('global_message', (message) => {
    addMessage(message);
    playSound();
  });

  socket.on('dm_message', (message) => {
    addMessage(message, true);
    playSound();
  });

  socket.on('user_typing', ({ username, isTyping }) => {
    const indicator = document.getElementById('typing-indicator');
    if (isTyping) {
      indicator.textContent = `${username} is typing...`;
      indicator.classList.remove('hidden');
    } else {
      indicator.classList.add('hidden');
    }
  });

  socket.on('user_status', ({ username, status }) => {
    addSystemMessage(`${username} is now ${status}`);
  });

  socket.on('system_message', ({ content }) => {
    addSystemMessage(content);
  });

  const input = document.getElementById('message-input');
  const sendBtn = document.getElementById('send-btn');

  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });

  input.addEventListener('input', () => {
    socket.emit('typing', true);
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => socket.emit('typing', false), 1000);
  });

  sendBtn.addEventListener('click', sendMessage);

  function sendMessage() {
    const content = input.value.trim();
    if (!content) return;
    socket.emit('global_message', content);
    input.value = '';
    socket.emit('typing', false);
  }

  document.getElementById('profile-btn').addEventListener('click', showProfile);
  document.getElementById('admin-panel-btn').addEventListener('click', () => {
    showScreen('admin-screen');
    loadAdminPanel();
  });
}

function addMessage(msg, isDM = false) {
  const log = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = `message ${msg.type || (isDM ? 'dm' : 'global')}`;

  const time = new Date(msg.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const sender = msg.sender?.username || 'SYSTEM';

  div.innerHTML = `<span class="timestamp">[${time}]</span>
                   <span class="sender">${sender}:</span>
                   <span class="content">${escapeHtml(msg.content)}</span>`;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
}

function addSystemMessage(content) {
  const log = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = 'message system';
  div.innerHTML = `<span class="timestamp">[${new Date().toLocaleTimeString()}]</span>
                   <span class="content">*** ${escapeHtml(content)} ***</span>`;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function playSound() {
  const audio = document.getElementById('message-sound');
  if (audio) {
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }
}

async function showProfile() {
  const modal = document.getElementById('profile-modal');
  document.getElementById('profile-username').textContent = window.currentUser.username;
  document.getElementById('profile-rank').textContent = window.currentUser.rank;
  document.getElementById('profile-points').textContent = window.currentUser.points;

  // Fetch tasks count
  const res = await fetch(`${API_BASE}/users/tasks`, { credentials: 'include' });
  const tasks = await res.json();
  const completed = tasks.filter(t => t.completed).length;
  document.getElementById('profile-tasks').textContent = completed;

  modal.classList.remove('hidden');
  document.getElementById('close-profile').onclick = () => modal.classList.add('hidden');

  document.getElementById('change-avatar-btn').onclick = () => {
    document.getElementById('avatar-upload').click();
  };

  document.getElementById('avatar-upload').onchange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await fetch(`${API_BASE}/users/avatar`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        window.currentUser.avatar = data.avatar;
      }
    }
  };
}