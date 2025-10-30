document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('dashboard-login-form');
    
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const accessKey = document.getElementById('access_key').value.trim();
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        
        if (!accessKey) {
            showError('Please enter your access key');
            return;
        }
        
        // Show loading state
        submitBtn.textContent = 'Verifying...';
        submitBtn.disabled = true;
        
        try {
            const response = await fetch('/ajax/dashboard/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ access_key: accessKey })
            });
            
            const result = await response.json();
            
            if (result.success) {
                window.location.href = '/dashboard';
            } else {
                showError(result.message || 'Invalid access key');
            }
        } catch (error) {
            console.error('Login error:', error);
            showError('Network error. Please try again.');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
    
    function showError(message) {
        let errorDiv = document.querySelector('.error-message');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            loginForm.insertBefore(errorDiv, loginForm.querySelector('button'));
        }
        errorDiv.textContent = message;
    }
});