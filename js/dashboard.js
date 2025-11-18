// Global variables
let currentPage = 1;
const pageSize = 20;
let currentSearch = '';

document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
});

function initializeDashboard() {
    document.getElementById('searchPayments').addEventListener('input', debounce(searchPayments, 300));
    document.getElementById('prevPage').addEventListener('click', goToPreviousPage);
    document.getElementById('nextPage').addEventListener('click', goToNextPage);
    document.getElementById('changeAdminForm').addEventListener('submit', handleChangeAdmin);
    document.getElementById('exportForm').addEventListener('submit', handleExport);
    document.getElementById('otherOfficialsForm').addEventListener('submit', handleOtherOfficials);
    document.getElementById('logoForm').addEventListener('submit', handleLogo);
    
    // Load initial data
    loadPayments();
}

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        fetch('/ajax/dashboard/logout', {
            method: 'POST'
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                window.location.href = '/dashboard';
            }
        })
        .catch(error => {
            window.location.href = '/dashboard';
        });
    }
}

function openOtherOfficialsModal() {
    loadSettings();
    document.getElementById('otherOfficialsModal').style.display = 'block';
}
function closeOtherOfficialsModal() {
    document.getElementById('otherOfficialsModal').style.display = 'none';
    document.getElementById('otherOfficialsForm').reset();
}

function openLogoModal() {
    loadSettings();
    document.getElementById('logoModal').style.display = 'block';
}
function closeLogoModal() {
    document.getElementById('logoModal').style.display = 'none';
    document.getElementById('logoForm').reset();
}

function openChangeAdminModal() {
    document.getElementById('changeAdminModal').style.display = 'block';
}
function closeChangeAdminModal() {
    document.getElementById('changeAdminModal').style.display = 'none';
    document.getElementById('changeAdminForm').reset();
}

function openExportModal() {
    // Set default dates (last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    document.getElementById('exportStartDate').value = startDate.toISOString().split('T')[0];
    document.getElementById('exportEndDate').value = endDate.toISOString().split('T')[0];
    document.getElementById('exportModal').style.display = 'block';
}

function closeExportModal() {
    document.getElementById('exportModal').style.display = 'none';
    document.getElementById('exportForm').reset();
}

// Close modals when clicking outside
window.addEventListener('click', function(e) {
    const changeAdminModal = document.getElementById('changeAdminModal');
    const otherOfficialsModal = document.getElementById('otherOfficialsModal');
    const logoModal = document.getElementById('logoModal');
    const exportModal = document.getElementById('exportModal');
    
    if (e.target === changeAdminModal) {
        closeChangeAdminModal();
    }
    if (e.target === exportModal) {
        closeExportModal();
    }
    if (e.target === otherOfficialsModal) {
        closeOtherOfficialsModal();
    }
    if (e.target === logoModal) {
        closeLogoModal();
    }
});

// Change Administration
async function handleChangeAdmin(e) {
    e.preventDefault();
    
    const form = e.target;
    const verifyKey = document.getElementById('verifyAccessKey').value;
    const newName = document.getElementById('newPresidentName').value.trim();
    const newPhone = document.getElementById('newPresidentPhone').value.trim();
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    if (!verifyKey || !newName || !newPhone) {
        alert('Please fill all fields');
        return;
    }
    
    submitBtn.textContent = 'Updating...';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch('/ajax/dashboard/change-admin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                verify_key: verifyKey,
                new_president_name: newName,
                new_president_phone: newPhone
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            const modalBody = document.querySelector('#changeAdminModal .modal-body');
            const modalHeader = document.querySelector('#changeAdminModal .modal-header h3');
            
            modalHeader.textContent = 'Administration Changed Successfully!';
            
            modalBody.innerHTML = `
                <div class="success-state">
                    <div class="success-icon" style="text-align: center; font-size: 48px; color: var(--success-color); margin-bottom: 20px;">✓</div>
                    
                    <div class="warning-box" style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: var(--border-radius); padding: var(--spacing-md); margin-bottom: var(--spacing-lg);">
                        <p style="margin: 0; color: #856404; font-weight: bold; text-align: center;">
                            ⚠️ Save this access key immediately!
                        </p>
                    </div>
                    
                    <div class="access-key-display" style="background: var(--secondary-color); padding: var(--spacing-lg); border-radius: var(--border-radius); margin-bottom: var(--spacing-lg); text-align: center;">
                        <label style="display: block; margin-bottom: var(--spacing-sm); font-weight: bold; color: var(--text-color);">Your New Access Key:</label>
                        <div style="display: flex; gap: var(--spacing-sm); align-items: center; justify-content: center;">
                            <input 
                                type="text" 
                                id="newAccessKeyDisplay" 
                                value="${result.new_access_key}" 
                                readonly 
                                style="flex: 1; padding: var(--spacing-md); font-family: monospace; font-size: var(--font-size-sm); text-align: center; background: white; border: 1px solid var(--border-color); border-radius: var(--border-radius);">
                            <button 
                                type="button" 
                                onclick="copyAccessKey()" 
                                style="background: var(--primary-color); color: white; border: none; padding: var(--spacing-md) var(--spacing-lg); border-radius: var(--border-radius); cursor: pointer; white-space: nowrap;">
                                Copy
                            </button>
                        </div>
                        <small style="display: block; margin-top: var(--spacing-sm); color: var(--text-light);">
                            Click the copy button to save your access key
                        </small>
                    </div>
                    
                    <div class="instructions" style="background: #d1ecf1; border: 1px solid #bee5eb; border-radius: var(--border-radius); padding: var(--spacing-md); margin-bottom: var(--spacing-lg);">
                        <p style="margin: 0; color: #0c5460;">
                            <strong>Next steps:</strong> 
                            <br>• Save this key in a secure location
                            <br>• Share it with the financial secretary or any other relevant administration officer 
                            <br>• You'll need this key to access the dashboard
                        </p>
                    </div>
                    
                    <div class="form-actions" style="text-align: center;">
                        <button type="button" onclick="closeChangeAdminModal(); window.location=window.location;" class="submit-btn" style="min-width: 120px;">
                            Done
                        </button>
                    </div>
                </div>
            `;
            
            const accessKeyInput = document.getElementById('newAccessKeyDisplay');
            if (accessKeyInput) {
                accessKeyInput.focus();
                accessKeyInput.select();
            }
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        alert('Network error. Please try again.');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// Function to copy access key to clipboard
function copyAccessKey() {
    const accessKeyInput = document.getElementById('newAccessKeyDisplay');
    if (!accessKeyInput) return;
    
    accessKeyInput.select();
    accessKeyInput.setSelectionRange(0, 99999); // For mobile devices
    
    try {
        navigator.clipboard.writeText(accessKeyInput.value).then(() => {
            // Show copied feedback
            const copyBtn = document.querySelector('button[onclick="copyAccessKey()"]');
            const originalText = copyBtn.textContent;
            copyBtn.textContent = 'Copied!';
            copyBtn.style.background = 'var(--success-color)';
            
            setTimeout(() => {
                copyBtn.textContent = originalText;
                copyBtn.style.background = 'var(--primary-color)';
            }, 2000);
        });
    } catch (err) {
        // Fallback for older browsers
        document.execCommand('copy');
        const copyBtn = document.querySelector('button[onclick="copyAccessKey()"]');
        const originalText = copyBtn.textContent;
        copyBtn.textContent = 'Copied!';
        copyBtn.style.background = 'var(--success-color)';
        
        setTimeout(() => {
            copyBtn.textContent = originalText;
            copyBtn.style.background = 'var(--primary-color)';
        }, 2000);
    }
}

// Payments Management
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function searchPayments(e) {
    currentSearch = e.target.value.trim();
    currentPage = 1;
    loadPayments();
}

function goToPreviousPage() {
    if (currentPage > 1) {
        currentPage--;
        loadPayments();
    }
}

function goToNextPage() {
    currentPage++;
    loadPayments();
}

async function loadPayments() {
    const tableBody = document.querySelector('#paymentsTable tbody');
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    const pageInfo = document.getElementById('pageInfo');
    
    // Show loading
    tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Loading...</td></tr>';
    
    try {
        const response = await fetch('/ajax/dashboard/payments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                page: currentPage,
                search: currentSearch,
                pageSize: pageSize
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            displayPayments(result.payments);
            updatePagination(result.hasMore);
        } else {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Error loading payments</td></tr>';
        }
    } catch (error) {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Network error</td></tr>';
    }
}

function displayPayments(payments) {
    const tableBody = document.querySelector('#paymentsTable tbody');
    
    if (payments.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No payments found</td></tr>';
        return;
    }
    
    tableBody.innerHTML = payments.map(payment => `
        <tr>
            <td>${escapeHtml(payment.fullname)}</td>
            <td>${escapeHtml(payment.matnumber)}</td>
            <td>${escapeHtml(payment.administration)}</td>
            <td>₦${parseFloat(payment.amount).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
            <td>
                ${(() => {
                    const s = "{{ payment.transfer_status }}";
                    const isSent = s === 'sent';
                    const color = isSent ? 'green' : '#f0c505';
                    const text = isSent ? 'Sent' : 'Pending';
                    const glow = isSent 
                        ? 'filter: drop-shadow(0 0 1.5px #0f0) drop-shadow(0 0 2.5px #0f0);'
                        : 'filter: drop-shadow(0 0 1.5px #f0c505) drop-shadow(0 0 2.5px #ff0);';
                    const svg = `<svg width="13" height="13" viewBox="0 0 13 13" style="display:inline-block;vertical-align:middle;${glow}">
                        <circle cx="6.5" cy="6.5" r="5.5" fill="${color}" />
                    </svg>`;
                    return `${svg} <span style="margin-left:6px;">${text}</span>`;
                })()}
            </td>
            <td>${formatDate(payment.created_at)}</td>
        </tr>
    `).join('');
    /*
    tableBody.innerHTML = payments.map(payment => `
        <tr>
            <td>${escapeHtml(payment.fullname)}</td>
            <td class="arn-cell">${formatARN(payment.arn)}</td>
            <td>${escapeHtml(payment.administration)}</td>
            <td>₦${parseFloat(payment.amount).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
            <td>${formatDate(payment.created_at)}</td>
            <td>
                <form action="/download-receipt" method="POST" class="download-form">
                    <input type="hidden" name="arn" value="${payment.arn}">
                    <button type="submit" class="download-btn">📥</button>
                </form>
            </td>
        </tr>
    `).join('');
    */
}

function updatePagination(hasMore) {
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    const pageInfo = document.getElementById('pageInfo');
    
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = !hasMore;
    pageInfo.textContent = `Page ${currentPage}`;
}

// Export functionality
function exportPayments() {
    openExportModal();
}

async function handleExport(e) {
    e.preventDefault();
    
    const form = e.target;
    const startDate = document.getElementById('exportStartDate').value;
    const endDate = document.getElementById('exportEndDate').value;
    const exportType = document.getElementById('exportType').value;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    if (!startDate || !endDate) {
        alert('Please select date range');
        return;
    }
    
    submitBtn.textContent = 'Exporting...';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch('/ajax/dashboard/export', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                start_date: startDate,
                end_date: endDate,
                export_type: exportType
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Download the file
            const link = document.createElement('a');
            link.href = result.download_url;
            link.download = result.filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            closeExportModal();
        } else {
            alert('Export failed: ' + result.message);
        }
    } catch (error) {
        alert('Network error during export.');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// Utility functions
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatARN(arn) {
    // Format ARN with dashes every 3 digits
    return arn.replace(/(\d{3})(?=\d)/g, '$1-');
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

// Update the formatARN function with proper error handling
function formatARN(arn) {
    if (!arn || typeof arn !== 'string') {
        return 'N/A';
    }
    
    // Format ARN with dashes every 3 digits
    return arn.replace(/(\d{3})(?=\d)/g, '$1-');
}

// Also update the displayPayments function to handle missing data
function displayPayments(payments) {
    const tableBody = document.querySelector('#paymentsTable tbody');
    
    if (!payments || payments.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No payments found</td></tr>';
        return;
    }
    
    tableBody.innerHTML = payments.map(payment => `
        <tr>
            <td>${escapeHtml(payment.fullname || 'N/A')}</td>
            <td>${escapeHtml(payment.matnumber || 'N/A')}</td>
            <td>${escapeHtml(payment.administration || 'N/A')}</td>
            <td>₦${parseFloat(payment.amount || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
            <td>
                ${(() => {
                    const s = "{{ payment.transfer_status }}";
                    const isSent = s === 'sent';
                    const color = isSent ? 'green' : '#f0c505';
                    const text = isSent ? 'Sent' : 'Pending';
                    const glow = isSent 
                        ? 'filter: drop-shadow(0 0 1.5px #0f0) drop-shadow(0 0 2.5px #0f0);'
                        : 'filter: drop-shadow(0 0 1.5px #f0c505) drop-shadow(0 0 2.5px #ff0);';
                    const svg = `<svg width="13" height="13" viewBox="0 0 13 13" style="display:inline-block;vertical-align:middle;${glow}">
                        <circle cx="6.5" cy="6.5" r="5.5" fill="${color}" />
                    </svg>`;
                    return `${svg} <span style="margin-left:6px;">${text}</span>`;
                })()}
            </td>
            <td>${formatDate(payment.created_at)}</td>
        </tr>
    `).join('');
    /*
    tableBody.innerHTML = payments.map(payment => `
        <tr>
            <td>${escapeHtml(payment.fullname || 'N/A')}</td>
            <td class="arn-cell">${formatARN(payment.arn)}</td>
            <td>${escapeHtml(payment.administration || 'N/A')}</td>
            <td>₦${parseFloat(payment.amount || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
            <td>${formatDate(payment.created_at)}</td>
            <td>
                <form action="/download-receipt" method="POST" class="download-form">
                    <input type="hidden" name="arn" value="${payment.arn || ''}">
                    <button type="submit" class="download-btn">📥</button>
                </form>
            </td>
        </tr>
    `).join('');
    */
}

// Update the formatDate function to handle missing dates
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    } catch (e) {
        return 'Invalid Date';
    }
}

// Update the loadPayments function with better error handling
async function loadPayments() {
    const tableBody = document.querySelector('#paymentsTable tbody');
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    const pageInfo = document.getElementById('pageInfo');
    
    // Only run if we're on a page with payments table
    if (!tableBody) return;
    
    // Show loading
    tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Loading...</td></tr>';
    
    try {
        const response = await fetch('/ajax/dashboard/payments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                page: currentPage,
                search: currentSearch,
                pageSize: pageSize
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            displayPayments(result.payments || []);
            updatePagination(result.hasMore || false);
        } else {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Error loading payments: ' + (result.message || 'Unknown error') + '</td></tr>';
        }
    } catch (error) {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Network error loading payments</td></tr>';
    }
}

// Update the initializeDashboard function to check for elements
function initializeDashboard() {
    // Only initialize if we're on the dashboard page
    const searchPayments = document.getElementById('searchPayments');
    const prevPage = document.getElementById('prevPage');
    const nextPage = document.getElementById('nextPage');
    const changeAdminForm = document.getElementById('changeAdminForm');
    const exportForm = document.getElementById('exportForm');
    
    // Add event listeners only if elements exist
    if (searchPayments) {
        searchPayments.addEventListener('input', debounce(searchPayments, 300));
    }
    if (prevPage) {
        prevPage.addEventListener('click', goToPreviousPage);
    }
    if (nextPage) {
        nextPage.addEventListener('click', goToNextPage);
    }
    if (changeAdminForm) {
        changeAdminForm.addEventListener('submit', handleChangeAdmin);
    }
    if (exportForm) {
        exportForm.addEventListener('submit', handleExport);
    }
    
    // Load initial data only if we have the payments table
    if (document.querySelector('#paymentsTable')) {
        loadPayments();
    }
}