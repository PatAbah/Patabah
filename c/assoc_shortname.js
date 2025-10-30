let checkTimeout = null;
let isAvailable = false;
let isChecking = false;
const shortnameInput = document.getElementById('shortname');
const validationMessage = document.getElementById('validation-message');
const submitBtn = document.getElementById('submit-btn');
const shortlinkForm = document.getElementById('shortlink-form');
const formSection = document.getElementById('form-section');
const successSection = document.getElementById('success-section');
const createdLink = document.getElementById('created-link');
const copyBtn = document.getElementById('copy-btn');

function validateInput(value) {
    if (value.length < 2) {
        return { valid: false, message: 'Shortname must be at least 2 characters' };
    }
    if (value.length > 21) {
        return { valid: false, message: 'Shortname must be at most 21 characters' };
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
        return { valid: false, message: 'Only letters, numbers, hyphens, and underscores allowed' };
    }
    return { valid: true, message: '' };
}

async function checkAvailability(shortname) {
    isChecking = true;
    validationMessage.textContent = 'Checking availability...';
    validationMessage.className = 'validation-message checking';
    submitBtn.disabled = true;

    try {
        const response = await fetch('/ajax/association/check-shortname', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ shortname: shortname })
        });

        const data = await response.json();
        isChecking = false;

        if (data === true) {
            validationMessage.textContent = 'This shortname is already taken';
            validationMessage.className = 'validation-message unavailable';
            isAvailable = false;
            submitBtn.disabled = true;
        } else {
            validationMessage.textContent = '✓ This shortname is available';
            validationMessage.className = 'validation-message available';
            isAvailable = true;
            submitBtn.disabled = false;
        }
    } catch (error) {
        isChecking = false;
        validationMessage.textContent = 'Error checking availability. Please try again.';
        validationMessage.className = 'validation-message error';
        isAvailable = false;
        submitBtn.disabled = true;
    }
}

shortnameInput.addEventListener('input', function(e) {
    this.value = this.value.toUpperCase();
    const value = e.target.value.trim();
    
    if (checkTimeout) {
        clearTimeout(checkTimeout);
    }

    isAvailable = false;
    submitBtn.disabled = true;

    if (value === '') {
        validationMessage.textContent = '';
        validationMessage.className = 'validation-message';
        return;
    }

    const validation = validateInput(value);
    
    if (!validation.valid) {
        validationMessage.textContent = validation.message;
        validationMessage.className = 'validation-message error';
        return;
    }

    checkTimeout = setTimeout(() => {
        checkAvailability(value);
    }, 500);
});
shortlinkForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    if (!isAvailable || isChecking) {
        return;
    }

    const shortname = shortnameInput.value.trim();
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating...';

    try {
        const response = await fetch('/ajax/association/shortname', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ shortname: shortname })
        });

        const result = await response.json();

        if (result.success) {
            const fullUrl = `${window.location.origin}${result.pay_url}`;
            createdLink.value = fullUrl;
            //successMessage.innerHTML = `Shortlink <strong>${result.shortname}</strong> created successfully!`;
            formSection.style.display = 'none';
            successSection.style.display = 'block';
        } else {
            validationMessage.textContent = result.message || 'Failed to create shortlink. Please try again.';
            validationMessage.className = 'validation-message error';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Create Shortlink';
        }
    } catch (error) {
        console.error('Error:', error);
        validationMessage.textContent = 'Network error occurred. Please check your connection and try again.';
        validationMessage.className = 'validation-message error';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Shortlink';
    }
});


copyBtn.addEventListener('click', function() {
    createdLink.select();
    createdLink.setSelectionRange(0, 99999);
    
    navigator.clipboard.writeText(createdLink.value).then(function() {
        const originalText = copyBtn.textContent;
        copyBtn.textContent = 'Copied!';
        copyBtn.classList.add('copied');
        
        setTimeout(function() {
            copyBtn.textContent = originalText;
            copyBtn.classList.remove('copied');
        }, 2000);
    }).catch(function() {
        document.execCommand('copy');
        const originalText = copyBtn.textContent;
        copyBtn.textContent = 'Copied!';
        copyBtn.classList.add('copied');
        
        setTimeout(function() {
            copyBtn.textContent = originalText;
            copyBtn.classList.remove('copied');
        }, 2000);
    });
});