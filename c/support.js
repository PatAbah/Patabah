document.addEventListener('DOMContentLoaded', function() {
    const supportForm = document.getElementById('supportForm');
    setupCaptcha();
    
    supportForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (!validateCaptcha()) {
            alert('Please enter the correct CAPTCHA code');
            return;
        }
        
        const name = document.getElementById('supportName').value.trim();
        const phone = document.getElementById('supportPhone').value.trim();
        const message = document.getElementById('supportMessage').value.trim();
        
        const subject = `Support Request from ${name}`;
        const body = `Name: ${name}\nPhone: ${phone}\n\nMessage:\n${message}`;
        
        const mailtoLink = `mailto:{{ support_email }}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        
        window.location.href = mailtoLink;
    });
});

let currentCaptcha = '';

function setupCaptcha() {
    currentCaptcha = generateCaptcha();
    const captchaContainer = document.getElementById('captchaContainer');
    
    captchaContainer.innerHTML = `
        <div class="captcha-box">
            <div class="captcha-text">${currentCaptcha}</div>
            <input type="text" id="captchaInput" class="form-input captcha-input" placeholder="Enter the code above" maxlength="6">
            <button type="button" onclick="refreshCaptcha()" class="captcha-refresh" style="background: none; border: none; color: var(--primary-color); cursor: pointer; margin-top: 8px;">
                ↻ Refresh Code
            </button>
        </div>
    `;
}

function generateCaptcha() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let captcha = '';
    for (let i = 0; i < 6; i++) {
        captcha += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return captcha;
}

function validateCaptcha() {
    const input = document.getElementById('captchaInput').value.trim().toUpperCase();
    return input === currentCaptcha;
}

function refreshCaptcha() {
    currentCaptcha = generateCaptcha();
    document.querySelector('.captcha-text').textContent = currentCaptcha;
    document.getElementById('captchaInput').value = '';
}