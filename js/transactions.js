/* transactions.js */
requireAuth();

let allCategories = [];
let deleteTargetId = null;

/* ── Set default date filters (current month) ────────────────── */
(function setDefaultFilters() {
  const now   = new Date();
  const first = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const last  = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
  document.getElementById('filterStart').value = first;
  document.getElementById('filterEnd').value   = last;
  document.getElementById('txDate').value       = now.toISOString().slice(0, 10);
})();

/* ── Load categories once ────────────────────────────────────── */
async function loadCategories() {
  try {
    allCategories = await Categories.getAll();
    populateFilterCategory();
    filterCategorySelect();
  } catch (err) {
    console.error('Error loading categories:', err);
  }
}

function populateFilterCategory() {
  const sel = document.getElementById('filterCategory');
  sel.innerHTML = '<option value="">Todas</option>';
  allCategories.forEach(c => {
    sel.innerHTML += `<option value="${c.id}">${c.icon || ''} ${c.name}</option>`;
  });
}

function filterCategorySelect() {
  const type = document.getElementById('txType').value;
  const sel  = document.getElementById('txCategory');
  const filtered = allCategories.filter(c => c.type === type);
  sel.innerHTML = '<option value="">Selecciona una categoría</option>';
  filtered.forEach(c => {
    sel.innerHTML += `<option value="${c.id}">${c.icon || ''} ${c.name}</option>`;
  });
}

/* ── Load & render transactions ──────────────────────────────── */
async function loadTransactions() {
  document.getElementById('txTable').innerHTML =
    `<tr><td colspan="6"><div class="spinner-wrap"><div class="spinner"></div></div></td></tr>`;

  const filters = {
    startDate:  document.getElementById('filterStart').value   || undefined,
    endDate:    document.getElementById('filterEnd').value     || undefined,
    type:       document.getElementById('filterType').value    || undefined,
    categoryId: document.getElementById('filterCategory').value || undefined,
  };

  try {
    const [transactions, summary] = await Promise.all([
      Transactions.getAll(filters),
      Transactions.getSummary(filters.startDate, filters.endDate),
    ]);

    renderSummaryBar(summary);
    renderTable(transactions);
  } catch (err) {
    showAlert('txAlert', err.message, 'error');
  }
}

function renderSummaryBar({ totalIncome = 0, totalExpense = 0, balance = 0 }) {
  document.getElementById('txStats').innerHTML = `
    <div class="stat-card income">
      <div class="stat-label">Ingresos</div>
      <div class="stat-value">${formatCurrency(totalIncome)}</div>
    </div>
    <div class="stat-card expense">
      <div class="stat-label">Gastos</div>
      <div class="stat-value">${formatCurrency(totalExpense)}</div>
    </div>
    <div class="stat-card balance">
      <div class="stat-label">Balance</div>
      <div class="stat-value" style="color:${balance >= 0 ? 'var(--income)' : 'var(--expense)'}">
        ${formatCurrency(balance)}
      </div>
    </div>
  `;
}

function renderTable(transactions) {
  const tbody = document.getElementById('txTable');

  if (!transactions || transactions.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6">
      <div class="empty-state">
        <span class="empty-icon">📭</span>
        <p>No se encontraron transacciones</p>
      </div>
    </td></tr>`;
    return;
  }

  const sorted = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));

  tbody.innerHTML = sorted.map(t => {
    const catName  = t.category ? `${t.category.icon || ''} ${t.category.name}` : '—';
    const sign     = t.type === 'income' ? '+' : '-';
    const amtClass = t.type === 'income' ? 'amount-income' : 'amount-expense';
    return `
      <tr>
        <td>${formatDate(t.date)}</td>
        <td>${t.description || '—'}</td>
        <td>${catName}</td>
        <td><span class="badge badge-${t.type}">${t.type === 'income' ? 'Ingreso' : 'Gasto'}</span></td>
        <td class="${amtClass}">${sign}${formatCurrency(t.amount)}</td>
        <td style="text-align:center;">
          <button class="btn btn-outline btn-sm btn-icon" onclick="editTransaction(${t.id})" title="Editar">✏️</button>
          <button class="btn btn-danger btn-sm btn-icon" onclick="confirmDelete(${t.id})" title="Eliminar">🗑️</button>
        </td>
      </tr>
    `;
  }).join('');
}

/* ── Form: Create / Update ───────────────────────────────────── */
document.getElementById('txForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id  = document.getElementById('txId').value;
  const btn = document.getElementById('txSubmitBtn');

  const payload = {
    categoryId:  parseInt(document.getElementById('txCategory').value),
    type:        document.getElementById('txType').value,
    amount:      parseFloat(document.getElementById('txAmount').value),
    date:        document.getElementById('txDate').value,
    description: document.getElementById('txDescription').value.trim() || undefined,
  };

  if (!payload.categoryId) {
    showAlert('txModalAlert', 'Selecciona una categoría', 'error');
    return;
  }

  btn.disabled   = true;
  btn.textContent = 'Guardando…';

  try {
    if (id) {
      await Transactions.update(id, payload);
    } else {
      await Transactions.create(payload);
    }
    closeModal('txModal');
    resetForm();
    loadTransactions();
    showAlert('txAlert', id ? 'Transacción actualizada' : 'Transacción creada', 'success');
  } catch (err) {
    showAlert('txModalAlert', err.message, 'error');
  } finally {
    btn.disabled   = false;
    btn.textContent = 'Guardar';
  }
});

function resetForm() {
  document.getElementById('txId').value         = '';
  document.getElementById('txAmount').value     = '';
  document.getElementById('txDescription').value = '';
  document.getElementById('txType').value        = 'income';
  document.getElementById('txModalTitle').textContent = 'Nueva transacción';
  filterCategorySelect();
  const now = new Date().toISOString().slice(0, 10);
  document.getElementById('txDate').value = now;
}

async function editTransaction(id) {
  try {
    const transactions = await Transactions.getAll();
    const t = transactions.find(tx => tx.id === id);
    if (!t) return;

    document.getElementById('txId').value          = t.id;
    document.getElementById('txType').value         = t.type;
    filterCategorySelect();
    document.getElementById('txCategory').value     = t.categoryId;
    document.getElementById('txAmount').value        = t.amount;
    document.getElementById('txDate').value          = t.date;
    document.getElementById('txDescription').value  = t.description || '';
    document.getElementById('txModalTitle').textContent = 'Editar transacción';
    openModal('txModal');
  } catch (err) {
    showAlert('txAlert', err.message, 'error');
  }
}

/* ── Delete ──────────────────────────────────────────────────── */
function confirmDelete(id) {
  deleteTargetId = id;
  openModal('deleteModal');
}

document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
  if (!deleteTargetId) return;
  try {
    await Transactions.delete(deleteTargetId);
    closeModal('deleteModal');
    deleteTargetId = null;
    loadTransactions();
    showAlert('txAlert', 'Transacción eliminada', 'success');
  } catch (err) {
    showAlert('txAlert', err.message, 'error');
    closeModal('deleteModal');
  }
});

/* ── Open new transaction modal ─────────────────────────────── */
document.getElementById('newTxBtn').addEventListener('click', () => {
  resetForm();
  openModal('txModal');
});

/* ── Init ────────────────────────────────────────────────────── */
loadCategories().then(() => loadTransactions());
