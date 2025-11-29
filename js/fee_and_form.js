document.addEventListener('DOMContentLoaded', function() {
    let currentSettings = {};
    
    initializeSettings();
    setupEventListeners();
    
    function initializeSettings() {
        fetch('/api/association-settings').then(r => r.json()).then(data => {
            if (data.success) {
                currentSettings = data.data;
                renderFeeStructure();
                renderCustomFields();
                renderChargeManagement();
            } else showNotification(data.message || 'Failed to load settings', 'error');
        }).catch(e => {
            showNotification('Error loading settings', 'error');
            console.error('Error:', e);
        });
    }
    
    function renderFeeStructure() {
        const container = document.getElementById('feeCategoriesContainer');
        if (!container) return;
        let html = '';
        Object.entries(currentSettings.fees || {}).forEach(([category, amount]) => {
            html += `<div class="fee-category"><input type="text" class="form-input" value="${category}" placeholder="Category name"><input type="number" class="form-input" value="${amount}" placeholder="Amount"><button type="button" class="secondary-btn" onclick="removeFeeCategory(this)">Remove</button></div>`;
        });
        container.innerHTML = html || '<p>No fee categories yet. Add one below.</p>';
    }
    
    function renderCustomFields() {
        const container = document.getElementById('customFieldsContainer');
        if (!container) return;
        let html = '';
        (currentSettings.custom_fields || []).forEach(field => {
            html += `<div class="custom-field"><input type="text" class="form-input" value="${field}" placeholder="Field name"><button type="button" class="secondary-btn" onclick="removeCustomField(this)">Remove</button></div>`;
        });
        container.innerHTML = html || '<p>No custom fields yet. Add one below.</p>';
    }
    
    function renderChargeManagement() {
        const slider = document.getElementById('memberFeeSlider');
        const valueDisplay = document.getElementById('memberFeeValue');
        const breakdownContent = document.getElementById('breakdownContent');
        if (slider && valueDisplay) {
            slider.value = currentSettings.member_fee || 100;
            valueDisplay.textContent = currentSettings.member_fee || 100;
        }
        if (breakdownContent && currentSettings.fee_breakdown) updateFeeBreakdown(currentSettings.member_fee || 100, currentSettings.fee_breakdown);
    }
    
    function updateFeeBreakdown(memberFee, feeStructure) {
        const breakdownContent = document.getElementById('breakdownContent');
        if (!breakdownContent) return;
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
            html += `<div class="fee-category-breakdown"><strong>${category}</strong><div class="fee-details"><div>Main Fee: ₦${mainFee.toLocaleString()}</div><div>Member Pays: ₦${memberPaysTotal.toLocaleString()} (includes ₦${memberPaysCharge.toLocaleString()} charge)</div><div>Association Receives: ₦${orgReceives.toLocaleString()}</div><div>Amount shown on receipts: ₦${mainFee.toLocaleString()}</div></div></div>`;
        });
        breakdownContent.innerHTML = html;
    }
    
    function setupEventListeners() {
        document.getElementById('feeStructureForm').addEventListener('submit', handleFeeStructureUpdate);
        document.getElementById('paymentFormDataForm').addEventListener('submit', handleCustomFieldsUpdate);
        document.getElementById('memberFeeSlider').addEventListener('input', function() {
            const value = this.value;
            document.getElementById('memberFeeValue').textContent = value;
            updateFeeBreakdown(value, currentSettings.fee_breakdown);
        });
        document.getElementById('updateMemberFee').addEventListener('click', updateMemberFee);
        document.querySelector('#chargesManagementModal .close').addEventListener('click', closeChargesManagementModal);
        document.querySelector('#feeStructureModal .close-modal').addEventListener('click', closeFeeStructureModal);
        document.querySelector('#paymentFormModal .close-modal').addEventListener('click', closePaymentFormModal);
        window.addEventListener('click', function(event) {
            if (event.target === document.getElementById('chargesManagementModal')) closeChargesManagementModal();
            if (event.target === document.getElementById('feeStructureModal')) closeFeeStructureModal();
            if (event.target === document.getElementById('paymentFormModal')) closePaymentFormModal();
        });
    }
    
    function handleFeeStructureUpdate(e) {
        e.preventDefault();
        const feeCategories = {};
        document.querySelectorAll('#feeCategoriesContainer .fee-category').forEach(categoryEl => {
            const nameInput = categoryEl.querySelector('input[type="text"]');
            const amountInput = categoryEl.querySelector('input[type="number"]');
            if (nameInput.value.trim() && amountInput.value) feeCategories[nameInput.value.trim()] = parseFloat(amountInput.value);
        });
        updateSettings('update_fees', feeCategories, 'Fee structure updated successfully');
    }
    
    function handleCustomFieldsUpdate(e) {
        e.preventDefault();
        const customFields = [];
        document.querySelectorAll('#customFieldsContainer .custom-field input').forEach(input => {
            if (input.value.trim()) customFields.push(input.value.trim());
        });
        updateSettings('update_custom_fields', customFields, 'Custom fields updated successfully');
    }
    
    function updateMemberFee() {
        updateSettings('update_member_fee', document.getElementById('memberFeeSlider').value, 'Member fee updated successfully');
    }
    
    function updateSettings(action, data, successMessage) {
        fetch('/api/association-settings', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({action: action, data: data})
        }).then(r => r.json()).then(result => {
            if (result.success) {
                showNotification(successMessage, 'success');
                initializeSettings();
                if (action === 'update_member_fee') closeChargesManagementModal();
                if (action === 'update_fees') closeFeeStructureModal();
                if (action === 'update_custom_fields') closePaymentFormModal();
            } else showNotification(result.message || 'Update failed', 'error');
        }).catch(e => {
            showNotification('Error updating settings', 'error');
            console.error('Error:', e);
        });
    }
    
    function addNewFeeCategory() {
        const container = document.getElementById('feeCategoriesContainer');
        const newCategory = document.createElement('div');
        newCategory.className = 'fee-category';
        newCategory.innerHTML = `<input type="text" class="form-input" placeholder="Category name"><input type="number" class="form-input" placeholder="Amount"><button type="button" class="secondary-btn" onclick="removeFeeCategory(this)">Remove</button>`;
        container.appendChild(newCategory);
    }
    
    function addNewCustomField() {
        const container = document.getElementById('customFieldsContainer');
        const newField = document.createElement('div');
        newField.className = 'custom-field';
        newField.innerHTML = `<input type="text" class="form-input" placeholder="Field name"><button type="button" class="secondary-btn" onclick="removeCustomField(this)">Remove</button>`;
        container.appendChild(newField);
    }
    
    function removeFeeCategory(button) {
        button.closest('.fee-category').remove();
    }
    
    function removeCustomField(button) {
        button.closest('.custom-field').remove();
    }
    
    function openChargesManagementModal() {
        document.getElementById('chargesManagementModal').style.display = 'block';
    }
    
    function closeChargesManagementModal() {
        document.getElementById('chargesManagementModal').style.display = 'none';
    }
    
    function openFeeStructureModal() {
        document.getElementById('feeStructureModal').style.display = 'block';
    }
    
    function closeFeeStructureModal() {
        document.getElementById('feeStructureModal').style.display = 'none';
    }
    
    function openPaymentFormModal() {
        document.getElementById('paymentFormModal').style.display = 'block';
    }
    
    function closePaymentFormModal() {
        document.getElementById('paymentFormModal').style.display = 'none';
    }
    
    function showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.style.cssText = `position:fixed;top:20px;right:20px;padding:12px 20px;border-radius:4px;color:white;z-index:10000;font-weight:500;background:${type==='success'?'#10b981':'#ef4444'}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }
    
    window.addNewFeeCategory = addNewFeeCategory;
    window.addNewCustomField = addNewCustomField;
    window.removeFeeCategory = removeFeeCategory;
    window.removeCustomField = removeCustomField;
    window.openChargesManagementModal = openChargesManagementModal;
    window.closeChargesManagementModal = closeChargesManagementModal;
    window.openFeeStructureModal = openFeeStructureModal;
    window.closeFeeStructureModal = closeFeeStructureModal;
    window.openPaymentFormModal = openPaymentFormModal;
    window.closePaymentFormModal = closePaymentFormModal;
});