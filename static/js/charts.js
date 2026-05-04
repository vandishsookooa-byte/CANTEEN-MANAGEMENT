// ============================================================
// CANTEEN MANAGEMENT SYSTEM — CHART HELPERS
// ============================================================

const nationalityColors = {
    bangladeshi: '#ff6b6b',
    srilankan:   '#4ecdc4',
    indian:      '#ffa502',
    malagasy:    '#9b59b6'
};

function createCumulativeNationalityChart(canvasId, data, isDark) {
    if (window.trendChart4) window.trendChart4.destroy();
    const ctx = document.getElementById(canvasId);
    if (!ctx || !data) return;
    const textColor = isDark ? '#f3f4f6' : '#374151';
    const gridColor = isDark ? '#4b5563' : '#e5e7eb';
    window.trendChart4 = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels || Array.from({length: 15}, (_, i) => `Day ${i+1}`),
            datasets: [
                {
                    label: 'Bangladeshi',
                    data: data.bangladeshi || [],
                    borderColor: nationalityColors.bangladeshi,
                    backgroundColor: nationalityColors.bangladeshi + '33',
                    fill: true, tension: 0.4
                },
                {
                    label: 'Sri Lankan',
                    data: data.srilankan || [],
                    borderColor: nationalityColors.srilankan,
                    backgroundColor: nationalityColors.srilankan + '33',
                    fill: true, tension: 0.4
                },
                {
                    label: 'Indian',
                    data: data.indian || [],
                    borderColor: nationalityColors.indian,
                    backgroundColor: nationalityColors.indian + '33',
                    fill: true, tension: 0.4
                },
                {
                    label: 'Malagasy',
                    data: data.malagasy || [],
                    borderColor: nationalityColors.malagasy,
                    backgroundColor: nationalityColors.malagasy + '33',
                    fill: true, tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { labels: { color: textColor } },
                tooltip: {
                    callbacks: {
                        label: ctx => `${ctx.dataset.label}: ${formatRs(ctx.parsed.y)}`
                    }
                }
            },
            scales: {
                x: { ticks: { color: textColor }, grid: { color: gridColor } },
                y: {
                    beginAtZero: true,
                    ticks: { color: textColor, callback: value => formatRs(value, 0) },
                    grid: { color: gridColor }
                }
            }
        }
    });
}

function createMonthComparisonCharts(data, month1Label, month2Label, isDark) {
    if (window.monthChart1) window.monthChart1.destroy();
    if (window.monthChart2) window.monthChart2.destroy();

    const textColor = isDark ? '#f3f4f6' : '#374151';
    const gridColor = isDark ? '#4b5563' : '#e5e7eb';
    const nats    = ['Bangladeshi', 'Sri Lankan', 'Indian', 'Malagasy'];
    const natKeys = ['bangladeshi', 'srilankan', 'indian', 'malagasy'];

    const ctx1 = document.getElementById('monthChart1');
    if (ctx1) {
        window.monthChart1 = new Chart(ctx1, {
            type: 'bar',
            data: {
                labels: nats,
                datasets: [
                    {
                        label: month1Label,
                        data: natKeys.map(k => data.month1?.[k]?.total || 0),
                        backgroundColor: natKeys.map(k => nationalityColors[k]),
                        borderWidth: 2, borderColor: '#ffffff'
                    },
                    {
                        label: month2Label,
                        data: natKeys.map(k => data.month2?.[k]?.total || 0),
                        backgroundColor: natKeys.map(k => nationalityColors[k] + '99'),
                        borderWidth: 2, borderColor: '#ffffff'
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { labels: { color: textColor } },
                    tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: ${formatRs(ctx.parsed.y)}` } }
                },
                scales: {
                    x: { ticks: { color: textColor }, grid: { color: gridColor } },
                    y: {
                        beginAtZero: true,
                        ticks: { color: textColor, callback: v => formatRs(v, 0) },
                        grid: { color: gridColor }
                    }
                }
            }
        });
    }

    const ctx2 = document.getElementById('monthChart2');
    if (ctx2) {
        window.monthChart2 = new Chart(ctx2, {
            type: 'bar',
            data: {
                labels: nats,
                datasets: [
                    {
                        label: month1Label,
                        data: natKeys.map(k => data.month1?.[k]?.per_head || 0),
                        backgroundColor: natKeys.map(k => nationalityColors[k]),
                        borderWidth: 2, borderColor: '#ffffff'
                    },
                    {
                        label: month2Label,
                        data: natKeys.map(k => data.month2?.[k]?.per_head || 0),
                        backgroundColor: natKeys.map(k => nationalityColors[k] + '99'),
                        borderWidth: 2, borderColor: '#ffffff'
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { labels: { color: textColor } },
                    tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: ${formatRs(ctx.parsed.y)}` } }
                },
                scales: {
                    x: { ticks: { color: textColor }, grid: { color: gridColor } },
                    y: {
                        beginAtZero: true,
                        ticks: { color: textColor, callback: v => formatRs(v, 0) },
                        grid: { color: gridColor }
                    }
                }
            }
        });
    }
}

function createItemComparisonChart(data, itemName, isDark) {
    if (window.itemComparisonChartInst) window.itemComparisonChartInst.destroy();
    const ctx = document.getElementById('itemComparisonChart');
    if (!ctx || !data) return;
    const textColor = isDark ? '#f3f4f6' : '#374151';
    const gridColor = isDark ? '#4b5563' : '#e5e7eb';
    const nats    = ['Bangladeshi', 'Sri Lankan', 'Indian', 'Malagasy'];
    const natKeys = ['bangladeshi', 'srilankan', 'indian', 'malagasy'];
    window.itemComparisonChartInst = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: nats,
            datasets: [
                {
                    label: `${itemName} — Total Cost (Rs)`,
                    data: natKeys.map(k => data[k]?.total_cost || 0),
                    backgroundColor: natKeys.map(k => nationalityColors[k]),
                    borderWidth: 2, borderColor: '#ffffff', borderRadius: 5
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { labels: { color: textColor } },
                tooltip: {
                    callbacks: {
                        label: ctx => `Total: ${formatRs(ctx.parsed.y)} | Per Head: ${formatRs(data[natKeys[ctx.dataIndex]]?.per_head || 0)}`
                    }
                }
            },
            scales: {
                x: { ticks: { color: textColor }, grid: { color: gridColor } },
                y: {
                    beginAtZero: true,
                    ticks: { color: textColor, callback: v => formatRs(v, 0) },
                    grid: { color: gridColor }
                }
            }
        }
    });
}
