async function loadAdminPanel() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  document.getElementById('admin-back').addEventListener('click', () => {
    showScreen('chat-screen');
  });

  switchTab('users');
}

async function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

  const content = document.getElementById('admin-content');
  content.innerHTML = '<div class="loading">ACCESSING DATABASE...</div>';

  let html = '';
  switch (tab) {
    case 'users':
      const users = await fetchAPI('/admin/users');
      html = renderUsersTable(users);
      break;
    case 'messages':
      const messages = await fetchAPI('/admin/messages');
      html = renderMessagesTable(messages);
      break;
    case 'reports':
      const reports = await fetchAPI('/admin/reports');
      html = renderReportsTable(reports);
      break;
    case 'tasks':
      const usersForTask = await fetchAPI('/admin/users');
      const tasks = await fetchAPI('/admin/tasks');
      html = renderTasksAdminPanel(usersForTask, tasks);
      break;
  }
  content.innerHTML = html;

  if (tab === 'tasks') attachTaskFormListener();
}

async function fetchAPI(endpoint, options = {}) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    credentials: 'include',
    ...options
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

function renderUsersTable(users) {
  return `
    <table class="data-table">
      <thead>
        <tr><th>Username</th><th>Email</th><th>Rank</th><th>Points</th><th>Status</th><th>Actions</th></tr>
      </thead>
      <tbody>
        ${users.map(u => `
          <tr>
            <td>${escapeHtml(u.username)}</td>
            <td>${escapeHtml(u.email || '—')}</td>
            <td>${u.rank}</td>
            <td>${u.points}</td>
            <td style="color: ${u.isBlocked ? '#f00' : u.isSuspended ? '#ff0' : '#0f0'}">
              ${u.isBlocked ? 'BLOCKED' : u.isSuspended ? 'SUSPENDED' : 'ACTIVE'}
            </td>
            <td>
              <button class="action-btn" onclick="adminAction('suspend', '${u._id}')">SUSPEND</button>
              <button class="action-btn" onclick="adminAction('block', '${u._id}')">BLOCK</button>
              <button class="action-btn" onclick="adminAction('resetUsername', '${u._id}')">RESET</button>
              <button class="action-btn" onclick="adminAction('addPoints', '${u._id}')">+100</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function renderMessagesTable(messages) {
  return `
    <table class="data-table">
      <thead>
        <tr><th>Time</th><th>Sender</th><th>Type</th><th>Content</th><th>Actions</th></tr>
      </thead>
      <tbody>
        ${messages.map(m => `
          <tr>
            <td>${new Date(m.timestamp).toLocaleString()}</td>
            <td>${escapeHtml(m.sender?.username || 'SYSTEM')}</td>
            <td>${m.type}</td>
            <td>${escapeHtml(m.content.substring(0, 50))}${m.content.length > 50 ? '…' : ''}</td>
            <td>
              <button class="action-btn" onclick="deleteMessage('${m._id}')">DELETE</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function renderReportsTable(reports) {
  return `
    <table class="data-table">
      <thead>
        <tr><th>Date</th><th>Reporter</th><th>Reported</th><th>Reason</th><th>Status</th><th>Actions</th></tr>
      </thead>
      <tbody>
        ${reports.map(r => `
          <tr>
            <td>${new Date(r.createdAt).toLocaleString()}</td>
            <td>${escapeHtml(r.reporter?.username)}</td>
            <td>${escapeHtml(r.reportedUser?.username)}</td>
            <td>${escapeHtml(r.reason || '—')}</td>
            <td>${r.status}</td>
            <td>
              <button class="action-btn" onclick="resolveReport('${r._id}', 'resolved')">RESOLVE</button>
              <button class="action-btn" onclick="resolveReport('${r._id}', 'dismissed')">DISMISS</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function renderTasksAdminPanel(users, tasks) {
  const usersOptions = users.map(u =>
    `<option value="${u._id}">${escapeHtml(u.username)} (${u.rank})</option>`
  ).join('');

  return `
    <div style="margin-bottom: 1rem;">
      <h3>ASSIGN NEW TASK</h3>
      <form id="task-form">
        <select id="task-user" class="terminal-input" required>${usersOptions}</select>
        <input type="text" id="task-title" placeholder="Task title" class="terminal-input" required>
        <input type="number" id="task-points" placeholder="Points" class="terminal-input" value="50" min="0">
        <textarea id="task-description" placeholder="Description" class="terminal-input" rows="2"></textarea>
        <button type="submit" class="terminal-btn">ASSIGN TASK</button>
      </form>
    </div>
    <table class="data-table">
      <thead>
        <tr><th>Assigned To</th><th>Title</th><th>Points</th><th>Status</th><th>Created</th></tr>
      </thead>
      <tbody>
        ${tasks.map(t => `
          <tr>
            <td>${escapeHtml(t.assignedTo?.username)}</td>
            <td>${escapeHtml(t.title)}</td>
            <td>${t.points}</td>
            <td>${t.completed ? '✅ Completed' : '⏳ Pending'}</td>
            <td>${new Date(t.createdAt).toLocaleDateString()}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function attachTaskFormListener() {
  document.getElementById('task-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = {
      assignedTo: document.getElementById('task-user').value,
      title: document.getElementById('task-title').value,
      points: parseInt(document.getElementById('task-points').value) || 0,
      description: document.getElementById('task-description').value
    };
    await fetchAPI('/admin/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    switchTab('tasks');
  });
}

window.adminAction = async (action, userId) => {
  if (action === 'resetUsername') {
    const res = await fetchAPI(`/admin/users/${userId}/reset-username`, { method: 'POST' });
    alert(`Username reset to: ${res.username}`);
  } else if (action === 'addPoints') {
    const points = prompt('Enter points to add (negative to subtract):', '100');
    if (points === null) return;
    await fetchAPI(`/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ points: parseInt(points) })
    });
  } else {
    const updates = {};
    if (action === 'suspend') updates.isSuspended = true;
    if (action === 'block') updates.isBlocked = true;
    await fetchAPI(`/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
  }
  switchTab('users');
};

window.deleteMessage = async (msgId) => {
  if (!confirm('Delete this message?')) return;
  await fetchAPI(`/admin/messages/${msgId}`, { method: 'DELETE' });
  switchTab('messages');
};

window.resolveReport = async (reportId, status) => {
  await fetchAPI(`/admin/reports/${reportId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  switchTab('reports');
};