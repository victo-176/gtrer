const API_BASE = 'http://localhost:5000/api';

document.addEventListener('DOMContentLoaded', () => {
  const authScreen = document.getElementById('auth-screen');
  const chatScreen = document.getElementById('chat-screen');
  const adminScreen = document.getElementById('admin-screen');
  const loginContainer = document.getElementById('login-container');
  const registerContainer = document.getElementById('register-container');
  const adminPanel = document.getElementById('admin-password-panel');
  const adminToggle = document.getElementById('admin-toggle');

  checkAuth();

  document.getElementById('login-btn').addEventListener('click', login);
  document.getElementById('register-btn').addEventListener('click', register);
  document.getElementById('show-register-btn').addEventListener('click', () => {
    loginContainer.classList.add('hidden');
    registerContainer.classList.remove('hidden');
  });
  document.getElementById('back-to-login').addEventListener('click', () => {
    registerContainer.classList.add('hidden');
    loginContainer.classList.remove('hidden');
  });

  adminToggle.addEventListener('click', () => {
    adminPanel.classList.toggle('hidden');
  });

  document.getElementById('admin-login-btn').addEventListener('click', adminLogin);
  document.getElementById('logout-btn').addEventListener('click', logout);
});

async function checkAuth() {
  try {
    const res = await fetch(`${API_BASE}/users/me`, { credentials: 'include' });
    if (res.ok) {
      const { user } = await res.json();
      window.currentUser = user;
      showScreen('chat-screen');
      initChat();
      if (user.isAdmin) {
        document.getElementById('admin-panel-btn').classList.remove('hidden');
      }
    }
  } catch (err) {
    // Not logged in
  }
}

async function login() {
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (res.ok) {
    window.currentUser = data.user;
    showScreen('chat-screen');
    initChat();
    if (data.user.isAdmin) {
      document.getElementById('admin-panel-btn').classList.remove('hidden');
    }
  } else {
    alert('ACCESS DENIED: ' + data.error);
  }
}

async function register() {
  const email = document.getElementById('reg-email').value;
  const password = document.getElementById('reg-password').value;
  const confirm = document.getElementById('reg-confirm').value;
  if (password !== confirm) return alert('Passwords do not match');

  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (res.ok) {
    window.currentUser = data.user;
    showScreen('chat-screen');
    initChat();
  } else {
    alert('REGISTRATION FAILED: ' + data.error);
  }
}

async function adminLogin() {
  const password = document.getElementById('admin-password').value;
  const res = await fetch(`${API_BASE}/auth/admin-verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ password })
  });
  if (res.ok) {
    showScreen('admin-screen');
    loadAdminPanel();
  } else {
    alert('INVALID ADMIN KEY');
  }
}

async function logout() {
  await fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' });
  window.currentUser = null;
  if (window.socket) window.socket.disconnect();
  showScreen('auth-screen');
  document.getElementById('admin-panel-btn').classList.add('hidden');
}

function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');
}

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}