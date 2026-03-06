/* dashboard.js */
requireAuth();

async function loadDashboard() {
  const user = getUser();
  if (user) {
    document.getElementById('welcomeMsg').textContent = `Bienvenido, ${user.username} 👋`;
  }

  // Load summary and recent transactions in parallel
  try {
    const now     = new Date();
    const firstDay = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const lastDay  = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString().slice(0, 10);

    const [summary, transactions] = await Promise.all([
      Transactions.getSummary(firstDay, lastDay),
      Transactions.getAll({ startDate: firstDay, endDate: lastDay }),
    ]);

    renderStats(summary);
    renderRecent(transactions);
  } catch (err) {
    console.error('Error loading dashboard:', err);
  }
}

function renderStats({ totalIncome = 0, totalExpense = 0, balance = 0 }) {
  const grid = document.getElementById('statsGrid');
  grid.innerHTML = `
    <div class="stat-card income">
      <div class="stat-label">Ingresos del mes</div>
      <div class="stat-value">${formatCurrency(totalIncome)}</div>
    </div>
    <div class="stat-card expense">
      <div class="stat-label">Gastos del mes</div>
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

function renderRecent(transactions) {
  const tbody = document.getElementById('recentTable');

  if (!transactions || transactions.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5">
      <div class="empty-state">
        <span class="empty-icon">📭</span>
        <p>No hay transacciones este mes</p>
      </div>
    </td></tr>`;
    return;
  }

  // Show latest 8
  const recent = [...transactions]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 8);

  tbody.innerHTML = recent.map(t => {
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
      </tr>
    `;
  }).join('');
}

loadDashboard();
