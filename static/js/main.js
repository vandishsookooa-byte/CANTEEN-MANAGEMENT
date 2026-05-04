// ============================================================
// CANTEEN MANAGEMENT SYSTEM — MAIN JAVASCRIPT
// ============================================================

// ── Number Formatting Helpers ────────────────────────────────
function formatRs(value, decimals = 2) {
    return `Rs ${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
}

function formatNum(value, decimals = 2) {
    return Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

// ── State ────────────────────────────────────────────────────
const state = {
    employees: {
        bangladeshi: 700,
        srilankan:   500,
        indian:      500,
        malagasy:    250
    },
    expenditures: [],
    currentPage: 'home',
    theme: localStorage.getItem('theme') || 'light',
    uploadedData: null,
    employeeHistories: [],
    selectedPeriod: '',
    availablePeriods: []
};

// ── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    loadState();
    initializeEventListeners();
    setupTheme();
    navigateTo(state.currentPage || 'home');
    updateAllKPIs();
    initPeriodSelector();
    setTimeout(() => initHomeCharts(), 500);
    renderEmployeeHistoryTable();
});

// ── LocalStorage ─────────────────────────────────────────────
function loadState() {
    const saved = localStorage.getItem('canteenState');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            state.employees         = parsed.employees         || state.employees;
            state.expenditures      = parsed.expenditures      || [];
            state.theme             = parsed.theme             || 'light';
            state.employeeHistories = parsed.employeeHistories || [];
            state.selectedPeriod    = parsed.selectedPeriod    || '';
            state.currentPage       = parsed.currentPage       || 'home';
        } catch (e) {
            console.warn('State load failed:', e);
        }
    }
}

function saveState() {
    localStorage.setItem('canteenState', JSON.stringify(state));
}

// ── Notifications ─────────────────────────────────────────────
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `<i class="fas fa-info-circle"></i><span>${message}</span>`;
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        padding: 14px 22px;
        border-radius: 8px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.18);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 10px;
        max-width: 360px;
        font-size: 0.875rem;
    `;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ── Event Listeners ───────────────────────────────────────────
function initializeEventListeners() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.dataset.page;
            navigateTo(page);
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            document.getElementById('navbarMenu').classList.remove('active');
        });
    });

    document.getElementById('themeToggle').addEventListener('click', toggleTheme);

    document.getElementById('hamburger').addEventListener('click', () => {
        document.getElementById('navbarMenu').classList.toggle('active');
    });

    const uploadZone = document.getElementById('uploadZone');
    const fileInput  = document.getElementById('fileInput');

    if (uploadZone) {
        uploadZone.addEventListener('click', () => fileInput.click());
        uploadZone.addEventListener('dragover',  handleDragOver);
        uploadZone.addEventListener('dragleave', handleDragLeave);
        uploadZone.addEventListener('drop',      handleFileDrop);
    }

    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
    }

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.navbar')) {
            document.getElementById('navbarMenu').classList.remove('active');
        }
    });
}

// ── Navigation ────────────────────────────────────────────────
function navigateTo(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById(page);
    if (target) target.classList.add('active');
    state.currentPage = page;
    saveState();

    // Sync active nav link
    document.querySelectorAll('.nav-link').forEach(l => {
        l.classList.toggle('active', l.dataset.page === page);
    });

    setTimeout(() => {
        if (page === 'home') {
            updateAllKPIs();
            updateEmployeeDisplays();
            updateHomeSummaryCards();
            initHomeCharts();
        } else if (page === 'employees') {
            updateEmployeeDisplays();
            renderEmployeeHistoryTable();
        } else if (page === 'trends') {
            initTrendCharts();
        } else if (page === 'per-head') {
            initPerHeadCharts();
        } else if (page === 'comparison') {
            initComparisonCharts();
            initItemComparisonFilter();
        } else if (page === 'month-comparison') {
            initMonthComparisonPage();
        } else if (page === 'reports') {
            // nothing auto-loaded
        }
    }, 100);
}

// ── Theme ─────────────────────────────────────────────────────
function setupTheme() {
    if (state.theme === 'dark') {
        document.body.classList.add('dark-mode');
        document.getElementById('themeToggle').innerHTML = '<i class="fas fa-sun"></i>';
    }
}

function toggleTheme() {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    document.body.classList.toggle('dark-mode');
    const icon = state.theme === 'dark' ? 'sun' : 'moon';
    document.getElementById('themeToggle').innerHTML = `<i class="fas fa-${icon}"></i>`;
    localStorage.setItem('theme', state.theme);
    saveState();

    if      (state.currentPage === 'home')             initHomeCharts();
    else if (state.currentPage === 'trends')           initTrendCharts();
    else if (state.currentPage === 'per-head')         initPerHeadCharts();
    else if (state.currentPage === 'comparison')       initComparisonCharts();
    else if (state.currentPage === 'month-comparison') loadMonthComparison();
}

// ── Period Selector ───────────────────────────────────────────
async function initPeriodSelector() {
    try {
        const data = await fetchPeriods();
        state.availablePeriods = data.periods || [];
        const sel = document.getElementById('periodSelector');
        if (!sel) return;
        sel.innerHTML = '<option value="">-- All Periods --</option>' +
            state.availablePeriods.map(p => `<option value="${p}">${p}</option>`).join('');
        sel.value = state.selectedPeriod || '';
        sel.addEventListener('change', onPeriodChange);
    } catch (e) {
        console.warn('Period selector init failed:', e);
    }
}

function onPeriodChange(e) {
    state.selectedPeriod = e.target.value;
    saveState();
    updateAllKPIs();
    if      (state.currentPage === 'trends')     initTrendCharts();
    else if (state.currentPage === 'per-head')   initPerHeadCharts();
    else if (state.currentPage === 'comparison') initComparisonCharts();
    highlightEmployeeRow(state.selectedPeriod);
}

function highlightEmployeeRow(period) {
    document.querySelectorAll('#employeeHistoryTable tr').forEach(row => {
        row.classList.toggle('highlighted', row.cells[0]?.textContent === period);
    });
}

// ── KPI Update ────────────────────────────────────────────────
async function updateAllKPIs() {
    const total = Object.values(state.employees).reduce((a, b) => a + b, 0);

    const totalEl = document.getElementById('totalEmployees');
    if (totalEl) totalEl.textContent = total.toLocaleString('en-IN');

    try {
        const data = await fetchDashboard(state.selectedPeriod);
        const totalExp = data.total_expenditure || 0;
        const avgPH    = data.avg_per_head || 0;

        const expEl = document.getElementById('totalExpenditure');
        if (expEl) expEl.textContent = formatRs(totalExp);

        const phEl = document.getElementById('avgPerHead');
        if (phEl) phEl.textContent = formatRs(avgPH);

        updateHomeSummaryCards(data.by_nationality);
    } catch (e) {
        // Fallback using local state
        let totalExpenditure = 0;
        if (state.expenditures && state.expenditures.length > 0) {
            totalExpenditure = state.expenditures.reduce((sum, r) => sum + (parseFloat(r.total) || 0), 0);
        }
        const expEl = document.getElementById('totalExpenditure');
        if (expEl) expEl.textContent = formatRs(totalExpenditure);
        const phEl = document.getElementById('avgPerHead');
        if (phEl) phEl.textContent = formatRs(total > 0 ? totalExpenditure / total : 0);
    }
}

// ── Summary Cards ─────────────────────────────────────────────
function updateHomeSummaryCards(byNationality) {
    const nationalities = ['bangladeshi', 'srilankan', 'indian', 'malagasy'];
    const total = Object.values(state.employees).reduce((a, b) => a + b, 0);

    nationalities.forEach(nat => {
        const count      = state.employees[nat];
        const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';

        const card = document.querySelector(`.summary-card[data-nationality="${nat}"]`);
        if (!card) return;

        const valueEl   = card.querySelector('.summary-value');
        const percentEl = card.querySelector('.summary-percent');

        if (valueEl)   valueEl.textContent   = count.toLocaleString('en-IN');
        if (percentEl) percentEl.textContent = `${percentage}%`;
    });
}

// ── Employee Management ───────────────────────────────────────
function updateEmployeeDisplays() {
    const nationalities = ['bangladeshi', 'srilankan', 'indian', 'malagasy'];
    const total = Object.values(state.employees).reduce((a, b) => a + b, 0);

    nationalities.forEach(nat => {
        const count      = state.employees[nat];
        const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';

        const countEl = document.getElementById(`count-${nat}`);
        if (countEl) countEl.textContent = count.toLocaleString('en-IN');

        const percentEls = document.querySelectorAll(`[data-nationality="${nat}"] .employee-percentage`);
        percentEls.forEach(el => el.textContent = `${percentage}% of workforce`);

        const input = document.querySelector(`#input-${nat} .employee-input`);
        if (input) input.value = count;
    });

    const summaryTotal = document.getElementById('summaryTotal');
    if (summaryTotal) summaryTotal.textContent = total.toLocaleString('en-IN');

    updateAllKPIs();
}

function recordEmployeeChange(nationality, oldCount, newCount) {
    const record = {
        date:      new Date().toLocaleDateString('en-IN'),
        timestamp: new Date().toISOString(),
        nationality,
        oldCount,
        newCount,
        change: newCount - oldCount
    };
    state.employeeHistories.push(record);
    saveState();
    showNotification(`${nationality.charAt(0).toUpperCase() + nationality.slice(1)}: ${oldCount} → ${newCount}`);
}

function editEmployee(nationality) {
    const card = document.querySelector(`[data-nationality="${nationality}"].employee-card`);
    if (!card) return;
    card.querySelector('.employee-display').style.display = 'none';
    card.querySelector('.employee-form').style.display    = 'flex';
    card.querySelector('.btn-edit').style.display   = 'none';
    card.querySelector('.btn-save').style.display   = 'inline-flex';
    card.querySelector('.btn-cancel').style.display = 'inline-flex';

    const input = card.querySelector('.employee-input');
    if (input) {
        input.value = state.employees[nationality];
        setTimeout(() => input.focus(), 80);
    }
}

function saveEmployee(nationality) {
    const card  = document.querySelector(`[data-nationality="${nationality}"].employee-card`);
    if (!card) return;
    const input = card.querySelector('.employee-input');
    const newValue = parseInt(input?.value);

    if (isNaN(newValue) || newValue < 0) {
        showNotification('Please enter a valid number');
        return;
    }

    const oldValue = state.employees[nationality];
    if (newValue !== oldValue) {
        recordEmployeeChange(nationality, oldValue, newValue);
        state.employees[nationality] = newValue;
        saveState();
    }

    cancelEdit(nationality);
    updateEmployeeDisplays();
    renderEmployeeHistoryTable();

    if (state.currentPage === 'home') {
        updateAllKPIs();
        initHomeCharts();
    }
}

function cancelEdit(nationality) {
    const card = document.querySelector(`[data-nationality="${nationality}"].employee-card`);
    if (!card) return;
    card.querySelector('.employee-display').style.display = 'block';
    card.querySelector('.employee-form').style.display    = 'none';
    card.querySelector('.btn-edit').style.display   = 'inline-flex';
    card.querySelector('.btn-save').style.display   = 'none';
    card.querySelector('.btn-cancel').style.display = 'none';
}

function renderEmployeeHistoryTable() {
    const tbody = document.getElementById('employeeHistoryBody');
    if (!tbody) return;
    const history = state.employeeHistories;
    if (!history.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-row">No changes recorded yet.</td></tr>';
        return;
    }
    tbody.innerHTML = [...history].reverse().map(r => {
        const change = r.change > 0 ? `+${r.change}` : String(r.change);
        const cls    = r.change > 0 ? 'positive' : r.change < 0 ? 'negative' : '';
        return `<tr>
            <td>${r.date}</td>
            <td>${r.nationality.charAt(0).toUpperCase() + r.nationality.slice(1)}</td>
            <td>${r.oldCount.toLocaleString('en-IN')}</td>
            <td>${r.newCount.toLocaleString('en-IN')}</td>
            <td class="${cls}">${change}</td>
        </tr>`;
    }).join('');
}

function getEmployeeChangeHistory(nationality = null, days = 30) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return state.employeeHistories.filter(r => {
        const d = new Date(r.timestamp);
        return d > cutoff && (!nationality || r.nationality === nationality);
    });
}

function downloadEmployeeHistory() {
    const history = getEmployeeChangeHistory();
    if (!history.length) {
        showNotification('No employee changes recorded yet.');
        return;
    }
    let csv = 'Date,Nationality,Old Count,New Count,Change\n';
    history.forEach(r => {
        csv += `${r.date},${r.nationality},${r.oldCount},${r.newCount},${r.change > 0 ? '+' : ''}${r.change}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `employee-history-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
}

// ── File Upload ───────────────────────────────────────────────
function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.style.borderColor       = 'var(--color-primary)';
    e.currentTarget.style.backgroundColor   = 'rgba(37, 99, 235, 0.05)';
}

function handleDragLeave(e) {
    e.currentTarget.style.borderColor     = '';
    e.currentTarget.style.backgroundColor = '';
}

function handleFileDrop(e) {
    e.preventDefault();
    handleFileSelect({ target: { files: e.dataTransfer.files } });
    e.currentTarget.style.borderColor     = '';
    e.currentTarget.style.backgroundColor = '';
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        try {
            const content    = ev.target.result;
            const parsedData = parseUploadedFile(content);
            if (parsedData && parsedData.length > 0) {
                state.uploadedData = {
                    data:        parsedData,
                    fileName:    file.name,
                    uploadDate:  new Date().toISOString(),
                    recordCount: parsedData.length
                };
                saveState();
                showUploadPreview(file.name, parsedData);
            }
        } catch (err) {
            showNotification(`Error parsing file: ${err.message}`);
        }
    };
    reader.readAsText(file);
}

function parseUploadedFile(content) {
    if (content.trim().startsWith('[') || content.trim().startsWith('{')) {
        return parseJSON(content);
    }
    if (content.includes('\t')) return parseDelimited(content, '\t');
    return parseDelimited(content, ',');
}

function parseJSON(content) {
    const data  = JSON.parse(content);
    const array = Array.isArray(data) ? data : [data];
    return array.map(row => normalizeRow(row));
}

function parseDelimited(content, delimiter) {
    const lines = content.trim().split('\n');
    if (lines.length < 2) return [];
    const headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase());
    const data    = [];
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(delimiter).map(v => v.trim());
        if (values.some(v => v)) {
            const row = {};
            headers.forEach((h, idx) => { row[h] = values[idx] || ''; });
            data.push(normalizeRow(row));
        }
    }
    return data;
}

function normalizeRow(row) {
    const getCol = (variations) => {
        for (const key in row) {
            if (variations.some(v => key.includes(v))) return row[key];
        }
        return null;
    };
    const date        = getCol(['date', 'transaction', 'purchase']) || new Date().toISOString().split('T')[0];
    const item        = getCol(['item', 'product', 'name'])         || 'Unknown';
    const quantity    = parseQuantity(getCol(['quantity', 'qty', 'amount']) || '0');
    const price       = parsePrice(getCol(['price', 'cost', 'rate', 'unit']) || '0');
    const nationality = normalizeNationality(getCol(['nationality', 'nation', 'country']) || 'Unknown');
    return { date, item, quantity, price, total: (quantity * price).toFixed(2), nationality, timestamp: new Date().toISOString() };
}

function parseQuantity(value) {
    const m = String(value).match(/[\d.]+/);
    return m ? parseFloat(m[0]) : 0;
}

function parsePrice(value) {
    const s = String(value).replace(/[^\d.]/g, '');
    return s ? parseFloat(s) : 0;
}

function normalizeNationality(value) {
    const s = String(value).toLowerCase().trim();
    if (s.includes('banglad'))                    return 'Bangladeshi';
    if (s.includes('sri'))                        return 'Sri Lankan';
    if (s.includes('indian') || s.includes('india')) return 'Indian';
    if (s.includes('malagasy'))                   return 'Malagasy';
    return value;
}

function showUploadPreview(filename, data) {
    const preview = document.getElementById('uploadPreview');
    const thead   = document.getElementById('previewHead');
    const tbody   = document.getElementById('previewBody');
    if (!preview) return;
    const headers = ['Date', 'Item', 'Quantity', 'Price', 'Total', 'Nationality'];
    if (thead) thead.innerHTML = `<tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;
    if (tbody) {
        tbody.innerHTML = data.slice(0, 10).map(row =>
            `<tr>
                <td>${row.date}</td>
                <td>${row.item}</td>
                <td>${formatNum(row.quantity)}</td>
                <td>${formatRs(row.price)}</td>
                <td>${formatRs(row.total)}</td>
                <td>${row.nationality}</td>
            </tr>`
        ).join('');
    }
    preview.style.display = 'block';
    showNotification(`${filename}: ${data.length} records ready to upload`);
}

function confirmUpload() {
    if (!state.uploadedData) { showNotification('No file to upload'); return; }
    state.expenditures = state.expenditures.concat(state.uploadedData.data);
    saveState();
    const preview   = document.getElementById('uploadPreview');
    const fileInput = document.getElementById('fileInput');
    if (preview)   preview.style.display = 'none';
    if (fileInput) fileInput.value = '';
    showNotification(`✅ Successfully uploaded ${state.uploadedData.recordCount} records!`);
    updateAllKPIs();
}

// ── Home Charts ───────────────────────────────────────────────
function initHomeCharts() {
    if (window.homeChart1) window.homeChart1.destroy();
    if (window.homeChart2) Plotly.purge('homeChart2');

    const isDark    = document.body.classList.contains('dark-mode');
    const bgColor   = isDark ? '#1f2937' : '#ffffff';
    const textColor = isDark ? '#f3f4f6' : '#374151';

    const ctx1 = document.getElementById('homeChart1');
    if (ctx1) {
        window.homeChart1 = new Chart(ctx1, {
            type: 'doughnut',
            data: {
                labels: [
                    `Bangladeshi (${state.employees.bangladeshi})`,
                    `Sri Lankan (${state.employees.srilankan})`,
                    `Indian (${state.employees.indian})`,
                    `Malagasy (${state.employees.malagasy})`
                ],
                datasets: [{
                    data: [state.employees.bangladeshi, state.employees.srilankan, state.employees.indian, state.employees.malagasy],
                    backgroundColor: ['#ff6b6b', '#4ecdc4', '#ffa502', '#9b59b6'],
                    borderWidth: 3,
                    borderColor: bgColor
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { usePointStyle: true, padding: 15, color: textColor, font: { size: 13, weight: 'bold' } }
                    }
                }
            }
        });
    }

    const data2 = [{
        x: ['Bangladeshi', 'Sri Lankan', 'Indian', 'Malagasy'],
        y: [state.employees.bangladeshi, state.employees.srilankan, state.employees.indian, state.employees.malagasy],
        type: 'bar',
        marker: { color: ['#ff6b6b', '#4ecdc4', '#ffa502', '#9b59b6'], line: { width: 2, color: '#ffffff' } },
        text: [state.employees.bangladeshi, state.employees.srilankan, state.employees.indian, state.employees.malagasy],
        textposition: 'outside',
        hovertemplate: '<b>%{x}</b><br>Employees: %{y}<extra></extra>'
    }];

    const layout2 = {
        xaxis: { title: 'Nationality', tickfont: { color: textColor, size: 12 } },
        yaxis: { title: 'Number of Employees', tickfont: { color: textColor, size: 12 } },
        paper_bgcolor: bgColor, plot_bgcolor: bgColor,
        font: { color: textColor, size: 12 },
        margin: { l: 60, r: 50, t: 30, b: 60 },
        hovermode: 'closest'
    };

    if (document.getElementById('homeChart2')) {
        Plotly.newPlot('homeChart2', data2, layout2, { responsive: true });
    }
}

// ── Trend Charts ──────────────────────────────────────────────
async function initTrendCharts() {
    if (window.trendChart1) window.trendChart1.destroy();
    if (window.trendChart2) window.trendChart2.destroy();
    if (window.trendChart3) window.trendChart3.destroy();

    const isDark    = document.body.classList.contains('dark-mode');
    const textColor = isDark ? '#f3f4f6' : '#374151';
    const gridColor = isDark ? '#4b5563' : '#e5e7eb';

    let labels = ['2026-04-10', '2026-04-12', '2026-04-14', '2026-04-17', '2026-04-20', '2026-04-24'];
    let dailyData = [500, 520, 510, 540, 480, 500];
    let weeklyByNat = {
        bangladeshi: [1500, 1600, 1400],
        srilankan:   [1200, 1300, 1100],
        indian:      [300,  320,  280],
        malagasy:    [600,  650,  550]
    };

    try {
        const data = await fetchTrends(state.selectedPeriod);
        if (data.labels) labels = data.labels;
        if (data.data) {
            dailyData   = data.data.bangladeshi || dailyData;
            weeklyByNat = data.data;
        }
    } catch (e) {
        console.warn('Trend data fetch failed, using defaults:', e);
    }

    const ctx1 = document.getElementById('trendChart1');
    if (ctx1) {
        window.trendChart1 = new Chart(ctx1, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Daily Expenditure',
                    data: dailyData,
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37,99,235,0.10)',
                    tension: 0.4, fill: true,
                    pointRadius: 5, pointBackgroundColor: '#2563eb',
                    pointBorderColor: '#fff', pointBorderWidth: 2, pointHoverRadius: 7
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: true,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: { labels: { color: textColor, font: { size: 13 } } },
                    tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: ${formatRs(ctx.parsed.y)}` } }
                },
                scales: {
                    y: { beginAtZero: true, ticks: { color: textColor, callback: v => formatRs(v, 0) }, grid: { color: gridColor } },
                    x: { ticks: { color: textColor }, grid: { color: gridColor } }
                }
            }
        });
    }

    const ctx2 = document.getElementById('trendChart2');
    if (ctx2) {
        window.trendChart2 = new Chart(ctx2, {
            type: 'bar',
            data: {
                labels: ['Week 1', 'Week 2', 'Week 3'],
                datasets: [
                    { label: 'Bangladeshi', data: weeklyByNat.bangladeshi || [1500,1600,1400], backgroundColor: '#ff6b6b' },
                    { label: 'Sri Lankan',  data: weeklyByNat.srilankan   || [1200,1300,1100], backgroundColor: '#4ecdc4' },
                    { label: 'Indian',      data: weeklyByNat.indian       || [300,320,280],   backgroundColor: '#ffa502' },
                    { label: 'Malagasy',    data: weeklyByNat.malagasy     || [600,650,550],   backgroundColor: '#9b59b6' }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: true,
                scales: {
                    x: { ticks: { color: textColor }, grid: { color: gridColor } },
                    y: { beginAtZero: true, ticks: { color: textColor, callback: v => formatRs(v, 0) }, grid: { color: gridColor } }
                },
                plugins: {
                    legend: { labels: { color: textColor, font: { size: 13 } } },
                    tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: ${formatRs(ctx.parsed.y)}` } }
                }
            }
        });
    }

    const cumulative = dailyData.reduce((acc, val) => {
        acc.push((acc.length > 0 ? acc[acc.length - 1] : 0) + val);
        return acc;
    }, []);

    const ctx3 = document.getElementById('trendChart3');
    if (ctx3) {
        window.trendChart3 = new Chart(ctx3, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Cumulative Expenditure',
                    data: cumulative,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16,185,129,0.10)',
                    tension: 0.4, fill: true,
                    pointRadius: 5, pointBackgroundColor: '#10b981',
                    pointBorderColor: '#fff', pointBorderWidth: 2, pointHoverRadius: 7
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: true,
                plugins: {
                    legend: { labels: { color: textColor, font: { size: 13 } } },
                    tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: ${formatRs(ctx.parsed.y)}` } }
                },
                scales: {
                    y: { beginAtZero: true, ticks: { color: textColor, callback: v => formatRs(v, 0) }, grid: { color: gridColor } },
                    x: { ticks: { color: textColor }, grid: { color: gridColor } }
                }
            }
        });
    }

    // Cumulative by nationality chart (trendChart4)
    try {
        const cumData = await fetchCumulativeTrend(state.selectedPeriod);
        createCumulativeNationalityChart('trendChart4', cumData, isDark);
    } catch (e) {
        console.warn('Cumulative trend chart failed:', e);
    }
}

// ── Per Head Charts ───────────────────────────────────────────
function initPerHeadCharts() {
    if (window.perHeadChart1) window.perHeadChart1.destroy();
    if (window.perHeadChart2) window.perHeadChart2.destroy();
    if (window.perHeadChart3) window.perHeadChart3.destroy();

    const isDark    = document.body.classList.contains('dark-mode');
    const bgColor   = isDark ? '#1f2937' : '#ffffff';
    const textColor = isDark ? '#f3f4f6' : '#374151';
    const gridColor = isDark ? '#4b5563' : '#e5e7eb';

    const ctx1 = document.getElementById('perHeadChart1');
    if (ctx1) {
        window.perHeadChart1 = new Chart(ctx1, {
            type: 'bar',
            data: {
                labels: ['Rice', 'Vegetables', 'Meat', 'Spices', 'Flour'],
                datasets: [{
                    label: 'Per Head Consumption (kg)',
                    data: [0.315, 0.189, 0.094, 0.031, 0.126],
                    backgroundColor: '#2563eb', borderColor: '#1e40af',
                    borderWidth: 1, borderRadius: 5
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: true, indexAxis: 'y',
                scales: {
                    x: { ticks: { color: textColor }, grid: { color: gridColor } },
                    y: { ticks: { color: textColor } }
                },
                plugins: { legend: { labels: { color: textColor, font: { size: 13 } } } }
            }
        });
    }

    const ctx2 = document.getElementById('perHeadChart2');
    if (ctx2) {
        window.perHeadChart2 = new Chart(ctx2, {
            type: 'pie',
            data: {
                labels: ['Rice (40%)', 'Vegetables (25%)', 'Meat (20%)', 'Spices (8%)', 'Flour (7%)'],
                datasets: [{
                    data: [40, 25, 20, 8, 7],
                    backgroundColor: ['#ff6b6b','#4ecdc4','#ffa502','#9b59b6','#f59e0b'],
                    borderWidth: 3, borderColor: bgColor
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { usePointStyle: true, padding: 15, color: textColor, font: { size: 13, weight: 'bold' } }
                    }
                }
            }
        });
    }

    const ctx3 = document.getElementById('perHeadChart3');
    if (ctx3) {
        window.perHeadChart3 = new Chart(ctx3, {
            type: 'bar',
            data: {
                labels: ['Rice', 'Vegetables', 'Meat', 'Flour', 'Spices', 'Oil', 'Salt', 'Sugar', 'Dal', 'Bread'],
                datasets: [{
                    label: 'Total Consumption (kg)',
                    data: [500, 300, 150, 200, 50, 80, 30, 40, 60, 100],
                    backgroundColor: ['#ff6b6b','#4ecdc4','#ffa502','#9b59b6','#2563eb','#10b981','#f59e0b','#ef4444','#6366f1','#8b5cf6'],
                    borderWidth: 1, borderColor: '#ffffff', borderRadius: 4
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: true,
                scales: {
                    x: { ticks: { color: textColor }, grid: { color: gridColor } },
                    y: { beginAtZero: true, ticks: { color: textColor }, grid: { color: gridColor } }
                },
                plugins: { legend: { labels: { color: textColor, font: { size: 13 } } } }
            }
        });
    }
}

// ── Comparison Charts ─────────────────────────────────────────
function initComparisonCharts() {
    if (window.comparisonChart1) window.comparisonChart1.destroy();
    if (window.comparisonChart2Plotly) Plotly.purge('comparisonChart2');
    if (window.comparisonChart3Plotly) Plotly.purge('comparisonChart3');

    const isDark    = document.body.classList.contains('dark-mode');
    const bgColor   = isDark ? '#1f2937' : '#ffffff';
    const textColor = isDark ? '#f3f4f6' : '#374151';
    const gridColor = isDark ? '#4b5563' : '#e5e7eb';

    const ctx1 = document.getElementById('comparisonChart1');
    if (ctx1) {
        window.comparisonChart1 = new Chart(ctx1, {
            type: 'bar',
            data: {
                labels: ['Bangladeshi', 'Sri Lankan', 'Indian', 'Malagasy'],
                datasets: [{
                    label: 'Total Expenditure',
                    data: [227958, 98519.90, 59601.20, 41566.60],
                    backgroundColor: ['#ff6b6b','#4ecdc4','#ffa502','#9b59b6'],
                    borderWidth: 2, borderColor: '#ffffff', borderRadius: 5
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: true,
                scales: {
                    y: { beginAtZero: true, ticks: { color: textColor, callback: v => formatRs(v, 0) }, grid: { color: gridColor } },
                    x: { ticks: { color: textColor }, grid: { color: gridColor } }
                },
                plugins: {
                    legend: { labels: { color: textColor, font: { size: 13 } } },
                    tooltip: { callbacks: { label: ctx => `Total: ${formatRs(ctx.parsed.y)}` } }
                }
            }
        });
    }

    const data2 = [{
        x: ['Bangladeshi', 'Sri Lankan', 'Indian', 'Malagasy'],
        y: [325.65, 197.04, 119.20, 166.27],
        type: 'bar',
        marker: { color: ['#ff6b6b','#4ecdc4','#ffa502','#9b59b6'], line: { width: 2, color: '#ffffff' } },
        text: ['Rs 325.65', 'Rs 197.04', 'Rs 119.20', 'Rs 166.27'],
        textposition: 'outside',
        hovertemplate: '<b>%{x}</b><br>Per Head: %{text}<extra></extra>'
    }];

    const layout2 = {
        xaxis: { title: 'Nationality', tickfont: { color: textColor, size: 12 } },
        yaxis: { title: 'Per Head Spending (Rs)', tickfont: { color: textColor, size: 12 } },
        paper_bgcolor: bgColor, plot_bgcolor: bgColor,
        font: { color: textColor, size: 12 },
        margin: { l: 60, r: 50, t: 30, b: 60 }, hovermode: 'closest'
    };

    if (document.getElementById('comparisonChart2')) {
        Plotly.newPlot('comparisonChart2', data2, layout2, { responsive: true });
        window.comparisonChart2Plotly = true;
    }

    const heatmapData = [{
        z: [
            [0.315, 0.280, 0.300, 0.310],
            [0.189, 0.175, 0.192, 0.188],
            [0.094, 0.085, 0.098, 0.093],
            [0.031, 0.028, 0.032, 0.030]
        ],
        x: ['Bangladeshi', 'Sri Lankan', 'Indian', 'Malagasy'],
        y: ['Rice', 'Vegetables', 'Meat', 'Spices'],
        type: 'heatmap',
        colorscale: 'Viridis',
        hovertemplate: '<b>%{y}</b><br>%{x}<br>Value: %{z:.3f}<extra></extra>'
    }];

    const layout3 = {
        xaxis: { title: 'Nationality', tickfont: { color: textColor, size: 12 } },
        yaxis: { title: 'Item', tickfont: { color: textColor, size: 12 } },
        paper_bgcolor: bgColor, plot_bgcolor: bgColor,
        font: { color: textColor, size: 12 },
        margin: { l: 100, r: 50, t: 30, b: 50 }, hovermode: 'closest'
    };

    if (document.getElementById('comparisonChart3')) {
        Plotly.newPlot('comparisonChart3', heatmapData, layout3, { responsive: true });
        window.comparisonChart3Plotly = true;
    }
}

// ── Month Comparison ──────────────────────────────────────────
async function initMonthComparisonPage() {
    try {
        const data    = await fetchPeriods();
        const periods = data.periods || [];
        const months  = [...new Set(periods.map(p => {
            const m = p.match(/^([A-Za-z]+ \d{4})/);
            return m ? m[1] : p;
        }))];

        ['month1Select', 'month2Select'].forEach(id => {
            const sel = document.getElementById(id);
            if (!sel) return;
            sel.innerHTML = months.map(m => `<option value="${m}">${m}</option>`).join('');
        });

        if (months.length > 1) {
            document.getElementById('month2Select').selectedIndex = 1;
        }
    } catch (e) {
        console.warn('Month comparison init failed:', e);
    }
}

async function loadMonthComparison() {
    const month1 = document.getElementById('month1Select')?.value;
    const month2 = document.getElementById('month2Select')?.value;
    if (!month1 || !month2) { showNotification('Please select both months'); return; }

    try {
        const data   = await fetchMonthComparison(month1, month2);
        const isDark = document.body.classList.contains('dark-mode');
        createMonthComparisonCharts(data, month1, month2, isDark);
        renderMonthComparisonTable(data, month1, month2);
    } catch (e) {
        console.error('Month comparison failed:', e);
        showNotification('Error loading month comparison data');
    }
}

function renderMonthComparisonTable(data, month1, month2) {
    const tbody = document.querySelector('#monthComparisonTable tbody');
    if (!tbody) return;
    const nats = [
        { key: 'bangladeshi', label: 'Bangladeshi' },
        { key: 'srilankan',   label: 'Sri Lankan' },
        { key: 'indian',      label: 'Indian' },
        { key: 'malagasy',    label: 'Malagasy' }
    ];
    tbody.innerHTML = nats.map(({ key, label }) => {
        const m1     = data.month1?.[key] || {};
        const m2     = data.month2?.[key] || {};
        const t1     = m1.total || 0;
        const t2     = m2.total || 0;
        const change = t2 - t1;
        const pct    = t1 > 0 ? ((change / t1) * 100).toFixed(1) : '—';
        const arrow  = change > 0 ? '▲' : change < 0 ? '▼' : '—';
        const cls    = change > 0 ? 'positive' : change < 0 ? 'negative' : '';
        return `<tr>
            <td>${label}</td>
            <td>${formatRs(t1)}</td>
            <td>${formatRs(t2)}</td>
            <td class="${cls}">${arrow} ${formatRs(Math.abs(change))}</td>
            <td class="${cls}">${pct}%</td>
        </tr>`;
    }).join('');
}

// ── Item Comparison ───────────────────────────────────────────
async function initItemComparisonFilter() {
    try {
        const data  = await fetchItemsList();
        const items = data.items || [];
        const sel   = document.getElementById('itemSelect');
        if (!sel) return;
        sel.innerHTML = '<option value="">-- Select Item --</option>' +
            items.map(i => `<option value="${i}">${i}</option>`).join('');
    } catch (e) {
        console.warn('Items list init failed:', e);
    }
}

async function loadItemComparison() {
    const item = document.getElementById('itemSelect')?.value;
    if (!item) { showNotification('Please select an item'); return; }

    try {
        const data   = await fetchItemComparison(item);
        const isDark = document.body.classList.contains('dark-mode');
        createItemComparisonChart(data, item, isDark);
        renderItemComparisonTable(data, item);
    } catch (e) {
        console.error('Item comparison failed:', e);
        showNotification('Error loading item comparison data');
    }
}

function renderItemComparisonTable(data, item) {
    const tbody = document.querySelector('#itemComparisonTable tbody');
    if (!tbody) return;
    const nats = [
        { key: 'bangladeshi', label: 'Bangladeshi' },
        { key: 'srilankan',   label: 'Sri Lankan' },
        { key: 'indian',      label: 'Indian' },
        { key: 'malagasy',    label: 'Malagasy' }
    ];
    tbody.innerHTML = nats.map(({ key, label }) => {
        const d = data[key] || {};
        return `<tr>
            <td>${item}</td>
            <td>${label}</td>
            <td>${formatNum(d.quantity || 0)} ${d.unit || ''}</td>
            <td>${formatRs(d.unit_price || 0)}</td>
            <td>${formatRs(d.total_cost || 0)}</td>
            <td>${formatRs(d.per_head || 0)}</td>
        </tr>`;
    }).join('');
}

// ── Report Generation ─────────────────────────────────────────
function generateReport(type) {
    const reportContent = document.getElementById('reportContent');
    const exportPdfBtn  = document.getElementById('exportPdfBtn');
    const exportExcelBtn = document.getElementById('exportExcelBtn');
    const reportExportGroup = document.getElementById('reportExportGroup');
    if (!reportContent) return;

    let content = '';
    const date  = new Date().toLocaleDateString('en-IN');

    switch (type) {
        case 'trend':
            content = `
                <h3>Trend Analysis Report</h3>
                <p><strong>Report Date:</strong> ${date}</p>
                <h4>Period Analysis</h4>
                <p>Expenditure trends from 2026-04-10 to 2026-04-24</p>
                <table class="preview-table" style="margin-top:1rem">
                    <thead><tr><th>Date</th><th>Daily Expenditure</th><th>Weekly Total</th><th>Cumulative</th></tr></thead>
                    <tbody>
                        <tr><td>2026-04-10</td><td>${formatRs(500)}</td><td>${formatRs(3500)}</td><td>${formatRs(500)}</td></tr>
                        <tr><td>2026-04-17</td><td>${formatRs(520)}</td><td>${formatRs(3640)}</td><td>${formatRs(4020)}</td></tr>
                        <tr><td>2026-04-24</td><td>${formatRs(480)}</td><td>${formatRs(3360)}</td><td>${formatRs(7380)}</td></tr>
                    </tbody>
                </table>`;
            break;

        case 'per-head':
            content = `
                <h3>Per-Head Consumption Report</h3>
                <p><strong>Report Date:</strong> ${date}</p>
                <table class="preview-table" style="margin-top:1rem">
                    <thead><tr><th>Item</th><th>Total Qty</th><th>Per Head Qty</th><th>Total Cost</th><th>Per Head Cost</th></tr></thead>
                    <tbody>
                        <tr><td>Rice</td><td>500 kg</td><td>0.31 kg</td><td>${formatRs(250)}</td><td>${formatRs(0.16)}</td></tr>
                        <tr><td>Vegetables</td><td>300 kg</td><td>0.19 kg</td><td>${formatRs(300)}</td><td>${formatRs(0.19)}</td></tr>
                        <tr><td>Meat</td><td>150 kg</td><td>0.09 kg</td><td>${formatRs(450)}</td><td>${formatRs(0.28)}</td></tr>
                        <tr><td>Spices</td><td>50 kg</td><td>0.03 kg</td><td>${formatRs(100)}</td><td>${formatRs(0.06)}</td></tr>
                    </tbody>
                </table>`;
            break;

        case 'comparison':
            content = `
                <h3>Nationality Comparison Report</h3>
                <p><strong>Report Date:</strong> ${date}</p>
                <table class="preview-table" style="margin-top:1rem">
                    <thead><tr><th>Nationality</th><th>Employees</th><th>Total Spend</th><th>Per Head</th><th>% of Total</th></tr></thead>
                    <tbody>
                        <tr><td>Bangladeshi</td><td>700</td><td>${formatRs(227958)}</td><td>${formatRs(325.65)}</td><td>53.4%</td></tr>
                        <tr><td>Sri Lankan</td><td>500</td><td>${formatRs(98519.90)}</td><td>${formatRs(197.04)}</td><td>23.1%</td></tr>
                        <tr><td>Indian</td><td>500</td><td>${formatRs(59601.20)}</td><td>${formatRs(119.20)}</td><td>14.0%</td></tr>
                        <tr><td>Malagasy</td><td>250</td><td>${formatRs(41566.60)}</td><td>${formatRs(166.27)}</td><td>9.7%</td></tr>
                    </tbody>
                </table>`;
            break;

        case 'detailed':
            content = `
                <h3>Detailed Expenditure Report</h3>
                <p><strong>Report Date:</strong> ${date}</p>
                <p><strong>Total Records:</strong> ${state.expenditures.length > 0 ? state.expenditures.length : 127}</p>
                <table class="preview-table" style="margin-top:1rem">
                    <thead><tr><th>Date</th><th>Item</th><th>Qty</th><th>Price</th><th>Total</th><th>Nationality</th></tr></thead>
                    <tbody>
                        ${state.expenditures.length > 0
                            ? state.expenditures.slice(0, 5).map(r =>
                                `<tr><td>${r.date}</td><td>${r.item}</td><td>${r.quantity}</td><td>${formatRs(r.price)}</td><td>${formatRs(r.total)}</td><td>${r.nationality}</td></tr>`
                              ).join('')
                            : `<tr><td>2026-04-24</td><td>Rice</td><td>50kg</td><td>${formatRs(0.50)}</td><td>${formatRs(25)}</td><td>Bangladeshi</td></tr>
                               <tr><td>2026-04-24</td><td>Vegetables</td><td>30kg</td><td>${formatRs(1.00)}</td><td>${formatRs(30)}</td><td>Sri Lankan</td></tr>
                               <tr><td>2026-04-23</td><td>Meat</td><td>20kg</td><td>${formatRs(2.00)}</td><td>${formatRs(40)}</td><td>Indian</td></tr>
                               <tr><td>2026-04-23</td><td>Spices</td><td>10kg</td><td>${formatRs(0.75)}</td><td>${formatRs(7.50)}</td><td>Malagasy</td></tr>`
                        }
                    </tbody>
                </table>`;
            break;

        case 'cumulative':
            content = `
                <h3>Cumulative Expenditure Report</h3>
                <p><strong>Report Date:</strong> ${date}</p>
                <table class="preview-table" style="margin-top:1rem">
                    <thead><tr><th>Day</th><th>Bangladeshi</th><th>Sri Lankan</th><th>Indian</th><th>Malagasy</th><th>Total</th></tr></thead>
                    <tbody>
                        ${Array.from({length: 15}, (_, i) => {
                            const day = i + 1;
                            const b   = (227958 / 15 * day).toFixed(2);
                            const s   = (98519.9 / 15 * day).toFixed(2);
                            const ind = (59601.2 / 15 * day).toFixed(2);
                            const m   = (41566.6 / 15 * day).toFixed(2);
                            const tot = (parseFloat(b)+parseFloat(s)+parseFloat(ind)+parseFloat(m)).toFixed(2);
                            return `<tr><td>Day ${day}</td><td>${formatRs(b)}</td><td>${formatRs(s)}</td><td>${formatRs(ind)}</td><td>${formatRs(m)}</td><td>${formatRs(tot)}</td></tr>`;
                        }).join('')}
                    </tbody>
                </table>`;
            break;
    }

    reportContent.innerHTML = content;
    if (exportPdfBtn)     exportPdfBtn.style.display     = 'inline-flex';
    if (exportExcelBtn)   exportExcelBtn.style.display   = 'inline-flex';
    if (reportExportGroup) reportExportGroup.style.display = 'flex';
}

function exportReport(format) {
    showNotification(`Exporting report as ${format.toUpperCase()}...`);
    generateReportExport('detailed', format, state.selectedPeriod);
}

// ── Page Export ───────────────────────────────────────────────
async function exportPageData(page, format) {
    try {
        showNotification(`Preparing ${page} export as ${format.toUpperCase()}...`);
        await generateReportExport(page, format, state.selectedPeriod);
    } catch (e) {
        showNotification(`Export failed: ${e.message}`);
    }
}

// ── Chart Update Wrappers ─────────────────────────────────────
function updateTrendChart()      { initTrendCharts(); }
function updatePerHeadChart()    { initPerHeadCharts(); }
function updateComparisonChart() { initComparisonCharts(); }

// ── Global Exports ────────────────────────────────────────────
window.updateTrendChart      = updateTrendChart;
window.updatePerHeadChart    = updatePerHeadChart;
window.updateComparisonChart = updateComparisonChart;
window.generateReport        = generateReport;
window.exportReport          = exportReport;
window.exportPageData        = exportPageData;
window.editEmployee          = editEmployee;
window.saveEmployee          = saveEmployee;
window.cancelEdit            = cancelEdit;
window.confirmUpload         = confirmUpload;
window.initHomeCharts        = initHomeCharts;
window.initTrendCharts       = initTrendCharts;
window.initPerHeadCharts     = initPerHeadCharts;
window.initComparisonCharts  = initComparisonCharts;
window.downloadEmployeeHistory    = downloadEmployeeHistory;
window.getEmployeeChangeHistory   = getEmployeeChangeHistory;
window.loadMonthComparison        = loadMonthComparison;
window.loadItemComparison         = loadItemComparison;
window.formatRs                   = formatRs;
window.formatNum                  = formatNum;
