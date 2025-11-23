let formData = {
    organization_type: 'student',
    institution: '',
    institution_id: null,
    association_name: '',
    association_email: '',
    bank_name: '',
    account_number: '',
    account_name: '',
    fees: {},
    contact_title: '',
    president_name: '',
    president_phone: '',
    custom_fields: []
};

const contactTitleOptions = {
    student: ['President', 'Vice President', 'Secretary', 'Treasurer'],
    non_student: ['President', 'Manager', 'Director', 'Coordinator', 'Chairman'],
    institution: ['Administrator', 'Principal', 'Headmaster', 'Proprietor', 'Coordinator', 'Bursar']
};

const organizationTypeLabels = {
    student: 'Student Association',
    non_student: 'Non-Student Group',
    institution: 'School/Institution'
};

function updateProgressBar(currentStep) {
    const progressFill = document.getElementById('progress-fill');
    const progress = ((currentStep) / 6) * 100;
    progressFill.style.width = `${progress}%`;
}

function showStep(stepNumber) {
    document.querySelectorAll('.step-content').forEach(step => {
        step.classList.remove('active');
        step.style.display = 'none';
    });

    const targetStep = document.getElementById(`step-${stepNumber}`);
    if (targetStep) {
        targetStep.classList.add('active');
        targetStep.style.display = 'block';
    }
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
    updateProgressBar(stepNumber);
}

function updateContactTitleOptions() {
    const select = document.getElementById('contact-title');
    const options = contactTitleOptions[formData.organization_type] || contactTitleOptions.student;
    
    select.innerHTML = '<option value="">Select your role</option>';
    options.forEach(title => {
        const option = document.createElement('option');
        option.value = title;
        option.textContent = title;
        select.appendChild(option);
    });
}

function updateInstitutionRequirement() {
    const institutionSection = document.getElementById('step-2');
    const institutionInput = document.getElementById('institution');
    const requiresInstitution = formData.organization_type === 'student';
    
    if (requiresInstitution) {
        institutionSection.style.display = 'block';
        institutionInput.required = true;
    } else {
        institutionSection.style.display = 'none';
        institutionInput.required = false;
        formData.institution = '';
        formData.institution_id = null;
    }
}

function updateDefaultFields() {
    const defaultFields = document.getElementById('default-fields');
    const isStudent = formData.organization_type === 'student';
    
    defaultFields.innerHTML = `
        <input type="text" class="form-input" placeholder="Full name" disabled style="background-color: var(--secondary-color);">
        <input type="tel" class="form-input" placeholder="Phone number" disabled style="background-color: var(--secondary-color);">
        <input type="email" class="form-input" placeholder="Email address" disabled style="background-color: var(--secondary-color);">
        ${isStudent ? '<input type="text" class="form-input" placeholder="Matriculation number" disabled style="background-color: var(--secondary-color);">' : ''}
    `;
}

function addCustomField() {
    const container = document.getElementById('custom-fields-container');
    const fieldId = 'custom_field_' + Date.now();
    const newRow = document.createElement('div');
    newRow.className = 'custom-field-row';
    newRow.innerHTML = `
        <input type="text" class="form-input custom-field-name" placeholder="Field name (e.g., Staff ID, Department)" data-id="${fieldId}">
        <button type="button" class="remove-custom-field-btn">×</button>
    `;
    container.appendChild(newRow);
    
    newRow.querySelector('.remove-custom-field-btn').addEventListener('click', function() {
        newRow.remove();
    });
}

function collectCustomFields() {
    const customFields = [];
    document.querySelectorAll('.custom-field-row').forEach(row => {
        const input = row.querySelector('.custom-field-name');
        const fieldName = input.value.trim();
        if (fieldName) {
            customFields.push({
                id: input.getAttribute('data-id'),
                name: fieldName
            });
        }
    });
    return customFields;
}

function nextStep(stepNumber) {
    const currentStep = document.querySelector('.step-content.active');
    const inputs = currentStep.querySelectorAll('input[required], select[required]');
    let isValid = true;

    inputs.forEach(input => {
        if (!input.value.trim()) {
            isValid = false;
            input.style.borderColor = 'var(--error-color)';
        } else {
            input.style.borderColor = 'var(--border-color)';
        }
    });

    if (!isValid) {
        alert('Please fill in all required fields');
        return;
    }

    const currentStepNum = parseInt(currentStep.id.split('-')[1]);
    
    if (currentStepNum === 1) {
        const selectedType = document.querySelector('input[name="organization_type"]:checked');
        formData.organization_type = selectedType ? selectedType.value : 'student';
        updateInstitutionRequirement();
        updateContactTitleOptions();
        updateDefaultFields();
        
        if (formData.organization_type === 'student') {
            showStep(2);
        } else {
            showStep(3);
        }
        return;
    } else if (currentStepNum === 2) {
        formData.institution = document.getElementById('institution').value.trim();
        if (!formData.institution_id) {
            alert("Please select an institution from the suggestions. If you can't find your institution name, please contact us and we'll add it ASAP. Thank you!");
            return;
        }
        showStep(3);
        return;
    } else if (currentStepNum === 3) {
        formData.association_name = document.getElementById('association-name').value.trim();
        formData.association_email = document.getElementById('association-email').value.trim();
        formData.bank_name = document.getElementById('bank-name').value.trim();
        formData.account_number = document.getElementById('account-number').value.trim();
        formData.account_name = document.getElementById('account-name').value.trim(); // MISSING THIS LINE
        
        const feeRows = document.querySelectorAll('.fee-row');
        formData.fees = {};
        
        feeRows.forEach(row => {
            const category = row.querySelector('.fee-category').value.trim();
            const amount = row.querySelector('.fee-amount').value.trim();
            if (category && amount) {
                formData.fees[category] = amount;
            }
        });
    
        if (Object.keys(formData.fees).length === 0) {
            alert('Please add at least one fee category');
            return;
        }
        showStep(4);
        return;
    } else if (currentStepNum === 4) {
        formData.contact_title = document.getElementById('contact-title').value.trim();
        formData.president_name = document.getElementById('president-name').value.trim();
        formData.president_phone = document.getElementById('president-phone').value.trim();
        
        if (!formData.contact_title) {
            alert('Please select your role/title');
            return;
        }
        showStep(5);
        return;
    } else if (currentStepNum === 5) {
        formData.custom_fields = collectCustomFields();
        populateReview();
        showStep(6);
        return;
    }

    showStep(stepNumber);
}

function previousStep(stepNumber) {
    if (stepNumber === 1) {
        showStep(1);
    } else if (stepNumber === 2 && formData.organization_type !== 'student') {
        showStep(1);
    } else {
        showStep(stepNumber);
    }
}

function addFeeRow() {
    const container = document.getElementById('fees-container');
    const newRow = document.createElement('div');
    newRow.className = 'fee-row';
    newRow.innerHTML = `
        <input type="text" class="form-input fee-category" placeholder="Category (e.g., Returning Members/Students)" required>
        <input type="number" class="form-input fee-amount" placeholder="Amount" required>
        <button type="button" class="remove-fee-btn">×</button>
    `;
    container.appendChild(newRow);

    updateRemoveButtons();
    
    newRow.querySelector('.remove-fee-btn').addEventListener('click', function() {
        removeFee(this);
    });
}

function removeFee(button) {
    button.parentElement.remove();
    updateRemoveButtons();
}

function updateRemoveButtons() {
    const rows = document.querySelectorAll('.fee-row');
    rows.forEach((row, index) => {
        const removeBtn = row.querySelector('.remove-fee-btn');
        if (rows.length > 1) {
            removeBtn.style.display = 'flex';
        } else {
            removeBtn.style.display = 'none';
        }
    });
}

function populateReview() {
    document.getElementById('review-organization-type').textContent = organizationTypeLabels[formData.organization_type] || 'Student Association';
    
    const institutionSection = document.getElementById('review-institution-section');
    if (formData.organization_type === 'student' && formData.institution) {
        institutionSection.style.display = 'block';
        document.getElementById('review-institution').textContent = formData.institution;
    } else {
        institutionSection.style.display = 'none';
    }
    
    document.getElementById('review-association').textContent = formData.association_name;
    document.getElementById('review-association-email').textContent = formData.association_email;
    document.getElementById('review-bank-name').textContent = formData.bank_name;
    document.getElementById('review-account-number').textContent = formData.account_number;
    document.getElementById('review-account-name').textContent = formData.account_name;
    document.getElementById('review-contact-title').textContent = formData.contact_title;
    document.getElementById('review-president').textContent = formData.president_name;
    document.getElementById('review-phone').textContent = formData.president_phone;

    const feesContainer = document.getElementById('review-fees');
    feesContainer.innerHTML = '';
    for (const [category, amount] of Object.entries(formData.fees)) {
        const feeItem = document.createElement('p');
        feeItem.style.margin = '5px 0';
        feeItem.innerHTML = `<strong>${category}:</strong> ₦${parseFloat(amount).toLocaleString()}`;
        feesContainer.appendChild(feeItem);
    }

    const customFieldsContainer = document.getElementById('review-custom-fields');
    customFieldsContainer.innerHTML = '';
    if (formData.custom_fields.length > 0) {
        formData.custom_fields.forEach(field => {
            const fieldItem = document.createElement('p');
            fieldItem.style.margin = '5px 0';
            fieldItem.innerHTML = `<strong>${field.name}</strong>`;
            customFieldsContainer.appendChild(fieldItem);
        });
    } else {
        customFieldsContainer.innerHTML = '<p style="color: var(--text-light);">No additional fields</p>';
    }
}

async function submitForm() {
    const submitBtn = document.getElementById('final-submit');
    const messageContainer = document.getElementById('submission-message');
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
    console.log('Submitting formData:', formData);
    try {
        const response = await fetch('/ajax/association/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (response.ok) {
            messageContainer.className = 'message-container success';
            messageContainer.textContent = result.message || 'Association registered successfully!';
            
            setTimeout(() => {
                window.location = "/a/shortname";
            }, 2000);
        } else {
            throw new Error(result.message || 'Registration failed');
        }
    } catch (error) {
        messageContainer.className = 'message-container error';
        messageContainer.textContent = error.message || 'An error occurred. Please try again.';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Registration';
    }
}

function fetchInstitutions(query) {
    fetch(`/api/institutions?q=${encodeURIComponent(query)}&range=all`)
        .then(response => response.json())
        .then(data => {
            displayInstitutionSuggestions(data);
        })
        .catch(error => {
            console.error('Error fetching institutions:', error);
        });
}

function displayInstitutionSuggestions(institutions) {
    const suggestionsContainer = document.getElementById('institution-suggestions');
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
            const institutionInput = document.getElementById('institution');
            institutionInput.value = inst.name;
            formData.institution_id = inst.id;
            suggestionsContainer.innerHTML = '';
            suggestionsContainer.style.display = 'none';
        });
        
        suggestionsContainer.appendChild(suggestionItem);
    });
    
    suggestionsContainer.style.display = 'block';
}

document.addEventListener('DOMContentLoaded', function() {
    showStep(1);
    updateProgressBar(1);
    updateDefaultFields();
    
    document.querySelectorAll('input[name="organization_type"]').forEach(radio => {
        radio.addEventListener('change', function() {
            document.querySelectorAll('.organization-type-option').forEach(option => {
                option.classList.remove('selected');
            });
            this.closest('.organization-type-option').classList.add('selected');
        });
    });

    document.querySelectorAll('.organization-type-option').forEach(option => {
        if (option.querySelector('input').checked) {
            option.classList.add('selected');
        }
    });

    document.querySelector('#step-1 .submit-btn').addEventListener('click', function() {
        nextStep(2);
    });

    document.querySelector('#step-2 .back-btn').addEventListener('click', function() {
        previousStep(1);
    });

    document.querySelector('#step-2 .submit-btn').addEventListener('click', function() {
        nextStep(3);
    });

    document.querySelector('#step-3 .back-btn').addEventListener('click', function() {
        previousStep(2);
    });

    document.querySelector('#step-3 .submit-btn').addEventListener('click', function() {
        nextStep(4);
    });

    document.querySelector('#step-4 .back-btn').addEventListener('click', function() {
        previousStep(3);
    });

    document.querySelector('#step-4 .submit-btn').addEventListener('click', function() {
        nextStep(5);
    });

    document.querySelector('#step-5 .back-btn').addEventListener('click', function() {
        previousStep(4);
    });

    document.querySelector('#step-5 .submit-btn').addEventListener('click', function() {
        nextStep(6);
    });

    document.querySelector('#step-6 .back-btn').addEventListener('click', function() {
        previousStep(5);
    });

    document.querySelector('#final-submit').addEventListener('click', submitForm);

    document.querySelector('.add-fee-btn').addEventListener('click', addFeeRow);

    document.querySelector('.remove-fee-btn').addEventListener('click', function() {
        removeFee(this);
    });

    document.querySelector('.add-custom-field-btn').addEventListener('click', addCustomField);

    const institutionInput = document.getElementById('institution');
    const suggestionsContainer = document.getElementById('institution-suggestions');

    let debounceTimer;
    institutionInput.addEventListener('input', function() {
        clearTimeout(debounceTimer);
        const query = this.value.trim();
        
        formData.institution_id = null;
        
        if (query.length < 3) {
            suggestionsContainer.innerHTML = '';
            suggestionsContainer.style.display = 'none';
            return;
        }
        
        debounceTimer = setTimeout(() => {
            fetchInstitutions(query);
        }, 300);
    });

    document.addEventListener('click', function(e) {
        if (!institutionInput.contains(e.target) && !suggestionsContainer.contains(e.target)) {
            suggestionsContainer.style.display = 'none';
        }
    });

    updateContactTitleOptions();
    updateInstitutionRequirement();
});