let currentOrganizationType = null;
let currentAssociationId = null;
let currentFees = null;
let currentCustomFields = [];
let selectedAmount = 0;
let endpoint = '/init-payment';
let institutionsCache = null;
let associationsCache = null;

const organizationTypeConfig = {
    student: {
        searchField: 'institution',
        searchEndpoint: '/api/search-institutions',
        associationEndpoint: '/api/search-student-associations',
        dynamicFields: ['institution', 'association']
    },
    non_student: {
        searchField: 'association',
        searchEndpoint: '/api/search-non-student-associations',
        associationEndpoint: null,
        dynamicFields: ['association']
    },
    institution: {
        searchField: 'institution',
        searchEndpoint: '/api/search-institution-organizations',
        associationEndpoint: null,
        dynamicFields: ['institution']
    }
};

function selectOrganizationType() {
    const selected = document.querySelector('input[name="pay_organization_type"]:checked');
    if (!selected) return;
    
    currentOrganizationType = selected.value;
    document.getElementById('organizationTypeModal').style.display = 'none';
    document.getElementById('paymentLoading').style.display = 'flex';
    
    initializePaymentForm();
}

async function initializePaymentForm() {
    try {
        await setupDynamicFields();
        await setupAutocomplete();
        document.getElementById('paymentLoading').style.display = 'none';
        document.querySelector('.payment-main').style.display = 'flex';
    } catch (error) {
        console.error('Error initializing payment form:', error);
        document.getElementById('paymentLoading').style.display = 'none';
        alert('Error loading payment form. Please refresh and try again.');
    }
}

function setupDynamicFields() {
    const container = document.getElementById('dynamic-fields-container');
    const config = organizationTypeConfig[currentOrganizationType];
    
    container.innerHTML = '';
    
    config.dynamicFields.forEach(field => {
        const fieldDiv = document.createElement('div');
        fieldDiv.className = 'form-group dynamic-field';
        
        if (field === 'institution') {
            fieldDiv.innerHTML = `
                <label for="institution" class="form-label">${currentOrganizationType === 'institution' ? 'Institution Name' : 'Institution'}</label>
                <input type="text" id="institution" name="institution" class="form-input" placeholder="${currentOrganizationType === 'institution' ? 'Enter institution name' : 'Enter institution name'}" autocomplete="off">
                <div id="institution-suggestions" class="suggestions-container"></div>
            `;
        } else if (field === 'association') {
            fieldDiv.innerHTML = `
                <label for="association" class="form-label">${currentOrganizationType === 'non_student' ? 'Association Name' : 'Association'}</label>
                <input type="text" id="association" name="association" class="form-input" placeholder="${currentOrganizationType === 'non_student' ? 'Enter association name' : 'Enter your association'}" autocomplete="off">
                <div id="association-suggestions" class="suggestions-container"></div>
            `;
        }
        
        container.appendChild(fieldDiv);
    });
    
    document.getElementById('matnumber-field').style.display = currentOrganizationType === 'student' ? 'block' : 'none';
}

function setupAutocomplete() {
    const config = organizationTypeConfig[currentOrganizationType];
    const searchInput = document.getElementById(config.searchField);
    const suggestionsContainer = document.getElementById(config.searchField + '-suggestions');
    
    if (!searchInput) return;
    
    let debounceTimer;
    searchInput.addEventListener('input', function() {
        clearTimeout(debounceTimer);
        const query = this.value.trim();
        
        if (query.length < 2) {
            suggestionsContainer.innerHTML = '';
            suggestionsContainer.style.display = 'none';
            return;
        }
        
        debounceTimer = setTimeout(() => {
            fetchAssociations(query, config.searchEndpoint);
        }, 300);
    });
    
    searchInput.addEventListener('focus', function() {
        const query = this.value.trim();
        if (query.length >= 2) {
            fetchAssociations(query, config.searchEndpoint);
        } else if (currentOrganizationType === 'student' && config.searchField === 'institution') {
            fetchAssociations('', config.searchEndpoint);
        }
    });
    
    // when institution is selected for student type
    if (currentOrganizationType === 'student' && config.searchField === 'institution') {
        const originalAddEventListener = searchInput.addEventListener;
        searchInput.addEventListener('blur', function() {
            setTimeout(() => {
                const institutionInput = document.getElementById('institution');
                const associationInput = document.getElementById('association');
                const associationSuggestions = document.getElementById('association-suggestions');
                
                if (institutionInput.value && currentAssociationId && associationInput) {
                    // Auto-fetch all associations for this institution
                    fetch(`${config.associationEndpoint}?institution_id=${currentAssociationId}&q=`)
                        .then(response => response.json())
                        .then(data => {
                            if (data.length > 0) {
                                displayAssociationSuggestions(data);
                                associationSuggestions.style.display = 'block';
                            }
                        })
                        .catch(error => console.error('Error fetching associations:', error));
                }
            }, 200);
        });
    }
    
    if (config.associationEndpoint && currentOrganizationType === 'student') {
        const associationInput = document.getElementById('association');
        const associationSuggestions = document.getElementById('association-suggestions');
        
        if (associationInput) {
            associationInput.addEventListener('input', function() {
                clearTimeout(debounceTimer);
                const query = this.value.trim();
                const institutionId = currentAssociationId;
                
                if (!institutionId) {
                    associationSuggestions.innerHTML = '';
                    associationSuggestions.style.display = 'none';
                    return;
                }
                
                if (query.length < 2) {
                    associationSuggestions.innerHTML = '';
                    associationSuggestions.style.display = 'none';
                    return;
                }
                
                debounceTimer = setTimeout(() => {
                    fetch(`${config.associationEndpoint}?q=${encodeURIComponent(query)}&institution_id=${institutionId}`)
                        .then(response => response.json())
                        .then(data => displayAssociationSuggestions(data))
                        .catch(error => console.error('Error fetching associations:', error));
                }, 300);
            });
            
            associationInput.addEventListener('focus', function() {
                const query = this.value.trim();
                const institutionId = currentAssociationId;
                
                if (!institutionId) {
                    alert('Please select an institution first');
                    return;
                }
                
                if (query.length >= 2) {
                    fetch(`${config.associationEndpoint}?q=${encodeURIComponent(query)}&institution_id=${institutionId}`)
                        .then(response => response.json())
                        .then(data => displayAssociationSuggestions(data))
                        .catch(error => console.error('Error fetching associations:', error));
                } else {
                    // when focused with empty query
                    fetch(`${config.associationEndpoint}?institution_id=${institutionId}&q=`)
                        .then(response => response.json())
                        .then(data => displayAssociationSuggestions(data))
                        .catch(error => console.error('Error fetching associations:', error));
                }
            });
        }
    }
}

async function fetchAssociations(query, endpoint) {
    try {
        const response = await fetch(`${endpoint}?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        displaySuggestions(data, endpoint.includes('institution') ? 'institution' : 'association');
    } catch (error) {
        console.error('Error fetching associations:', error);
    }
}

function displaySuggestions(items, type) {
    const container = document.getElementById(type + '-suggestions');
    container.innerHTML = '';
    
    if (items.length === 0) {
        container.style.display = 'none';
        return;
    }
    
    items.forEach(item => {
        const suggestionItem = document.createElement('div');
        suggestionItem.className = 'suggestion-item';
        suggestionItem.textContent = item.name || item.association_name;
        suggestionItem.setAttribute('data-id', item.id);
        suggestionItem.setAttribute('data-fees', item.fees || '{}');
        suggestionItem.setAttribute('data-custom-fields', item.custom_fields || '[]');
        
        suggestionItem.addEventListener('click', () => {
            document.getElementById(type).value = item.name || item.association_name;
            currentAssociationId = item.id;
            currentFees = JSON.parse(item.fees || '{}');
            currentCustomFields = JSON.parse(item.custom_fields || '[]');
            
            container.innerHTML = '';
            container.style.display = 'none';
            
            if (currentOrganizationType === 'student' && type === 'institution') {
                const associationInput = document.getElementById('association');
                const associationSuggestions = document.getElementById('association-suggestions');
                
                if (associationInput) {
                    associationInput.value = '';
                    
                    fetch(`/api/search-student-associations?institution_id=${currentAssociationId}&q=`)
                        .then(response => response.json())
                        .then(data => {
                            if (data.length > 0) {
                                displayAssociationSuggestions(data);
                                associationSuggestions.style.display = 'block';
                            }
                        })
                        .catch(error => console.error('Error fetching associations:', error));
                }
            }
            
            renderFeeOptions(currentFees);
            renderCustomFields(currentCustomFields);
        });
        
        container.appendChild(suggestionItem);
    });
    
    container.style.display = 'block';
}

function displayAssociationSuggestions(associations) {
    const container = document.getElementById('association-suggestions');
    container.innerHTML = '';
    
    if (associations.length === 0) {
        container.style.display = 'none';
        return;
    }
    
    associations.forEach(assoc => {
        const suggestionItem = document.createElement('div');
        suggestionItem.className = 'suggestion-item';
        suggestionItem.textContent = assoc.name || assoc.association_name;
        suggestionItem.setAttribute('data-fees', assoc.fees);
        suggestionItem.setAttribute('data-id', assoc.id);
        suggestionItem.setAttribute('data-custom-fields', assoc.custom_fields || '[]');
        
        suggestionItem.addEventListener('click', () => {
            document.getElementById('association').value = assoc.name || assoc.association_name;
            currentFees = JSON.parse(assoc.fees || '{}');
            currentCustomFields = JSON.parse(assoc.custom_fields || '[]');
            
            container.innerHTML = '';
            container.style.display = 'none';
            
            renderFeeOptions(currentFees);
            renderCustomFields(currentCustomFields);
        });
        
        container.appendChild(suggestionItem);
    });
    
    container.style.display = 'block';
}

function renderFeeOptions(fees) {
    const container = document.getElementById('amount-container');
    container.innerHTML = '';
    
    if (typeof fees === 'object' && Object.keys(fees).length > 1) {
        const feeOptionsContainer = document.createElement('div');
        feeOptionsContainer.className = 'fee-options-container';
        
        Object.entries(fees).forEach(([category, amount]) => {
            const optionWrapper = document.createElement('div');
            optionWrapper.className = 'fee-option-wrapper';
            
            const radioInput = document.createElement('input');
            radioInput.type = 'radio';
            radioInput.name = 'fee_category';
            radioInput.value = amount;
            radioInput.id = `fee_${category}`;
            radioInput.className = 'fee-radio';
            
            const radioLabel = document.createElement('label');
            radioLabel.htmlFor = `fee_${category}`;
            radioLabel.className = 'fee-label';
            radioLabel.innerHTML = `<span class="fee-category">${category}</span><span class="fee-amount">₦${parseFloat(amount).toLocaleString()}</span>`;
            
            radioInput.addEventListener('change', function() {
                if (this.checked) showSummaryBox(amount, category);
            });
            
            optionWrapper.appendChild(radioInput);
            optionWrapper.appendChild(radioLabel);
            feeOptionsContainer.appendChild(optionWrapper);
        });
        
        container.appendChild(feeOptionsContainer);
    } else {
        const amount = typeof fees === 'object' ? Object.values(fees)[0] : fees;
        const amountInput = document.createElement('input');
        amountInput.type = 'text';
        amountInput.className = 'form-input';
        amountInput.value = `₦${parseFloat(amount).toLocaleString()}`;
        amountInput.disabled = true;
        amountInput.name = 'amount';
        container.appendChild(amountInput);
        showSummaryBox(amount);
    }
}

function renderCustomFields(customFields) {
    const container = document.getElementById('custom-fields-container');
    container.innerHTML = '';
    
    customFields.forEach(field => {
        const fieldDiv = document.createElement('div');
        fieldDiv.className = 'form-group';
        fieldDiv.innerHTML = `
            <label for="custom_${field.name}" class="form-label">${field.name}</label>
            <input type="text" id="custom_${field.name}" name="custom_${field.name}" class="form-input" placeholder="Enter ${field.name}" ${field.required ? 'required' : ''}>
        `;
        container.appendChild(fieldDiv);
    });
}

async function getTotalAmount(inputAmount) {
    const formFeeData = new FormData();
    formFeeData.append('amount', inputAmount);
    try {
        const response = await fetch('/api/service-fee', { method: 'POST', body: formFeeData });
        const data = await response.json();
        return data.fee;
    } catch(error) {
        const summaryBoxes = document.querySelectorAll('.summary-box');
        const lastSummaryBox = summaryBoxes[summaryBoxes.length - 1];
        lastSummaryBox.innerHTML = `<div class="summary-content"><div class="summary-row"><span>Error fetching service charge. Your internet connection is probably broken.</span><span style="display: none" class="summary-note"><strong><br>Please try again later, or generate an invoice and pay with the generated ARN later.</strong></span></div></div>`;
        document.querySelector('.submit-btn').style.display = 'none';
        document.getElementById('tos').style.display = 'none';
        document.getElementById('generateInvoice').style.display = 'none';
        return 0;
    }
}

function showSummaryBox(associationAmount, category = '') {
    if (!associationAmount || parseFloat(associationAmount) <= 0) {
        return;
    }
    getTotalAmount(parseFloat(associationAmount)).then(totalAmount => {
        selectedAmount = totalAmount;
        let summaryBox = document.getElementById('summary-box');
        if (!summaryBox) {
            summaryBox = document.createElement('div');
            summaryBox.id = 'summary-box';
            summaryBox.className = 'summary-box';
            document.getElementById('tos').parentNode.insertBefore(summaryBox, document.getElementById('tos'));
        }
        const categoryText = category ? ` (${category})` : '';
        summaryBox.innerHTML = `<div class="summary-content"><div class="summary-row"><span>Amount to pay:</span><span><strong>₦${totalAmount.toLocaleString()}</strong></span></div><div class="summary-note">Service charge + gateway & FGN Tax all included</div></div>`;
        updatePaymentButton(totalAmount);
    });
}

function updatePaymentButton(totalAmount = null) {
    const submitBtn = document.querySelector('#biller-form .submit-btn');
    submitBtn.innerHTML = totalAmount !== null ? `Pay <strong>₦${parseFloat(totalAmount).toLocaleString()}</strong>` : 'Proceed to Payment';
}

function clearSummaryBox() {
    const summaryBox = document.getElementById('summary-box');
    if (summaryBox) summaryBox.remove();
    updatePaymentButton();
}

function handleFormSubmission(submitEndpoint, isGenerateInvoice = false) {
    const config = organizationTypeConfig[currentOrganizationType];
    const institution = currentOrganizationType !== 'non_student' ? document.getElementById('institution')?.value : '';
    const association = currentOrganizationType !== 'institution' ? document.getElementById('association')?.value : '';
    const fullname = document.getElementById('fullname').value;
    const matnumber = currentOrganizationType === 'student' ? document.getElementById('matnumber')?.value : '';
    const email = document.getElementById('email_address').value;
    const phone = document.getElementById('phone_number').value;
    
    let amount = selectedAmount;
    let category = '';
    
    if (currentFees && typeof currentFees === 'object' && Object.keys(currentFees).length > 1) {
        const selectedFee = document.querySelector('input[name="fee_category"]:checked');
        if (!selectedFee) {
            alert('Please select a fee category');
            return false;
        }
        category = document.querySelector(`label[for="${selectedFee.id}"] .fee-category`).textContent;
    }
    
    const customFieldsData = {};
    currentCustomFields.forEach(field => {
        const fieldValue = document.getElementById(`custom_${field.name}`)?.value;
        if (fieldValue) {
            customFieldsData[field.name] = fieldValue;
        }
    });
    
    if (!institution && currentOrganizationType !== 'non_student') {
        alert('Please select an institution');
        return false;
    }
    
    if (!association && currentOrganizationType !== 'institution') {
        alert('Please select an association');
        return false;
    }
    
    if (!fullname || !amount || !phone) {
        alert('Please fill in all required fields');
        return false;
    }
    
    const generateInvoiceBtn = document.getElementById('generateInvoice');
    if (isGenerateInvoice && generateInvoiceBtn) {
        const originalText = generateInvoiceBtn.innerHTML;
        generateInvoiceBtn.innerHTML = '<img src="/static/img/loading.gif" style="height: 20px; margin-right: 8px;"> Generating...';
        generateInvoiceBtn.disabled = true;
        generateInvoiceBtn.setAttribute('data-original-text', originalText);
    }
    
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = submitEndpoint;
    form.style.display = 'none';
    
    const fields = {
        'organization_type': currentOrganizationType,
        'institution': institution,
        'institution_id': currentAssociationId,
        'association': association,
        'fullname': fullname,
        'matnumber': matnumber,
        'email': email,
        'phone': phone,
        'amount': amount,
        'custom_fields_data': JSON.stringify(customFieldsData)
    };
    
    if (category) fields['category'] = category;
    if (isGenerateInvoice) fields['generate_invoice'] = 'true';
    
    Object.keys(fields).forEach(key => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = fields[key];
        form.appendChild(input);
    });
    
    document.body.appendChild(form);
    form.submit();
    return true;
}

document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('input[name="pay_organization_type"]').forEach(radio => {
        radio.addEventListener('change', function() {
            document.querySelectorAll('.organization-type-option').forEach(option => {
                option.classList.remove('selected');
            });
            this.closest('.organization-type-option').classList.add('selected');
            selectOrganizationType();
        });
    });
    
    document.getElementById('biller-form').addEventListener('submit', function(e) {
        e.preventDefault();
        handleFormSubmission(endpoint, false);
    });
    
    document.getElementById('generateInvoice').addEventListener('click', function(e){
        e.preventDefault();
        handleFormSubmission('/generate-invoice', true);
    });
    
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(tab => tab.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(`${btn.getAttribute('data-tab')}-tab`).classList.add('active');
        });
    });
    
    const invoiceForm = document.getElementById('invoice-form');
    const invoiceNumberInput = document.getElementById('invoice-number');
    const retrieveBtn = document.querySelector('#invoice-tab .submit-btn');
    let invoiceData = null;
    
    invoiceNumberInput.addEventListener('input', function(e) {
        this.value = this.value.replace(/\D/g, '');
    });
    
    invoiceForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const invoiceNumber = invoiceNumberInput.value.trim();
        
        if (!invoiceNumber) {
            alert('Please enter the ARN');
            return;
        }
    
        const originalBtnText = retrieveBtn.innerHTML;
        const loadingGif = document.createElement('img');
        loadingGif.src = '/static/img/loading.gif';
        loadingGif.alt = 'Loading';
        loadingGif.className = 'loading-gif';
        loadingGif.style.cssText = 'height: 20px; margin-bottom: 10px;';
        
        retrieveBtn.parentNode.insertBefore(loadingGif, retrieveBtn);
        retrieveBtn.innerHTML = 'Retrieving...';
        retrieveBtn.disabled = true;
    
        try {
            const formData = new FormData();
            formData.append('arn', invoiceNumber);
            
            const response = await fetch('/retrieve-invoice', {
                method: 'POST',
                body: formData
            });
    
            const result = await response.json();
            
            if (result.success) {
                invoiceData = result.data;
                displayInvoiceDetails(result.data, invoiceNumber);
            } else {
                alert(result.message || 'Invoice not found');
                loadingGif.remove();
                retrieveBtn.innerHTML = originalBtnText;
                retrieveBtn.disabled = false;
            }
        } catch (error) {
            alert('Error retrieving invoice. Please try again.');
            loadingGif.remove();
            retrieveBtn.innerHTML = originalBtnText;
            retrieveBtn.disabled = false;
        }
    });
    
    function displayInvoiceDetails(data, arn) {
        const loadingGif = document.querySelector('.loading-gif');
        if (loadingGif) loadingGif.remove();
        
        let detailsContainer = document.getElementById('invoice-details-container');
        if (!detailsContainer) {
            detailsContainer = document.createElement('div');
            detailsContainer.id = 'invoice-details-container';
            invoiceForm.appendChild(detailsContainer);
        }
        
        const categoryRow = data.category ? `<div class="detail-row"><span class="detail-label">Category: </span><span class="detail-value">${data.category}</span></div>` : '';
        
        detailsContainer.innerHTML = `
            <div class="payment-details">
                <div class="detail-row">
                    <span class="detail-label">ARN:</span>
                    <span class="detail-value reference">${arn}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Institution:</span>
                    <span class="detail-value">${data.institution}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Association:</span>
                    <span class="detail-value">${data.association}</span>
                </div>
                ${categoryRow}
                <div class="detail-row">
                    <span class="detail-label">Amount:</span>
                    <span class="detail-value">₦${parseFloat(data.amount).toLocaleString()}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Name:</span>
                    <span class="detail-value">${data.fullname}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Matric Number:</span>
                    <span class="detail-value">${data.matnumber}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Email:</span>
                    <span class="detail-value">${data.email}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Phone:</span>
                    <span class="detail-value">${data.phone}</span>
                </div>
            </div>
        `;
        
        retrieveBtn.innerHTML = `Pay <strong>₦${parseFloat(data.amount).toLocaleString()}</strong>`;
        retrieveBtn.disabled = false;
        retrieveBtn.onclick = function(e) {
            e.preventDefault();
            payInvoice(data, arn);
        };
    }
    
    function payInvoice(data, arn) {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = '/init-payment';
        form.style.display = 'none';
        
        const fields = {
            'institution': data.institution,
            'institution_id': data.institution_id,
            'association': data.association,
            'fullname': data.fullname,
            'matnumber': data.matnumber,
            'email': data.email,
            'phone': data.phone,
            'amount': data.amount,
            'arn': arn
        };
        
        if (data.category) fields['category'] = data.category;
        
        Object.keys(fields).forEach(key => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = fields[key];
            form.appendChild(input);
        });
        
        document.body.appendChild(form);
        form.submit();
    }
    document.getElementById("loading-container").style.display = "none";
    document.getElementById("organizationTypeModal").style.display = "block";
});