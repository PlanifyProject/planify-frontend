/* reports.js */
requireAuth();

let monthlyChartInst    = null;
let expensePieChartInst = null;
let incomePieChartInst  = null;

/* ── Default date range: last 6 months ───────────────────────── */
(function setDefaultDates() {
  const now   = new Date();
  const end   = now.toISOString().slice(0, 10);
  const start = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString().slice(0, 10);
  document.getElementById('reportStart').value = start;
  document.getElementById('reportEnd').value   = end;
})();

/* ── Load report ─────────────────────────────────────────────── */
async function loadReport() {
  const startDate = document.getElementById('reportStart').value || undefined;
  const endDate   = document.getElementById('reportEnd').value   || undefined;

  document.getElementById('reportStats').innerHTML    = `<div class="spinner-wrap"><div class="spinner"></div></div>`;
  document.getElementById('catBreakdown').innerHTML   = `<li><div class="spinner-wrap"><div class="spinner"></div></div></li>`;

  try {
    const report = await Reports.getFullReport(startDate, endDate);
    // report = { summary: {totalIncome, totalExpense, balance}, byCategory: [...], monthlySummary: [...] }

    renderStats(report.summary);
    renderMonthlyChart(report.monthlySummary);
    renderCategoryPies(report.byCategory);
    renderCategoryBreakdown(report.byCategory);
  } catch (err) {
    showAlert('reportAlert', err.message, 'error');
  }
}

/* ── Stats ───────────────────────────────────────────────────── */
function renderStats({ totalIncome = 0, totalExpense = 0, balance = 0 }) {
  document.getElementById('reportStats').innerHTML = `
    <div class="stat-card income">
      <div class="stat-label">Total Ingresos</div>
      <div class="stat-value">${formatCurrency(totalIncome)}</div>
    </div>
    <div class="stat-card expense">
      <div class="stat-label">Total Gastos</div>
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

/* ── Monthly Bar Chart ───────────────────────────────────────── */
function renderMonthlyChart(monthlySummary) {
  const labels  = monthlySummary.map(m => formatMonth(m.month));
  const incomes  = monthlySummary.map(m => m.income);
  const expenses = monthlySummary.map(m => m.expense);

  if (monthlyChartInst) monthlyChartInst.destroy();

  const ctx = document.getElementById('monthlyChart').getContext('2d');
  monthlyChartInst = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Ingresos',
          data: incomes,
          backgroundColor: 'rgba(34,197,94,.75)',
          borderColor: '#22c55e',
          borderWidth: 1.5,
          borderRadius: 4,
        },
        {
          label: 'Gastos',
          data: expenses,
          backgroundColor: 'rgba(239,68,68,.75)',
          borderColor: '#ef4444',
          borderWidth: 1.5,
          borderRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'top' },
        tooltip: {
          callbacks: {
            label: ctx => ` ${formatCurrency(ctx.raw)}`,
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: v => formatCurrency(v),
          },
        },
      },
    },
  });
}

/* ── Category Pies ───────────────────────────────────────────── */
function renderCategoryPies(byCategory) {
  const expenses = byCategory.filter(c => c.type === 'expense');
  const incomes  = byCategory.filter(c => c.type === 'income');

  if (expensePieChartInst) expensePieChartInst.destroy();
  if (incomePieChartInst)  incomePieChartInst.destroy();

  expensePieChartInst = buildDoughnut(
    'expensePieChart',
    expenses.map(c => `${c.icon || ''} ${c.name}`),
    expenses.map(c => c.total),
    expenses.map(c => c.color || '#ef4444')
  );

  incomePieChartInst = buildDoughnut(
    'incomePieChart',
    incomes.map(c => `${c.icon || ''} ${c.name}`),
    incomes.map(c => c.total),
    incomes.map(c => c.color || '#22c55e')
  );
}

function buildDoughnut(canvasId, labels, data, colors) {
  // Clear any previous "Sin datos" messages before rendering
  const card = document.getElementById(canvasId).parentElement;
  card.querySelectorAll('p.no-data-msg').forEach(el => el.remove());

  if (!labels.length) {
    card.querySelector('h3').insertAdjacentHTML(
      'afterend', '<p class="no-data-msg" style="color:var(--muted);font-size:.875rem;">Sin datos para el periodo seleccionado</p>'
    );
    return null;
  }
  const ctx = document.getElementById(canvasId).getContext('2d');
  return new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors,
        borderWidth: 2,
        borderColor: '#fff',
      }],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 12 } } },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.label}: ${formatCurrency(ctx.raw)}`,
          },
        },
      },
    },
  });
}

/* ── Category breakdown list ─────────────────────────────────── */
function renderCategoryBreakdown(byCategory) {
  const ul = document.getElementById('catBreakdown');

  if (!byCategory || byCategory.length === 0) {
    ul.innerHTML = `<li><div class="empty-state"><span class="empty-icon">📊</span><p>Sin datos</p></div></li>`;
    return;
  }

  const max = Math.max(...byCategory.map(c => c.total), 1);

  ul.innerHTML = byCategory.map(c => {
    const pct = Math.round((c.total / max) * 100);
    const typeLabel = c.type === 'income' ? 'Ingreso' : 'Gasto';
    const badgeClass = c.type === 'income' ? 'badge-income' : 'badge-expense';
    return `
      <li>
        <span class="cat-dot" style="background:${c.color || '#6366f1'};"></span>
        <span class="cat-icon">${c.icon || '📂'}</span>
        <span class="cat-name-label">${c.name}</span>
        <span class="badge ${badgeClass}">${typeLabel}</span>
        <div class="cat-bar-wrap">
          <div class="cat-bar" style="width:${pct}%; background:${c.color || '#6366f1'};"></div>
        </div>
        <span class="cat-amount">${formatCurrency(c.total)}</span>
      </li>
    `;
  }).join('');
}

/* ── Helpers ─────────────────────────────────────────────────── */
function formatMonth(monthStr) {
  // "2024-01" → "Ene 2024"
  const [year, month] = monthStr.split('-');
  const names = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  return `${names[parseInt(month) - 1]} ${year}`;
}

loadReport();
