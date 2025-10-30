const tabBtns = document.querySelectorAll('.tab-btn');
const tabPanes = document.querySelectorAll('.tab-pane');
const billerForm = document.getElementById('biller-form');
const invoiceForm = document.getElementById('invoice-form');
const institutionInput = document.getElementById('institution');
const associationInput = document.getElementById('association');
const suggestionsContainer = document.getElementById('institution-suggestions');
const associationSuggestionsContainer = document.getElementById('association-suggestions');
const amountContainer = document.getElementById('amount-container');
const submitBtn = document.querySelector('#biller-form .submit-btn');

let currentInstitutionId = null;
let currentFees = null;
let SERVICE_CHARGE = 0;
let selectedAmount = 0;
let endpoint = '/init-payment';

async function getTotalAmount(inputAmount) {
    const formFeeData = new FormData();
    formFeeData.append('amount', inputAmount);
    try {
        const response = await fetch('/api/service-fee', {
            method: 'POST',
            body: formFeeData
        });
        const data = await response.json();
        console.log(data);
        return data.fee;
    } catch(error) {
        const summaryBoxes = document.querySelectorAll('.summary-box');
        const lastSummaryBox = summaryBoxes[summaryBoxes.length - 1];
        lastSummaryBox.innerHTML = `
            <div class="summary-content">
                <div class="summary-row">
                    <span>Error fetching service charge. Your internet connection is probably broken.</span>
                    <span style="display: none" class="summary-note"><strong><br>Please try again later, or generate an invoice and pay with the generated ARN later.</strong></span>
                </div>
            </div>
        `;
        document.querySelector('.submit-btn').style.display = 'none';
        document.getElementById('tos').style.display = 'none';
        document.getElementById('generateInvoice').style.display = 'none';
        return 0; 
    }
}

function updatePaymentButton(totalAmount = null) {
    if (totalAmount !== null) {
        submitBtn.innerHTML = `Pay <strong>₦${parseFloat(totalAmount).toLocaleString()}</strong>`;
    } else {
        submitBtn.textContent = 'Proceed to Payment';
    }
}

async function showSummaryBox(associationAmount, category = '') {
    const totalAmount = await getTotalAmount(parseFloat(associationAmount));
    selectedAmount = totalAmount;
    
    let summaryBox = document.getElementById('summary-box');
    if (!summaryBox) {
        summaryBox = document.createElement('div');
        summaryBox.id = 'summary-box';
        summaryBox.className = 'summary-box';
        submitBtn.parentNode.insertBefore(summaryBox, document.getElementById('tos'));
    }
    
    const categoryText = category ? ` (${category})` : '';
    summaryBox.innerHTML = `
        <div class="summary-content">
            <div class="summary-row">
                <span>Amount to pay:</span>
                <span><strong>₦${totalAmount.toLocaleString()}</strong></span>
            </div>
            <div class="summary-note">Includes service charge</div>
        </div>
    `;
    
    updatePaymentButton(totalAmount);
}

function clearSummaryBox() {
    const summaryBox = document.getElementById('summary-box');
    if (summaryBox) {
        summaryBox.remove();
    }
    updatePaymentButton();
}

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        tabBtns.forEach(tab => tab.classList.remove('active'));
        tabPanes.forEach(pane => pane.classList.remove('active'));
        
        btn.classList.add('active');
        const tabId = btn.getAttribute('data-tab');
        document.getElementById(`${tabId}-tab`).classList.add('active');
    });
});

let debounceTimer;
institutionInput.addEventListener('input', function() {
    clearTimeout(debounceTimer);
    const query = this.value.trim();
    
    associationInput.value = '';
    associationInput.disabled = true;
    associationInput.placeholder = "Select institution first";
    associationSuggestionsContainer.innerHTML = '';
    associationSuggestionsContainer.style.display = 'none';
    amountContainer.innerHTML = '';
    currentInstitutionId = null;
    currentFees = null;
    clearSummaryBox();
    
    if (query.length < 1) {
        suggestionsContainer.innerHTML = '';
        suggestionsContainer.style.display = 'none';
        return;
    }
    
    debounceTimer = setTimeout(() => {
        fetchInstitutions(query);
    }, 150);
});

let associationDebounceTimer;
associationInput.addEventListener('input', function() {
    if (!currentInstitutionId) return;
    
    clearTimeout(associationDebounceTimer);
    const query = this.value.trim();
    
    associationDebounceTimer = setTimeout(() => {
        fetchAssociations(query, currentInstitutionId);
    }, 300);
});

associationInput.addEventListener('focus', function() {
    if (currentInstitutionId && associationSuggestionsContainer.children.length === 0) {
        fetchAssociations('', currentInstitutionId);
    } else if (currentInstitutionId && associationSuggestionsContainer.children.length > 0) {
        associationSuggestionsContainer.style.display = 'block';
    }
});

function fetchInstitutions(query) {
    fetch(`/api/institutions?q=${encodeURIComponent(query)}`)
        .then(response => response.json())
        .then(data => {
            displayInstitutionSuggestions(data);
        })
        .catch(error => {
            console.error('Error fetching institutions:', error);
        });
}

function fetchAssociations(query, institutionId) {
    fetch(`/api/associations?q=${encodeURIComponent(query)}&institution_id=${institutionId}`)
        .then(response => response.json())
        .then(data => {
            displayAssociationSuggestions(data);
        })
        .catch(error => {
            console.error('Error fetching associations:', error);
        });
}

function displayInstitutionSuggestions(institutions) {
    suggestionsContainer.innerHTML = '';
    
    if (institutions.length === 0) {
        suggestionsContainer.style.display = 'none';
        return;
    }
    
    institutions.forEach(inst => {
        const suggestionItem = document.createElement('div');
        suggestionItem.className = 'suggestion-item';
        suggestionItem.textContent = inst.name;
        suggestionItem.setAttribute('data-id', inst.id);
        
        suggestionItem.addEventListener('click', () => {
            institutionInput.value = inst.name;
            currentInstitutionId = inst.id;
            suggestionsContainer.innerHTML = '';
            suggestionsContainer.style.display = 'none';
            
            associationInput.disabled = false;
            associationInput.placeholder = "Enter association name";
            associationInput.value = '';
            amountContainer.innerHTML = '';
            currentFees = null;
            clearSummaryBox();
            
            fetchAssociations('', currentInstitutionId);
        });
        
        suggestionsContainer.appendChild(suggestionItem);
    });
    
    suggestionsContainer.style.display = 'block';
}

function displayAssociationSuggestions(associations) {
    associationSuggestionsContainer.innerHTML = '';
    
    if (associations.length === 0) {
        associationSuggestionsContainer.style.display = 'none';
        return;
    }
    
    associations.forEach(assoc => {
        const suggestionItem = document.createElement('div');
        suggestionItem.className = 'suggestion-item';
        suggestionItem.textContent = assoc.association_name;
        suggestionItem.setAttribute('data-fees', assoc.fees);
        suggestionItem.setAttribute('data-id', assoc.id);
        
        suggestionItem.addEventListener('click', () => {
            associationInput.value = assoc.association_name;
            currentFees = JSON.parse(assoc.fees);
            associationSuggestionsContainer.innerHTML = '';
            associationSuggestionsContainer.style.display = 'none';
            renderFeeOptions(currentFees);
        });
        
        associationSuggestionsContainer.appendChild(suggestionItem);
    });
    
    associationSuggestionsContainer.style.display = 'block';
}

function renderFeeOptions(fees) {
    amountContainer.innerHTML = '';
    clearSummaryBox();
    
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
            radioLabel.innerHTML = `
                <span class="fee-category">${category}</span>
                <span class="fee-amount">₦${parseFloat(amount).toLocaleString()}</span>
            `;
            
            radioInput.addEventListener('change', function() {
                if (this.checked) {
                    showSummaryBox(amount, category);
                }
            });
            
            optionWrapper.appendChild(radioInput);
            optionWrapper.appendChild(radioLabel);
            feeOptionsContainer.appendChild(optionWrapper);
        });
        
        amountContainer.appendChild(feeOptionsContainer);
    } else {
        const amount = typeof fees === 'object' ? Object.values(fees)[0] : fees;
        const amountInput = document.createElement('input');
        amountInput.type = 'text';
        amountInput.className = 'form-input';
        amountInput.value = `₦${parseFloat(amount).toLocaleString()}`;
        amountInput.disabled = true;
        amountInput.name = 'amount';
        amountContainer.appendChild(amountInput);
        
        showSummaryBox(amount);
    }
}

document.addEventListener('click', function(e) {
    if (!institutionInput.contains(e.target) && !suggestionsContainer.contains(e.target)) {
        suggestionsContainer.style.display = 'none';
    }
    if (!associationInput.contains(e.target) && !associationSuggestionsContainer.contains(e.target)) {
        associationSuggestionsContainer.style.display = 'none';
    }
});

function handleFormSubmission(submitEndpoint, isGenerateInvoice = false) {
    const institution = institutionInput.value;
    const association = associationInput.value;
    const fullname = document.getElementById('fullname').value;
    const matnumber = document.getElementById('matnumber').value;
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
    
    if (!institution || !association || !fullname || !matnumber || !amount || !phone) {
        alert('Please FILL in ALL required fields');
        return false;
    }
    
    const generateInvoiceBtn = document.getElementById('generateInvoice');
    if (isGenerateInvoice && generateInvoiceBtn) {
        const originalText = generateInvoiceBtn.innerHTML;
        generateInvoiceBtn.innerHTML = '<img src="/static/img/loading.gif" style="height: 20px; margin-right: 8px;"> Generating...';
        generateInvoiceBtn.disabled = true;
        
        generateInvoiceBtn.setAttribute('data-original-text', originalText);
    }
    
    const formData = new FormData();
    formData.append('institution', institution);
    formData.append('institution_id', currentInstitutionId);
    formData.append('association', association);
    formData.append('fullname', fullname);
    formData.append('matnumber', matnumber);
    formData.append('email', email);
    formData.append('phone', phone);
    formData.append('amount', amount);
    if (category) formData.append('category', category);
    
    // Add a flag to indicate this is an invoice generation request
    if (isGenerateInvoice) {
        formData.append('generate_invoice', 'true');
    }
    
    return fetch(submitEndpoint, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (isGenerateInvoice && generateInvoiceBtn) {
            const originalText = generateInvoiceBtn.getAttribute('data-original-text');
            generateInvoiceBtn.innerHTML = originalText;
            generateInvoiceBtn.disabled = false;
        }
        
        if (data.success) {
            if (isGenerateInvoice) {
                if (data.invoice_callback) {
                    window.location.href = data.invoice_callback;
                } else {
                    alert('Invoice generated but no redirect URL provided');
                    console.log('Invoice data:', data);
                }
            } else {
                window.location.href = data.authorization_url;
            }
        } else {
            alert('Request failed: ' + data.message);
        }
        return data;
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while processing your request');
        
        if (isGenerateInvoice && generateInvoiceBtn) {
            const originalText = generateInvoiceBtn.getAttribute('data-original-text');
            generateInvoiceBtn.innerHTML = originalText;
            generateInvoiceBtn.disabled = false;
        }
        
        throw error;
    });
}

// Original form submit handler
billerForm.addEventListener('submit', function(e) {
    e.preventDefault();
    handleFormSubmission(endpoint, false);
});

// Generate invoice handler
document.getElementById('generateInvoice').addEventListener('click', function(e){
    e.preventDefault();
    handleFormSubmission('/generate-invoice', true);
});

invoiceForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const invoiceNumber = document.getElementById('invoice-number').value;    const payerEmail = document.getElementById('payer-email').value;
    
    if (!invoiceNumber) {
        alert('Please enter the ARN');
        return;
    }
});

document.addEventListener('DOMContentLoaded', function() {
    associationInput.disabled = true;
    associationInput.placeholder = "Select institution first";
});