// ============================================================
// CANTEEN MANAGEMENT SYSTEM — API SERVICE
// ============================================================

const API_BASE = '';

async function fetchDashboard(period = '') {
    const params = period ? `?period=${encodeURIComponent(period)}` : '';
    const res = await fetch(`${API_BASE}/api/dashboard${params}`);
    return res.json();
}

async function fetchTrends(period = '') {
    const params = period ? `?period=${encodeURIComponent(period)}` : '';
    const res = await fetch(`${API_BASE}/api/trends${params}`);
    return res.json();
}

async function fetchPerHead(period = '') {
    const params = period ? `?period=${encodeURIComponent(period)}` : '';
    const res = await fetch(`${API_BASE}/api/per-head${params}`);
    return res.json();
}

async function fetchComparison(period = '') {
    const params = period ? `?period=${encodeURIComponent(period)}` : '';
    const res = await fetch(`${API_BASE}/api/comparison${params}`);
    return res.json();
}

async function fetchCumulativeTrend(period = '', nationality = 'all') {
    const res = await fetch(`${API_BASE}/api/cumulative-trend?period=${encodeURIComponent(period)}&nationality=${encodeURIComponent(nationality)}`);
    return res.json();
}

async function fetchMonthComparison(month1, month2) {
    const res = await fetch(`${API_BASE}/api/month-comparison?month1=${encodeURIComponent(month1)}&month2=${encodeURIComponent(month2)}`);
    return res.json();
}

async function fetchItemComparison(item) {
    const res = await fetch(`${API_BASE}/api/item-comparison?item=${encodeURIComponent(item)}`);
    return res.json();
}

async function fetchItemsList() {
    const res = await fetch(`${API_BASE}/api/items-list`);
    return res.json();
}

async function fetchPeriods() {
    const res = await fetch(`${API_BASE}/api/periods`);
    return res.json();
}

async function generateReportExport(type, format, period = '') {
    const params = new URLSearchParams({ type, format, period });
    const res = await fetch(`${API_BASE}/api/generate-report?${params}`);
    if (format === 'excel') {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report-${type}.xlsx`;
        a.click();
        URL.revokeObjectURL(url);
    } else {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
    }
}
