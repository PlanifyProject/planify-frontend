/* categories.js */
requireAuth();

let categoriesData = [];
let currentTab     = 'income';
let deleteCatId    = null;

/* ── Color picker sync ───────────────────────────────────────── */
document.getElementById('catColor').addEventListener('input', function () {
  document.getElementById('catColorHex').textContent = this.value;
});

/* ── Tab switching ───────────────────────────────────────────── */
function showCatTab(type) {
  currentTab = type;
  document.getElementById('tabIncomeBtn').classList.toggle('active',  type === 'income');
  document.getElementById('tabExpenseBtn').classList.toggle('active', type === 'expense');
  renderCategories();
}

/* ── Load categories ─────────────────────────────────────────── */
async function loadCategories() {
  try {
    categoriesData = await Categories.getAll();
    renderCategories();
  } catch (err) {
    showAlert('catAlert', err.message, 'error');
  }
}

function renderCategories() {
  const grid = document.getElementById('catGrid');
  const list = categoriesData.filter(c => c.type === currentTab);

  if (list.length === 0) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">
      <span class="empty-icon">${currentTab === 'income' ? '💵' : '💸'}</span>
      <p>No hay categorías de ${currentTab === 'income' ? 'ingresos' : 'gastos'} aún</p>
    </div>`;
    return;
  }

  grid.innerHTML = list.map(c => `
    <div class="category-card" style="border-top-color:${c.color || 'var(--primary)'};">
      <span class="cat-icon">${c.icon || '📂'}</span>
      <span class="cat-name">${c.name}</span>
      <span class="cat-type" style="color:${c.color || 'var(--primary)'};">
        ${c.type === 'income' ? 'Ingreso' : 'Gasto'}
      </span>
      <div class="cat-actions">
        <button class="btn btn-outline btn-sm" onclick="editCategory(${c.id})">✏️ Editar</button>
        <button class="btn btn-danger btn-sm" onclick="confirmCatDelete(${c.id})">🗑️</button>
      </div>
    </div>
  `).join('');
}

/* ── Open new form ───────────────────────────────────────────── */
document.getElementById('newCatBtn').addEventListener('click', () => {
  document.getElementById('catId').value          = '';
  document.getElementById('catName').value        = '';
  document.getElementById('catType').value        = currentTab;
  document.getElementById('catColor').value       = '#6366f1';
  document.getElementById('catColorHex').textContent = '#6366f1';
  document.getElementById('catIcon').value        = '';
  document.getElementById('catModalTitle').textContent = 'Nueva categoría';
  openModal('catModal');
});

/* ── Edit ────────────────────────────────────────────────────── */
function editCategory(id) {
  const cat = categoriesData.find(c => c.id === id);
  if (!cat) return;

  document.getElementById('catId').value          = cat.id;
  document.getElementById('catName').value        = cat.name;
  document.getElementById('catType').value        = cat.type;
  document.getElementById('catColor').value       = cat.color || '#6366f1';
  document.getElementById('catColorHex').textContent = cat.color || '#6366f1';
  document.getElementById('catIcon').value        = cat.icon || '';
  document.getElementById('catModalTitle').textContent = 'Editar categoría';
  openModal('catModal');
}

/* ── Save (create / update) ──────────────────────────────────── */
document.getElementById('catForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id  = document.getElementById('catId').value;
  const btn = document.getElementById('catSubmitBtn');

  const payload = {
    name:  document.getElementById('catName').value.trim(),
    type:  document.getElementById('catType').value,
    color: document.getElementById('catColor').value,
    icon:  document.getElementById('catIcon').value.trim() || '📂',
  };

  btn.disabled   = true;
  btn.textContent = 'Guardando…';

  try {
    if (id) {
      await Categories.update(id, payload);
    } else {
      await Categories.create(payload);
    }
    closeModal('catModal');
    showAlert('catAlert', id ? 'Categoría actualizada' : 'Categoría creada', 'success');
    await loadCategories();
  } catch (err) {
    showAlert('catModalAlert', err.message, 'error');
  } finally {
    btn.disabled   = false;
    btn.textContent = 'Guardar';
  }
});

/* ── Delete ──────────────────────────────────────────────────── */
function confirmCatDelete(id) {
  deleteCatId = id;
  openModal('catDeleteModal');
}

document.getElementById('confirmCatDeleteBtn').addEventListener('click', async () => {
  if (!deleteCatId) return;
  try {
    await Categories.delete(deleteCatId);
    closeModal('catDeleteModal');
    deleteCatId = null;
    showAlert('catAlert', 'Categoría eliminada', 'success');
    await loadCategories();
  } catch (err) {
    showAlert('catAlert', err.message, 'error');
    closeModal('catDeleteModal');
  }
});

loadCategories();
