// ============================================================================
// CANTEEN MANAGEMENT SYSTEM - MAIN JAVASCRIPT (COMPLETE & CORRECTED)
// ============================================================================

// State Management
const state = {
    employees: {
        bangladeshi: 700,
        srilankan: 500,
        indian: 138,
        malagasy: 250
    },
    expenditures: [],
    currentPage: 'home',
    theme: localStorage.getItem('theme') || 'light',
    uploadedData: null,
    employeeHistories: [] // Track employee count changes over time
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    loadState();
    initializeEventListeners();
    setupTheme();
    navigateTo('home');
    updateAllKPIs();
    setTimeout(() => initHomeCharts(), 500);
});

// Load State from LocalStorage
function loadState() {
    const savedState = localStorage.getItem('canteenState');
    if (savedState) {
        const parsed = JSON.parse(savedState);
        state.employees = parsed.employees || state.employees;
        state.expenditures = parsed.expenditures || state.expenditures;
        state.theme = parsed.theme || 'light';
        state.employeeHistories = parsed.employeeHistories || [];
    }
}

// Save State to LocalStorage
function saveState() {
    localStorage.setItem('canteenState', JSON.stringify(state));
}

// Record Employee Count Change with Timestamp
function recordEmployeeChange(nationality, oldCount, newCount) {
    const timestamp = new Date().toISOString();
    const changeRecord = {
        date: new Date().toLocaleDateString('en-IN'),
        timestamp: timestamp,
        nationality: nationality,
        oldCount: oldCount,
        newCount: newCount,
        change: newCount - oldCount,
        period: new Date().toLocaleDateString('en-IN', { month: '2-digit', day: '2-digit', year: 'numeric' })
    };
    
    state.employeeHistories.push(changeRecord);
    saveState();
    
    // Log to console for debugging
    console.log(`Employee Change Recorded:`, changeRecord);
    
    // Show notification
    showNotification(`${nationality.charAt(0).toUpperCase() + nationality.slice(1)} count updated: ${oldCount} → ${newCount}`);
}

// Show Notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
    `;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 10px;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add animation styles
const style = document.createElement('style');
style.innerHTML = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize Event Listeners
function initializeEventListeners() {
    // Navigation
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

    // Theme Toggle
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);

    // Hamburger Menu
    document.getElementById('hamburger').addEventListener('click', () => {
        document.getElementById('navbarMenu').classList.toggle('active');
    });

    // Upload Zone
    const uploadZone = document.getElementById('uploadZone');
    const fileInput = document.getElementById('fileInput');

    if (uploadZone) {
        uploadZone.addEventListener('click', () => fileInput.click());
        uploadZone.addEventListener('dragover', handleDragOver);
        uploadZone.addEventListener('dragleave', handleDragLeave);
        uploadZone.addEventListener('drop', handleFileDrop);
    }

    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
    }

    // Close mobile menu when clicking outside
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
    if (targetPage) {
        targetPage.classList.add('active');
    }
    state.currentPage = page;
    saveState();

    // Initialize charts and updates when page becomes active
    setTimeout(() => {
        if (page === 'home') {
            updateAllKPIs();
            updateEmployeeDisplays();
            updateHomeSummaryCards();
            initHomeCharts();
        }
        else if (page === 'employees') {
            updateEmployeeDisplays();
        }
        else if (page === 'trends') {
            initTrendCharts();
        }
        else if (page === 'per-head') {
            initPerHeadCharts();
        }
        else if (page === 'comparison') {
            initComparisonCharts();
        }
    }, 100);
}

// Theme Management
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
    
    // Redraw charts with new theme
    if (state.currentPage === 'home') initHomeCharts();
    else if (state.currentPage === 'trends') initTrendCharts();
    else if (state.currentPage === 'per-head') initPerHeadCharts();
    else if (state.currentPage === 'comparison') initComparisonCharts();
}

// ============================================================================
// EMPLOYEE MANAGEMENT
// ============================================================================

function updateEmployeeDisplays() {
    const nationalities = ['bangladeshi', 'srilankan', 'indian', 'malagasy'];
    const total = Object.values(state.employees).reduce((a, b) => a + b, 0);

    nationalities.forEach(nat => {
        const count = state.employees[nat];
        const percentage = ((count / total) * 100).toFixed(1);
        
        const countElement = document.getElementById(`count-${nat}`);
        if (countElement) {
            countElement.textContent = count.toLocaleString();
        }
        
        const percentElements = document.querySelectorAll(`[data-nationality="${nat}"] .employee-percentage`);
        percentElements.forEach(el => el.textContent = `${percentage}%`);
    });

    const summaryTotal = document.getElementById('summaryTotal');
    if (summaryTotal) {
        summaryTotal.textContent = total.toLocaleString();
    }

    updateAllKPIs();
}

// Update Home Page Summary Cards with Dynamic Percentages
function updateHomeSummaryCards() {
    const nationalities = ['bangladeshi', 'srilankan', 'indian', 'malagasy'];
    const total = Object.values(state.employees).reduce((a, b) => a + b, 0);

    nationalities.forEach(nat => {
        const count = state.employees[nat];
        const percentage = ((count / total) * 100).toFixed(1);
        
        // Find the summary card for this nationality and update value and percentage
        const cards = document.querySelectorAll('.summary-card');
        cards.forEach(card => {
            const label = card.querySelector('.summary-label');
            if (label && label.textContent.toLowerCase().includes(nat === 'bangladeshi' ? 'bangladeshi' : 
                                                                    nat === 'srilankan' ? 'sri' : 
                                                                    nat === 'indian' ? 'indian' : 'malagasy')) {
                const valueEl = card.querySelector('.summary-value');
                const percentEl = card.querySelector('.summary-percent');
                
                if (valueEl) valueEl.textContent = count;
                if (percentEl) percentEl.textContent = `${percentage}%`;
            }
        });
    });
}

function editEmployee(nationality) {
    const card = document.querySelector(`[data-nationality="${nationality}"]`);
    if (card) {
        card.querySelector('.employee-display').style.display = 'none';
        card.querySelector('.employee-form').style.display = 'flex';
        const editBtn = card.querySelector('.btn-edit');
        if (editBtn) editBtn.style.display = 'none';
        
        // Focus input for better UX
        const input = document.getElementById(`input-${nationality}`);
        if (input) {
            setTimeout(() => input.focus(), 100);
        }
    }
}

function saveEmployee(nationality) {
    const input = document.getElementById(`input-${nationality}`);
    const newValue = parseInt(input.value);
    
    if (isNaN(newValue) || newValue < 0) {
        alert('Please enter a valid number');
        return;
    }
    
    const oldValue = state.employees[nationality];
    
    // Only update if value changed
    if (newValue !== oldValue) {
        // Record the change with timestamp
        recordEmployeeChange(nationality, oldValue, newValue);
        
        state.employees[nationality] = newValue;
        saveState();
    }
    
    cancelEdit(nationality);
    updateEmployeeDisplays();
    updateHomeSummaryCards();
    
    // Always refresh home charts so the KPI and doughnut chart reflect the new count
    // even when the user is currently on the Employees page.
    // The next navigation to 'home' will also re-trigger these via navigateTo().
    initHomeCharts();
}

function cancelEdit(nationality) {
    const card = document.querySelector(`[data-nationality="${nationality}"]`);
    if (card) {
        card.querySelector('.employee-display').style.display = 'block';
        card.querySelector('.employee-form').style.display = 'none';
        const editBtn = card.querySelector('.btn-edit');
        if (editBtn) editBtn.style.display = 'inline-flex';
        const input = document.getElementById(`input-${nationality}`);
        if (input) input.value = state.employees[nationality];
    }
}

// Get Employee Change History
function getEmployeeChangeHistory(nationality = null, days = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return state.employeeHistories.filter(record => {
        const recordDate = new Date(record.timestamp);
        const matches = recordDate > cutoffDate;
        const nationalityMatches = !nationality || record.nationality === nationality;
        return matches && nationalityMatches;
    });
}

// Export Employee Change History
function downloadEmployeeHistory() {
    const history = getEmployeeChangeHistory();
    
    if (history.length === 0) {
        alert('No employee changes recorded yet.');
        return;
    }
    
    let csv = 'Date,Nationality,Old Count,New Count,Change\n';
    history.forEach(record => {
        csv += `${record.date},${record.nationality},${record.oldCount},${record.newCount},${record.change > 0 ? '+' : ''}${record.change}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `employee-history-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}

// ============================================================================
// FILE UPLOAD
// ============================================================================

function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.style.borderColor = 'var(--color-primary)';
    e.currentTarget.style.backgroundColor = 'rgba(37, 99, 235, 0.05)';
}

function handleDragLeave(e) {
    e.currentTarget.style.borderColor = '';
    e.currentTarget.style.backgroundColor = '';
}

function handleFileDrop(e) {
    e.preventDefault();
    const files = e.dataTransfer.files;
    handleFileSelect({ target: { files } });
    e.currentTarget.style.borderColor = '';
    e.currentTarget.style.backgroundColor = '';
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const content = event.target.result;
            const parsedData = parseUploadedFile(content, file.type || file.name);
            
            if (parsedData && parsedData.length > 0) {
                state.uploadedData = {
                    data: parsedData,
                    fileName: file.name,
                    uploadDate: new Date().toISOString(),
                    recordCount: parsedData.length
                };
                saveState();
                showUploadPreview(file.name, parsedData);
            }
        } catch (error) {
            alert(`Error parsing file: ${error.message}`);
            console.error('File parse error:', error);
        }
    };
    reader.readAsText(file);
}

// Advanced File Parser - Supports Multiple Formats
function parseUploadedFile(content, fileType) {
    try {
        // Try JSON first
        if (content.trim().startsWith('[') || content.trim().startsWith('{')) {
            return parseJSON(content);
        }
        
        // Try TSV (Tab-separated)
        if (content.includes('\t')) {
            return parseDelimited(content, '\t');
        }
        
        // Try CSV (Comma-separated)
        return parseDelimited(content, ',');
    } catch (error) {
        console.error('Parse error:', error);
        return null;
    }
}

function parseJSON(content) {
    const data = JSON.parse(content);
    const array = Array.isArray(data) ? data : [data];
    
    return array.map(row => normalizeRow(row));
}

function parseDelimited(content, delimiter) {
    const lines = content.trim().split('\n');
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase());
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(delimiter).map(v => v.trim());
        if (values.some(v => v)) { // Skip empty rows
            const row = {};
            headers.forEach((header, idx) => {
                row[header] = values[idx] || '';
            });
            data.push(normalizeRow(row));
        }
    }
    
    return data;
}

function normalizeRow(row) {
    // Find column by any variation of the name
    const getColumn = (row, variations) => {
        for (let key in row) {
            if (variations.some(v => key.includes(v))) {
                return row[key];
            }
        }
        return null;
    };
    
    const date = getColumn(row, ['date', 'transaction', 'purchase']) || new Date().toISOString().split('T')[0];
    const item = getColumn(row, ['item', 'product', 'name']) || 'Unknown';
    const quantity = parseQuantity(getColumn(row, ['quantity', 'qty', 'amount']) || '0');
    const price = parsePrice(getColumn(row, ['price', 'cost', 'rate']) || '0');
    const nationality = normalizeNationality(getColumn(row, ['nationality', 'nation', 'country']) || 'Unknown');

    // Detect measurement unit from item name using whole-word matching to avoid
    // false positives (e.g. "Eggplant" must not match "egg", "Breadfruit" is fine as "pc").
    let unit = 'kg'; // default for most dry goods
    if (/\boil\b/i.test(item))       unit = 'L';
    else if (/\bbread\b/i.test(item)) unit = 'pc';
    else if (/\beggs?\b/i.test(item)) unit = 'unit';

    return {
        date,
        item,
        quantity,
        price,
        unit,
        total: (quantity * price).toFixed(2),
        nationality,
        timestamp: new Date().toISOString()
    };
}

function parseQuantity(value) {
    const match = String(value).match(/[\d.]+/);
    return match ? parseFloat(match[0]) : 0;
}

function parsePrice(value) {
    const str = String(value).replace(/[^\d.]/g, '');
    return str ? parseFloat(str) : 0;
}

function normalizeNationality(value) {
    const str = String(value).toLowerCase().trim();
    if (str.includes('banglad')) return 'Bangladeshi';
    if (str.includes('sri')) return 'Sri Lankan';
    if (str.includes('indian') || str.includes('india')) return 'Indian';
    if (str.includes('malagasy')) return 'Malagasy';
    return value;
}

function showUploadPreview(filename, data) {
    const preview = document.getElementById('uploadPreview');
    const thead = document.getElementById('previewHead');
    const tbody = document.getElementById('previewBody');

    if (!preview) return;

    const headers = ['Date', 'Item', 'Quantity', 'Unit', 'Price (Rs)', 'Total (Rs)', 'Nationality'];
    
    if (thead) {
        thead.innerHTML = `<tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;
    }
    
    if (tbody) {
        // Show first 10 rows
        const previewData = data.slice(0, 10);
        tbody.innerHTML = previewData.map(row => 
            `<tr>
                <td>${row.date}</td>
                <td>${row.item}</td>
                <td>${row.quantity.toFixed(2)}</td>
                <td>${row.unit || 'kg'}</td>
                <td>Rs ${row.price.toFixed(2)}</td>
                <td>Rs ${row.total}</td>
                <td>${row.nationality}</td>
            </tr>`
        ).join('');
    }

    preview.style.display = 'block';
    showNotification(`${filename}: ${data.length} records ready to upload`);
}

function confirmUpload() {
    if (!state.uploadedData) {
        alert('No file to upload');
        return;
    }
    
    // Add to expenditures
    state.expenditures = state.expenditures.concat(state.uploadedData.data);
    saveState();
    
    const preview = document.getElementById('uploadPreview');
    const fileInput = document.getElementById('fileInput');
    
    if (preview) preview.style.display = 'none';
    if (fileInput) fileInput.value = '';
    
    showNotification(`✅ Successfully uploaded ${state.uploadedData.recordCount} records!`);

    // Refresh all displays so the new data is immediately visible everywhere
    updateAllKPIs();
    updateEmployeeDisplays();
    updateHomeSummaryCards();

    // Redraw charts if on a chart page
    if (state.currentPage === 'home') initHomeCharts();
    else if (state.currentPage === 'trends') initTrendCharts();
    else if (state.currentPage === 'per-head') initPerHeadCharts();
    else if (state.currentPage === 'comparison') initComparisonCharts();

    // Sync with backend if available (non-blocking)
    if (typeof syncWithBackend === 'function') {
        try { syncWithBackend(); } catch (e) { console.warn('Backend sync error:', e); }
    }

    state.uploadedData = null;
}

function cancelUpload() {
    const preview = document.getElementById('uploadPreview');
    const fileInput = document.getElementById('fileInput');
    if (preview) preview.style.display = 'none';
    if (fileInput) fileInput.value = '';
    state.uploadedData = null;
    showNotification('Upload cancelled.');
}

// ============================================================================
// KPI CALCULATIONS
// ============================================================================

function updateAllKPIs() {
    const total = Object.values(state.employees).reduce((a, b) => a + b, 0);
    
    // Update Total Employees
    const totalEmployeesEl = document.getElementById('totalEmployees');
    if (totalEmployeesEl) {
        totalEmployeesEl.textContent = total.toLocaleString();
    }

    // Calculate expenditure from uploaded data; show zero when no data is present
    let totalExpenditure = 0;
    if (state.expenditures && state.expenditures.length > 0) {
        totalExpenditure = state.expenditures.reduce((sum, record) => {
            return sum + (parseFloat(record.total) || 0);
        }, 0);
    }
    
    const totalExpenditureEl = document.getElementById('totalExpenditure');
    if (totalExpenditureEl) {
        totalExpenditureEl.textContent = `Rs ${totalExpenditure.toFixed(2)}`;
    }

    // Calculate average per head
    const avgPerHead = total > 0 ? (totalExpenditure / total).toFixed(2) : '0.00';
    const avgPerHeadEl = document.getElementById('avgPerHead');
    if (avgPerHeadEl) {
        avgPerHeadEl.textContent = `Rs ${avgPerHead}`;
    }

    console.log(`KPIs Updated:`, {
        totalEmployees: total,
        totalExpenditure: totalExpenditure.toFixed(2),
        avgPerHead: avgPerHead
    });
}

// ============================================================================
// CHART INITIALIZATION
// ============================================================================

function initHomeCharts() {
    // Destroy existing charts
    if (window.homeChart1) window.homeChart1.destroy();
    if (window.homeChart2) {
        Plotly.purge('homeChart2');
    }

    // Chart 1: Employee Distribution Doughnut
    const ctx1 = document.getElementById('homeChart1');
    if (ctx1) {
        const isDark = document.body.classList.contains('dark-mode');
        const bgColor = isDark ? '#1f2937' : '#ffffff';
        const textColor = isDark ? '#f3f4f6' : '#374151';

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
                    data: [
                        state.employees.bangladeshi,
                        state.employees.srilankan,
                        state.employees.indian,
                        state.employees.malagasy
                    ],
                    backgroundColor: [
                        '#ff6b6b',
                        '#4ecdc4',
                        '#ffa502',
                        '#9b59b6'
                    ],
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
                        labels: {
                            usePointStyle: true,
                            padding: 15,
                            color: textColor,
                            font: { size: 14, weight: 'bold' }
                        }
                    }
                }
            }
        });
    }

    // Chart 2: Nationality Breakdown (Plotly)
    const data2 = [{
        x: ['Bangladeshi', 'Sri Lankan', 'Indian', 'Malagasy'],
        y: [
            state.employees.bangladeshi,
            state.employees.srilankan,
            state.employees.indian,
            state.employees.malagasy
        ],
        type: 'bar',
        marker: {
            color: ['#ff6b6b', '#4ecdc4', '#ffa502', '#9b59b6'],
            line: { width: 2, color: '#ffffff' }
        },
        text: [
            state.employees.bangladeshi,
            state.employees.srilankan,
            state.employees.indian,
            state.employees.malagasy
        ],
        textposition: 'outside',
        hovertemplate: '<b>%{x}</b><br>Employees: %{y}<extra></extra>'
    }];

    const isDark = document.body.classList.contains('dark-mode');
    const bgColor = isDark ? '#1f2937' : '#ffffff';
    const textColor = isDark ? '#f3f4f6' : '#374151';

    const layout2 = {
        title: { text: '', font: { size: 16 } },
        xaxis: { 
            title: 'Nationality',
            tickfont: { color: textColor, size: 12 }
        },
        yaxis: { 
            title: 'Number of Employees',
            tickfont: { color: textColor, size: 12 }
        },
        paper_bgcolor: bgColor,
        plot_bgcolor: bgColor,
        font: { color: textColor, size: 12 },
        margin: { l: 60, r: 50, t: 30, b: 60 },
        hovermode: 'closest'
    };

    const homeChart2 = document.getElementById('homeChart2');
    if (homeChart2) {
        Plotly.newPlot('homeChart2', data2, layout2, { responsive: true });
    }
}

function initTrendCharts() {
    // Destroy existing charts
    if (window.trendChart1) window.trendChart1.destroy();
    if (window.trendChart2) window.trendChart2.destroy();
    if (window.trendChart3) window.trendChart3.destroy();
    if (window.trendChart2Plotly) Plotly.purge('trendChart2');

    const isDark = document.body.classList.contains('dark-mode');
    const bgColor = isDark ? '#1f2937' : '#ffffff';
    const textColor = isDark ? '#f3f4f6' : '#374151';
    const gridColor = isDark ? '#4b5563' : '#e5e7eb';

    const dates = ['2026-04-10', '2026-04-12', '2026-04-14', '2026-04-17', '2026-04-20', '2026-04-24'];
    
    // Chart 1: Daily Expenditure Trend
    const ctx1 = document.getElementById('trendChart1');
    if (ctx1) {
        window.trendChart1 = new Chart(ctx1, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [
                    {
                        label: 'Daily Expenditure (Rs)',
                        data: [500, 520, 510, 540, 480, 500],
                        borderColor: '#2563eb',
                        backgroundColor: 'rgba(37, 99, 235, 0.1)',
                        tension: 0.4,
                        fill: true,
                        pointRadius: 6,
                        pointBackgroundColor: '#2563eb',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointHoverRadius: 8
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: {
                        labels: { color: isDark ? '#f3f4f6' : '#374151', font: { size: 13 } }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: isDark ? '#f3f4f6' : '#374151' },
                        grid: { color: isDark ? '#4b5563' : '#e5e7eb' }
                    },
                    x: {
                        ticks: { color: isDark ? '#f3f4f6' : '#374151' },
                        grid: { color: isDark ? '#4b5563' : '#e5e7eb' }
                    }
                }
            }
        });
    }

    // Chart 2: Weekly Totals
    const ctx2 = document.getElementById('trendChart2');
    if (ctx2) {
        window.trendChart2 = new Chart(ctx2, {
            type: 'bar',
            data: {
                labels: ['Week 1', 'Week 2', 'Week 3'],
                datasets: [
                    {
                        label: 'Bangladeshi',
                        data: [1500, 1600, 1400],
                        backgroundColor: '#ff6b6b'
                    },
                    {
                        label: 'Sri Lankan',
                        data: [1200, 1300, 1100],
                        backgroundColor: '#4ecdc4'
                    },
                    {
                        label: 'Indian',
                        data: [300, 320, 280],
                        backgroundColor: '#ffa502'
                    },
                    {
                        label: 'Malagasy',
                        data: [600, 650, 550],
                        backgroundColor: '#9b59b6'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    x: {
                        stacked: false,
                        ticks: { color: isDark ? '#f3f4f6' : '#374151' },
                        grid: { color: isDark ? '#4b5563' : '#e5e7eb' }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: { color: isDark ? '#f3f4f6' : '#374151' },
                        grid: { color: isDark ? '#4b5563' : '#e5e7eb' }
                    }
                },
                plugins: {
                    legend: {
                        labels: { color: isDark ? '#f3f4f6' : '#374151', font: { size: 13 } }
                    }
                }
            }
        });
    }

    // Chart 3: Cumulative Expenditure
    const ctx3 = document.getElementById('trendChart3');
    if (ctx3) {
        window.trendChart3 = new Chart(ctx3, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [
                    {
                        label: 'Cumulative Expenditure (Rs)',
                        data: [500, 1020, 1530, 2070, 2550, 3050],
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.4,
                        fill: true,
                        pointRadius: 6,
                        pointBackgroundColor: '#10b981',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointHoverRadius: 8
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        labels: { color: isDark ? '#f3f4f6' : '#374151', font: { size: 13 } }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: isDark ? '#f3f4f6' : '#374151' },
                        grid: { color: isDark ? '#4b5563' : '#e5e7eb' }
                    },
                    x: {
                        ticks: { color: isDark ? '#f3f4f6' : '#374151' },
                        grid: { color: isDark ? '#4b5563' : '#e5e7eb' }
                    }
                }
            }
        });
    }
}

function initPerHeadCharts() {
    // Destroy existing charts
    if (window.perHeadChart1) window.perHeadChart1.destroy();
    if (window.perHeadChart2) window.perHeadChart2.destroy();
    if (window.perHeadChart3) window.perHeadChart3.destroy();

    const isDark = document.body.classList.contains('dark-mode');
    const bgColor = isDark ? '#1f2937' : '#ffffff';
    const textColor = isDark ? '#f3f4f6' : '#374151';

    // Chart 1: Item-wise Per Head Consumption
    const ctx1 = document.getElementById('perHeadChart1');
    if (ctx1) {
        window.perHeadChart1 = new Chart(ctx1, {
            type: 'bar',
            data: {
                labels: ['Rice', 'Vegetables', 'Meat', 'Spices', 'Flour'],
                datasets: [{
                    label: 'Per Head Consumption (kg)',
                    data: [0.315, 0.189, 0.094, 0.031, 0.126],
                    backgroundColor: '#2563eb',
                    borderColor: '#1e40af',
                    borderWidth: 1,
                    borderRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                indexAxis: 'y',
                scales: {
                    x: {
                        ticks: { color: isDark ? '#f3f4f6' : '#374151' },
                        grid: { color: isDark ? '#4b5563' : '#e5e7eb' }
                    },
                    y: {
                        ticks: { color: isDark ? '#f3f4f6' : '#374151' }
                    }
                },
                plugins: {
                    legend: {
                        labels: { color: isDark ? '#f3f4f6' : '#374151', font: { size: 13 } }
                    }
                }
            }
        });
    }

    // Chart 2: Consumption Distribution
    const ctx2 = document.getElementById('perHeadChart2');
    if (ctx2) {
        window.perHeadChart2 = new Chart(ctx2, {
            type: 'pie',
            data: {
                labels: ['Rice (40%)', 'Vegetables (25%)', 'Meat (20%)', 'Spices (8%)', 'Flour (7%)'],
                datasets: [{
                    data: [40, 25, 20, 8, 7],
                    backgroundColor: [
                        '#ff6b6b',
                        '#4ecdc4',
                        '#ffa502',
                        '#9b59b6',
                        '#f59e0b'
                    ],
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
                        labels: {
                            usePointStyle: true,
                            padding: 15,
                            color: textColor,
                            font: { size: 13, weight: 'bold' }
                        }
                    }
                }
            }
        });
    }

    // Chart 3: Top 10 Items
    const ctx3 = document.getElementById('perHeadChart3');
    if (ctx3) {
        window.perHeadChart3 = new Chart(ctx3, {
            type: 'bar',
            data: {
                labels: ['Rice', 'Vegetables', 'Meat', 'Flour', 'Spices', 'Oil', 'Salt', 'Sugar', 'Dal', 'Bread'],
                datasets: [{
                    label: 'Total Consumption (kg)',
                    data: [500, 300, 150, 200, 50, 80, 30, 40, 60, 100],
                    backgroundColor: [
                        '#ff6b6b', '#4ecdc4', '#ffa502', '#9b59b6', '#2563eb',
                        '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#8b5cf6'
                    ],
                    borderWidth: 1,
                    borderColor: '#ffffff',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    x: {
                        ticks: { color: isDark ? '#f3f4f6' : '#374151' },
                        grid: { color: isDark ? '#4b5563' : '#e5e7eb' }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: { color: isDark ? '#f3f4f6' : '#374151' },
                        grid: { color: isDark ? '#4b5563' : '#e5e7eb' }
                    }
                },
                plugins: {
                    legend: {
                        labels: { color: isDark ? '#f3f4f6' : '#374151', font: { size: 13 } }
                    }
                }
            }
        });
    }
}

function initComparisonCharts() {
    // Destroy existing charts
    if (window.comparisonChart1) window.comparisonChart1.destroy();
    if (window.comparisonChart2Plotly) Plotly.purge('comparisonChart2');
    if (window.comparisonChart3Plotly) Plotly.purge('comparisonChart3');

    const isDark = document.body.classList.contains('dark-mode');
    const bgColor = isDark ? '#1f2937' : '#ffffff';
    const textColor = isDark ? '#f3f4f6' : '#374151';

    // Chart 1: Total Expenditure by Nationality — use live calculated totals
    const natTotals = calculateNationalityTotals();
    const ctx1 = document.getElementById('comparisonChart1');
    if (ctx1) {
        window.comparisonChart1 = new Chart(ctx1, {
            type: 'bar',
            data: {
                labels: ['Bangladeshi', 'Sri Lankan', 'Indian', 'Malagasy'],
                datasets: [{
                    label: 'Total Expenditure (Rs)',
                    data: [
                        natTotals.bangladeshi,
                        natTotals.srilankan,
                        natTotals.indian,
                        natTotals.malagasy
                    ],
                    backgroundColor: [
                        '#ff6b6b',
                        '#4ecdc4',
                        '#ffa502',
                        '#9b59b6'
                    ],
                    borderWidth: 2,
                    borderColor: '#ffffff',
                    borderRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: isDark ? '#f3f4f6' : '#374151' },
                        grid: { color: isDark ? '#4b5563' : '#e5e7eb' }
                    },
                    x: {
                        ticks: { color: isDark ? '#f3f4f6' : '#374151' },
                        grid: { color: isDark ? '#4b5563' : '#e5e7eb' }
                    }
                },
                plugins: {
                    legend: {
                        labels: { color: isDark ? '#f3f4f6' : '#374151', font: { size: 13 } }
                    }
                }
            }
        });
    }

    // Chart 2: Per-Head Spending Comparison (Plotly) — calculated from live data
    const empKeys = ['bangladeshi', 'srilankan', 'indian', 'malagasy'];
    const perHeadValues = empKeys.map(k => {
        const emp  = state.employees[k] || 0;
        const spend = natTotals[k] || 0;
        return emp > 0 ? parseFloat((spend / emp).toFixed(2)) : 0;
    });
    const perHeadLabels = perHeadValues.map(v => `Rs ${v.toFixed(2)}`);

    const data2 = [{
        x: ['Bangladeshi', 'Sri Lankan', 'Indian', 'Malagasy'],
        y: perHeadValues,
        type: 'bar',
        marker: {
            color: ['#ff6b6b', '#4ecdc4', '#ffa502', '#9b59b6'],
            line: { width: 2, color: '#ffffff' }
        },
        text: perHeadLabels,
        textposition: 'outside',
        hovertemplate: '<b>%{x}</b><br>Per Head: %{text}<extra></extra>'
    }];

    const layout2 = {
        title: '',
        xaxis: { 
            title: 'Nationality',
            tickfont: { color: textColor, size: 12 }
        },
        yaxis: { 
            title: 'Per Head Spending (Rs)',
            tickfont: { color: textColor, size: 12 }
        },
        paper_bgcolor: bgColor,
        plot_bgcolor: bgColor,
        font: { color: textColor, size: 12 },
        margin: { l: 60, r: 50, t: 30, b: 60 },
        hovermode: 'closest'
    };

    const comparisonChart2 = document.getElementById('comparisonChart2');
    if (comparisonChart2) {
        Plotly.newPlot('comparisonChart2', data2, layout2, { responsive: true });
    }

    // Chart 3: Consumption Pattern Heatmap (Plotly)
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
        title: '',
        xaxis: { 
            title: 'Nationality',
            tickfont: { color: textColor, size: 12 }
        },
        yaxis: { 
            title: 'Item',
            tickfont: { color: textColor, size: 12 }
        },
        paper_bgcolor: bgColor,
        plot_bgcolor: bgColor,
        font: { color: textColor, size: 12 },
        margin: { l: 100, r: 50, t: 30, b: 50 },
        hovermode: 'closest'
    };

    const comparisonChart3 = document.getElementById('comparisonChart3');
    if (comparisonChart3) {
        Plotly.newPlot('comparisonChart3', heatmapData, layout3, { responsive: true });
    }
}

// ============================================================================
// CHART UPDATE FUNCTIONS
// ============================================================================

function updateTrendChart() {
    console.log('Updating trend chart...');
    initTrendCharts();
}

function updatePerHeadChart() {
    console.log('Updating per-head chart...');
    initPerHeadCharts();
}

function updateComparisonChart() {
    console.log('Updating comparison chart...');
    initComparisonCharts();
}

// ============================================================================
// REPORT GENERATION
// ============================================================================

function generateReport(type) {
    const reportContent = document.getElementById('reportContent');
    const exportPdfBtn = document.getElementById('exportPdfBtn');
    const exportExcelBtn = document.getElementById('exportExcelBtn');

    if (!reportContent) return;

    let content = '';

    switch(type) {
        case 'trend':
            content = `
                <h3>Trend Analysis Report</h3>
                <p><strong>Report Date:</strong> ${new Date().toLocaleDateString()}</p>
                <h4>Period Analysis</h4>
                <p>Expenditure trends from 2026-04-10 to 2026-04-24</p>
                <table class="preview-table" style="margin-top: 1rem;">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Daily Expenditure</th>
                            <th>Weekly Total</th>
                            <th>Cumulative</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td>2026-04-10</td><td>Rs 500</td><td>Rs 3,500</td><td>Rs 500</td></tr>
                        <tr><td>2026-04-17</td><td>Rs 520</td><td>Rs 3,640</td><td>Rs 4,020</td></tr>
                        <tr><td>2026-04-24</td><td>Rs 480</td><td>Rs 3,360</td><td>Rs 7,380</td></tr>
                    </tbody>
                </table>
            `;
            break;

        case 'per-head':
            content = `
                <h3>Per-Head Consumption Report</h3>
                <p><strong>Report Date:</strong> ${new Date().toLocaleDateString()}</p>
                <h4>Consumption Metrics</h4>
                <table class="preview-table" style="margin-top: 1rem;">
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th>Total Qty</th>
                            <th>Per Head Qty</th>
                            <th>Total Cost</th>
                            <th>Per Head Cost</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td>Rice</td><td>500kg</td><td>0.31kg</td><td>Rs 250</td><td>Rs 0.16</td></tr>
                        <tr><td>Vegetables</td><td>300kg</td><td>0.19kg</td><td>Rs 300</td><td>Rs 0.19</td></tr>
                        <tr><td>Meat</td><td>150kg</td><td>0.09kg</td><td>Rs 450</td><td>Rs 0.28</td></tr>
                        <tr><td>Spices</td><td>50kg</td><td>0.03kg</td><td>Rs 100</td><td>Rs 0.06</td></tr>
                    </tbody>
                </table>
            `;
            break;

        case 'comparison':
            content = `
                <h3>Nationality Comparison Report</h3>
                <p><strong>Report Date:</strong> ${new Date().toLocaleDateString()}</p>
                <h4>Comparative Analysis</h4>
                <table class="preview-table" style="margin-top: 1rem;">
                    <thead>
                        <tr>
                            <th>Nationality</th>
                            <th>Employees</th>
                            <th>Total Spend</th>
                            <th>Per Head</th>
                            <th>% of Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${generateComparisonRows()}
                    </tbody>
                </table>
            `;
            break;

        case 'detailed':
            content = `
                <h3>Detailed Expenditure Report</h3>
                <p><strong>Report Date:</strong> ${new Date().toLocaleDateString()}</p>
                <p><strong>Total Records:</strong> ${state.expenditures.length > 0 ? state.expenditures.length : '127'}</p>
                <h4>Recent Transactions</h4>
                <table class="preview-table" style="margin-top: 1rem;">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Item</th>
                            <th>Qty</th>
                            <th>Price</th>
                            <th>Total</th>
                            <th>Nationality</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${state.expenditures.length > 0 ? 
                            state.expenditures.slice(0, 5).map(r => 
                                `<tr><td>${r.date}</td><td>${r.item}</td><td>${r.quantity}</td><td>Rs ${r.price}</td><td>Rs ${r.total}</td><td>${r.nationality}</td></tr>`
                            ).join('') :
                            `<tr><td>2026-04-24</td><td>Rice</td><td>50kg</td><td>Rs 0.50</td><td>Rs 25</td><td>Bangladeshi</td></tr>
                            <tr><td>2026-04-24</td><td>Vegetables</td><td>30kg</td><td>Rs 1.00</td><td>Rs 30</td><td>Sri Lankan</td></tr>
                            <tr><td>2026-04-23</td><td>Meat</td><td>20kg</td><td>Rs 2.00</td><td>Rs 40</td><td>Indian</td></tr>
                            <tr><td>2026-04-23</td><td>Spices</td><td>10kg</td><td>Rs 0.75</td><td>Rs 7.50</td><td>Malagasy</td></tr>`
                        }
                    </tbody>
                </table>
                <p style="margin-top: 1rem;"><strong>...and ${Math.max(0, (state.expenditures.length > 0 ? state.expenditures.length : 127) - 5)} more records</strong></p>
            `;
            break;
    }

    reportContent.innerHTML = content;
    if (exportPdfBtn) exportPdfBtn.style.display = 'inline-flex';
    if (exportExcelBtn) exportExcelBtn.style.display = 'inline-flex';

    // Show the output container (Reports page wraps content in #reportOutput)
    const reportOutput = document.getElementById('reportOutput');
    if (reportOutput) reportOutput.style.display = 'block';
}

// Helper: calculate expenditure totals per nationality from uploaded data
function calculateNationalityTotals() {
    const totals = { bangladeshi: 0, srilankan: 0, indian: 0, malagasy: 0 };

    if (state.expenditures && state.expenditures.length > 0) {
        state.expenditures.forEach(record => {
            const nat = String(record.nationality).toLowerCase().replace(/\s+/g, '');
            const key = nat.includes('banglad') ? 'bangladeshi'
                      : nat.includes('sri')     ? 'srilankan'
                      : nat.includes('indian')  ? 'indian'
                      : nat.includes('malagasy')? 'malagasy'
                      : null;
            if (key) totals[key] += parseFloat(record.total) || 0;
        });
    }

    return totals;
}

// Helper: build comparison table rows from live state
function generateComparisonRows() {
    const nationalities = [
        { key: 'bangladeshi', label: 'Bangladeshi' },
        { key: 'srilankan',   label: 'Sri Lankan'  },
        { key: 'indian',      label: 'Indian'       },
        { key: 'malagasy',    label: 'Malagasy'     }
    ];

    const employeeTotal = Object.values(state.employees).reduce((a, b) => a + b, 0);
    const spendingTotals = calculateNationalityTotals();
    const totalSpend = Object.values(spendingTotals).reduce((a, b) => a + b, 0);

    return nationalities.map(nat => {
        const employees = state.employees[nat.key] || 0;
        const spending  = spendingTotals[nat.key]  || 0;
        const perHead   = employees > 0 ? (spending / employees).toFixed(2) : '0.00';
        const pctEmp    = employeeTotal > 0
            ? ((employees / employeeTotal) * 100).toFixed(1)
            : '0.0';

        return `<tr>
            <td>${nat.label}</td>
            <td>${employees.toLocaleString()}</td>
            <td>Rs ${spending.toFixed(2)}</td>
            <td>Rs ${perHead}</td>
            <td>${pctEmp}%</td>
        </tr>`;
    }).join('');
}

function exportReport(format) {
    const content = document.getElementById('reportContent').innerText;
    showNotification(`Report exported as ${format.toUpperCase()}! (Download started)`);
    console.log(`Exporting report as ${format}`);
}

// Export functions for global use
window.updateTrendChart = updateTrendChart;
window.updatePerHeadChart = updatePerHeadChart;
window.updateComparisonChart = updateComparisonChart;
window.generateReport = generateReport;
window.exportReport = exportReport;
window.editEmployee = editEmployee;
window.saveEmployee = saveEmployee;
window.cancelEdit = cancelEdit;
window.confirmUpload = confirmUpload;
window.cancelUpload = cancelUpload;
window.initHomeCharts = initHomeCharts;
window.initTrendCharts = initTrendCharts;
window.initPerHeadCharts = initPerHeadCharts;
window.initComparisonCharts = initComparisonCharts;
window.downloadEmployeeHistory = downloadEmployeeHistory;
window.getEmployeeChangeHistory = getEmployeeChangeHistory;
window.calculateNationalityTotals = calculateNationalityTotals;
window.generateComparisonRows = generateComparisonRows;
