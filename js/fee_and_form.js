const feeStructureForm = document.getElementById('feeStructureForm');
const paymentFormDataForm = document.getElementById('paymentFormDataForm');

if (feeStructureForm) {
    feeStructureForm.addEventListener('submit', handleFeeStructureUpdate);
}

if (paymentFormDataForm) {
    paymentFormDataForm.addEventListener('submit', handlePaymentFormDataUpdate);
}

function handleFeeStructureUpdate(e) {
    e.preventDefault();
    const formData = new FormData(this);
    const submitBtn = this.querySelector('.submit-btn');
    const originalText = submitBtn.innerHTML;

    submitBtn.innerHTML = '<img src="/static/img/loading.gif" style="height: 20px; margin-right: 8px;"> Updating...';
    submitBtn.disabled = true;

    fetch('/update-fee-structure', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Fee structure updated successfully!', 'success');
        } else {
            showNotification(data.message || 'Update failed', 'error');
        }
    })
    .catch(error => {
        showNotification('Error updating fee structure', 'error');
        console.error('Error:', error);
    })
    .finally(() => {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    });
}

function handlePaymentFormDataUpdate(e) {
    e.preventDefault();
    const formData = new FormData(this);
    const submitBtn = this.querySelector('.submit-btn');
    const originalText = submitBtn.innerHTML;

    submitBtn.innerHTML = '<img src="/static/img/loading.gif" style="height: 20px; margin-right: 8px;"> Updating...';
    submitBtn.disabled = true;

    fetch('/update-payment-form-data', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Form data updated successfully!', 'success');
        } else {
            showNotification(data.message || 'Update failed', 'error');
        }
    })
    .catch(error => {
        showNotification('Error updating form data', 'error');
        console.error('Error:', error);
    })
    .finally(() => {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    });
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 4px;
        color: white;
        z-index: 10000;
        font-weight: 500;
        background: ${type === 'success' ? '#10b981' : '#ef4444'};
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function openChargesManagementModal() {
    const modal = document.getElementById('chargesManagementModal');
    modal.style.display = 'block';
    fetchCurrentMemberFee();
}

function closeChargesManagementModal() {
    document.getElementById('chargesManagementModal').style.display = 'none';
}

function fetchCurrentMemberFee() {
    fetch('/api/get-member-fee')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const slider = document.getElementById('memberFeeSlider');
                const valueDisplay = document.getElementById('memberFeeValue');
                slider.value = data.member_fee;
                valueDisplay.textContent = data.member_fee;
                updateFeeBreakdown(data.member_fee, data.fee_structure);
            }
        })
        .catch(error => console.error('Error fetching member fee:', error));
}

function updateFeeBreakdown(memberFee, feeStructure) {
    const breakdownContent = document.getElementById('breakdownContent');
    
    if (!feeStructure || Object.keys(feeStructure).length === 0) {
        breakdownContent.innerHTML = '<p>No fee structure available.</p>';
        return;
    }

    let html = '';
    Object.entries(feeStructure).forEach(([category, data]) => {
        const mainFee = parseFloat(data.fee);
        const calculatedFee = parseFloat(data.calculated_fee);
        const charge = calculatedFee - mainFee;
        const memberPaysCharge = charge * (memberFee / 100);
        const orgPaysCharge = charge - memberPaysCharge;
        const orgReceives = mainFee - orgPaysCharge;
        const memberPaysTotal = mainFee + memberPaysCharge;

        html += `
            <div class="fee-category-breakdown">
                <strong>${category}</strong>
                <div class="fee-details">
                    <div>Main Fee: ₦${mainFee.toLocaleString()}</div>
                    <div>Member Pays: ₦${memberPaysTotal.toLocaleString()} (includes ₦${memberPaysCharge.toLocaleString()} charge)</div>
                    <div>Association Receives: ₦${orgReceives.toLocaleString()}</div>
                </div>
            </div>
        `;
    });
    
    breakdownContent.innerHTML = html;
}

function updateMemberFee() {
    const memberFee = document.getElementById('memberFeeSlider').value;
    
    fetch('/api/update-member-fee', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'member_fee=' + memberFee
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Member fee updated successfully!', 'success');
            closeChargesManagementModal();
        } else {
            showNotification('Error updating member fee: ' + data.message, 'error');
        }
    })
    .catch(error => {
        showNotification('Error updating member fee', 'error');
        console.error('Error:', error);
    });
}

document.addEventListener('DOMContentLoaded', function() {
    const memberFeeSlider = document.getElementById('memberFeeSlider');
    if (memberFeeSlider) {
        memberFeeSlider.addEventListener('input', function() {
            const value = this.value;
            document.getElementById('memberFeeValue').textContent = value;
            
            fetch('/api/get-fee-breakdown?member_fee=' + value)
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        updateFeeBreakdown(value, data.fee_structure);
                    }
                })
                .catch(error => console.error('Error fetching fee breakdown:', error));
        });
    }

    const modalClose = document.querySelector('#chargesManagementModal .close');
    if (modalClose) {
        modalClose.addEventListener('click', closeChargesManagementModal);
    }

    window.addEventListener('click', function(event) {
        const modal = document.getElementById('chargesManagementModal');
        if (event.target === modal) {
            closeChargesManagementModal();
        }
    });
});