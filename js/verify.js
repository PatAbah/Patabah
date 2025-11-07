function formatARN(number) {
    return String(number).replace(/\D/g, '').replace(/(\d{3})(?=\d)/g, '$1-');
}

function openVerifyModal(arn = '') {
    const modal = document.getElementById('verifyModal');
    const arnInput = document.getElementById('arnInput');
    
    if (arn) {
        arnInput.value = arn;
    }
    modal.style.display = 'block';
    resetVerifyModal();
    arnInput.focus();
}

function closeVerifyModal() {
    document.getElementById('verifyModal').style.display = 'none';
    resetVerifyModal(true);
}

function resetVerifyModal(trueReset) {
    document.getElementById('verifyForm').style.display = 'block';
    document.getElementById('verifyLoading').style.display = 'none';
    document.getElementById('verifyResult').style.display = 'none';
    document.getElementById('verifyResult').innerHTML = '';
    if (trueReset) {
        document.getElementById('arnInput').value = '';
        document.getElementById('arnInput').focus();
    } 
}

window.addEventListener('click', function(e) {
    const modal = document.getElementById('verifyModal');
    if (e.target === modal) {
        closeVerifyModal();
    }
});

async function verifyARN() {
    const arnInput = document.getElementById('arnInput');
    const arn = arnInput.value.trim().replace(/-/g, '');
    
    if (!arn) {
        alert('Please enter a valid ARN');
        return;
    }
    showVerifyLoading();
    try {
        const response = await fetch(`/ajax/verify/${arn}`);
        const result = await response.json();
        
        if (result.success) {
            showVerifyResult(result, arn);
        } else {
            showVerifyError(result.message);
        }
    } catch (error) {
        console.error('Verify error:', error);
        showVerifyError('Network error. Please try again.');
    }
}

function showVerifyLoading() {
    document.getElementById('verifyForm').style.display = 'none';
    document.getElementById('verifyLoading').style.display = 'block';
    document.getElementById('verifyResult').style.display = 'none';
}

function showVerifyResult(result, arn=false) {
    document.getElementById('verifyLoading').style.display = 'none';
    document.getElementById('verifyResult').style.display = 'block';
    document.querySelector('.verify-modal .modal-body').classList.remove('modal-blur');
    
    const verifyResult = document.getElementById('verifyResult');
    
    if (result.payment.status === 'success') {
        verifyResult.innerHTML = `
            <div class="result-header">
                <div class="valid-payment">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                    Authentic
                </div>
                <div>
                    ${(() => {
                      const s = result.payment.transfer_status;
                      const isSent = s === 'sent';
                      const color = isSent ? 'green' : '#f0c505';
                      const text = isSent ? 'Green' : 'Yellow';
                      const glow = isSent 
                        ? 'filter: drop-shadow(0 0 1.5px #0f0) drop-shadow(0 0 2.5px #0f0);'
                        : 'filter: drop-shadow(0 0 1.5px #f0c505) drop-shadow(0 0 2.5px #ff0);';
                      const svg = `<svg width="13" height="13" viewBox="0 0 13 13" style="display:inline-block;vertical-align:middle;${glow}">
                        <circle cx="6.5" cy="6.5" r="5.5" fill="${color}" />
                      </svg>`;
                      return `<table style="display:inline-table;border-collapse:collapse;font-size:16px;"><tr>
                        <td valign="center" style="padding:0 6px 0 0;white-space:nowrap;">Code:</td>
                        <td valign="center" style="padding:0;">${svg}</td>
                        <td valign="center" style="padding:0 0 0 6px;">${text}</td>
                      </tr></table>`;
                    })()}
                </div>
                <br>
                <small>Please confirm you're on our site: <br>${(() => window.location.href.split('/').slice(0,3).join('/'))()}</small>
            </div>
            
            <div class="payment-info">
                <center>
                    <div class="detail-item">
                        <span class="detail-value"><font style="font-weight: 400 !important">${escapeHtml(result.payment.institution_name)} /</font> ${escapeHtml(result.payment.association_name)}</span>
                    </div>
                </center>
                <div class="amount-display">
                    <div class="amount-value">₦${parseFloat(result.payment.amount).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                    <div>Payment Amount</div>
                </div>
                
                <div class="payment-details">
                    <div class="detail-item">
                        <span class="detail-label">Name:</span>
                        <span class="detail-value">${escapeHtml(result.payment.fullname)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Matric Number:</span>
                        <span class="detail-value">${escapeHtml(result.payment.matnumber)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Phone:</span>
                        <span class="detail-value">${escapeHtml(result.payment.phone)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Administration:</span>
                        <span class="detail-value">${escapeHtml(result.payment.president_name)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Date:</span>
                        <span class="detail-value">${formatDate(result.payment.created_at)}</span>
                    </div>
                </div>
            </div>
            ${result.is_official ? `
                <div class="notes-panel">
                    <small>Only those with association's access key can view or add notes. </small>
                    <h4>Notes:</h4>
                    <div id="notesList"></div>
                    <div class="add-note">
                        <input type="text" id="newNote" placeholder="Add note (max 100 chars)" maxlength="100" class="form-input">
                        <button id="addNoteButt" onclick="addNote('${result.arn}')" class="submit-btn">Add note</button>
                    </div>
                </div>
                ` : ''}
            <div class="verify-actions">
                <form action="/download-receipt" method="POST" style="flex: 1;">
                    <input type="hidden" name="arn" value="${arn}">
                    <button type="submit" class="submit-btn">Download Receipt</button>
                </form>
                <button type="button" onclick="resetVerifyModal(true)" class="submit-btn" style="background: var(--text-light);">Verify Another</button>
            </div>
        `;
        if (result.is_official) {
            loadNotes(result.arn);
        }
    } else {
        // Unpaid invoice
        verifyResult.innerHTML = `
            <div class="unpaid-invoice">
                <h4>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="#dc2626">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                    <br>
                    Unpaid Invoice
                </h4>
                <p>The ARN <strong>${formatARN(document.getElementById('arnInput').value)}</strong> is for an unpaid invoice.</p>
                <p><strong>To pay:</strong> Go to the homepage, select "Pay Invoice", and enter this ARN to complete payment.</p>
            </div>
            
            <div class="payment-info">
                <div class="amount-display">
                    <div class="amount-value">₦${parseFloat(result.payment.amount).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                    <div>Invoice Amount</div>
                </div>
                
                <div class="payment-details">
                    <div class="detail-item">
                        <span class="detail-label">Name:</span>
                        <span class="detail-value">${escapeHtml(result.payment.fullname)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Matric Number:</span>
                        <span class="detail-value">${escapeHtml(result.payment.matnumber)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Phone:</span>
                        <span class="detail-value">${escapeHtml(result.payment.phone)}</span>
                    </div>
                </div>
            </div>
            
            <div class="verify-actions">
                <button type="button" onclick="window.location.href='/?arn=${result.payment.arn}'" class="submit-btn">Pay Invoice</button>
                <button type="button" onclick="resetVerifyModal(true)" class="submit-btn" style="background: var(--text-light);">Verify Another</button>
            </div>
        `;
    }
}

function showVerifyError(message) {
    document.getElementById('verifyLoading').style.display = 'none';
    document.getElementById('verifyResult').style.display = 'block';
    document.querySelector('.verify-modal .modal-body').classList.remove('modal-blur');
    
    const verifyResult = document.getElementById('verifyResult');
    verifyResult.innerHTML = `
        <div class="error-result">
            <h4>Verification Failed</h4>
            <p>${message}</p>
            <div class="error-actions">
                <button type="button" onclick="resetVerifyModal()" class="submit-btn">Retry</button>
                <button type="button" onclick="closeVerifyModal()" class="submit-btn" style="background: var(--text-light);">Close</button>
            </div>
        </div>
    `;
}

function escapeHtml(unsafe) {
    if (!unsafe) return 'N/A';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatARN(arn) {
    if (!arn || typeof arn !== 'string') return 'N/A';
    return arn.replace(/(\d{3})(?=\d)/g, '$1-');
}

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

// Handle direct ARN access
document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const arn = urlParams.get('arn');
    
    if (arn) {
        openVerifyModal(arn);
    }
});

function setupARNInput() {
    const arnInput = document.getElementById('arnInput');
    if (!arnInput) return;

    arnInput.addEventListener('input', function(e) {
        let value = this.value.replace(/\D/g, '');
        //this.value = value.replace(/\d{3}(?=\d{1,2})/g, '$&-');
    });
}

async function loadNotes(arn) {
    try {
        const response = await fetch(`/ajax/dashboard/getnotes?arn=${arn}`);
        const result = await response.json();
        if (result.success && result.notes) {
            const notes = Object.entries(result.notes);
            document.getElementById('notesList').innerHTML = notes.length > 0
                ? '<ul>' + notes.map(([timestamp, note]) => 
                    `<li><small>${formatDate(timestamp)}:</small> ${escapeHtml(note)}</li>`
                ).join('') + '</ul>'
                : '<p>No notes yet</p>';
        }
    } catch (error) {}
}

async function addNote(arn) {
    rerenderNoteButton(false);
    const noteInput = document.getElementById('newNote');
    const note = noteInput.value.trim();
    if (!note || note.length > 100) {
        alert('Note must be 1-100 characters');
        return;
    }
    try {
        const formData = new FormData();
        formData.append('arn', arn);
        formData.append('note', note);
        const response = await fetch('/ajax/dashboard/addnote', {
            method: 'POST',
            body: formData
        });
        const result = await response.json();
        if (result.success) {
            noteInput.value = '';
            loadNotes(arn);
            rerenderNoteButton(true);
        } else {
            alert('Failed to add note');
            rerenderNoteButton(true);
        }
    } catch (error) {
        alert('Network error');
        rerenderNoteButton(true);
    }
}

function rerenderNoteButton(status) {
    const btn = document.getElementById('addNoteButt');
    btn.disabled = !status;
    btn.textContent = status ? 'Add note' : 'Adding... Please wait.';
}

document.addEventListener('DOMContentLoaded', function() {
    setupARNInput();
    const urlParams = new URLSearchParams(window.location.search);
    const arn = urlParams.get('arn');
    if (arn) openVerifyModal(arn);
});