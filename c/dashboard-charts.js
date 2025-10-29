// static/js/dashboard-charts.js
let revenueChart, volumeChart;

document.addEventListener('DOMContentLoaded', function() {
    initializeCharts();
});

function initializeCharts() {
    const revenueChartEl = document.getElementById('revenueChart');
    const volumeChartEl = document.getElementById('volumeChart');
    
    if (revenueChartEl && volumeChartEl) {
        loadChartData('30');
    }
}

function loadChartData(range = '30') {
    console.log('Loading chart data for range:', range);
    
    const revenueContainer = document.getElementById('revenueChart')?.parentElement;
    const volumeContainer = document.getElementById('volumeChart')?.parentElement;
    
    showLoadingState(revenueContainer, volumeContainer);
    
    fetch('/ajax/dashboard/chart-data?range=' + range)
        .then(response => response.json())
        .then(data => {
            console.log('Chart data response:', data);
            
            if (data.success && data.stats && data.stats.length > 0) {
                createCharts(data.stats);
            } else {
                showNoDataState(revenueContainer, volumeContainer);
            }
        })
        .catch(error => {
            console.error('Error loading chart data:', error);
            showErrorState(revenueContainer, volumeContainer);
        });
}

function showLoadingState(revenueContainer, volumeContainer) {
    const loadingHTML = '<div style="text-align: center; padding: 20px; color: var(--text-light);">Loading chart data...</div>';
    if (revenueContainer) revenueContainer.innerHTML = loadingHTML + '<canvas id="revenueChart"></canvas>';
    if (volumeContainer) volumeContainer.innerHTML = loadingHTML + '<canvas id="volumeChart"></canvas>';
}

function showNoDataState(revenueContainer, volumeContainer) {
    const noDataHTML = '<div style="text-align: center; padding: 20px; color: var(--text-light);">No payment data available for charts</div>';
    if (revenueContainer) revenueContainer.innerHTML = noDataHTML;
    if (volumeContainer) volumeContainer.innerHTML = noDataHTML;
}

function showErrorState(revenueContainer, volumeContainer) {
    const errorHTML = '<div style="text-align: center; padding: 20px; color: var(--error-color);">Error loading chart data</div>';
    if (revenueContainer) revenueContainer.innerHTML = errorHTML;
    if (volumeContainer) volumeContainer.innerHTML = errorHTML;
}

function createCharts(chartData) {
    console.log('Creating charts with data:', chartData);
    
    // Destroy existing charts before creating new ones
    if (revenueChart) {
        revenueChart.destroy();
        revenueChart = null;
    }
    if (volumeChart) {
        volumeChart.destroy();
        volumeChart = null;
    }
    
    // Small delay to ensure DOM is updated
    requestAnimationFrame(() => {
        createRevenueChart(chartData);
        createVolumeChart(chartData);
    });
}

function createRevenueChart(chartData) {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) {
        console.error('Revenue chart canvas not found');
        return;
    }
    
    const chartContext = ctx.getContext('2d');
    if (!chartContext) {
        console.error('Cannot get 2D context for revenue chart');
        return;
    }
    
    const labels = chartData.map(stat => {
        try {
            const [year, month] = stat.month.split('-');
            return new Date(year, month - 1).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short' 
            });
        } catch (e) {
            return stat.month;
        }
    });
    
    const revenueData = chartData.map(stat => parseFloat(stat.total_amount) || 0);
    
    revenueChart = new Chart(chartContext, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Revenue (₦)',
                data: revenueData,
                borderColor: '#af4c02',
                backgroundColor: 'rgba(175, 76, 2, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2,  // Added: Controls width:height ratio
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return '₦' + context.parsed.y.toLocaleString();
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '₦' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
    
    console.log('Revenue chart created successfully');
}

function createVolumeChart(chartData) {
    const ctx = document.getElementById('volumeChart');
    if (!ctx) {
        console.error('Volume chart canvas not found');
        return;
    }
    
    const chartContext = ctx.getContext('2d');
    if (!chartContext) {
        console.error('Cannot get 2D context for volume chart');
        return;
    }
    
    const labels = chartData.map(stat => {
        try {
            const [year, month] = stat.month.split('-');
            return new Date(year, month - 1).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short' 
            });
        } catch (e) {
            return stat.month;
        }
    });
    
    const volumeData = chartData.map(stat => parseInt(stat.payment_count) || 0);
    
    volumeChart = new Chart(chartContext, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Payment Count',
                data: volumeData,
                backgroundColor: 'rgba(180, 133, 0, 0.7)',
                borderColor: '#b48500',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2,  // Added: Controls width:height ratio
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
    
    console.log('Volume chart created successfully');
}

function refreshCharts() {
    const timeRange = document.getElementById('timeRange');
    if (!timeRange) return;
    
    const range = timeRange.value;
    console.log('Refreshing charts with range:', range);
    loadChartData(range);
}

window.dashboardCharts = {
    refreshCharts,
    loadChartData
};