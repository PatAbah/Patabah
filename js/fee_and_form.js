function openFeeStructureModal() {
    loadFeeStructure();
    document.getElementById('feeStructureModal').style.display = 'block';
}

function closeFeeStructureModal() {
    document.getElementById('feeStructureModal').style.display = 'none';
    document.getElementById('feeStructureForm').reset();
}

function loadFeeStructure() {
    // This will be populated from the association data
    const fees = window.associationData?.fees || {};
    const container = document.getElementById('feeCategoriesContainer');
    
    container.innerHTML = '';
    
    Object.entries(fees).forEach(([category, amount], index) => {
        const feeRow = createFeeCategoryRow(category, amount, index);
        container.appendChild(feeRow);
    });
}

function createFeeCategoryRow(category = '', amount = '', index = 0) {
    const row = document.createElement('div');
    row.className = 'fee-category-row';
    row.style.cssText = 'display: flex; gap: 10px; align-items: center; margin-bottom: 10px;';
    
    row.innerHTML = `
        <input type="text" 
               class="form-input fee-category" 
               placeholder="Category name (e.g., Membership Fee)"
               value="${escapeHtml(category)}"
               style="flex: 2;">
        <input type="number" 
               class="form-input fee-amount" 
               placeholder="Amount" 
               value="${amount}"
               min="0" 
               step="0.01"
               style="flex: 1;">
        <button type="button" 
                class="remove-fee-btn" 
                onclick="removeFeeCategory(this)"
                ${Object.keys(window.associationData?.fees || {}).length <= 1 ? 'disabled' : ''}
                style="background: #dc3545; color: white; border: none; padding: 10px 12px; border-radius: var(--border-radius); cursor: pointer; font-size: 14px;">
            ×
        </button>
    `;
    
    return row;
}

function addNewFeeCategory() {
    const container = document.getElementById('feeCategoriesContainer');
    const newRow = createFeeCategoryRow('', '', container.children.length);
    container.appendChild(newRow);
    
    // Enable remove buttons if we have more than 1 fee
    updateFeeRemoveButtons();
}

function removeFeeCategory(button) {
    const row = button.closest('.fee-category-row');
    const container = document.getElementById('feeCategoriesContainer');
    
    if (container.children.length > 1) {
        row.remove();
        updateFeeRemoveButtons();
    }
}

function updateFeeRemoveButtons() {
    const container = document.getElementById('feeCategoriesContainer');
    const removeButtons = container.querySelectorAll('.remove-fee-btn');
    const hasMultipleFees = container.children.length > 1;
    
    removeButtons.forEach(btn => {
        btn.disabled = !hasMultipleFees;
        btn.style.opacity = hasMultipleFees ? '1' : '0.5';
        btn.style.cursor = hasMultipleFees ? 'pointer' : 'not-allowed';
    });
}

async function handleFeeStructureUpdate(e) {
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    submitBtn.textContent = 'Saving...';
    submitBtn.disabled = true;
    
    try {
        const feeRows = document.querySelectorAll('.fee-category-row');
        const fees = {};
        let hasErrors = false;
        
        feeRows.forEach((row, index) => {
            const categoryInput = row.querySelector('.fee-category');
            const amountInput = row.querySelector('.fee-amount');
            
            const category = categoryInput.value.trim();
            const amount = amountInput.value.trim();
            
            if (!category || !amount) {
                hasErrors = true;
                if (!category) categoryInput.style.borderColor = 'var(--error-color)';
                if (!amount) amountInput.style.borderColor = 'var(--error-color)';
            } else {
                fees[category] = parseFloat(amount);
                categoryInput.style.borderColor = '';
                amountInput.style.borderColor = '';
            }
        });
        
        if (hasErrors) {
            alert('Please fill in all category names and amounts');
            return;
        }
        
        if (Object.keys(fees).length === 0) {
            alert('At least one fee category is required');
            return;
        }
        
        const response = await fetch('/ajax/dashboard/update-fees', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ fees })
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Fee structure updated successfully!');
            closeFeeStructureModal();
            // Refresh association data if needed
            if (window.associationData) {
                window.associationData.fees = fees;
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

// Payment Form Data Modal Functions
function openPaymentFormModal() {
    loadPaymentFormData();
    document.getElementById('paymentFormModal').style.display = 'block';
}

function closePaymentFormModal() {
    document.getElementById('paymentFormModal').style.display = 'none';
    document.getElementById('paymentFormDataForm').reset();
}

function loadPaymentFormData() {
    const orgType = window.associationData?.organization_type_id || 1;
    loadDefaultFields(orgType);
    loadCustomFields();
}

function loadDefaultFields(orgType) {
    const container = document.getElementById('defaultFieldsContainer');
    const defaultFields = getDefaultFieldsByOrgType(orgType);
    
    container.innerHTML = defaultFields.map(field => `
        <div class="default-field-row" style="display: flex; gap: 10px; align-items: center; margin-bottom: 10px; opacity: 0.7;">
            <input type="text" 
                   class="form-input" 
                   value="${field.label}" 
                   disabled
                   style="flex: 2; background-color: var(--secondary-color);">
            <input type="text" 
                   class="form-input" 
                   value="Required" 
                   disabled
                   style="flex: 1; background-color: var(--secondary-color);">
            <button type="button" disabled style="background: #6c757d; color: white; border: none; padding: 10px 12px; border-radius: var(--border-radius); cursor: not-allowed; font-size: 14px;">
                ×
            </button>
        </div>
    `).join('');
}

function getDefaultFieldsByOrgType(orgType) {
    const defaultFields = [
        { label: 'Full Name', required: true },
        { label: 'Email', required: true },
        { label: 'Phone Number', required: true }
    ];
    
    if (orgType === 1) { // Student
        defaultFields.splice(1, 0, { label: 'Matriculation Number', required: true });
    }
    
    return defaultFields;
}

function loadCustomFields() {
    const customFields = window.associationData?.custom_fields || [];
    const container = document.getElementById('customFieldsContainer');
    
    container.innerHTML = '';
    
    customFields.forEach((field, index) => {
        const fieldRow = createCustomFieldRow(field, index);
        container.appendChild(fieldRow);
    });
}

function createCustomFieldRow(field = {}, index = 0) {
    const row = document.createElement('div');
    row.className = 'custom-field-row';
    row.style.cssText = 'display: flex; gap: 10px; align-items: center; margin-bottom: 10px;';
    
    row.innerHTML = `
        <input type="text" 
               class="form-input custom-field-label" 
               placeholder="Field label (e.g., Department)"
               value="${escapeHtml(field.name || '')}"
               style="flex: 2;">
        <select class="form-input custom-field-required" style="flex: 1;">
            <option value="0" ${field.is_required ? '' : 'selected'}>Optional</option>
            <option value="1" ${field.is_required ? 'selected' : ''}>Required</option>
        </select>
        <button type="button" 
                class="remove-custom-field-btn" 
                onclick="removeCustomField(this)"
                style="background: #dc3545; color: white; border: none; padding: 10px 12px; border-radius: var(--border-radius); cursor: pointer; font-size: 14px;">
            ×
        </button>
    `;
    
    return row;
}

function addNewCustomField() {
    const container = document.getElementById('customFieldsContainer');
    const newRow = createCustomFieldRow({}, container.children.length);
    container.appendChild(newRow);
}

function removeCustomField(button) {
    const row = button.closest('.custom-field-row');
    row.remove();
}

async function handlePaymentFormDataUpdate(e) {
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    submitBtn.textContent = 'Saving...';
    submitBtn.disabled = true;
    
    try {
        const customFieldRows = document.querySelectorAll('.custom-field-row');
        const customFields = [];
        let hasErrors = false;
        
        customFieldRows.forEach((row, index) => {
            const labelInput = row.querySelector('.custom-field-label');
            const requiredSelect = row.querySelector('.custom-field-required');
            
            const label = labelInput.value.trim();
            const isRequired = requiredSelect.value === '1';
            
            if (!label) {
                hasErrors = true;
                labelInput.style.borderColor = 'var(--error-color)';
            } else {
                customFields.push({
                    name: label,
                    is_required: isRequired,
                    display_order: index
                });
                labelInput.style.borderColor = '';
            }
        });
        
        if (hasErrors) {
            alert('Please fill in all custom field labels');
            return;
        }
        
        const response = await fetch('/ajax/dashboard/update-custom-fields', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ custom_fields: customFields })
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Payment form data updated successfully!');
            closePaymentFormModal();
            // Refresh association data if needed
            if (window.associationData) {
                window.associationData.custom_fields = customFields;
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
