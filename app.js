const API_BASE = '';

function setMessage(id, text, type = 'ok') {
  const el = document.getElementById(id);

  if (!el) {
    return;
  }

  el.textContent = text;
  el.className = `message show ${type}`;
}

function getUser() {
  const raw = localStorage.getItem('waiUser');

  return raw ? JSON.parse(raw) : null;
}

function getToken() {
  const user = getUser();

  return user ? user.token : null;
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`,
  };
}

function requireUser() {
  const user = getUser();

  if (!user || user.role !== 'user') {
    window.location.href = '/auth/login.html';
    return null;
  }

  return user;
}

function requireAdmin() {
  const user = getUser();

  if (!user || user.role !== 'admin') {
    window.location.href = '/auth/login.html';
    return null;
  }

  return user;
}

function logout() {
  localStorage.removeItem('waiUser');
  window.location.href = '/auth/login.html';
}

function statusBadge(status) {
  return `<span class="status ${status}">${status}</span>`;
}

function formatDate(value) {
  if (!value) {
    return '-';
  }

  return new Date(value).toLocaleString('en-US');
}
