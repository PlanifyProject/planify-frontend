/* profile.js */
requireAuth();

let profileData = null;

/* ── Load profile ────────────────────────────────────────────── */
async function loadProfile() {
  try {
    profileData = await Auth.getProfile();
    renderProfile(profileData);
  } catch (err) {
    showAlert('profileAlert', err.message, 'error');
  }
}

function renderProfile(user) {
  // Avatar initials
  const initials = (user.username || '?')
    .split(' ')
    .map(w => w[0].toUpperCase())
    .join('')
    .slice(0, 2);
  document.getElementById('profileAvatar').textContent = initials;

  // View mode
  document.getElementById('profileName').textContent  = user.username;
  document.getElementById('profileEmail').textContent = user.email;

  // Update nav user
  const navUser = document.getElementById('navUser');
  if (navUser) navUser.textContent = `👤 ${user.username}`;

  // Pre-fill edit fields
  document.getElementById('editUsername').value = user.username;
  document.getElementById('editEmail').value    = user.email;
}

/* ── Toggle edit mode ────────────────────────────────────────── */
function enableEdit() {
  document.getElementById('profileView').style.display = 'none';
  document.getElementById('profileForm').style.display = '';
}

function cancelEdit() {
  document.getElementById('profileView').style.display = '';
  document.getElementById('profileForm').style.display = 'none';
  // Reset fields
  if (profileData) {
    document.getElementById('editUsername').value = profileData.username;
    document.getElementById('editEmail').value    = profileData.email;
  }
  document.getElementById('editPassword').value = '';
}

/* ── Save profile ────────────────────────────────────────────── */
document.getElementById('profileForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn  = document.getElementById('profileSaveBtn');
  const data = {};

  const username = document.getElementById('editUsername').value.trim();
  const email    = document.getElementById('editEmail').value.trim();
  const password = document.getElementById('editPassword').value;

  if (username && username !== profileData.username)  data.username = username;
  if (email    && email    !== profileData.email)     data.email    = email;
  if (password)                                        data.password = password;

  if (Object.keys(data).length === 0) {
    showAlert('profileAlert', 'No hay cambios para guardar', 'error');
    return;
  }

  btn.disabled   = true;
  btn.textContent = 'Guardando…';

  try {
    await Auth.updateProfile(data);
    showAlert('profileAlert', 'Perfil actualizado correctamente', 'success');
    // Refresh
    profileData = await Auth.getProfile();
    setUser(profileData);
    renderProfile(profileData);
    cancelEdit();
  } catch (err) {
    showAlert('profileAlert', err.message, 'error');
  } finally {
    btn.disabled   = false;
    btn.textContent = 'Guardar cambios';
  }
});

/* ── Danger zone logout ──────────────────────────────────────── */
document.getElementById('dangerLogout').addEventListener('click', () => {
  clearSession();
  window.location.href = 'index.html';
});

loadProfile();
