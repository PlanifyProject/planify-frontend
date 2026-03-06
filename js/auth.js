/* auth.js — Login y Register */

// Si ya hay sesión, redirigir al dashboard
if (getToken()) {
  window.location.href = 'dashboard.html';
}

function showTab(tab) {
  const loginForm    = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const tabLogin     = document.getElementById('tabLoginBtn');
  const tabRegister  = document.getElementById('tabRegisterBtn');

  if (tab === 'login') {
    loginForm.style.display    = '';
    registerForm.style.display = 'none';
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
  } else {
    loginForm.style.display    = 'none';
    registerForm.style.display = '';
    tabLogin.classList.remove('active');
    tabRegister.classList.add('active');
  }
}

/* ── Login ──────────────────────────────────────────────────── */
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn   = document.getElementById('loginBtn');
  const email = document.getElementById('loginEmail').value.trim();
  const pass  = document.getElementById('loginPassword').value;

  btn.disabled   = true;
  btn.textContent = 'Ingresando…';

  try {
    const data = await Auth.login(email, pass);
    setToken(data.token);
    setUser(data.user);
    window.location.href = 'dashboard.html';
  } catch (err) {
    showAlert('authAlert', err.message, 'error');
  } finally {
    btn.disabled   = false;
    btn.textContent = 'Ingresar';
  }
});

/* ── Register ───────────────────────────────────────────────── */
document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn      = document.getElementById('registerBtn');
  const username = document.getElementById('regUsername').value.trim();
  const email    = document.getElementById('regEmail').value.trim();
  const pass     = document.getElementById('regPassword').value;

  btn.disabled   = true;
  btn.textContent = 'Creando cuenta…';

  try {
    const data = await Auth.register(username, email, pass);
    setToken(data.token);
    setUser(data.user);
    window.location.href = 'dashboard.html';
  } catch (err) {
    showAlert('authAlert', err.message, 'error');
  } finally {
    btn.disabled   = false;
    btn.textContent = 'Crear cuenta';
  }
});
