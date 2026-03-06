/**
 * api.js — Capa de servicio centralizada para Planify
 * Todos los módulos JS importan desde aquí.
 */

const API_BASE =
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000/api'
    : '/api';

/* ── Token helpers ─────────────────────────────────────────── */
function getToken() {
  return localStorage.getItem('planify_token');
}

function setToken(token) {
  localStorage.setItem('planify_token', token);
}

function setUser(user) {
  localStorage.setItem('planify_user', JSON.stringify(user));
}

function getUser() {
  try {
    return JSON.parse(localStorage.getItem('planify_user')) || null;
  } catch {
    return null;
  }
}

function clearSession() {
  localStorage.removeItem('planify_token');
  localStorage.removeItem('planify_user');
}

function requireAuth() {
  if (!getToken()) {
    window.location.href = 'index.html';
  }
}

/* ── Base fetch wrapper ────────────────────────────────────── */
async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || `Error ${res.status}`);
  }
  return data;
}

/* ── Auth ──────────────────────────────────────────────────── */
const Auth = {
  async register(username, email, password) {
    return apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
  },
  async login(email, password) {
    return apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },
  async getProfile() {
    return apiFetch('/profile');
  },
  async updateProfile(data) {
    return apiFetch('/profile', { method: 'PUT', body: JSON.stringify(data) });
  },
};

/* ── Transactions ──────────────────────────────────────────── */
const Transactions = {
  async getAll(filters = {}) {
    const params = new URLSearchParams();
    if (filters.startDate)  params.append('startDate',  filters.startDate);
    if (filters.endDate)    params.append('endDate',    filters.endDate);
    if (filters.type)       params.append('type',       filters.type);
    if (filters.categoryId) params.append('categoryId', filters.categoryId);
    const qs = params.toString() ? `?${params}` : '';
    return apiFetch(`/transactions${qs}`);
  },
  async getSummary(startDate, endDate) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate)   params.append('endDate',   endDate);
    const qs = params.toString() ? `?${params}` : '';
    return apiFetch(`/transactions/summary${qs}`);
  },
  async create(data) {
    return apiFetch('/transactions', { method: 'POST', body: JSON.stringify(data) });
  },
  async update(id, data) {
    return apiFetch(`/transactions/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  async delete(id) {
    return apiFetch(`/transactions/${id}`, { method: 'DELETE' });
  },
};

/* ── Categories ────────────────────────────────────────────── */
const Categories = {
  async getAll() {
    return apiFetch('/categories');
  },
  async create(data) {
    return apiFetch('/categories', { method: 'POST', body: JSON.stringify(data) });
  },
  async update(id, data) {
    return apiFetch(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  async delete(id) {
    return apiFetch(`/categories/${id}`, { method: 'DELETE' });
  },
};

/* ── Reports ───────────────────────────────────────────────── */
const Reports = {
  async getFullReport(startDate, endDate) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate)   params.append('endDate',   endDate);
    const qs = params.toString() ? `?${params}` : '';
    return apiFetch(`/reports${qs}`);
  },
  async getMonthlySummary() {
    return apiFetch('/reports/monthly');
  },
};

/* ── Utility helpers ───────────────────────────────────────── */
function formatCurrency(amount) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

function showAlert(elId, msg, type = 'error') {
  const el = document.getElementById(elId);
  if (!el) return;
  el.textContent = msg;
  el.className = `alert show alert-${type}`;
  setTimeout(() => { el.className = 'alert'; }, 4000);
}

function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

/* ── Nav: mark active link ─────────────────────────────────── */
(function markActiveNav() {
  const page = window.location.pathname.split('/').pop();
  document.querySelectorAll('.nav-links a').forEach(a => {
    if (a.getAttribute('href') === page) a.classList.add('active');
  });

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      clearSession();
      window.location.href = 'index.html';
    });
  }

  const navUser = document.getElementById('navUser');
  if (navUser) {
    const u = getUser();
    if (u) navUser.textContent = `👤 ${u.username}`;
  }
})();
