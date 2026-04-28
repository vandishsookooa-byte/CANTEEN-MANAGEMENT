// ============================================================================
// CANTEEN MANAGEMENT SYSTEM - MAIN JAVASCRIPT (UPDATED - API WIRED)
// ============================================================================

// State Management
const state = {
    employees: {
        bangladeshi: 700,
        srilankan: 500,
        indian: 138,
        malagasy: 250
    },
    currentPage: 'home',
    theme: localStorage.getItem('theme') || 'light',
    uploadedFile: null,
    employeeHistories: []
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    setupTheme();
    initializeEventListeners();
    navigateTo('home');
});

// Show Notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = 'notification';
    const bgColor = type === 'error' ? 'linear-gradient(135deg,#ef4444,#b91c1c)' : 'linear-gradient(135deg,#10b981,#059669)';
    notification.innerHTML = `<i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'check-circle'}"></i><span>${message}</span>`;
    notification.style.cssText = `
        position:fixed;top:80px;right:20px;background:${bgColor};color:white;
        padding:14px 22px;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,.2);
        z-index:10000;animation:slideIn .3s ease-out;font-weight:600;
        display:flex;align-items:center;gap:10px;max-width:400px;
    `;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.style.animation = 'slideOut .3s ease-in';
        setTimeout(() => notification.remove(), 300);
    }, 3500);
}

const notifStyle = document.createElement('style');
notifStyle.innerHTML = `
    @keyframes slideIn { from { transform:translateX(400px);opacity:0; } to { transform:translateX(0);opacity:1; } }
    @keyframes slideOut { from { transform:translateX(0);opacity:1; } to { transform:translateX(400px);opacity:0; } }
`;
document.head.appendChild(notifStyle);

// Initialize Event Listeners
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
    const fileInput = document.getElementById('fileInput');
    if (uploadZone) {
        uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.style.borderColor = 'var(--color-primary)'; });
        uploadZone.addEventListener('dragleave', () => { uploadZone.style.borderColor = ''; });
        uploadZone.addEventListener('drop', e => { e.preventDefault(); uploadZone.style.borderColor = ''; if (e.dataTransfer.files[0]) handleFileSelect(e.dataTransfer.files[0]); });
    }
    if (fileInput) {
        fileInput.addEventListener('change', e => { if (e.target.files[0]) handleFileSelect(e.target.files[0]); });
    }

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.navbar')) {
            document.getElementById('navbarMenu').classList.remove('active');
        }
    });
}

// Navigation
function navigateTo(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const targetPage = document.getElementById(page);
    if (targetPage) targetPage.classList.add('active');
    state.currentPage = page;

    setTimeout(async () => {
        if (page === 'home') {
            await loadHomePage();
        } else if (page === 'employees') {
            await loadEmployeePage();
        } else if (page === 'trends') {
            await loadTrendsPage();
        } else if (page === 'per-head') {
            await loadPerHeadPage();
        } else if (page === 'comparison') {
            await loadComparisonPage();
        }
    }, 100);
}

// ============================================================================
// PAGE LOADERS
// ============================================================================

async function loadHomePage() {
    try {
        const summary = await CanteenAPI.getSummary();

        if (summary.error && !summary.excelAvailable) {
            showNotification('Excel file not found. Showing employee data only.', 'error');
        }

        state.employees = summary.employees || state.employees;

        // Update KPI cards
        const totalEmpEl = document.getElementById('totalEmployees');
        if (totalEmpEl) totalEmpEl.textContent = summary.totalEmployees.toLocaleString();

        const totalExpEl = document.getElementById('totalExpenditure');
        if (totalExpEl) totalExpEl.textContent = `Rs ${summary.totalExpenditure.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}`;

        const avgEl = document.getElementById('avgPerHead');
        if (avgEl) avgEl.textContent = `Rs ${summary.avgPerHead.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}`;

        const periodEl = document.getElementById('periodDisplay');
        if (periodEl) periodEl.textContent = summary.period;

        const periodBadge = document.getElementById('periodBadge');
        if (periodBadge) periodBadge.textContent = summary.period;

        // Update summary cards
        updateSummaryCards(summary.employees, summary.totalEmployees);

        // Update summaryTotal
        const st = document.getElementById('summaryTotal');
        if (st) st.textContent = summary.totalEmployees.toLocaleString();

        // Draw charts
        initHomeCharts(summary.employees);
    } catch (err) {
        console.error('Error loading home page:', err);
        showNotification('Error loading dashboard data', 'error');
        initHomeCharts(state.employees);
    }
}

function updateSummaryCards(employees, total) {
    const nats = ['bangladeshi', 'srilankan', 'indian', 'malagasy'];
    const ids = { bangladeshi: 'sumBangladeshi', srilankan: 'sumSrilankan', indian: 'sumIndian', malagasy: 'sumMalagasy' };
    const pctIds = { bangladeshi: 'sumPctBangladeshi', srilankan: 'sumPctSrilankan', indian: 'sumPctIndian', malagasy: 'sumPctMalagasy' };
    nats.forEach(nat => {
        const count = employees[nat] || 0;
        const pct = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
        const valEl = document.getElementById(ids[nat]);
        const pctEl = document.getElementById(pctIds[nat]);
        if (valEl) valEl.textContent = count.toLocaleString();
        if (pctEl) pctEl.textContent = `${pct}%`;
    });
}

async function loadEmployeePage() {
    try {
        const data = await CanteenAPI.getEmployees();
        state.employees = {};
        const nats = ['bangladeshi', 'srilankan', 'indian', 'malagasy'];
        let total = 0;
        nats.forEach(nat => {
            const info = data[nat];
            if (info) {
                state.employees[nat] = info.count;
                total += info.count;
                const countEl = document.getElementById(`count-${nat}`);
                if (countEl) countEl.textContent = info.count.toLocaleString();
                const input = document.getElementById(`input-${nat}`);
                if (input) input.value = info.count;
            }
        });
        const st2 = document.getElementById('summaryTotal2');
        if (st2) st2.textContent = total.toLocaleString();
    } catch (err) {
        console.error('Error loading employee page:', err);
    }
}

async function loadTrendsPage() {
    try {
        const nat = document.getElementById('trendNationality')?.value || 'all';
        const data = await CanteenAPI.getTrends(nat);
        initTrendCharts(data);
    } catch (err) {
        console.error('Error loading trends:', err);
        initTrendCharts(null);
    }
}

async function loadPerHeadPage() {
    try {
        const nat = document.getElementById('perHeadNationality')?.value || 'all';
        const cat = document.getElementById('perHeadCategory')?.value || 'all';
        const data = await CanteenAPI.getPerHead(nat, cat);
        initPerHeadCharts(Array.isArray(data) ? data : []);
    } catch (err) {
        console.error('Error loading per-head:', err);
        initPerHeadCharts([]);
    }
}

async function loadComparisonPage() {
    try {
        const data = await CanteenAPI.getComparison();
        if (Array.isArray(data)) {
            initComparisonCharts(data);
            updateComparisonTable(data);
        }
    } catch (err) {
        console.error('Error loading comparison:', err);
        initComparisonCharts([]);
    }
}

function updateComparisonTable(data) {
    const tbody = document.getElementById('comparisonTableBody');
    if (!tbody) return;
    tbody.innerHTML = data.map(row => `
        <tr>
            <td><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${row.color};margin-right:8px;"></span>${row.label}</td>
            <td>${row.employees.toLocaleString()}</td>
            <td>Rs ${row.totalExpenditure.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
            <td>Rs ${row.perHead.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
            <td>Rs ${row.perDay.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
            <td>${row.period}</td>
        </tr>
    `).join('');
}

// ============================================================================
// THEME
// ============================================================================

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

    // Redraw current page charts
    if (state.currentPage === 'home') loadHomePage();
    else if (state.currentPage === 'trends') loadTrendsPage();
    else if (state.currentPage === 'per-head') loadPerHeadPage();
    else if (state.currentPage === 'comparison') loadComparisonPage();
}

// ============================================================================
// EMPLOYEE MANAGEMENT
// ============================================================================

function editEmployee(nationality) {
    const card = document.querySelector(`[data-nationality="${nationality}"]`);
    if (card) {
        card.querySelector('.employee-display').style.display = 'none';
        card.querySelector('.employee-form').style.display = 'flex';
        const editBtn = card.querySelector('.btn-edit');
        if (editBtn) editBtn.style.display = 'none';
        const input = document.getElementById(`input-${nationality}`);
        if (input) { input.value = state.employees[nationality] || ''; setTimeout(() => input.focus(), 100); }
    }
}

async function saveEmployee(nationality) {
    const input = document.getElementById(`input-${nationality}`);
    const newValue = parseInt(input.value);
    if (isNaN(newValue) || newValue < 0) { alert('Please enter a valid number'); return; }

    try {
        const result = await CanteenAPI.updateEmployee(nationality, newValue);
        if (result.error) { showNotification(result.error, 'error'); return; }

        state.employees[nationality] = newValue;
        const nats = ['bangladeshi', 'srilankan', 'indian', 'malagasy'];
        let total = 0;
        nats.forEach(nat => { total += (result[nat]?.count || state.employees[nat] || 0); });

        nats.forEach(nat => {
            const countEl = document.getElementById(`count-${nat}`);
            if (countEl && result[nat]) countEl.textContent = result[nat].count.toLocaleString();
        });

        const st2 = document.getElementById('summaryTotal2');
        if (st2) st2.textContent = total.toLocaleString();

        showNotification(`${nationality.charAt(0).toUpperCase() + nationality.slice(1)} updated to ${newValue}`);
    } catch (err) {
        showNotification('Error updating employee count', 'error');
    }

    cancelEdit(nationality);
}

function cancelEdit(nationality) {
    const card = document.querySelector(`[data-nationality="${nationality}"]`);
    if (card) {
        card.querySelector('.employee-display').style.display = 'block';
        card.querySelector('.employee-form').style.display = 'none';
        const editBtn = card.querySelector('.btn-edit');
        if (editBtn) editBtn.style.display = 'inline-flex';
    }
}

// ============================================================================
// CHART UPDATE TRIGGERS (from filter selects)
// ============================================================================

function updateTrendChart() { loadTrendsPage(); }
function updatePerHeadChart() { loadPerHeadPage(); }
function updateComparisonChart() { loadComparisonPage(); }

// ============================================================================
// FILE UPLOAD
// ============================================================================

function handleFileSelect(file) {
    state.uploadedFile = file;
    const preview = document.getElementById('uploadPreview');
    const fileName = document.getElementById('uploadFileName');
    if (fileName) fileName.textContent = `File: ${file.name}`;
    if (preview) preview.style.display = 'block';

    // Show a simple preview row
    const thead = document.getElementById('previewHead');
    const tbody = document.getElementById('previewBody');
    if (thead) thead.innerHTML = '<tr><th>File</th><th>Size</th><th>Type</th></tr>';
    if (tbody) tbody.innerHTML = `<tr><td>${file.name}</td><td>${(file.size/1024).toFixed(1)} KB</td><td>${file.type || 'unknown'}</td></tr>`;

    showNotification(`File "${file.name}" ready to upload`);
}

async function confirmUpload() {
    if (!state.uploadedFile) { alert('No file selected'); return; }
    const formData = new FormData();
    formData.append('file', state.uploadedFile);

    try {
        const result = await CanteenAPI.uploadFile(formData);
        if (result.success) {
            showNotification(`Successfully uploaded ${result.records} records!`);
            const preview = document.getElementById('uploadPreview');
            if (preview) preview.style.display = 'none';
            const fileInput = document.getElementById('fileInput');
            if (fileInput) fileInput.value = '';
            state.uploadedFile = null;
        } else {
            showNotification(`Upload failed: ${result.error}`, 'error');
        }
    } catch (err) {
        showNotification('Upload failed: ' + err.message, 'error');
    }
}

function cancelUpload() {
    state.uploadedFile = null;
    const preview = document.getElementById('uploadPreview');
    if (preview) preview.style.display = 'none';
    const fileInput = document.getElementById('fileInput');
    if (fileInput) fileInput.value = '';
}

// ============================================================================
// REPORTS
// ============================================================================

async function generateReport(type) {
    const reportPreview = document.getElementById('reportPreview');
    const reportContent = document.getElementById('reportContent');
    const exportPdfBtn = document.getElementById('exportPdfBtn');
    const exportExcelBtn = document.getElementById('exportExcelBtn');

    if (!reportContent) return;

    reportContent.innerHTML = '<p>Generating report...</p>';
    if (reportPreview) reportPreview.style.display = 'block';

    try {
        const data = await CanteenAPI.getReport(type);

        if (data.error) {
            reportContent.innerHTML = `<p style="color:red">Error: ${data.error}</p>`;
            return;
        }

        const cols = data.columns || [];
        const rows = data.rows || [];

        let html = `<h3>${type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')} Report</h3>`;
        html += `<p><strong>Report Date:</strong> ${new Date().toLocaleDateString()}</p>`;
        html += `<p><strong>Total Records:</strong> ${rows.length}</p>`;
        html += `<div style="overflow-x:auto;margin-top:1rem"><table class="preview-table">`;
        html += `<thead><tr>${cols.map(c => `<th>${c}</th>`).join('')}</tr></thead>`;
        html += `<tbody>`;
        rows.forEach(row => {
            html += `<tr>${cols.map(c => `<td>${row[c] !== undefined ? row[c] : ''}</td>`).join('')}</tr>`;
        });
        html += `</tbody></table></div>`;

        reportContent.innerHTML = html;
        if (exportPdfBtn) exportPdfBtn.style.display = 'inline-flex';
        if (exportExcelBtn) exportExcelBtn.style.display = 'inline-flex';
    } catch (err) {
        reportContent.innerHTML = `<p style="color:red">Error generating report: ${err.message}</p>`;
    }
}

function exportReport(format) {
    showNotification(`Report exported as ${format.toUpperCase()}!`);
}

// Export functions for global use
window.editEmployee = editEmployee;
window.saveEmployee = saveEmployee;
window.cancelEdit = cancelEdit;
window.confirmUpload = confirmUpload;
window.cancelUpload = cancelUpload;
window.generateReport = generateReport;
window.exportReport = exportReport;
window.updateTrendChart = updateTrendChart;
window.updatePerHeadChart = updatePerHeadChart;
window.updateComparisonChart = updateComparisonChart;
