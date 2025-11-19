document.addEventListener('DOMContentLoaded', () => {
    // one
    associationInput.disabled = true;
    associationInput.placeholder = "Select institution first";
    fetchInstitutions();
    
    // Auto-fill from ?sn=shortname
    const params = new URLSearchParams(location.search);
    const sn = params.get('sn');
    if (!sn) return;

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content verify-modal" style="max-width:400px;">
            <div class="modal-body" style="text-align:center; padding:50px 20px;">
                <div style="width:44px;height:44px;border:5px solid #f3f3f3;border-top:5px solid var(--primary-color);border-radius:50%;animation:spin 0.9s linear infinite;margin:0 auto 20px;"></div>
                <p style="margin:0;font-size:15px;color:#555;">Automatically fetching details...</p>
            </div>
        </div>
        <style>@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}</style>`;
    document.body.appendChild(modal);
    modal.style.display = 'block';

    let settled = false;
    const close = () => { if (!settled) { settled = true; modal.remove(); } };

    const hardTimeout = setTimeout(() => {
        modal.innerHTML = `<div class="modal-content verify-modal" style="max-width:400px;">
            <div class="modal-body" style="text-align:center;padding:40px 20px;">
                <p style="margin-bottom:20px;">Taking too long.</p>
                <button onclick="location.reload()" class="submit-btn" style="margin:0 8px;">Retry</button>
                <button onclick="this.closest('.modal').remove()" class="submit-btn" style="background:#999;">Close</button>
            </div></div>`;
    }, 8000);

    fetch(`/pay/${encodeURIComponent(sn)}`, {method:'POST', signal:AbortSignal.timeout(10000)})
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(data => {
            if (data.association_name && data.institution_id) {
                // Set institution values FIRST
                currentInstitutionId = data.institution_id;
                institutionInput.value = data.institution_name || '';
                
                // Enable association input with proper placeholder
                associationInput.disabled = false;
                associationInput.placeholder = "Enter association name";
                
                // Set association value
                associationInput.value = data.association_name;
                
                // Parse and set fees
                currentFees = JSON.parse(data.fees || '{}');
                
                // Clear any existing suggestions
                associationSuggestionsContainer.innerHTML = '';
                associationSuggestionsContainer.style.display = 'none';
                
                // Render fee options
                renderFeeOptions(currentFees);

                // Auto-select first fee option if multiple exist
                const first = document.querySelector('input[name="fee_category"]');
                if (first) {
                    first.checked = true;
                    const label = document.querySelector(`label[for="${first.id}"] .fee-category`);
                    showSummaryBox(first.value, label?.textContent || '');
                }
            }
        })
        .catch(() => {})
        .finally(() => {
            clearTimeout(hardTimeout);
            close();
        });
});