// ============================================================================
// CANTEEN MANAGEMENT SYSTEM - CHART FUNCTIONS
// ============================================================================

function initHomeCharts(employees) {
    if (window.homeChart1) window.homeChart1.destroy();
    if (window.homeChart2) Plotly.purge('homeChart2');

    const isDark = document.body.classList.contains('dark-mode');
    const bgColor = isDark ? '#1e293b' : '#ffffff';
    const textColor = isDark ? '#f1f5f9' : '#374151';

    if (!employees || Object.values(employees).every(v => v === 0)) {
        showNoData('homeChart1');
        document.getElementById('homeChart2').innerHTML = '<div class="no-data">No data available</div>';
        return;
    }

    const ctx1 = document.getElementById('homeChart1');
    if (ctx1) {
        window.homeChart1 = new Chart(ctx1, {
            type: 'doughnut',
            data: {
                labels: [
                    `Bangladeshi (${employees.bangladeshi})`,
                    `Sri Lankan (${employees.srilankan})`,
                    `Indian (${employees.indian})`,
                    `Malagasy (${employees.malagasy})`
                ],
                datasets: [{
                    data: [employees.bangladeshi, employees.srilankan, employees.indian, employees.malagasy],
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
        y: [employees.bangladeshi, employees.srilankan, employees.indian, employees.malagasy],
        type: 'bar',
        marker: { color: ['#ff6b6b', '#4ecdc4', '#ffa502', '#9b59b6'], line: { width: 2, color: '#ffffff' } },
        text: [employees.bangladeshi, employees.srilankan, employees.indian, employees.malagasy],
        textposition: 'outside',
        hovertemplate: '<b>%{x}</b><br>Employees: %{y}<extra></extra>'
    }];

    const layout2 = {
        xaxis: { title: 'Nationality', tickfont: { color: textColor, size: 12 } },
        yaxis: { title: 'Number of Employees', tickfont: { color: textColor, size: 12 } },
        paper_bgcolor: bgColor, plot_bgcolor: bgColor,
        font: { color: textColor, size: 12 },
        margin: { l: 60, r: 50, t: 30, b: 60 }
    };

    const homeChart2 = document.getElementById('homeChart2');
    if (homeChart2) Plotly.newPlot('homeChart2', data2, layout2, { responsive: true });
}

function initTrendCharts(trendData) {
    if (window.trendChart1) window.trendChart1.destroy();
    if (window.trendChart2) window.trendChart2.destroy();
    if (window.trendChart3) window.trendChart3.destroy();

    const isDark = document.body.classList.contains('dark-mode');
    const textColor = isDark ? '#f1f5f9' : '#374151';
    const gridColor = isDark ? '#334155' : '#e5e7eb';

    if (!trendData || !trendData.items || trendData.items.length === 0) {
        showNoData('trendChart1');
        showNoData('trendChart2');
        showNoData('trendChart3');
        return;
    }

    const items = trendData.items;
    const datasets = trendData.datasets;

    // Chart 1: Item Expenditure by Nationality (grouped bar)
    const ctx1 = document.getElementById('trendChart1');
    if (ctx1) {
        window.trendChart1 = new Chart(ctx1, {
            type: 'bar',
            data: {
                labels: items,
                datasets: datasets.map(ds => ({
                    label: ds.label,
                    data: ds.data,
                    backgroundColor: ds.color,
                    borderColor: ds.color,
                    borderWidth: 1,
                    borderRadius: 3
                }))
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    x: { ticks: { color: textColor, maxRotation: 45 }, grid: { color: gridColor } },
                    y: { beginAtZero: true, ticks: { color: textColor }, grid: { color: gridColor } }
                },
                plugins: { legend: { labels: { color: textColor, font: { size: 12 } } } }
            }
        });
    }

    // Chart 2: Total Expenditure by Nationality (bar)
    const ctx2 = document.getElementById('trendChart2');
    if (ctx2) {
        const totals = datasets.map(ds => ds.data.reduce((a, b) => a + b, 0));
        window.trendChart2 = new Chart(ctx2, {
            type: 'bar',
            data: {
                labels: datasets.map(ds => ds.label),
                datasets: [{
                    label: 'Total Expenditure',
                    data: totals,
                    backgroundColor: datasets.map(ds => ds.color),
                    borderWidth: 2,
                    borderColor: '#ffffff',
                    borderRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    x: { ticks: { color: textColor }, grid: { color: gridColor } },
                    y: { beginAtZero: true, ticks: { color: textColor }, grid: { color: gridColor } }
                },
                plugins: { legend: { labels: { color: textColor } } }
            }
        });
    }

    // Chart 3: Item-wise total across all nationalities
    const ctx3 = document.getElementById('trendChart3');
    if (ctx3) {
        const itemTotals = items.map((item, idx) => datasets.reduce((sum, ds) => sum + (ds.data[idx] || 0), 0));
        window.trendChart3 = new Chart(ctx3, {
            type: 'bar',
            data: {
                labels: items,
                datasets: [{
                    label: 'Total Expenditure (All)',
                    data: itemTotals,
                    backgroundColor: '#2563eb',
                    borderWidth: 1,
                    borderRadius: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    x: { ticks: { color: textColor, maxRotation: 45 }, grid: { color: gridColor } },
                    y: { beginAtZero: true, ticks: { color: textColor }, grid: { color: gridColor } }
                },
                plugins: { legend: { labels: { color: textColor } } }
            }
        });
    }
}

function initPerHeadCharts(perHeadData) {
    if (window.perHeadChart1) window.perHeadChart1.destroy();
    if (window.perHeadChart2) window.perHeadChart2.destroy();
    if (window.perHeadChart3) window.perHeadChart3.destroy();

    const isDark = document.body.classList.contains('dark-mode');
    const bgColor = isDark ? '#1e293b' : '#ffffff';
    const textColor = isDark ? '#f1f5f9' : '#374151';
    const gridColor = isDark ? '#334155' : '#e5e7eb';

    if (!perHeadData || perHeadData.length === 0) {
        showNoData('perHeadChart1');
        showNoData('perHeadChart2');
        showNoData('perHeadChart3');
        return;
    }

    const items = perHeadData.map(d => d.item);
    const perHeads = perHeadData.map(d => d.perHead);
    const totals = perHeadData.map(d => d.total);

    const COLORS = ['#ff6b6b','#4ecdc4','#ffa502','#9b59b6','#2563eb','#10b981','#f59e0b','#ef4444','#6366f1','#8b5cf6','#06b6d4','#84cc16'];

    // Chart 1: Per Head Cost (horizontal bar)
    const ctx1 = document.getElementById('perHeadChart1');
    if (ctx1) {
        window.perHeadChart1 = new Chart(ctx1, {
            type: 'bar',
            data: {
                labels: items,
                datasets: [{
                    label: 'Per Head Cost',
                    data: perHeads,
                    backgroundColor: '#2563eb',
                    borderColor: '#1e40af',
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                indexAxis: 'y',
                scales: {
                    x: { ticks: { color: textColor }, grid: { color: gridColor } },
                    y: { ticks: { color: textColor } }
                },
                plugins: { legend: { labels: { color: textColor } } }
            }
        });
    }

    // Chart 2: Distribution Pie
    const ctx2 = document.getElementById('perHeadChart2');
    if (ctx2) {
        const totalSum = totals.reduce((a, b) => a + b, 0);
        window.perHeadChart2 = new Chart(ctx2, {
            type: 'pie',
            data: {
                labels: items.map((item, i) => `${item} (${totalSum > 0 ? ((totals[i] / totalSum) * 100).toFixed(1) : 0}%)`),
                datasets: [{
                    data: totals,
                    backgroundColor: items.map((_, i) => COLORS[i % COLORS.length]),
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
                        labels: { usePointStyle: true, padding: 12, color: textColor, font: { size: 12, weight: 'bold' } }
                    }
                }
            }
        });
    }

    // Chart 3: Total spend bar
    const ctx3 = document.getElementById('perHeadChart3');
    if (ctx3) {
        window.perHeadChart3 = new Chart(ctx3, {
            type: 'bar',
            data: {
                labels: items,
                datasets: [{
                    label: 'Total Expenditure',
                    data: totals,
                    backgroundColor: items.map((_, i) => COLORS[i % COLORS.length]),
                    borderWidth: 1,
                    borderColor: '#ffffff',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    x: { ticks: { color: textColor, maxRotation: 45 }, grid: { color: gridColor } },
                    y: { beginAtZero: true, ticks: { color: textColor }, grid: { color: gridColor } }
                },
                plugins: { legend: { labels: { color: textColor } } }
            }
        });
    }
}

function initComparisonCharts(comparisonData) {
    if (window.comparisonChart1) window.comparisonChart1.destroy();
    if (window.comparisonChart2Plotly) Plotly.purge('comparisonChart2');
    if (window.comparisonChart3Plotly) Plotly.purge('comparisonChart3');

    const isDark = document.body.classList.contains('dark-mode');
    const bgColor = isDark ? '#1e293b' : '#ffffff';
    const textColor = isDark ? '#f1f5f9' : '#374151';
    const gridColor = isDark ? '#334155' : '#e5e7eb';

    if (!comparisonData || comparisonData.length === 0) {
        showNoData('comparisonChart1');
        document.getElementById('comparisonChart2').innerHTML = '<div class="no-data">No data available</div>';
        document.getElementById('comparisonChart3').innerHTML = '<div class="no-data">No data available</div>';
        return;
    }

    const labels = comparisonData.map(d => d.label);
    const colors = comparisonData.map(d => d.color);
    const totals = comparisonData.map(d => d.totalExpenditure);
    const perHeads = comparisonData.map(d => d.perHead);

    // Chart 1: Total Expenditure by Nationality
    const ctx1 = document.getElementById('comparisonChart1');
    if (ctx1) {
        window.comparisonChart1 = new Chart(ctx1, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Total Expenditure',
                    data: totals,
                    backgroundColor: colors,
                    borderWidth: 2,
                    borderColor: '#ffffff',
                    borderRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    y: { beginAtZero: true, ticks: { color: textColor }, grid: { color: gridColor } },
                    x: { ticks: { color: textColor }, grid: { color: gridColor } }
                },
                plugins: { legend: { labels: { color: textColor } } }
            }
        });
    }

    // Chart 2: Per Head Spending (Plotly)
    const data2 = [{
        x: labels,
        y: perHeads,
        type: 'bar',
        marker: { color: colors, line: { width: 2, color: '#ffffff' } },
        text: perHeads.map(v => `Rs ${v.toFixed(2)}`),
        textposition: 'outside',
        hovertemplate: '<b>%{x}</b><br>Per Head: %{text}<extra></extra>'
    }];

    const layout2 = {
        xaxis: { title: 'Nationality', tickfont: { color: textColor, size: 12 } },
        yaxis: { title: 'Per Head Spending', tickfont: { color: textColor, size: 12 } },
        paper_bgcolor: bgColor, plot_bgcolor: bgColor,
        font: { color: textColor, size: 12 },
        margin: { l: 60, r: 50, t: 30, b: 60 }
    };

    const comparisonChart2 = document.getElementById('comparisonChart2');
    if (comparisonChart2) Plotly.newPlot('comparisonChart2', data2, layout2, { responsive: true });

    // Chart 3: Heatmap - items vs nationalities
    if (window._comparisonItemData) {
        buildHeatmap(window._comparisonItemData, comparisonData, textColor, bgColor);
    } else {
        CanteenAPI.getItems('all').then(items => {
            if (!Array.isArray(items) || items.length === 0) return;
            window._comparisonItemData = items;
            buildHeatmap(items, comparisonData, textColor, bgColor);
        });
    }
}

function buildHeatmap(items, comparisonData, textColor, bgColor) {
    // Group items by nationality and item name
    const natMap = {};
    const itemSet = new Set();
    items.forEach(row => {
        if (!natMap[row.nationality]) natMap[row.nationality] = {};
        natMap[row.nationality][row.item] = (natMap[row.nationality][row.item] || 0) + row.total;
        itemSet.add(row.item);
    });

    const allItems = Array.from(itemSet).sort();
    const nats = comparisonData.map(d => d.nationality);
    const labels = comparisonData.map(d => d.label);

    const z = allItems.map(item => nats.map(nat => (natMap[nat] && natMap[nat][item]) ? natMap[nat][item] : 0));

    const heatmapData = [{
        z,
        x: labels,
        y: allItems,
        type: 'heatmap',
        colorscale: 'Viridis',
        hovertemplate: '<b>%{y}</b><br>%{x}<br>Total: Rs %{z:,.2f}<extra></extra>'
    }];

    const layout3 = {
        xaxis: { title: 'Nationality', tickfont: { color: textColor, size: 12 } },
        yaxis: { title: 'Item', tickfont: { color: textColor, size: 11 } },
        paper_bgcolor: bgColor, plot_bgcolor: bgColor,
        font: { color: textColor, size: 12 },
        margin: { l: 120, r: 50, t: 30, b: 60 }
    };

    const comparisonChart3 = document.getElementById('comparisonChart3');
    if (comparisonChart3) Plotly.newPlot('comparisonChart3', heatmapData, layout3, { responsive: true });
}

function showNoData(canvasId) {
    const el = document.getElementById(canvasId);
    if (!el) return;
    if (el.tagName === 'CANVAS') {
        const parent = el.parentElement;
        el.style.display = 'none';
        const msg = document.createElement('div');
        msg.className = 'no-data';
        msg.textContent = 'No data available';
        parent.appendChild(msg);
    } else {
        el.innerHTML = '<div class="no-data">No data available</div>';
    }
}
