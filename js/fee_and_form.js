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
            html += `
                <div class="fee-category-row">
                    <input type="text" class="form-input fee-label-input" value="${category}" placeholder="Category name">
                    <input type="number" class="form-input fee-amount-input" value="${amount}" placeholder="Amount">
                    <button type="button" class="delete-btn" onclick="removeFeeCategory(this)">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M2 4H14M12.6667 4V13.3333C12.6667 14 12 14.6667 11.3333 14.6667H4.66667C4 14.6667 3.33333 14 3.33333 13.3333V4M5.33333 4V2.66667C5.33333 2 6 1.33333 6.66667 1.33333H9.33333C10 1.33333 10.6667 2 10.6667 2.66667V4M6.66667 7.33333V11.3333M9.33333 7.33333V11.3333" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </div>`;
        });
        container.innerHTML = html || '<p class="empty-state">No fee categories yet. Add one below.</p>';
    }
    
    function renderCustomFields() {
        const container = document.getElementById('customFieldsContainer');
        if (!container) return;
        let html = '';
        (currentSettings.custom_fields || []).forEach(field => {
            const fieldName = field.name || field.field_name || field;
            html += `
                <div class="custom-field-row">
                    <input type="text" class="form-input custom-field-input" value="${fieldName}" placeholder="Field name">
                    <button type="button" class="delete-btn" onclick="removeCustomField(this)">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M2 4H14M12.6667 4V13.3333C12.6667 14 12 14.6667 11.3333 14.6667H4.66667C4 14.6667 3.33333 14 3.33333 13.3333V4M5.33333 4V2.66667C5.33333 2 6 1.33333 6.66667 1.33333H9.33333C10 1.33333 10.6667 2 10.6667 2.66667V4M6.66667 7.33333V11.3333M9.33333 7.33333V11.3333" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </div>`;
        });
        container.innerHTML = html || '<p class="empty-state">No custom fields yet. Add one below.</p>';
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
            html += `<div class="fee-category-breakdown"><strong>${category}</strong><div class="fee-details"><div>Main Fee: ₦${mainFee.toLocaleString()}</div><div>Member Pays: ₦${memberPaysTotal.toLocaleString()} (includes ₦${memberPaysCharge.toLocaleString()} charge)</div><div>Association Receives: ₦${orgReceives.toLocaleString()}</div><div>Amount shown on receipts: ₦${mainFee.toLocaleString()} (always)</div></div></div>`;
        });
        breakdownContent.innerHTML = html;
    }
    
    function setupEventListeners() {
        document.getElementById('feeStructureForm').addEventListener('submit', handleFeeStructureUpdate);
        document.getElementById('paymentFormDataForm').addEventListener('submit', handleCustomFieldsUpdate);
        document.getElementById('memberFeeSlider').addEventListener('input', function() {
            const value = this.value;
            document.getElementById('memberFeeValue').textContent = value;
            this.style.setProperty('--value', value + '%');
            updateFeeBreakdown(value, currentSettings.fee_breakdown);
        });
        document.getElementById('updateMemberFee').addEventListener('click', updateMemberFee);
        
        const chargesClose = document.querySelector('#chargesManagementModal .close-modal');
        if (chargesClose) chargesClose.addEventListener('click', closeChargesManagementModal);
        
        const feeClose = document.querySelector('#feeStructureModal .close-modal');
        if (feeClose) feeClose.addEventListener('click', closeFeeStructureModal);
        
        const paymentClose = document.querySelector('#paymentFormModal .close-modal');
        if (paymentClose) paymentClose.addEventListener('click', closePaymentFormModal);
        
        document.querySelectorAll('.cancel-btn').forEach(btn => {
            const modal = btn.closest('.modal');
            if (modal) {
                btn.addEventListener('click', function() {
                    if (modal.id === 'chargesManagementModal') closeChargesManagementModal();
                    else if (modal.id === 'feeStructureModal') closeFeeStructureModal();
                    else if (modal.id === 'paymentFormModal') closePaymentFormModal();
                });
            }
        });
        
        window.addEventListener('click', function(event) {
            if (event.target === document.getElementById('chargesManagementModal')) closeChargesManagementModal();
            if (event.target === document.getElementById('feeStructureModal')) closeFeeStructureModal();
            if (event.target === document.getElementById('paymentFormModal')) closePaymentFormModal();
        });
    }
    
    function handleFeeStructureUpdate(e) {
        e.preventDefault();
        const feeCategories = {};
        document.querySelectorAll('#feeCategoriesContainer .fee-category-row').forEach(categoryEl => {
            const nameInput = categoryEl.querySelector('.fee-label-input');
            const amountInput = categoryEl.querySelector('.fee-amount-input');
            if (nameInput.value.trim() && amountInput.value) feeCategories[nameInput.value.trim()] = parseFloat(amountInput.value);
        });
        updateSettings('update_fees', feeCategories, 'Fee structure updated successfully');
    }
    
    function handleCustomFieldsUpdate(e) {
        e.preventDefault();
        const customFields = [];
        document.querySelectorAll('#customFieldsContainer .custom-field-row input').forEach(input => {
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
        if (container.querySelector('.empty-state')) {
            container.innerHTML = '';
        }
        const newCategory = document.createElement('div');
        newCategory.className = 'fee-category-row';
        newCategory.innerHTML = `
            <input type="text" class="form-input fee-label-input" placeholder="Category name">
            <input type="number" class="form-input fee-amount-input" placeholder="Amount">
            <button type="button" class="delete-btn" onclick="removeFeeCategory(this)">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2 4H14M12.6667 4V13.3333C12.6667 14 12 14.6667 11.3333 14.6667H4.66667C4 14.6667 3.33333 14 3.33333 13.3333V4M5.33333 4V2.66667C5.33333 2 6 1.33333 6.66667 1.33333H9.33333C10 1.33333 10.6667 2 10.6667 2.66667V4M6.66667 7.33333V11.3333M9.33333 7.33333V11.3333" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </button>`;
        container.appendChild(newCategory);
    }
    
    function addNewCustomField() {
        const container = document.getElementById('customFieldsContainer');
        if (container.querySelector('.empty-state')) {
            container.innerHTML = '';
        }
        const newField = document.createElement('div');
        newField.className = 'custom-field-row';
        newField.innerHTML = `
            <input type="text" class="form-input custom-field-input" placeholder="Field name">
            <button type="button" class="delete-btn" onclick="removeCustomField(this)">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2 4H14M12.6667 4V13.3333C12.6667 14 12 14.6667 11.3333 14.6667H4.66667C4 14.6667 3.33333 14 3.33333 13.3333V4M5.33333 4V2.66667C5.33333 2 6 1.33333 6.66667 1.33333H9.33333C10 1.33333 10.6667 2 10.6667 2.66667V4M6.66667 7.33333V11.3333M9.33333 7.33333V11.3333" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </button>`;
        container.appendChild(newField);
    }
    
    function removeFeeCategory(button) {
        const container = document.getElementById('feeCategoriesContainer');
        button.closest('.fee-category-row').remove();
        if (container.children.length === 0) {
            container.innerHTML = '<p class="empty-state">No fee categories yet. Add one below.</p>';
        }
    }
    
    function removeCustomField(button) {
        const container = document.getElementById('customFieldsContainer');
        button.closest('.custom-field-row').remove();
        if (container.children.length === 0) {
            container.innerHTML = '<p class="empty-state">No custom fields yet. Add one below.</p>';
        }
    }
    
    function closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }
    
    function openChargesManagementModal() {
        closeAllModals();
        document.getElementById('chargesManagementModal').style.display = 'block';
    }
    
    function closeChargesManagementModal() {
        document.getElementById('chargesManagementModal').style.display = 'none';
    }
    
    function openFeeStructureModal() {
        closeAllModals();
        document.getElementById('feeStructureModal').style.display = 'block';
    }
    
    function closeFeeStructureModal() {
        document.getElementById('feeStructureModal').style.display = 'none';
    }
    
    function openPaymentFormModal() {
        closeAllModals();
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